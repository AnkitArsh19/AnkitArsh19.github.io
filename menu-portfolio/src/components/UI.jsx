import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { activeItemAtom, galleryImages, hoveredLinkAtom, pageAtom, pages, photoIndexAtom } from '../store';

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const [photoIndex, setPhotoIndex] = useAtom(photoIndexAtom);
  const [activeItem, setActiveItem] = useAtom(activeItemAtom);
  const [hoveredLink] = useAtom(hoveredLinkAtom);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef(null);

  // Auto-hide controls when a page/photo turns
  useEffect(() => {
    if (activeItem === 'book' && page === 0) return;

    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 1500);

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio can be blocked until the first user gesture.
    }
  }, [page, photoIndex, activeItem]);

  return (
    <div className="ui-overlay">
      {activeItem !== null && (
        <div 
          className={`nav-shell ${controlsVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={() => {
          clearTimeout(hideTimer.current);
          setControlsVisible(true);
        }}
        onMouseLeave={() => {
          clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setControlsVisible(false), 700);
        }}
      >
        <div className="nav-dots">
          {/* Dynamically render dots based on active item */}
          {activeItem === 'book' && [...Array(pages.length + 1)].map((_, index) => (
            <button
              key={index}
              className={`nav-dot ${page === index ? 'active' : ''}`}
              onClick={() => setPage(index)}
              title={`Page ${index + 1}`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}

          {activeItem === 'cards' && galleryImages.map((_, index) => (
            <button
              key={index}
              className={`nav-dot ${photoIndex === index ? 'active' : ''}`}
              onClick={() => setPhotoIndex(index)}
              title={`Photo ${index + 1}`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}

          <button
            className={`table-toggle ${activeItem === null ? 'active' : ''}`}
            onClick={() => setActiveItem(null)}
            title={activeItem === null ? 'Select an item to view' : 'Place on table'}
            aria-label={activeItem === null ? 'Select an item to view' : 'Place on table'}
          >
            Table
          </button>
        </div>
      </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: 'rgba(212, 175, 55, 0.7)',
          letterSpacing: '0.05em',
          transition: 'opacity 0.3s ease',
          opacity: activeItem === null ? 0 : 1,
        }}
      >
        &#8592; / &#8594; to {activeItem === 'book' ? 'turn pages' : 'swap photos'}
      </div>

      {/* Custom Bottom-Left Link Preview Overlay */}
      {hoveredLink && (
        <div
          style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            backgroundColor: '#e9ecef',
            color: '#495057',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            borderTopRightRadius: '4px',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '1px -1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {hoveredLink.url}
        </div>
      )}
    </div>
  );
};
