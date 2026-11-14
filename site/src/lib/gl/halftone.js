/**
 * Riso halftone WebGL moment, shared by the hero (mode 0) and the contact finale
 * (mode 1): one fixed full-screen canvas and one three.js renderer, loaded by
 * dynamic import after first paint, drawn only while an attached stage is on screen.
 *
 * Usage from a section (inside `$effect`, only when `webglAllowed()`):
 *   const handle = attachHalftone(stageEl, { mode: 0, boxes: kinetic.boxes, onFallback });
 *   return () => handle.detach();
 * `onFallback` is called if WebGL cannot start or the context is lost; show the
 * `.halftone-css` fallback then.
 *
 * Budget: the warped fBm runs in a field pass at 1/8 resolution and the dot pass only
 * samples it; DPR min(dpr, 1.5), one frame per 100ms after 4s without input, paused
 * off-screen and while the tab is hidden. While it runs, the quality monitor keeps
 * measuring FPS; the contact section swaps to the CSS halftone on the 'low' tier. No layout
 * reads per frame: stage offsets are cached on resize and ScrollTrigger refresh.
 */
import { TOKENS, oklchToSrgb, activeTheme } from '../tokens.js';
import { ui } from '../ui.svelte.js';
import { gsap, ScrollTrigger } from '../motion/runtime.js';
import vertexShader from './halftone.vert.glsl?raw';
import fragmentShader from './halftone.frag.glsl?raw';
import trailShader from './trail.frag.glsl?raw';
import fieldShader from './halftone-field.frag.glsl?raw';
import { setGlActive } from '../motion/quality.js';

const MAX_BOXES = 32;

/**
 * @typedef {object} StageOptions
 * @property {0 | 1} mode 0 = hero drift and scroll exit, 1 = convergence on `focus`.
 * @property {(out: Float32Array, max: number) => number} [boxes] Glyph boxes to knock out (kinetic controller `boxes`).
 * @property {() => { x: number, y: number } | null} [focus] Viewport CSS px point for mode 1 (cache it; no layout reads).
 * @property {() => void} [onFallback] Called when WebGL is unavailable or lost.
 */

/**
 * @typedef {{ el: HTMLElement, options: StageOptions, ratio: number, top: number, height: number }} Stage
 */

/** @type {Set<Stage>} */
const stages = new Set();
/** @type {Promise<any> | null} */
let enginePromise = null;
let failed = false;

/**
 * Attaches a stage. Returns a handle whose `detach()` must run on destroy.
 * @param {HTMLElement} el Stage element (hero or contact section).
 * @param {StageOptions} options Stage options.
 * @returns {{ detach: () => void, measure: () => void }} Handle.
 */
export function attachHalftone(el, options) {
  /** @type {Stage} */
  const stage = { el, options, ratio: 0, top: 0, height: 1 };
  const measure = () => {
    const rect = el.getBoundingClientRect();
    stage.top = rect.top + scrollY;
    stage.height = Math.max(1, rect.height);
  };
  measure();
  const io = new IntersectionObserver(([entry]) => {
    stage.ratio = entry.isIntersecting ? Math.max(entry.intersectionRatio, 0.001) : 0;
    enginePromise?.then(engine => engine?.wake());
  }, { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] });
  io.observe(el);
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  ScrollTrigger.addEventListener('refresh', measure);
  stages.add(stage);

  if (failed) queueMicrotask(() => options.onFallback?.());
  else {
    enginePromise ??= createEngine().catch(error => {
      console.info('Halftone WebGL unavailable:', error instanceof Error ? error.message : error);
      failed = true;
      for (const s of stages) s.options.onFallback?.();
      return null;
    });
  }

  return {
    measure,
    detach() {
      io.disconnect();
      ro.disconnect();
      ScrollTrigger.removeEventListener('refresh', measure);
      stages.delete(stage);
      enginePromise?.then(engine => engine?.wake());
    },
  };
}

/** @returns {[number, number, number][]} Ink and accent colours for the active theme (sRGB). */
function themeColours() {
  const tokens = TOKENS[activeTheme()];
  return [oklchToSrgb(tokens.ink), oklchToSrgb(tokens.accent)];
}

/**
 * Builds the renderer, materials and loop. Throws when WebGL2 is unavailable.
 * @returns {Promise<{ wake: () => void }>} Engine handle.
 */
