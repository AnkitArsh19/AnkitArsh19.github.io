import { useCursor, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useAtom } from 'jotai';
import { easing } from 'maath';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bone,
  BoxGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import { activeItemAtom, hoveredLinkAtom, pageAtom, pages } from '../store';
import { playBookHover, playPageFlip } from '../audio';

/* ═══════════════════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════════════════ */

const EASING_SPEED = 0.5;
const EASING_FOLD = 0.3;
const INSIDE_CURVE = 0.16;
const OUTSIDE_CURVE = 0.04;
const TURNING_CURVE = 0.09;

const PAGE_WIDTH = 2.0;
const PAGE_HEIGHT = 2.67;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

/* ═══════════════════════════════════════════════════════
   SHARED GEOMETRY
   ═══════════════════════════════════════════════════════ */

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2
);
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;
  // Clamp so skinIndex+1 never exceeds PAGE_SEGMENTS (max bone index)
  const skinIndex = Math.max(0, Math.min(Math.floor(x / SEGMENT_WIDTH), PAGE_SEGMENTS - 1));
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndexes, 4));
pageGeometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));

// Pre-compute bounding sphere so Three.js doesn't try to do it
// at render time when bones might not have matrixWorld yet
pageGeometry.computeBoundingSphere();

/* ═══════════════════════════════════════════════════════
   MATERIALS
   ═══════════════════════════════════════════════════════ */

const parchmentColor = new Color('#F0E6D0');
const spineColor = new Color('#131008');
const goldEmissive = new Color('#D4AF37');

const edgeMaterials = [
  new MeshStandardMaterial({ color: parchmentColor }),
  new MeshStandardMaterial({ color: spineColor }),
  new MeshStandardMaterial({ color: parchmentColor }),
  new MeshStandardMaterial({ color: parchmentColor }),
];

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */

const HOTZONES = [
  // Page 7 (Front face of page index 3) - Material index 4
  { pageIndex: 3, faceIndex: 4, x: 79, y: 973, w: 247, h: 86, url: 'https://ankitarsh.me/pokemon' },
  
  // Page 5 (Front face of page index 2) - Material index 4
  { pageIndex: 2, faceIndex: 4, x: 140, y: 734, w: 272, h: 50, url: 'https://github.com/AnkitArsh19/yaplab-app' },
  { pageIndex: 2, faceIndex: 4, x: 413, y: 738, w: 122, h: 42, url: 'https://yaplab.social' },

  // Page 4 (Back face of page index 1) - Material index 5
  { pageIndex: 1, faceIndex: 5, x: 219, y: 1386, w: 319, h: 41, url: 'https://github.com/AnkitArsh19/crescendo' },
  { pageIndex: 1, faceIndex: 5, x: 63, y: 1311, w: 144, h: 150, url: 'https://github.com/AnkitArsh19/crescendo' },

  // Back_page (Back face of page index 3) - Material index 5
  { pageIndex: 3, faceIndex: 5, x: 440, y: 523, w: 380, h: 69, url: 'mailto:ankitarsh19@gmail.com' },
  { pageIndex: 3, faceIndex: 5, x: 438, y: 592, w: 420, h: 65, url: 'https://github.com/AnkitArsh19' },
  { pageIndex: 3, faceIndex: 5, x: 446, y: 660, w: 412, h: 68, url: 'https://linkedin.com/in/ankitarsh19' },
  { pageIndex: 3, faceIndex: 5, x: 448, y: 728, w: 411, h: 66, url: 'https://medium.com/@ankitarsh19' },
  { pageIndex: 3, faceIndex: 5, x: 451, y: 795, w: 413, h: 67, url: 'https://instagram.com/ankit_arsh19' },
  { pageIndex: 3, faceIndex: 5, x: 453, y: 863, w: 414, h: 65, url: 'https://x.com/AnkitArsh19' },
];

const checkHotzone = (pageIndex, faceIndex, u, v) => {
  const IMG_W = 1023;
  const IMG_H = 1537;
  
  for (let i = 0; i < HOTZONES.length; i++) {
    const zone = HOTZONES[i];
    if (zone.pageIndex === pageIndex && zone.faceIndex === faceIndex) {
      const xMin = zone.x / IMG_W;
      const xMax = (zone.x + zone.w) / IMG_W;
      const yTop = 1.0 - (zone.y / IMG_H);
      const yBottom = 1.0 - ((zone.y + zone.h) / IMG_H);

      if (u >= xMin && u <= xMax && v >= yBottom && v <= yTop) {
        return zone;
      }
    }
  }
  return null;
};

