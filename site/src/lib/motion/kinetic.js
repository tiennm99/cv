/**
 * Kinetic display type: each character's `wght`/`wdth` axes follow a pointer field.
 *
 * Performance contract (the prototype's main flaw was per-frame layout reads):
 * - character rects are measured only on mount, `document.fonts.ready`, ResizeObserver
 *   and ScrollTrigger refresh, and stored in page coordinates;
 * - the loop runs on gsap.ticker only while the root is on screen and either the
 *   pointer moved in the last 2s or the idle wave is playing (stops after 6s idle);
 * - the loop writes `font-variation-settings` only, never reads layout.
 *
 * Markup: put `data-kinetic-line` on each line element inside `root`. The text is
 * split into `span.ch` (aria-hidden) and an sr-only copy keeps it readable.
 * Reserve each line's box in CSS (fixed height, `contain: layout`) so growth at peak
 * `wdth` never pushes neighbours.
 */
import { gsap, ScrollTrigger, motionReduced } from './runtime.js';

/** Axis values at rest and at the pointer peak (from the design tokens). */
export const AXES = { rest: { wght: 820, wdth: 68 }, peak: { wght: 200, wdth: 138 } };

/**
 * @typedef {{ el: HTMLElement, x: number, y: number, w: number, h: number, wght: number, wdth: number, line: number, index: number }} KineticChar
 * @typedef {{ rest?: { wght: number, wdth: number }, peak?: { wght: number, wdth: number }, radius?: number, idleWave?: boolean, onLayout?: (chars: KineticChar[]) => void }} KineticOptions
 */

/**
 * Splits each `[data-kinetic-line]` into character spans (idempotent).
 * @param {HTMLElement} root Container.
 * @returns {HTMLElement[]} Character spans in reading order.
 */
export function splitChars(root) {
  /** @type {HTMLElement[]} */
  const chars = [];
  root.querySelectorAll('[data-kinetic-line]').forEach(line => {
    const el = /** @type {HTMLElement} */ (line);
    if (!el.dataset.kineticSplit) {
      const text = el.textContent ?? '';
      el.textContent = '';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = text;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      for (const char of text) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = char;
        if (char === ' ') span.style.whiteSpace = 'pre';
        visual.append(span);
      }
      el.append(sr, visual);
      el.dataset.kineticSplit = '1';
    }
    el.querySelectorAll('.ch').forEach(ch => chars.push(/** @type {HTMLElement} */ (ch)));
  });
  return chars;
}

/**
 * Starts the kinetic field on `root`.
 * @param {HTMLElement} root Container holding `[data-kinetic-line]` elements.
 * @param {KineticOptions} [options] Options.
 * @returns {{ destroy: () => void, measure: () => void, chars: () => KineticChar[], boxes: (out: Float32Array, max: number) => number }} Controller.
 */
