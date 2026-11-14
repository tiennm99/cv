/**
 * The hero's own riso print: a WebGL canvas placed inside the hero section, so the
 * print is clipped to the hero and can never land on the next section's text.
 *
 * Three passes per frame, all in host-local CSS px (y down), so nothing depends on
 * scroll except the exit progress:
 * 1. trail at 1/8 resolution (ping-pong, fast decay);
 * 2. field at 1/4 resolution: both plates' domain-warped noise, trail plus tap ripple,
 *    and the distance to the type (glyph boxes, avatar circle);
 * 3. plates at full resolution: two rotated dot screens sampling the field.
 *
 * Budget: DPR min(dpr, 1.5) (1 on 'low'), 30fps cap on 'low', 10fps after 4s without
 * input, stopped after 10s without input, off-screen or while the tab is hidden.
 * No layout reads per frame: the host rect is cached on resize and ScrollTrigger refresh.
 */
import { TOKENS, oklchToSrgb, activeTheme } from '../../lib/tokens.js';
import { ui } from '../../lib/ui.svelte.js';
import { gsap, ScrollTrigger } from '../../lib/motion/runtime.js';
import { setGlActive } from '../../lib/motion/quality.js';
import vertexShader from '../../lib/gl/halftone.vert.glsl?raw';
import trailShader from './ink-trail.frag.glsl?raw';
import fieldShader from './ink-field.frag.glsl?raw';
import platesShader from './ink-plates.frag.glsl?raw';

export const MAX_SHAPES = 32;
const FULL_MS = 4000;
const STOP_MS = 10000;
const RIPPLE_S = 1.2;

/**
 * @typedef {object} InkOptions
 * @property {(out: Float32Array, max: number) => number} shapes Writes the type shapes in host CSS px (cx, cy, halfW, halfH; halfH < 0 marks a circle of radius halfW).
 * @property {() => void} [onFallback] Called when WebGL2 is unavailable or the context is lost.
 */

/**
 * @typedef {object} InkHandle
 * @property {() => void} detach Stops the loop and frees GPU memory.
 * @property {() => void} measure Re-reads the host rect (call after layout changes).
 * @property {() => void} show Fades the print in (call once the type has landed).
 * @property {(clientX: number, clientY: number) => void} ripple Starts a tap ripple at a viewport point.
 */

/**
 * Starts the hero print on `canvas`, which must sit inside `host` and cover it.
 * @param {HTMLElement} host The hero section.
 * @param {HTMLCanvasElement} canvas The canvas to draw into.
 * @param {InkOptions} options Options.
 * @returns {InkHandle} Handle.
 */
export function createHeroInk(host, canvas, options) {
  const geo = { left: 0, top: 0, width: 1, height: 1 };
  const state = { visible: false, shown: false, disposed: false };
  /** @type {{ wake: () => void, ripple: (x: number, y: number) => void, dispose: () => void } | null} */
  let engine = null;

  const measure = () => {
    const rect = host.getBoundingClientRect();
    geo.left = rect.left + scrollX;
    geo.top = rect.top + scrollY;
    geo.width = Math.max(1, Math.round(rect.width));
    geo.height = Math.max(1, Math.round(rect.height));
    engine?.wake();
  };
  measure();
  const io = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    engine?.wake();
  });
  io.observe(host);
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  ScrollTrigger.addEventListener('refresh', measure);
  const lost = () => options.onFallback?.();
  canvas.addEventListener('webglcontextlost', lost);

  start(canvas, geo, state, options.shapes)
    .then(created => {
      if (state.disposed) created.dispose();
      else {
        engine = created;
        created.wake();
      }
    })
    .catch(error => {
      if (state.disposed) return;
      console.info('Hero ink WebGL unavailable:', error instanceof Error ? error.message : error);
      options.onFallback?.();
    });

  return {
    measure,
    show() {
      state.shown = true;
      engine?.wake();
    },
    ripple(clientX, clientY) {
      engine?.ripple(clientX + scrollX - geo.left, clientY + scrollY - geo.top);
    },
    detach() {
      state.disposed = true;
      io.disconnect();
      ro.disconnect();
      ScrollTrigger.removeEventListener('refresh', measure);
      canvas.removeEventListener('webglcontextlost', lost);
      engine?.dispose();
      engine = null;
    },
  };
}

