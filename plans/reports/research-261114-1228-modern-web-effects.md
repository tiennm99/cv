# Research: modern web effects for the show-off landing site

Date: 2026-11-14 · Scope: techniques for an award-level personal landing site on the
approved stack (Svelte 5 + Vite + Tailwind v4, plain JS + JSDoc, three.js via Threlte,
GSAP, Lenis), hosted statically on GitHub Pages. Research only; the user picks a concept.

## TL;DR

- **One hero 3D moment and a fast, typographic page around it.** Award sites in
  2025-2026 pair a single GPU hero (particles, a shader field or a raymarched object)
  with kinetic type, smooth scroll and page transitions. They do not put 3D in every section.
- **WebGPU first, WebGL fallback for free.** three.js `WebGPURenderer` falls back to
  WebGL2 automatically, and TSL shaders compile to both. WebGPU is still missing on
  some stable platforms (Linux, Android on some GPUs), so the fallback path matters.
- **Native CSS handles most scroll effects.** Scroll-driven animations, View
  Transitions, `@property` and anchor positioning have shipped in all three engines.
  Keep GSAP for choreography (timelines, SplitText, pinning).
- **Cost on phones.** The 3D hero's fragment work and post-processing are the main
  costs. Cap DPR, use adaptive quality, and drop to a static poster when
  `prefers-reduced-motion` is set, WebGL is missing, or FPS stays low.

## Technique matrix

| Technique | Wow it gives | Support (Nov 2026) | Phone cost | Svelte 5 pairing |
| --- | --- | --- | --- | --- |
| three.js WebGPURenderer + TSL | Compute particles (100k+), node-based shaders, modern post-FX | WebGPU: Chrome/Edge, Safari 26, Firefox 141+ on Windows; elsewhere auto WebGL2 fallback | Medium-high; compute is cheaper than CPU particles | Threlte `<Canvas>` with a custom `createRenderer` returning `WebGPURenderer` |
| Shaders: noise / fBm fields | Living gradient or "liquid" background reacting to cursor and scroll | Everywhere WebGL2 works | Low-medium (one full-screen pass) | A plain `<canvas>` action, or a Threlte `<T.Mesh>` with a ShaderMaterial / TSL node |
| Shaders: raymarching (SDF) | Morphing metaball or "blob" logo, glassy refraction | WebGL2 | High (per-pixel loop); render at 0.5x and upscale on phones | Same, behind a quality tier |
| GPU particles | Avatar or name dissolving into particles, morphing into the GitHub contribution grid | WebGL2 (FBO ping-pong) / WebGPU compute | Medium; scale count by tier (e.g. 16k phone vs 128k desktop) | Threlte + `useTask` for the sim step |
| Post-processing (bloom, chromatic, grain, DOF) | Cinematic polish | three `PostProcessing` (WebGPU) or `postprocessing` lib (WebGL) | Medium-high; each pass is a full-screen draw | Disable on low tier |
| Threlte 8 | Declarative scene graph in Svelte 5 runes | Svelte 5 only; 8.x line current | Thin wrapper over three | `@threlte/core`, `@threlte/extras` (HTML overlays, `Float`, `Text`, loaders) |
| GSAP 3.13+ (ScrollTrigger, SplitText, Flip, MorphSVG, ScrambleText) | Pinned storytelling, per-char text reveals, layout morphs | All browsers; every plugin free since 2025 | Low (transform/opacity only) | Svelte actions (`use:reveal`) or `$effect` with `gsap.context()` / `gsap.matchMedia()` and revert on cleanup |
| Lenis 1.3.x | Inertial smooth scroll that syncs with WebGL | All; native on touch by default | Low | Create in root `+layout` / `App.svelte` `$effect`, drive `lenis.raf` from `gsap.ticker`, `lenis.on('scroll', ScrollTrigger.update)` |
| CSS scroll-driven animations (`animation-timeline: scroll()/view()`) | Progress bars, parallax, reveal-on-view with no JS, off the main thread | Chrome 115+, Safari 26, Firefox 159 (default) | Very low (compositor) | Plain CSS in components; wrap in `@supports (animation-timeline: view())` |
| View Transitions API | Morphing between sections/projects (card expands to detail) | Same-document: Baseline (Firefox 144); cross-document: Chrome 126+, Safari 18.2 (Firefox unverified) | Low | `document.startViewTransition(() => state = x)` around a rune update; `view-transition-name` per card |
| `@property` typed custom props | Animatable gradients, conic "border beam", hue cycling | Baseline since 2024 | Very low | Tailwind v4 already emits `@property`; add your own in `app.css` |
| Anchor positioning | Tooltips / popovers tethered to elements (skill chips, repo cards) with no JS | Chrome 125, Safari 26, Firefox 147 | None | Pair with `popover` attribute |
| Variable fonts | Weight/width morph on hover or scroll, "breathing" headline | Universal | Very low (one file, but subset it) | Animate `font-variation-settings` via GSAP or a scroll timeline |
| Cursor / magnetic effects | Custom blend-mode cursor, magnetic buttons, image trail | Pointer devices only | Low; skip on `(hover: none)` | One `use:magnetic` action with `gsap.quickTo` |
| Audio-reactive touches | Shader that pulses to an ambient loop; UI "tick" sounds | Web Audio everywhere; needs a user gesture | Low (AnalyserNode FFT, 64 bins) | Off by default, a sound toggle stores the choice in `localStorage` |