async function createEngine() {
  await new Promise(resolve => (document.readyState === 'complete' ? requestAnimationFrame(resolve) : addEventListener('load', resolve, { once: true })));
  const THREE = await import('./three-lite.js');
  const canvas = document.createElement('canvas');
  canvas.className = 'halftone-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL2 not supported');
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, context });
  renderer.setClearColor(0x000000, 0);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const scene = new THREE.Scene();
  scene.add(quad);

  const trailOptions = { type: THREE.UnsignedByteType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  let trailA = new THREE.WebGLRenderTarget(8, 8, trailOptions);
  let trailB = new THREE.WebGLRenderTarget(8, 8, trailOptions);
  const trailMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: trailShader,
    uniforms: {
      uPrev: { value: trailA.texture },
      uPointer: { value: new THREE.Vector2(-1e4, -1e4) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uStrength: { value: 0 },
      uRadius: { value: 70 },
    },
    depthTest: false,
  });
  const FIELD_STEP = 8; // CSS px per field texel
  const field = new THREE.WebGLRenderTarget(8, 8, trailOptions);
  const fieldMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: fieldShader,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
    },
    depthTest: false,
  });
  const [ink, accent] = themeColours();
  const boxes = new Float32Array(MAX_BOXES * 4);
  const boxUniform = Array.from({ length: MAX_BOXES }, () => new THREE.Vector4());
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uTime: { value: 0 },
      uCell: { value: 8 },
      uScroll: { value: 0 },
      uMode: { value: 0 },
      uAlpha: { value: 0 },
      uFocus: { value: new THREE.Vector2(0, 0) },
      uShift: { value: new THREE.Vector2(1, 1) },
      uInk: { value: new THREE.Vector3(...ink) },
      uAccent: { value: new THREE.Vector3(...accent) },
      uTrail: { value: trailA.texture },
      uField: { value: field.texture },
      uBoxes: { value: boxUniform },
      uBoxCount: { value: 0 },
    },
    // The shader already outputs premultiplied colour over a cleared, transparent canvas.
    blending: THREE.NoBlending,
    depthTest: false,
  });

  let width = 0;
  let height = 0;
  let dpr = 0;
  const resize = () => {
    const tierDpr = ui.quality === 'low' ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    if (innerWidth === width && innerHeight === height && tierDpr === dpr) return;
    width = innerWidth;
    height = innerHeight;
    dpr = tierDpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    trailA.setSize(Math.ceil(width / 8), Math.ceil(height / 8));
    trailB.setSize(Math.ceil(width / 8), Math.ceil(height / 8));
    field.setSize(Math.ceil(width / FIELD_STEP), Math.ceil(height / FIELD_STEP));
    fieldMaterial.uniforms.uRes.value.set(width, height);
    material.uniforms.uRes.value.set(width, height);
    material.uniforms.uDpr.value = dpr;
    trailMaterial.uniforms.uRes.value.set(width, height);
  };

  const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, speed: 0 };
  let lastInput = performance.now();
  let lastRender = 0;
  let running = false;
  let alpha = 0;

  const onPointer = event => {
    pointer.vx += event.clientX - pointer.x;
    pointer.vy += event.clientY - pointer.y;
    if (pointer.x < -1e3) pointer.vx = pointer.vy = 0;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    lastInput = performance.now();
    wake();
  };
  const onScroll = () => {
    lastInput = performance.now();
  };
  const onTheme = () => {
    const [nextInk, nextAccent] = themeColours();
    material.uniforms.uInk.value.set(...nextInk);
    material.uniforms.uAccent.value.set(...nextAccent);
    lastRender = 0;
  };
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('themechange', onTheme);
  scheme.addEventListener('change', onTheme);
  document.addEventListener('visibilitychange', () => wake());
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    failed = true;
    sleep();
    canvas.remove();
    for (const stage of stages) stage.options.onFallback?.();
  });

  /** @returns {Stage | null} The most visible stage. */
  const activeStage = () => {
    let best = null;
    for (const stage of stages) if (stage.ratio > 0 && (!best || stage.ratio > best.ratio)) best = stage;
    return best;
  };

  const frame = time => {
    const stage = activeStage();
    if (!stage || document.hidden || failed) {
      alpha = 0;
      canvas.style.opacity = '0';
      sleep();
      return;
    }
    const now = performance.now();
    const idle = now - lastInput > 4000;
    const minGap = ui.quality === 'low' ? 33 : idle ? 100 : 0;
    if (now - lastRender < minGap) return;
    const elapsed = Math.min(now - lastRender, 100);
    lastRender = now;
    resize();

    const u = material.uniforms;
    u.uTime.value = time;
    u.uCell.value = ui.quality === 'low' ? 11 : 8;
    u.uMode.value = stage.options.mode;
    u.uScroll.value = stage.options.mode === 0 ? Math.min(1, Math.max(0, (scrollY - stage.top) / stage.height)) : 0;
    alpha = Math.min(1, alpha + elapsed / 500);
    u.uAlpha.value = alpha;
    canvas.style.opacity = '1';
    const focus = stage.options.focus?.();
    if (focus) u.uFocus.value.set(focus.x, focus.y);

    const count = stage.options.boxes ? stage.options.boxes(boxes, MAX_BOXES) : 0;
    for (let i = 0; i < count; i++) boxUniform[i].set(boxes[i * 4], boxes[i * 4 + 1], boxes[i * 4 + 2] + 2, boxes[i * 4 + 3]);
    u.uBoxCount.value = count;

    // Pointer velocity drives the trail strength and plate B misregistration (1-2px).
    pointer.speed += (Math.hypot(pointer.vx, pointer.vy) - pointer.speed) * 0.25;
    u.uShift.value.set(1 + Math.max(-1, Math.min(1, pointer.vx * 0.05)), 1 + Math.max(-1, Math.min(1, pointer.vy * 0.05)));
    pointer.vx *= 0.5;
    pointer.vy *= 0.5;
    trailMaterial.uniforms.uPrev.value = trailA.texture;
    trailMaterial.uniforms.uPointer.value.set(pointer.x, height - pointer.y);
    trailMaterial.uniforms.uStrength.value = Math.min(0.5, pointer.speed * 0.02);
    quad.material = trailMaterial;
    renderer.setRenderTarget(trailB);
    renderer.render(scene, camera);
    [trailA, trailB] = [trailB, trailA];

    fieldMaterial.uniforms.uTime.value = time;
    quad.material = fieldMaterial;
    renderer.setRenderTarget(field);
    renderer.render(scene, camera);

    u.uTrail.value = trailA.texture;
    quad.material = material;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  };

  function wake() {
    if (running || failed || !activeStage()) return;
    running = true;
    setGlActive(true);
    gsap.ticker.add(frame);
  }
  function sleep() {
    if (!running) return;
    running = false;
    setGlActive(false);
    gsap.ticker.remove(frame);
  }

  wake();
  return { wake };
}
