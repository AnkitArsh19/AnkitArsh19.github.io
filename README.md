# The Epicurean Portfolio

A full-stack developer portfolio served as a luxury restaurant menu experience.

I built this because I wanted to try something different. Outside of writing code and building backend-heavy systems, I spend my time drawing monochromatic graphite studies, exploring architecture, and cooking unusual pairings in the kitchen. I treat every project as a chance to learn something I didn't know before, and this portfolio is a collision of those interests: art, food, and software architecture.

## How It Works

Instead of a standard scrolling website, this portfolio is a fully interactive 3D scene built with **React Three Fiber** and **Three.js**.

The centerpiece is a leather-bound menu resting on a dark wooden table under a warm, dynamic spotlight. 

**The 3D Page Flip Physics:**
The book isn't just an animation—it's a mathematical physics simulation. 
- The pages are built on a **30-bone SkinnedMesh rig**. 
- Each bone controls a specific segment of the page geometry. 
- When a page flips, the code rotates these bones in a precise sequence from the spine outward. This creates the realistic physical curl, tension, and bending of heavy paper.
- The lighting, leather grain textures, and shadows all react dynamically to the mesh deformation in real-time.

## Tech Stack
- **React (Vite):** Core UI and state management.
- **Three.js & React Three Fiber:** 3D rendering engine and scene graph.
- **Drei & Maath:** Camera controls, environmental staging, and smooth damping mathematics for animations.
- **Vanilla CSS:** Minimal, clean styling to let the WebGL canvas breathe.

## The Other Portfolio
If a 3D restaurant menu isn't your style, I also built a fully playable Pokémon FireRed replica game engine where my projects are hidden inside the houses of a 2D pixel-art town. 

## Contact
- **Email:** ankitarsh19@gmail.com
- **GitHub:** [github.com/AnkitArsh19](https://github.com/AnkitArsh19)
- **LinkedIn:** [linkedin.com/in/ankitarsh19](https://linkedin.com/in/ankitarsh19)
- **Medium:** [medium.com/@ankitarsh19](https://medium.com/@ankitarsh19)
