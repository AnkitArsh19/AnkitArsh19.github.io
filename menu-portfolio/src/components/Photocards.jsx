import { RoundedBox, useCursor, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useAtom } from 'jotai';
import { easing } from 'maath';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { activeItemAtom, galleryImages, photoIndexAtom } from '../store';
import { playPhotoHover, playPhotoFlip } from '../audio';

const FRAME_THICKNESS = 0.01;
const IMG_WIDTH = 1.25;

const Card = ({ url, index, relIndex }) => {
  const meshRef = useRef();
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Dynamically calculate sizes to maintain original image aspect ratio without stretching
  const imgAspect = texture.image.width / texture.image.height;
  const imgHeight = IMG_WIDTH / imgAspect;
  const frameWidth = IMG_WIDTH + 0.15; // 0.075 padding on sides
  const frameHeight = imgHeight + 0.4; // 0.1 top padding, 0.3 bottom padding

  // Reduce random rotation slightly to prevent extreme clipping
  const randomRotZ = useMemo(() => (Math.random() - 0.5) * 0.15, []);
  const randomRotX = useMemo(() => (Math.random() - 0.5) * 0.03, []);
  const randomRotY = useMemo(() => (Math.random() - 0.5) * 0.03, []);

  // Generate a random slight X/Y offset for the messy stack
  const randomOffsetX = useMemo(() => (Math.random() - 0.5) * 0.1, []);
  const randomOffsetY = useMemo(() => (Math.random() - 0.5) * 0.1, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // The top card (relIndex === 0) should be perfectly centered and straight.
    const isTop = relIndex === 0;
    let targetX = isTop ? 0 : randomOffsetX;
    let targetY = isTop ? 0 : randomOffsetY;
    let targetZ = -relIndex * 0.04; // Stack them behind each other with gap

    const currentX = meshRef.current.position.x;
    const currentZ = meshRef.current.position.z;

    const finalZ = -relIndex * 0.04;

    // 1. Swipe OUT animation (moving from front to back)
    if (relIndex === galleryImages.length - 1) {
      // If it hasn't safely reached the back of the stack yet:
      if (currentZ > finalZ + 0.02) {
        targetX = -1.8; // Keep it on the left
        
        // Only allow it to push backwards in Z once it has cleared the stack horizontally
        if (currentX > -1.5) {
          targetZ = 0.02; // Pop up slightly while moving left
        } else {
          targetZ = finalZ; // Push to the back
        }
      }
    }

    const targetRotX = isTop ? 0 : randomRotX;
    const targetRotY = isTop ? 0 : randomRotY;
    const targetRotZ = isTop ? 0 : randomRotZ;

    // Animate position and rotation smoothly
    easing.damp3(meshRef.current.position, [targetX, targetY, targetZ], 0.3, delta);
    easing.dampE(meshRef.current.rotation, [targetRotX, targetRotY, targetRotZ], 0.3, delta);
  });

  return (
    <group ref={meshRef}>
      {/* Polaroid White Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[frameWidth, frameHeight, FRAME_THICKNESS]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.8} />
      </mesh>

      {/* Picture Texture */}
      <mesh position={[0, (frameHeight - imgHeight) / 2 - 0.1, FRAME_THICKNESS / 2 + 0.001]} castShadow receiveShadow>
        <planeGeometry args={[IMG_WIDTH, imgHeight]} />
        <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
};

export const Photocards = (props) => {
  const group = useRef();
  const innerGroup = useRef();
  const [activeItem, setActiveItem] = useAtom(activeItemAtom);
  const [photoIndex, setPhotoIndex] = useAtom(photoIndexAtom);
  const [hovered, setHovered] = useState(false);
  
  useCursor(hovered);

  useFrame((_, delta) => {
    if (!innerGroup.current) return;
    const isActive = activeItem === 'cards';
    
    // Smoothly highlight the stack by elevating it slightly when hovered on the table
    const targetY = (!isActive && hovered) ? 0.3 : 0;
    const targetScale = (!isActive && hovered) ? 1.05 : 1;
    
    easing.damp(innerGroup.current.position, 'y', targetY, 0.4, delta);
    easing.damp3(innerGroup.current.scale, [targetScale, targetScale, targetScale], 0.4, delta);
  });


  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => { 
        e.stopPropagation(); 
        setHovered(true); 
        if (activeItem !== 'cards') playPhotoHover();
      }}
      onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => {
        e.stopPropagation();
        if (activeItem !== 'cards') {
          // If resting on table, click to activate it
          setActiveItem('cards');
        } else {
          // If active, clicking flips the next picture
          setPhotoIndex((prev) => (prev + 1) % galleryImages.length);
          playPhotoFlip();
        }
      }}
    >
      <group ref={innerGroup}>
        {galleryImages.map((url, index) => {
          // Calculate index relative to the current top card
          const relIndex = (index - photoIndex + galleryImages.length) % galleryImages.length;
          
          return (
            <Card 
              key={url} 
              url={url} 
              index={index} 
              relIndex={relIndex} 
            />
          );
        })}
      </group>
    </group>
  );
};
