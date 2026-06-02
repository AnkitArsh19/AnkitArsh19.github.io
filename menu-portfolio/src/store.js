import { atom } from 'jotai';

/**
 * Page state atom — controls which page the book is opened to.
 * 0 = closed (showing cover), pages.length = back cover.
 */
export const pageAtom = atom(0);

/**
 * The currently active item at the camera.
 * Can be 'book', 'cards', or null (both resting on the table).
 */
export const activeItemAtom = atom('book');

/**
 * Tracks the hovered link URL for the bottom-left preview UI.
 */
export const hoveredLinkAtom = atom(null);

/**
 * Tracks which photocard is currently at the top of the stack.
 */
export const photoIndexAtom = atom(0);

/**
 * Array of image paths in the public gallery folder.
 */
const galleryModules = import.meta.glob('../public/gallery/*.{jpg,jpeg,png,webp,gif}', { query: '?url', eager: true });

export const galleryImages = Object.keys(galleryModules)
  .map(key => key.replace('/public', '')) // Convert to valid public URL
  .filter(path => {
    // Extract filename (e.g., "1" from "/gallery/1.jpg")
    const filename = path.split('/').pop().split('.')[0];
    return /^\d+$/.test(filename); // Keep only if filename is entirely digits
  })
  .sort((a, b) => {
    // Sort them numerically (1, 2, 3...) instead of alphabetically (1, 10, 2...)
    const numA = parseInt(a.split('/').pop().split('.')[0], 10);
    const numB = parseInt(b.split('/').pop().split('.')[0], 10);
    return numA - numB;
  });

/**
 * Page definitions for the menu book.
 * Each entry has a front and back — the textures/content shown on each side.
 * The first page's front is the cover, the last page's back is the back cover.
 * 
 * Content type can be:
 * - 'cover'     → leather textured cover
 * - 'parchment' → cream parchment page with content
 * - 'backcover' → back cover
 */
export const pages = [
  {
    front: '/Cover_page.png',
    back: '/page_2.png',
    frontType: 'cover',
    backType: 'parchment',
  },
  {
    front: '/page_3.png',
    back: '/page_4.png',
    frontType: 'parchment',
    backType: 'parchment',
  },
  {
    front: '/page_5.png',
    back: '/page_6.png',
    frontType: 'parchment',
    backType: 'parchment',
  },
  {
    front: '/page_7.png',
    back: '/Back_page.png',
    frontType: 'parchment',
    backType: 'cover',
  },
];
