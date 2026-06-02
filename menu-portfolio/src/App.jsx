import { Loader } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { PCFShadowMap } from 'three';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import { bgmAudio } from './audio';
import { activeItemAtom, galleryImages, pageAtom, pages, photoIndexAtom } from './store';

/**
 * App — The Epicurean Portfolio
 * 
 * A 3D book experience where a luxury restaurant menu reveals 
 * a software developer's portfolio.
 */
function App() {
  const [activeItem] = useAtom(activeItemAtom);
  const [, setPage] = useAtom(pageAtom);
  const [, setPhotoIndex] = useAtom(photoIndexAtom);
  const [isLoaded, setIsLoaded] = useState(false);

  // Attempt to start background music immediately on load.
  // Note: Modern browsers (Chrome, Safari) strictly block audio from playing without user interaction.
  // If it gets blocked, we silently fall back to playing it on the very first click.
  useEffect(() => {
    bgmAudio.play().catch(() => {
      // Autoplay was blocked by the browser. Wait for the user to click anywhere.
      const playOnClick = () => {
        bgmAudio.play().catch(() => {});
      };
      window.addEventListener('pointerdown', playOnClick, { once: true });
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeItem === 'book') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          setPage((p) => Math.min(p + 1, pages.length));
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          setPage((p) => Math.max(p - 1, 0));
        }
        if (e.key === 'Home') {
          setPage(0);
        }
        if (e.key === 'End') {
          setPage(pages.length);
        }
      } else if (activeItem === 'cards') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          setPhotoIndex((p) => (p + 1) % galleryImages.length);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          setPhotoIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPage, setPhotoIndex, activeItem]);

  // Mark loaded after a delay
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>


      {/* Loading screen */}
      <div className={`loading-screen ${isLoaded ? 'loaded' : ''}`}>
        <div style={{
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)',
          animation: 'goldShimmer 2s ease-in-out infinite',
        }} />
      </div>

      {/* 3D Canvas */}
      <div 
        className="canvas-container"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Canvas
          shadows={{ type: PCFShadowMap }}
          dpr={[1, window.devicePixelRatio]}
          gl={{ antialias: true, alpha: true }}
          camera={{
            position: [0, 2.2, 1.8],
            fov: 50,
          }}
        >
          {/* Removed solid color background to let CSS background image show through */}
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>

      {/* HTML UI overlay */}
      <UI />

      {/* Drei loader fallback */}
      <Loader
        containerStyles={{
          background: 'var(--color-midnight)',
        }}
        innerStyles={{
          background: 'var(--color-gold)',
          width: '200px',
          height: '2px',
        }}
        barStyles={{
          background: 'var(--color-gold-dark)',
          height: '2px',
        }}
        dataStyles={{
          color: 'var(--color-gold)',
          fontFamily: 'var(--font-display-sc)',
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
        }}
      />
    </>
  );
}

export default App;
