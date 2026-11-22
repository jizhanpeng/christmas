# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A dependency-free, single-page Christmas animation generated with WebGL and Canvas 2D. The scene is procedural rather than image-based; the music player separately uses a lightweight local WebP thumbnail derived from `img/孙燕姿.png` as its CD cover. Markup, styles, JavaScript, and GLSL are split into small local files.

## Run and verify

Open `index.html` directly in a modern WebGL-capable browser—no install, build, or server is required. Alternatively, serve the directory locally:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`.

There is no package manifest, build step, linter, or automated test suite. Verify changes in a browser over both `file://` and HTTP, including resizing/mobile layouts, high-DPI rendering, continuous animation, mouse parallax and local repulsion, and the complete click/tap scatter-regather-pulse sequence. For audio changes, verify autoplay fallback, play/pause, pointer and keyboard seeking, lyric cue synchronization, loop reset, and that every part of the music player is isolated from the tree burst. Check the console for JavaScript and shader compilation errors and profile the GPU render loop after changing particle counts or shaders.

## Architecture

`index.html` loads ordered classic scripts rather than ES modules so direct-file operation does not encounter module CORS restrictions. Each script is an IIFE sharing only the `window.ChristmasScene` namespace; no shader or data files are fetched at runtime.

- `index.html` — two canvases and semantic HTML overlays, plus the stylesheet and script references.
- `css/scene.css` — editorial typography, frame details, and responsive layouts.
- `js/config.js` — shared geometry, palettes, responsive radii, and entrance/burst/pulse timings.
- `js/shaders.js` — `createShaders()` returns vertex and fragment GLSL strings. Geometry and timing constants are injected from `config.js` to keep JavaScript and GPU timelines synchronized.
- `js/ornaments.js` — `createOrnamentBuilder(config)` generates shallow particle reliefs of Rilakkuma, a segmented chocolate bar, and Santa Claus. It reserves an exact responsive particle budget and emits through the main particle builder without owning WebGL state.
- `js/particles.js` — `createParticleBuilder(config).build(layout)` purely generates typed arrays and the actual particle count. It has no WebGL dependency or global state.
- `js/background.js` — `createBackground(canvas, config)` owns Canvas 2D sizing and static background drawing, including private projection and procedural mist helpers.
- `js/renderer.js` — `createRenderer(canvas, shaders)` owns WebGL initialization, shader compilation/linking, buffers, uniforms, and rendering. `upload(result)` is the boundary between generated data and GPU state.
- `js/lyrics.js` — timestamped lyric data converted from the user-supplied local LRC; loaded as a classic script so no runtime fetch is needed under `file://`.
- `js/music.js` — `createMusicPlayer()` owns local audio playback, the accessible CD player and seek control, lyric synchronization, and its playback-only animation loop.
- `js/main.js` — the sole orchestration layer: responsive projection, resize, pointer state, burst state, shared timings, and the animation loop.

Load order is `config` → `shaders` → `ornaments` → `particles` → `background` → `renderer` → `lyrics` → `music` → `main`.

### Rendering and motion

- **Two canvases:** `#bg` is a Canvas 2D static background containing the sky, stars, glows, celestial orbits, vignette, and organic blue upper-sky mist generated from layered value noise on resize. `#c` is a transparent WebGL canvas for all moving particles. Editorial typography and fine border details remain HTML overlays.
- **Custom WebGL renderer:** hand-written shaders, not Three.js. Five per-particle attributes store target position, scatter position, color, procedural parameters such as bell anchors or firework directions, and size/alpha/random-seed/kind. One `gl.drawArrays(gl.POINTS)` call renders the entire point cloud with additive blending. Canvas MSAA is disabled with `antialias:false`; particle edges are smoothed procedurally instead, avoiding a severe mobile fill-rate cost.
- **Particle kinds:** approximately 92,500 particles on desktop and 66,700 on mobile. Kind 0 is irregular tree volume dust, 1 is the deliberately sparse rising helix, 2 is the camera-facing heart, 3 is soft tree/ground haze, 4 is ambient dust that does not participate in the explosion, 5 is a champagne-gold particle bell or a shallow Rilakkuma/chocolate/Santa ornament, 6 is a sparse star glint, 7 is a distant firework, 8 is a short-lived introductory light trail, 9 is a large introductory bell that dissolves into stardust, and 10 is its fine particle suspension line. Kind 11 is full-screen layered falling snow and kind 12 forms three slowly counter-rotating ground light rings; neither joins the tree explosion. Six tree bells each contain 280 particles forming the top ring, body, flared lip, and clapper. The three additional ornaments use 2,800 desktop or 1,960 mobile particles, share one sway seed per ornament, and reuse kind 5 so they rotate, swing, reveal, pulse, scatter, and regather with the bells. Three larger entrance bells reuse the bell generator with denser particles and independent depth, scale, drop phase, and damped sway. Four fireworks on desktop and three on mobile expand and fade on staggered GPU loops without joining the tree explosion. Dust density is weighted toward the base to avoid an overbright tree tip.
- **GPU animation:** the vertex shader rotates the 3D tree, advances ribbon particles along the helix, pulses the heart, sways bells and character ornaments around their anchors, expands staggered fireworks, drifts ambient dust, falls and wraps viewport-covering snow, rotates and breathes the ground rings, and applies an analytical curl flow field with kind-specific amplitudes. It also calculates perspective and front/rear brightness. Keep per-frame motion in GLSL; moving these calculations into JavaScript would negate the renderer's performance advantage.
- **Crisp particles and glints:** the fragment shader procedurally draws a small bright core and a restrained halo using `gl_PointCoord`. Only kind 6 adds narrow crossed rays for star glints. Large blurred sprites and full-screen bloom are intentionally avoided. Particle size is perspective-scaled and device-pixel-ratio aware.

