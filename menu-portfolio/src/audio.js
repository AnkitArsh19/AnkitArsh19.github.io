// ======== AUDIO VOLUME TWEAKS ========
// Adjust these values between 0.0 (silent) and 1.0 (max volume)
export const VOLUMES = {
  bgm: 0.4,         // Background music (very low)
  pokeball: 0.2,     // Pokeball hover loop
  bookHover: 1,    // Book hover
  photoHover: 0.1,   // Photo hover
  pageFlip: 0.3,     // Book page flip
  photoFlip: 0.1,    // Photo swipe
};
// =====================================

export const bgmAudio = new Audio('/music/background_music.mp3');
bgmAudio.loop = true;
bgmAudio.volume = VOLUMES.bgm;

const bookHoverAudio = new Audio('/music/book_select.mp3');
bookHoverAudio.volume = VOLUMES.bookHover;

const photoHoverAudio = new Audio('/music/photo_select.mp3');
photoHoverAudio.volume = VOLUMES.photoHover;

const pageFlipAudio = new Audio('/music/page_flip.mp3');
pageFlipAudio.volume = VOLUMES.pageFlip;

const photoFlipAudio = new Audio('/music/photo_flipping.mp3');
photoFlipAudio.volume = VOLUMES.photoFlip;

const pokeballAudio = new Audio('/music/pokeball.mp3');
pokeballAudio.volume = VOLUMES.pokeball;

export const playBookHover = () => {
  bookHoverAudio.currentTime = 0;
  bookHoverAudio.play().catch(() => { });
};

export const playPhotoHover = () => {
  photoHoverAudio.currentTime = 0;
  photoHoverAudio.play().catch(() => { });
};

export const playPageFlip = () => {
  pageFlipAudio.currentTime = 0;
  pageFlipAudio.play().catch(() => { });
};

export const playPhotoFlip = () => {
  photoFlipAudio.currentTime = 0;
  photoFlipAudio.play().catch(() => { });
};

let pokeballHovered = false;
let pokeballTimeout = null;

pokeballAudio.onended = () => {
  if (pokeballHovered) {
    pokeballTimeout = setTimeout(() => {
      if (pokeballHovered) {
        pokeballAudio.currentTime = 0;
        pokeballAudio.play().catch(() => { });
      }
    }, 1000); // 1 second gap
  }
};

export const setPokeballHovered = (isHovered) => {
  pokeballHovered = isHovered;
  if (isHovered) {
    pokeballAudio.currentTime = 0;
    pokeballAudio.play().catch(() => { });
  } else {
    // Stop immediately if they hover off
    pokeballAudio.pause();
    clearTimeout(pokeballTimeout);
  }
};
