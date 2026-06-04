import { useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { PCFShadowMap } from 'three';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import { bgmAudio } from './audio';
import { activeItemAtom, galleryImages, pageAtom, pages, photoIndexAtom } from './store';
import { loadingFacts } from './data/loadingFacts';

function LoadingScreen({ started, setStarted }) {
  const { progress } = useProgress();
  const [factIndex, setFactIndex] = useState(0);

  // Pick a random fact on mount
  useEffect(() => {
    setFactIndex(Math.floor(Math.random() * loadingFacts.length));
  }, []);

  // Handlers for cycling facts
  const nextFact = () => {
    setFactIndex((prev) => (prev + 1) % loadingFacts.length);
  };

  const prevFact = () => {
    setFactIndex((prev) => (prev - 1 + loadingFacts.length) % loadingFacts.length);
  };

  // Auto-cycle every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextFact();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard controls for facts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextFact();
      if (e.key === 'ArrowLeft') prevFact();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className={`loading-screen ${started ? 'loaded' : ''}`}>
      <div className="loading-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '800px', width: '90%', padding: '0 20px' }}>
        <div style={{
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)',
          animation: progress < 100 ? 'goldShimmer 2s ease-in-out infinite' : 'none',
          marginBottom: '2rem'
        }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {progress < 100 ? (
            <div className="loading-text" style={{ 
              color: 'var(--color-gold)',
              fontFamily: 'var(--font-display-sc)',
              letterSpacing: '0.2em',
              fontSize: '0.9rem',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginBottom: '2rem'
            }}>
              Cooking textures for the book... please wait ({Math.round(progress)}%)
            </div>
          ) : (
            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%',
            gap: '1.5rem'
          }}>
            <button onClick={prevFact} style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              opacity: 0.6,
              padding: '10px',
              transition: 'opacity 0.2s ease',
            }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}>
              &#8592;
            </button>

            <div style={{
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              lineHeight: '1.6',
              textAlign: 'center',
              fontStyle: 'normal',
              whiteSpace: 'pre-line',
              minHeight: '150px',
              display: 'flex',
              alignItems: 'center',
              flex: 1
            }}>
              {loadingFacts[factIndex]}
            </div>

            <button onClick={nextFact} style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-gold)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              opacity: 0.6,
              padding: '10px',
              transition: 'opacity 0.2s ease',
            }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}>
              &#8594;
            </button>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            opacity: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textAlign: 'center'
          }}>
            Press arrows to cycle
            {progress >= 100 && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                fontStyle: 'italic',
                opacity: 0.8,
                textTransform: 'none',
                letterSpacing: 'normal'
              }}>
                For the full luxury experience, viewing on desktop is highly recommended.
              </div>
            )}
          </div>
        </div>
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

  // Handle tab visibility to pause/play background audio
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        bgmAudio.pause();
      } else {
        if (started) {
          bgmAudio.play().catch(() => {});
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [started]);

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
