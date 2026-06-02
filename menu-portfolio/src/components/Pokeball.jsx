import { Center, useGLTF } from '@react-three/drei';
import React, { useEffect, useRef, useState } from 'react';
import { setPokeballHovered } from '../audio';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Pokeball(props) {
  const group = useRef();
  const jiggleGroup = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setPokeballHovered(hovered);
  }, [hovered]);

  // Load the GLB file from the public folder
  const { scene } = useGLTF('/pokeball/pokeball.glb');

  // Ensure all parts of the model can cast and receive shadows
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Apply a gentle, warm darkened tint WITHOUT destroying the original colors!
          if (child.material && child.material.color && !child.userData.tinted) {
            // Clone the material so we don't accidentally mutate it multiple times in React Strict Mode
            child.material = child.material.clone();

            // Darken the original red/white/black by 50%
            child.material.color.multiplyScalar(0.8);

            // Blend in 15% of a warm candlelight orange to match the restaurant
            child.material.color.lerp(new THREE.Color('#ffaa00'), 0.15);

            // Mark as tinted so we don't double-tint it
            child.userData.tinted = true;
          }
        }
      });
    }
  }, [scene]);

  // Change the mouse cursor to a pointer when hovering over the Pokeball
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto'; // Cleanup
    };
  }, [hovered]);

  // The Jiggle Animation!
  useFrame((state) => {
    if (!jiggleGroup.current) return;

    if (hovered) {
      // Rapidly tilt left and right (sin wave based on time)
      jiggleGroup.current.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.15;
      
      // Highlight by smoothly scaling up by 10%
      jiggleGroup.current.scale.setScalar(THREE.MathUtils.lerp(jiggleGroup.current.scale.x, 1.1, 0.2));
    } else {
      // Smoothly return to static position and normal scale when not hovered
      jiggleGroup.current.rotation.z = THREE.MathUtils.lerp(jiggleGroup.current.rotation.z, 0, 0.1);
      jiggleGroup.current.scale.setScalar(THREE.MathUtils.lerp(jiggleGroup.current.scale.x, 1.0, 0.2));
    }
  });

  return (
    <group 
      ref={group} 
      {...props} 
      dispose={null}
      // Add interaction events!
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={() => window.open('http://localhost:5174', '_blank')}
    >
      {/* Nested group for animating so we don't overwrite the base rotation from Experience.jsx */}
      <group ref={jiggleGroup}>
        <Center scale={1} top>
          <primitive object={scene} />
        </Center>
      </group>
    </group>
  );
}

// Preload the model so there's no delay when rendering
useGLTF.preload('/pokeball/pokeball.glb');
