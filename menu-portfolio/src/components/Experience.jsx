import { ContactShadows, Environment, Hud, OrbitControls, PerspectiveCamera, Shadow } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useAtom } from 'jotai';
import { easing } from 'maath';
import { useEffect, useRef, Suspense } from 'react';
import { activeItemAtom, pageAtom } from '../store';
import { Book } from './Book';
import { Pokeball } from './Pokeball';
import { Photocards } from './Photocards';

export const Experience = () => {
  const [activeItem, setActiveItem] = useAtom(activeItemAtom);
  const [, setPage] = useAtom(pageAtom);
  const bookRig = useRef();
  const bookHudRef = useRef();
  const photocardsRig = useRef();
  const cardsHudRef = useRef();
  const controlsRef = useRef();
  const pokeballGroupRef = useRef();

  const { camera } = useThree();

  // Reset the camera position and panning target back to center when toggling active items
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }

    // Automatically close the book when it's placed back on the table
    if (activeItem !== 'book') {
      setPage(0);
    }
  }, [activeItem, setPage]);

  useFrame((_, delta) => {
    if (!bookRig.current || !photocardsRig.current) return;

    const isBookActive = activeItem === 'book';
    const isCardsActive = activeItem === 'cards';

    // ======== TWEAK ACTIVE/RESTING POSITIONS HERE ========
    // Format: [X (left/right), Y (up/down), Z (forward/backward)]

    // BOOK TWEAKS
    let bookPos = isBookActive
      ? [0, -0.08, -0.24]  // Active (In your hands)
      : [0, -3.5, -0.5];   // Resting (On the table)
    let bookRotX = isBookActive ? -Math.PI / 3 : -Math.PI / 2 - 0.6; // Up/Down Tilt
    let bookRotY = isBookActive ? 0 : 0; // Left/Right Tilt
    let bookScale = isBookActive ? 1 : 1.2; // Resting scale

    // PHOTOCARD TWEAKS
    let cardsPos = isCardsActive
      ? [0, -0.08, -0.24]  // Active (In your hands)
      : [4.5, -3.5, -0.5]; // Resting (On the table)
    let cardsRotX = isCardsActive ? -Math.PI / 5 - 0.5 : -Math.PI / 2 - 0.6; // Up/Down Tilt
    let cardsRotY = isCardsActive ? 0 : -0.15; // Left/Right Tilt
    let cardsRotZ = isCardsActive ? 0 : -0.3; // Twist Angle (Positive = Left, Negative = Right)
    let cardsScale = isCardsActive ? 1 : 0.9; // Resting scale
    // =====================================================

    // 2. Apply HUD Screen-Lock Math to Inactive Objects INSTANTLY!
    // (We separate the camera tracking from the damp3 animation so it never lags when panning!)
    if (controlsRef.current && bookHudRef.current && cardsHudRef.current) {
      const panOffset = controlsRef.current.target;
      const zoomRatio = camera.position.distanceTo(panOffset) / 5.0;

      // If the Book is resting on the table, glue its HUD wrapper to the screen!
      if (!isBookActive) {
        bookHudRef.current.position.copy(panOffset);
        bookHudRef.current.scale.setScalar(zoomRatio);
      } else {
        bookHudRef.current.position.set(0, 0, 0);
        bookHudRef.current.scale.setScalar(1);
      }

      // If the Cards are resting on the table, glue their HUD wrapper to the screen!
      if (!isCardsActive) {
        cardsHudRef.current.position.copy(panOffset);
        cardsHudRef.current.scale.setScalar(zoomRatio);
      } else {
        cardsHudRef.current.position.set(0, 0, 0);
        cardsHudRef.current.scale.setScalar(1);
      }
    }

    // 3. Smoothly Animate Book
    easing.damp3(bookRig.current.position, bookPos, 0.55, delta);
    easing.dampAngle(bookRig.current.rotation, 'x', bookRotX, 0.55, delta);
    easing.dampAngle(bookRig.current.rotation, 'y', bookRotY, 0.55, delta);
    easing.damp3(bookRig.current.scale, [bookScale, bookScale, bookScale], 0.55, delta);

    // 4. Smoothly Animate Photocards
    easing.damp3(photocardsRig.current.position, cardsPos, 0.55, delta);
    easing.dampAngle(photocardsRig.current.rotation, 'x', cardsRotX, 0.55, delta);
    easing.dampAngle(photocardsRig.current.rotation, 'y', cardsRotY, 0.55, delta);
    easing.dampAngle(photocardsRig.current.rotation, 'z', cardsRotZ, 0.55, delta);
    easing.damp3(photocardsRig.current.scale, [cardsScale, cardsScale, cardsScale], 0.55, delta);

    // Lock the Pokeball to the screen by moving and scaling it perfectly in sync with camera panning AND zooming!
    if (controlsRef.current && pokeballGroupRef.current) {
      const panOffset = controlsRef.current.target;

      // Calculate zoom ratio (default R3F camera distance is 5 units)
      const currentDistance = camera.position.distanceTo(panOffset);
      const zoomRatio = currentDistance / 5.0;

      // Apply pan tracking and zoom projection compensation
      pokeballGroupRef.current.position.set(
        panOffset.x + (-3.5 * zoomRatio),
        panOffset.y + (-3.5 * zoomRatio),
        panOffset.z + (-0.1 * zoomRatio)
      );

      // Scale the entire group so the Pokeball and its shadow maintain exactly the same visual size on screen
      pokeballGroupRef.current.scale.setScalar(zoomRatio);
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableRotate={false}
        enablePan={true}
        enableZoom={activeItem !== null} // Disable zoom when everything is resting on the table!
        minDistance={1.5}
        maxDistance={6}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />

      <group ref={bookHudRef}>
        <group ref={bookRig}>
          <Book position={[0, 0, 0]} />
        </group>
      </group>

      <group ref={cardsHudRef}>
        <group ref={photocardsRig}>
          <Suspense fallback={null}>
            <Photocards position={[0, 0, 0]} />
          </Suspense>
        </group>
      </group>

      {/* 
        POKEBALL CONTROLS: 
        Adjust the position array below to move it around the table (X, Y, Z). 
      */}
      <group ref={pokeballGroupRef} position={[-1.7, -1.45, -0.2]}>
        <Pokeball
          scale={0.5} // Adjust size here!
          rotation={[-0.9, 0.7, 0.1]} // Adjust tilt here (X, Y, Z)
        />
        {/* Simple drop shadow. Shift X and Z to move the shadow around the ball! */}
        <Shadow
          position={[-0.15, -0.25, 0.05]} // X=-0.15 shifts it to the left! Y=-0.25 keeps it at the bottom.
          opacity={1.5}
          scale={1.3} // How wide the shadow is
          color="#000000"
        />
      </group>

      <ambientLight intensity={0.4} color="#FFF5E1" />

      <directionalLight
        position={[2, 6, 3]}
        intensity={1.0}
        color="#FFFBF0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <pointLight
        position={[0, 3, 4]}
        intensity={0.5}
        color="#FFF8EE"
        distance={12}
      />

      <pointLight
        position={[-3, 2, 0]}
        intensity={0.2}
        color="#D4AF37"
        distance={10}
      />

      <Environment preset="apartment" environmentIntensity={0.5} />

      {/* Dynamic shadows that get tighter and harder when the book lays flat */}
      <ContactShadows
        position={[0, activeItem === null ? -1.75 : -0.94, activeItem === null ? 0.2 : -0.25]}
        opacity={activeItem === null ? 1 : 0.38}
        scale={activeItem === null ? 7 : 6.5}
        blur={activeItem === null ? 1.5 : 2.4}
        far={activeItem === null ? 1.5 : 3.4}
        color="#050301"
      />

      {/* Invisible plane to catch clicks when placed on the table, to bring it back */}
      <mesh
        position={[0, -1.75, 0.2]}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={() => {
          if (activeItem !== null) {
            setActiveItem(null);
          }
        }}
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.4} />
      </mesh>
    </>
  );
};