const Page = ({ number, front, back, frontType, backType, page, opened, bookClosed, ...props }) => {
  const [frontTexture, backTexture] = useTexture([front, back]);
  const [activeItem, setActiveItem] = useAtom(activeItemAtom);
  const [, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);

  const [hoveredLink, setHoveredLink] = useAtom(hoveredLinkAtom);

  const { gl } = useThree();

  useEffect(() => {
    [frontTexture, backTexture].forEach((texture) => {
      if (texture) {
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();

        // Re-enabled Mipmapping. 
        // LinearFilter caused the GPU to skip pixels, which made thin text randomly disappear 
        // when zoomed out. Mipmapping fixes the "disappearing" text by smoothing it,
        // and max anisotropy prevents it from getting too blurry.
        texture.minFilter = LinearMipmapLinearFilter;
        texture.magFilter = LinearFilter;
        texture.needsUpdate = true;
      }
    });
  }, [frontTexture, backTexture, gl]);

  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new Bone();
      bones.push(bone);
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) bones[i - 1].add(bone);
    }
    const skeleton = new Skeleton(bones);

    const isFrontCover = frontType === 'cover';
    const isBackCover = backType === 'cover';

    const materials = [
      ...edgeMaterials,
      // Front face (index 4)
      new MeshStandardMaterial({
        color: new Color('white'),
        map: frontTexture,
        roughness: isFrontCover ? 0.85 : 0.5,
        metalness: isFrontCover ? 0.05 : 0,
        emissive: goldEmissive,
        emissiveIntensity: 0,
      }),
      // Back face (index 5)
      new MeshStandardMaterial({
        color: new Color('white'),
        map: backTexture,
        roughness: isBackCover ? 0.85 : 0.5,
        metalness: isBackCover ? 0.05 : 0,
        emissive: goldEmissive,
        emissiveIntensity: 0,
      }),
    ];

    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);

    // CRITICAL: Override computeBoundingSphere/Box to use base geometry's
    // pre-computed bounds. Three.js v0.184's SkinnedMesh default tries to
    // apply bone transforms to vertices, but ContactShadows renders the
    // scene before bones have matrixWorld → crash. This bypasses that.
    mesh.computeBoundingSphere = () => {
      mesh.geometry.computeBoundingSphere();
      mesh.boundingSphere = mesh.geometry.boundingSphere;
    };
    mesh.computeBoundingBox = () => {
      mesh.geometry.computeBoundingBox();
      mesh.boundingBox = mesh.geometry.boundingBox;
    };

    // Fall back to standard Mesh raycasting to allow pointer events (onClick) without SkinnedMesh crash
    mesh.raycast = Mesh.prototype.raycast;

    return mesh;
  }, [frontTexture, backTexture, frontType, backType]);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) return;

    // Hover glow
    const emissiveIntensity = highlighted ? 0.12 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    // Turn timing
    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    const isHardCover = number === 0 || number === pages.length - 1;

    // Reduce static curve to prevent blurriness on the resting pages
    const INSIDE_CURVE = 0.05; // Reduced from 0.16
    const OUTSIDE_CURVE = 0.01; // Reduced from 0.04
    const TURNING_CURVE = 0.09;

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed && !isHardCover) {
      targetRotation += degToRad(number * 0.8);
    }

    // inSum = 5.8448, outSum = -0.8446
    // Calculate total curve rotation so we can mathematically compensate for it at the root bone
    const totalCurveSum = INSIDE_CURVE * 5.8448 - OUTSIDE_CURVE * -0.8446;

    // Bone animation
    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

      let rotationAngle =
        INSIDE_CURVE * insideCurveIntensity * targetRotation -
        OUTSIDE_CURVE * outsideCurveIntensity * targetRotation +
        TURNING_CURVE * turningIntensity * targetRotation;
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);

      // Mathematical compensation: ensure the final sum of bone rotations equals EXACTLY targetRotation.
      // This forces the edge of the page to lay perfectly flat at 180 degrees regardless of how we tweak the curve!
      if (i === 0) {
        const compensation = 1.0 - totalCurveSum;
        rotationAngle += compensation * targetRotation;
      }

      // Force flat rigid rotation if it's a hardcover OR if the book is fully closed
      if (bookClosed || isHardCover) {
        if (i === 0) {
          rotationAngle = targetRotation;
          // Prevent Z-fighting/shadow acne when closed by adding a tiny fan-out offset
          if (bookClosed) {
            rotationAngle += degToRad(number * 0.15);
          }
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      // Use damp instead of dampAngle for Y. Since the angle swings exactly 180 degrees 
      // (-PI/2 to PI/2), dampAngle can occasionally choose to wrap backwards through the book. 
      // Regular damp guarantees it crosses the front (0 degrees).
      easing.damp(target.rotation, 'y', rotationAngle, EASING_SPEED, delta);

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(target.rotation, 'x', foldRotationAngle * foldIntensity, EASING_FOLD, delta);
    }
  });



  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => { 
        e.stopPropagation(); 
        setHighlighted(true); 
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.face) {
          const hit = checkHotzone(number, e.face.materialIndex, e.uv.x, e.uv.y);
          document.body.style.cursor = hit ? 'pointer' : 'auto';
          
          // Only update state if it changed to prevent infinite re-renders!
          if (hit !== hoveredLink) {
            setHoveredLink(hit);
          }
        }
      }}
      onPointerOut={(e) => { 
        e.stopPropagation();
        setHighlighted(false);
        setHoveredLink(null);
        document.body.style.cursor = 'auto'; 
      }}
      onClick={(e) => {
        e.stopPropagation();

        // --------------------------------------------------------
        // CUSTOM LINK HOTZONES (UV Raycasting)
        // --------------------------------------------------------
        if (e.face) {
          const hit = checkHotzone(number, e.face.materialIndex, e.uv.x, e.uv.y);
          if (hit) {
            if (hit.url.startsWith('mailto:')) {
              window.location.href = hit.url;
            } else {
              window.open(hit.url, '_blank');
            }
            // Reset state since we might be leaving the window
            setHoveredLink(null);
            document.body.style.cursor = 'auto';
            return; // Stop here so it doesn't try to turn the page!
          }
        }

        // If resting on the table, clicking the book activates it!
        if (activeItem !== 'book') {
          setActiveItem('book');
          return;
        }
        
        setPage(opened ? number : number + 1);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
        castShadow={activeItem === 'book'}
        receiveShadow={activeItem === 'book'}
      />
    </group>
  );
};