export function createKinetic(root, options = {}) {
  const rest = options.rest ?? AXES.rest;
  const peak = options.peak ?? AXES.peak;
  const idleWave = options.idleWave ?? true;
  const spans = splitChars(root);
  const lineOf = span => [...root.querySelectorAll('[data-kinetic-line]')].findIndex(line => line.contains(span));
  /** @type {KineticChar[]} */
  const chars = spans.map((el, index) => ({ el, x: 0, y: 0, w: 0, h: 0, wght: rest.wght, wdth: rest.wdth, line: lineOf(el), index }));
  /** @type {Array<{ align: string, members: KineticChar[] }>} */
  let lines = [];
  let radius = 120;
  let visible = false;
  let running = false;
  let pointerX = -1e5;
  let pointerY = -1e5;
  let lastMove = -1e9;
  let waveStart = 0;

  const write = (char, wght, wdth) => {
    if (Math.abs(char.wght - wght) < 0.5 && Math.abs(char.wdth - wdth) < 0.2) return;
    char.wght = wght;
    char.wdth = wdth;
    char.el.style.fontVariationSettings = `"wght" ${wght.toFixed(0)}, "wdth" ${wdth.toFixed(1)}`;
  };

  /** Measures every char once (rest axes) in page coordinates. */
  const measure = () => {
    const sx = scrollX;
    const sy = scrollY;
    for (const char of chars) char.el.style.fontVariationSettings = `"wght" ${rest.wght}, "wdth" ${rest.wdth}`;
    for (const char of chars) {
      const rect = char.el.getBoundingClientRect();
      char.x = rect.left + sx + rect.width / 2;
      char.y = rect.top + sy + rect.height / 2;
      char.w = rect.width;
      char.h = rect.height;
      char.wght = rest.wght;
      char.wdth = rest.wdth;
    }
    lines = [...root.querySelectorAll('[data-kinetic-line]')].map((line, index) => ({
      align: getComputedStyle(line).textAlign,
      members: chars.filter(char => char.line === index),
    }));
    const size = parseFloat(getComputedStyle(root).fontSize) || 120;
    radius = (options.radius ?? 1.1) * size;
    options.onLayout?.(chars);
  };

  // One clock for everything: lastMove and waveStart come from performance.now().
  const frame = () => {
    const now = performance.now();
    const active = now - lastMove < 2000;
    const waving = idleWave && !active && now - waveStart < 6000;
    if (!active && !waving) {
      for (const char of chars) write(char, char.wght + (rest.wght - char.wght) * 0.15, char.wdth + (rest.wdth - char.wdth) * 0.15);
      if (chars.every(char => Math.abs(char.wght - rest.wght) < 1)) stop();
      return;
    }
    const px = pointerX;
    const py = pointerY + scrollY;
    const t = (now - waveStart) / 1000;
    for (const char of chars) {
      let k;
      if (active) {
        const d = Math.hypot(char.x - px, (char.y - py) * 1.4) / radius;
        k = Math.exp(-d * d);
      } else {
        const fade = Math.min(1, t / 0.6) * Math.max(0, 1 - (t - 4.5) / 1.5);
        k = fade * Math.max(0, Math.sin(char.index * 0.55 - t * 3.2)) ** 3 * 0.85;
      }
      const wght = rest.wght + (peak.wght - rest.wght) * k;
      const wdth = rest.wdth + (peak.wdth - rest.wdth) * k;
      write(char, char.wght + (wght - char.wght) * 0.2, char.wdth + (wdth - char.wdth) * 0.2);
    }
  };

  function start() {
    if (running || !visible || motionReduced()) return;
    running = true;
    gsap.ticker.add(frame);
  }
  function stop() {
    if (!running) return;
    running = false;
    gsap.ticker.remove(frame);
  }

  const onMove = event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    lastMove = performance.now();
    start();
  };
  const onLeave = () => {
    lastMove = -1e9;
    waveStart = -1e9;
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && idleWave && waveStart === 0) waveStart = performance.now();
    if (visible) start();
    else stop();
  });
  io.observe(root);
  const ro = new ResizeObserver(() => measure());
  ro.observe(root);
  document.fonts?.ready.then(measure);
  ScrollTrigger.addEventListener('refresh', measure);
  window.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave);

  /**
   * Writes the current glyph boxes (viewport px: cx, cy, halfW, halfH) without reading
   * layout: widths scale with the live `wdth`, and neighbours shift by the summed
   * growth according to each line's text-align. Used by the halftone knock-out.
   * @param {Float32Array} out Destination, 4 floats per box.
   * @param {number} max Maximum boxes.
   * @returns {number} Boxes written.
   */
  const boxes = (out, max) => {
    const sx = scrollX;
    const sy = scrollY;
    let n = 0;
    for (const { align, members } of lines) {
      const grow = members.map(char => char.w * (char.wdth / rest.wdth - 1));
      const total = grow.reduce((sum, value) => sum + value, 0);
      const anchor = align === 'right' || align === 'end' ? -total : align === 'center' ? -total / 2 : 0;
      let before = 0;
      members.forEach((char, i) => {
        if (n >= max || char.el.textContent === ' ') {
          before += grow[i];
          return;
        }
        out[n * 4] = char.x - char.w / 2 + anchor + before + (char.w + grow[i]) / 2 - sx;
        out[n * 4 + 1] = char.y - sy;
        out[n * 4 + 2] = (char.w + grow[i]) / 2;
        out[n * 4 + 3] = char.h / 2;
        before += grow[i];
        n++;
      });
    }
    return n;
  };

  return {
    measure,
    boxes,
    chars: () => chars,
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      ScrollTrigger.removeEventListener('refresh', measure);
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      for (const char of chars) char.el.style.fontVariationSettings = '';
    },
  };
}