### Music and lyrics

- `music/孙燕姿 - 遇见.web.m4a` is the local looping background track, an AAC stereo browser-compatible copy of the original AV3A M4A. Its companion user-supplied LRC is converted into `js/lyrics.js`; neither the LRC nor its external credit URLs are fetched at runtime.
- The player attempts audible autoplay, then retries on the first pointer or keyboard interaction outside the music control if browser policy blocks it. Ordinary pages cannot bypass a browser's audible-autoplay policy. A manual pause is never undone by interacting with the tree, and every pointer interaction inside the player is isolated from the tree burst.
- The bottom-right glass player displays `img/孙燕姿-thumb.webp`, a 320×432 local derivative of the supplied portrait, on a CSS-rotating CD. Playback state freezes or resumes that rotation without a JavaScript rotation loop; `prefers-reduced-motion` disables it. Its native range control exposes the real audio duration, elapsed time, pointer/touch scrubbing, and keyboard seeking. While scrubbing, only the preview moves; releasing or committing the range updates `audio.currentTime` and resynchronizes lyrics without starting paused audio.
- `createMusicPlayer()` is initialized before WebGL and synchronizes the active lyric from `audio.currentTime`. The low-opacity, vertically scrolling list bolds the current line, retains it through instrumental gaps and the outro, and resets with the audio loop. Its separate `requestAnimationFrame` runs only while audio is playing; lyric easing remains per-frame, while cached progress DOM writes are throttled to 10Hz and forced immediately for interaction/resynchronization. Pausing, seeking, resizing, and visibility changes resynchronize without affecting scene time.

### Interaction and timeline

- **Entrance:** `uIntro` drives a roughly 7.5-second opening. Kind-11 snow is visible from the first frame. Three large kind-9 bells descend from offscreen on kind-10 particle suspension lines for 1.45 seconds, with staggered landings, different depths, and damped sway. The lines fade from 1.9–2.35 seconds while the bells dissolve into arcing stardust and gather at the two helix origins by 2.75 seconds, then fade by 2.95 seconds. Two kind-8 streams take over those origins and cross in opposing helices from 2.75–4.4 seconds, with larger particles and an RGB-only brightness boost at the leading ends. The trails collapse into an irregular star flash at the tree tip from 4.4–4.9 seconds, hold until 5.4 seconds, and fade by 5.7 seconds. Starting at 5.05 seconds, a descending height threshold reveals the heart and tree over 1.9 seconds; the kind-12 ground rings fade in alongside the tree. Fireworks fade in from 7.0–7.5 seconds and the automatic pulse starts after 7.5 seconds. All stage times are derived from the shared `prelude` offset in `config.js`.
- **Scatter/regather interaction:** `pointerdown` starts a global sequence that resets after 4.05 seconds. In GLSL, each particle receives a seed/height-based delay, then follows an eased 0.85-second expansion and fade, a nearly invisible hold until 1.25 seconds, and a swirling regather ending at 3.75 seconds after its delay. `uBurstAge` drives these local timelines while the hint reports the global stage. Additional clicks are ignored until the sequence finishes. While the tree is idle, a 1.8-second `uPulse` light wave rises from the base to the heart and automatically repeats every 6.4 seconds; the pulse is suspended during the burst.
- **Pointer response:** pointer position controls eased camera parallax. `setPointer()` also projects the cursor onto the tree's vertical plane; `uPointerWorld` and a smoothed `uPointerForce` produce local GPU repulsion while the mouse moves. Touch taps trigger the burst without persistent hover repulsion.
- **Responsive projection:** `resize()` is debounced, ignores duplicate notifications when width, height, and effective DPR are unchanged, and otherwise regenerates GPU buffers and calculates projection scale/offset from the front of the outer ground ring and the top of the heart. This keeps the tree and its rings at the bottom of the viewport without clipping the heart. Device pixel ratio is capped at 2.
- **Editorial layout:** at widths of 1100px and above, the tree sits right of center and the greeting occupies the left column. Below that breakpoint, the tree centers and the greeting overlaps its lower section.

Keep the static background/dynamic WebGL split when adding visuals. Geometry and random scatter targets are generated only on resize; continuous animation belongs in the shaders or a small number of uniform updates in `tick()`.
