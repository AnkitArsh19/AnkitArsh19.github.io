import { useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { PCFShadowMap } from 'three';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import { bgmAudio } from './audio';
import { activeItemAtom, galleryImages, pageAtom, pages, photoIndexAtom } from './store';

function LoadingScreen({ started, setStarted }) {
  const { progress } = useProgress();
  
  return (
    <div className={`loading-screen ${started ? 'loaded' : ''}`}>
      <div className="loading-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)',
          animation: progress < 100 ? 'goldShimmer 2s ease-in-out infinite' : 'none',
          marginBottom: '2rem'
        }} />
        
        {progress < 100 ? (
          <div className="loading-text" style={{ 
            color: 'var(--color-gold)',
            fontFamily: 'var(--font-display-sc)',
            letterSpacing: '0.3em',
            fontSize: '0.8rem',
            textAlign: 'center',
            textTransform: 'uppercase'
          }}>
            LOADING {Math.round(progress)}%
          </div>
        ) : (
          <>
            <button 
              className="enter-button"
              onClick={() => {
                setStarted(true);
                bgmAudio.play().catch(() => {});
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)',
                padding: '1rem 2rem',
                fontFamily: 'var(--font-display-sc)',
                letterSpacing: '0.2em',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(184, 151, 105, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(184, 151, 105, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              CLICK TO ENTER
            </button>
            <div style={{
              marginTop: '1.5rem',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              textAlign: 'center',
              opacity: 0.8
            }}>
              For the full luxury experience, viewing on desktop is highly recommended.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [started, setStarted] = useState(false);

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

  return (
    <>
      {/* Custom Loading Screen */}
      <LoadingScreen started={started} setStarted={setStarted} />

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
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
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
    </>
  );
}

export default App;