## Notes per technique

**three.js WebGPU + TSL.** `import * as THREE from 'three/webgpu'` and `three/tsl`.
r182 made `WebGPURenderer` the recommended renderer; r183 added a formal TSL spec. TSL
nodes (`positionLocal`, `mx_noise_float`, `time`, `Fn`) replace string GLSL and compile
to WGSL or GLSL, so one shader serves both backends. `await renderer.init()` is
required before the first render. The API still moves between releases, so pin the
three.js minor that Threlte supports and say why in the README (exception to the
moving-tag rule). Sources: [three.js WebGPURenderer manual](https://threejs.org/manual/en/webgpurenderer),
[r183 summary](https://app.cinevva.com/news/2026-03-18-threejs-r183-render-pipeline),
[What changed in three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed),
[WebGL to WebGPU migration caveats](https://www.buildmvpfast.com/blog/threejs-webgl-to-webgpu-renderer-migration-2026),
[WebGPU in all major browsers](https://web.dev/blog/webgpu-supported-major-browsers).

**Shaders.** The highest wow per kilobyte is a full-screen fBm/domain-warp field
(Inigo Quilez style) tinted with the brand palette and nudged by cursor velocity and
scroll progress. Raymarching (SDF smooth-union blobs, glass with fake refraction) is the
"how did they do that" piece, but it costs a lot per pixel: render to a half-resolution
target on phones. Particles that morph between shapes (sphere, the name as text
points, the user's avatar sampled from the GitHub image) tell the CV story well, using
attribute targets plus a noise curl. Post-FX: subtle bloom and film grain are enough.
Heavy chromatic aberration reads as 2021.

**Threlte 8.** Built for Svelte 5 runes and drops Svelte 4. `useTask` replaces
manual RAF and `<HTML>` from extras places DOM labels in 3D space, which suits
floating repo cards. For WebGPU, pass a `createRenderer` prop that builds
`WebGPURenderer` (check the Threlte docs for the current prop name before building). Sources:
[Threlte migration guide](https://threlte-git-studio-threlte.vercel.app/docs/learn/advanced/migration-guides),
[@threlte/core 8.5 README](https://cdn.jsdelivr.net/npm/@threlte/core@8.5.16/README.md).

**GSAP.** Since Webflow's acquisition, all of GSAP is free, Club plugins included.
3.13 shipped a SplitText rewrite: about half the size, 14 new features, `autoSplit` re-splits on
resize and font load, and `mask: 'lines'` gives clean line reveals. Pair
`ScrollTrigger` pin + scrub for a horizontal "timeline of experience" section.
`gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` covers the reduced-motion
branch in one place. Sources: [GSAP 3.13 notes](https://gsap.com/blog/3-13/),
[Webflow: GSAP is free](https://webflow.com/blog/gsap-becomes-free),
[SplitText rewrite](https://webflow.com/blog/gsap-splittext-rewrite),
[Codrops free-plugin demos](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/).

**Lenis.** Use the `lenis` package (1.3.x, not `@studio-freight/lenis`) and import
`lenis/dist/lenis.css`. It has no Svelte binding, and the vanilla API in a root effect is
enough. Turn it off under reduced motion, and use `lenis/snap` for snapping, because
CSS scroll-snap does not work with it. Sources: [Lenis README](https://cdn.jsdelivr.net/gh/darkroomengineering/lenis@1.3.26/README.md),
[Motion docs on Lenis](https://motion.dev/docs/lenis).

**Native CSS layer.** Scroll-driven animations are now in all three engines, so
simple reveals and parallax should use CSS, with GSAP only for scrubbed, pinned
choreography. View Transitions give app-like morphs on a static site. Anchor
positioning plus `popover` replaces a tooltip library. Sources:
[web.dev Oct 2026](https://web.dev/blog/web-platform-10-2026),
[same-document VT Baseline](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available),
[web.dev Jan 2026 (anchor positioning)](https://web.dev/blog/web-platform-01-2026),
[Firefox 147 notes](https://developer.mozilla.org/en-US/Firefox/Releases/147),
[caniuse anchor positioning](https://caniuse.com/css-anchor-positioning),
[Chrome anchor positioning guide](https://developer.chrome.com/docs/css-ui/anchor-positioning-api).

**Type, cursor, audio.** Variable display faces (e.g. a wide grotesk with a `wdth`
axis) animated on scroll are the cheapest way to make a page look "designed".
Self-host them through Fontsource packages (JS-only, no Python subsetting tools). A magnetic cursor and an image or particle trail should apply only on
`(hover: hover) and (pointer: fine)`. Audio adds a lot when it is opt-in and very
bad when it autoplays.

## Award patterns 2025-2026 (Awwwards / FWA / Codrops)

Observed across Awwwards SOTD and SOTY portfolio winners (e.g.
[Cyd Stumpel Portfolio 2025](https://www.awwwards.com/inspiration_search/Aeonik/), SOTY 2025 "Women At Work")
and Codrops demos:

1. **Preloader that is the intro**: a counter or a particle assembly that resolves into
   the hero, finishing under about 2 s.
2. **Oversized kinetic typography**: line-masked SplitText reveals and variable-weight
   hover.
3. **One interactive WebGL hero**: distortion or particles that react to the cursor,
   with an idle animation.
4. **Seamless transitions**: View Transitions or a WebGL plane that carries an image from
   a list to a detail view.
5. **Horizontal pinned sections and sticky storytelling** for a timeline.
6. **Grain, noise and a restrained palette** (one accent color) instead of gradients
   everywhere. Brutalist grids are back.
7. **Live data as proof**: real counters (stars, repos, years) ticking up. This fits
   the user's live GitHub-data requirement.
8. **A small easter egg**: Konami code, a terminal mode, or a "view source" toggle.
   Developer portfolios win Developer Awards on craft details.

## Live GitHub data (constraint)

- Fetch in the browser: `GET https://api.github.com/users/tiennm99` (avatar_url,
  public_repos, followers) and `/users/tiennm99/repos?per_page=100&sort=updated`
  (sum `stargazers_count`, pick top repos). Two calls per visit, well under the 60 req/h
  per IP unauthenticated limit, and CORS is allowed.
- Cache the response in `sessionStorage`/`localStorage` with a TTL (e.g. 1 h) and
  send `If-None-Match` with the stored ETag. A 304 does not count against the rate limit.
- **Degrade gracefully**: render skeletons, then the data. On an error or a 403/429
  (`x-ratelimit-remaining: 0`), show the cached copy marked "as of <time>". With no
  cache, hide the numbers and keep the static project list from `miti99.yml`, and use
  `https://github.com/tiennm99.png` as the avatar (a plain image URL, no API quota).
- Never render the phone field from `miti99.yml`. Strip it at build time in the data
  loader, so it never reaches the bundle.

## Performance and accessibility guardrails

- **Quality tiers**: detect `navigator.gpu`, `devicePixelRatio`,
  `navigator.hardwareConcurrency`, and measure FPS over the first 60 frames. Set DPR to
  `min(dpr, 1.5)` on phones and to 1 under load. Pause rendering when the canvas is
  off-screen (`IntersectionObserver`) or the tab is hidden.
- **Reduced motion**: no Lenis, no scrubbed pins, the canvas shows one static frame or a
  poster image, and reveals become fades. Use `gsap.matchMedia` plus CSS
  `@media (prefers-reduced-motion: reduce)`.
- **Non-WebGL fallback**: if WebGL2 context creation fails, swap the canvas for a CSS
  `@property` animated gradient plus an SVG grain. The content stays complete as HTML.
- **Budget**: lazy-load three/Threlte after first paint (dynamic `import()`), aim for
  under 250 KB gzip JS on first load, ship assets as KTX2/Draco, and set
  `base: '/cv/'` in Vite for GitHub Pages.
- Text stays real DOM, not canvas, so it remains selectable, indexable and readable by
  screen readers. Add a "skip intro" control.

## Suggested concept seeds (for the prototype step)

1. **Particle self**: the GitHub avatar sampled into GPU particles that scatter on
   scroll and re-form as the contribution grid, then as top repo cards.
2. **Liquid terminal**: a dark noise-field shader behind a typed-terminal hero,
   SplitText command output, and repo cards that morph with View Transitions.
3. **Orbit of work**: Threlte scene with projects as floating cards orbiting a
   raymarched core. Scroll moves the camera, and each card shows live stars.
4. **Editorial kinetic** (lightest): no 3D hero, only variable type, scroll-driven CSS,
   grain and a cursor-reactive gradient. Doubles as the reduced-motion design.

## Unresolved questions

- Threlte's exact prop and API for `WebGPURenderer` in the current 8.x release
  (not confirmed in sources; check the docs before building).
- Firefox support for cross-document View Transitions was not confirmed. Not needed
  for a single-page site.
- Whether the user wants sound at all (opt-in toggle suggested).
- Which public profiles beyond GitHub (LinkedIn, blog, etc.) count as "all public
  information". Confirm the list against `miti99.yml`.