/* ═══════════════════════════════════════════════════════
   BOOK COMPONENT
   ═══════════════════════════════════════════════════════ */

export const Book = ({ ...props }) => {
  const [page] = useAtom(pageAtom);
  const [activeItem] = useAtom(activeItemAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const [hovered, setHovered] = useState(false);
  const targetPageRef = useRef(page);
  const animatingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Always track the latest target
  targetPageRef.current = page;

  useEffect(() => {
    // Single animation loop — steps toward target one page at a time.
    // If the target changes mid-flight, the loop picks up the new target
    // on its next tick without spawning a competing chain.
    const step = () => {
      setDelayedPage((current) => {
        const target = targetPageRef.current;
        if (current === target) {
          // Arrived at destination — stop animating
          animatingRef.current = false;
          return current;
        }
        // Schedule next step. Faster when skipping many pages.
        const distance = Math.abs(target - current);
        const delay = distance > 2 ? 80 : 200;
        timeoutRef.current = setTimeout(step, delay);
        animatingRef.current = true;
        
        playPageFlip();
        
        // Move one page toward the target
        return current + (target > current ? 1 : -1);
      });
    };

    // If not already animating, start the loop
    if (!animatingRef.current) {
      // Small initial delay to batch rapid clicks into one animation
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(step, 30);
    }
    // If already animating, the running loop will pick up the new
    // targetPageRef.current on its next tick — no extra chain needed.

    return () => {
      // Only clear on unmount, not on every page change,
      // to avoid killing the running animation loop.
    };
  }, [page]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const bookGroup = useRef();

  useFrame((_, delta) => {
    let targetX = 0;
    let targetY = -0.05; // Lowered to prevent the top of the book from being cut off
    let targetZ = 0.1; // Brought closer in reading mode

    // Center and bring closer when on the first or last page
    if (delayedPage === 0) {
      targetX = -PAGE_WIDTH / 2;
      targetY = -0.05;
      targetZ = 0.15; // Cover brought closer
    } else if (delayedPage === pages.length) {
      targetX = PAGE_WIDTH / 2;
      targetY = -0.05;
      targetZ = 0.15; // Back cover brought closer
    }

    easing.damp3(bookGroup.current.position, [targetX, targetY, targetZ], 0.5, delta);
  });

  return (
    <group 
      ref={bookGroup} 
      {...props}
      onPointerEnter={(e) => { 
        e.stopPropagation(); 
        setHovered(true); 
        if (activeItem !== 'book') playBookHover();
      }}
      onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      <group rotation-y={-Math.PI / 2}>
        {pages.map((pageData, index) => (
          <Page
            key={index}
            page={delayedPage}
            number={index}
            opened={delayedPage > index}
            bookClosed={delayedPage === 0 || delayedPage === pages.length}
            {...pageData}
          />
        ))}
      </group>
    </group>
  );
};