/** @returns {{ ink: [number, number, number], accent: [number, number, number], bias: number }} Theme colours and density bias. */
function themeInk() {
  const theme = activeTheme();
  const tokens = TOKENS[theme];
  // On dark paper the bright plates read twice as dense; lift the threshold there.
  return { ink: oklchToSrgb(tokens.ink), accent: oklchToSrgb(tokens.accent), bias: theme === 'invert' ? 0.09 : 0 };
}

/**
 * Builds the renderer and loop. Throws when WebGL2 is unavailable.
 * @param {HTMLCanvasElement} canvas Target canvas.
 * @param {{ left: number, top: number, width: number, height: number }} geo Cached host rect (page px).
 * @param {{ visible: boolean, shown: boolean, disposed: boolean }} state Shared flags.
 * @param {InkOptions['shapes']} shapes Type shapes writer.
 * @returns {Promise<{ wake: () => void, ripple: (x: number, y: number) => void, dispose: () => void }>} Engine.
 */
async function start(canvas, geo, state, shapes) {
  if (document.readyState !== 'complete') await new Promise(resolve => addEventListener('load', resolve, { once: true }));
  const THREE = await import('../../lib/gl/three-lite.js');
  if (state.disposed) return { wake() {}, ripple() {}, dispose() {} };
  const context = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL2 not supported');

  const renderer = new THREE.WebGLRenderer({ canvas, context });
  renderer.setClearColor(0x000000, 0);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const scene = new THREE.Scene();
  scene.add(quad);

  const targetOptions = { type: THREE.UnsignedByteType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  let trailA = new THREE.WebGLRenderTarget(8, 8, targetOptions);
  let trailB = new THREE.WebGLRenderTarget(8, 8, targetOptions);
  const fieldTarget = new THREE.WebGLRenderTarget(8, 8, targetOptions);

  const trailMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: trailShader,
    uniforms: {
      uPrev: { value: trailA.texture },
      uPointer: { value: new THREE.Vector2(-1e4, -1e4) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uStrength: { value: 0 },
      uRadius: { value: 56 },
    },
    blending: THREE.NoBlending,
    depthTest: false,
  });
  const shapeData = new Float32Array(MAX_SHAPES * 4);
  const shapeUniform = Array.from({ length: MAX_SHAPES }, () => new THREE.Vector4());
  const fieldMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: fieldShader,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uShapes: { value: shapeUniform },
      uShapeCount: { value: 0 },
      uTrail: { value: trailA.texture },
      uRipple: { value: new THREE.Vector3(0, 0, -1) },
    },
    // The alpha channel carries the distance field, so it must be written raw.
    blending: THREE.NoBlending,
    depthTest: false,
  });
  const colours = themeInk();
  const platesMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: platesShader,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uCell: { value: 8 },
      uScroll: { value: 0 },
      uAlpha: { value: 0 },
      uBias: { value: colours.bias },
      uShift: { value: new THREE.Vector2(1, 1) },
      uInk: { value: new THREE.Vector3(...colours.ink) },
      uAccent: { value: new THREE.Vector3(...colours.accent) },
      uField: { value: fieldTarget.texture },
    },
    // The shader outputs premultiplied colour over a cleared, transparent canvas.
    blending: THREE.NoBlending,
    depthTest: false,
  });

  let width = 0;
  let height = 0;
  let dpr = 0;
  const resize = () => {
    const tierDpr = ui.quality === 'low' ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    if (geo.width === width && geo.height === height && tierDpr === dpr) return;
    width = geo.width;
    height = geo.height;
    dpr = tierDpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    trailA.setSize(Math.ceil(width / 8), Math.ceil(height / 8));
    trailB.setSize(Math.ceil(width / 8), Math.ceil(height / 8));
    fieldTarget.setSize(Math.ceil(width / 4), Math.ceil(height / 4));
    for (const material of [trailMaterial, fieldMaterial, platesMaterial]) material.uniforms.uRes.value.set(width, height);
    platesMaterial.uniforms.uDpr.value = dpr;
  };

  // Pointer in host px. A jump over 160px (a tap, a synthetic cast start) begins a new
  // stroke instead of counting as speed, so it never paints a streak across the hero.
  const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, speed: 0 };
  const ripple = { x: 0, y: 0, start: -1 };
  let lastInput = performance.now();
  let lastRender = 0;
  let running = false;
  let alpha = 0;

  const onPointer = event => {
    const x = event.clientX + scrollX - geo.left;
    const y = event.clientY + scrollY - geo.top;
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    if (Math.hypot(dx, dy) < 160) {
      pointer.vx += dx;
      pointer.vy += dy;
    } else {
      pointer.vx = pointer.vy = pointer.speed = 0;
    }
    pointer.x = x;
    pointer.y = y;
    poke();
  };
  const poke = () => {
    lastInput = performance.now();
    wake();
  };
  const onTheme = () => {
    const next = themeInk();
    platesMaterial.uniforms.uInk.value.set(...next.ink);
    platesMaterial.uniforms.uAccent.value.set(...next.accent);
    platesMaterial.uniforms.uBias.value = next.bias;
    lastRender = 0;
    poke();
  };
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const onVisibility = () => wake();
  const onLost = event => {
    event.preventDefault();
    sleep();
    canvas.style.opacity = '0';
  };
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('scroll', poke, { passive: true });
  addEventListener('themechange', onTheme);
  scheme.addEventListener('change', onTheme);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);

  const render = (time, now, elapsed) => {
    resize();
    const progress = Math.min(1, Math.max(0, (scrollY - geo.top) / geo.height));
    const rippleAge = ripple.start < 0 ? -1 : (now - ripple.start) / 1000;
    if (rippleAge > RIPPLE_S) ripple.start = -1;

    // Pointer velocity drives the trail strength and plate B misregistration (1-2px).
    pointer.speed += (Math.hypot(pointer.vx, pointer.vy) - pointer.speed) * 0.25;
    const plates = platesMaterial.uniforms;
    plates.uShift.value.set(1 + Math.max(-1, Math.min(1, pointer.vx * 0.05)), 1 + Math.max(-1, Math.min(1, pointer.vy * 0.05)));
    pointer.vx *= 0.5;
    pointer.vy *= 0.5;

    trailMaterial.uniforms.uPrev.value = trailA.texture;
    trailMaterial.uniforms.uPointer.value.set(pointer.x, height - pointer.y);
    trailMaterial.uniforms.uStrength.value = Math.min(0.35, pointer.speed * 0.012);
    quad.material = trailMaterial;
    renderer.setRenderTarget(trailB);
    renderer.render(scene, camera);
    [trailA, trailB] = [trailB, trailA];

    const field = fieldMaterial.uniforms;
    field.uTime.value = time;
    field.uTrail.value = trailA.texture;
    field.uRipple.value.set(ripple.x, ripple.y, ripple.start < 0 ? -1 : rippleAge);
    const count = shapes(shapeData, MAX_SHAPES);
    for (let i = 0; i < count; i++) shapeUniform[i].fromArray(shapeData, i * 4);
    field.uShapeCount.value = count;
    quad.material = fieldMaterial;
    renderer.setRenderTarget(fieldTarget);
    renderer.render(scene, camera);

    alpha = state.shown ? Math.min(1, alpha + elapsed / 600) : 0;
    plates.uAlpha.value = alpha;
    plates.uScroll.value = progress;
    plates.uCell.value = ui.quality === 'low' ? 11 : 8;
    quad.material = platesMaterial;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    canvas.style.opacity = '1';
  };

  const frame = time => {
    if (!state.visible || document.hidden || state.disposed) {
      sleep();
      return;
    }
    const now = performance.now();
    const quiet = now - lastInput;
    const animating = ripple.start >= 0 || (state.shown && alpha < 1);
    if (quiet > STOP_MS && !animating) {
      sleep();
      return;
    }
    const minGap = ui.quality === 'low' ? 33 : quiet > FULL_MS && !animating ? 100 : 0;
    if (now - lastRender < minGap) return;
    const elapsed = Math.min(now - lastRender, 100);
    lastRender = now;
    render(time, now, elapsed);
  };

  function wake() {
    if (running || state.disposed || !state.visible) return;
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

  return {
    wake: poke,
    ripple(x, y) {
      ripple.x = x;
      ripple.y = y;
      ripple.start = performance.now();
      poke();
    },
    dispose() {
      sleep();
      removeEventListener('pointermove', onPointer);
      removeEventListener('scroll', poke);
      removeEventListener('themechange', onTheme);
      scheme.removeEventListener('change', onTheme);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const target of [trailA, trailB, fieldTarget]) target.dispose();
      for (const material of [trailMaterial, fieldMaterial, platesMaterial]) material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    },
  };
}
