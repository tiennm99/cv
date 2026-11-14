/**
 * "Cast" for keyboard and touch visitors: sweeps a virtual pointer through the
 * name so the kinetic axes and the halftone ink trail play without a mouse.
 * It dispatches ordinary `pointermove` events on window, which both the kinetic
 * field and the hero ink already listen to; no shared module changes.
 * When the sweep ends it releases the field at once (see `releaseField`), so the
 * last letters do not hold their peak axes for the kinetic field's 2s hold.
 */
import { gsap } from '../../lib/motion/runtime.js';

/**
 * Sweeps a zig-zag path through the lines of `stage` (one rect read at start).
 * @param {HTMLElement} stage The h1 holding the kinetic lines.
 * @param {() => void} [done] Called when the sweep ends or is cut short.
 * @returns {() => void} Cancels the sweep.
 */
export function castSpell(stage, done) {
  const lines = [...stage.querySelectorAll('[data-line]')].map(line => line.getBoundingClientRect());
  if (!lines.length) {
    done?.();
    return () => {};
  }
  // Left-to-right on line 1, right-to-left on 2, left-to-right on 3: a wand's path.
  /** @type {Array<{ x: number, y: number }>} */
  const points = [];
  lines.forEach((rect, i) => {
    const y = rect.top + rect.height * 0.5;
    const from = rect.left + rect.width * 0.02;
    const to = rect.right - rect.width * 0.02;
    if (i % 2) points.push({ x: to, y }, { x: from, y });
    else points.push({ x: from, y }, { x: to, y });
  });
  const state = { t: 0 };
  const segments = points.length - 1;
  const emit = () => {
    const f = state.t * segments;
    const i = Math.min(segments - 1, Math.floor(f));
    const k = f - i;
    const a = points[i];
    const b = points[i + 1];
    const wobble = Math.sin(state.t * Math.PI * 9) * lines[0].height * 0.12;
    const x = a.x + (b.x - a.x) * k;
    const y = a.y + (b.y - a.y) * k + wobble;
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'pen', bubbles: true }));
  };
  const tween = gsap.to(state, {
    t: 1,
    duration: 2.6,
    ease: 'sine.inOut',
    onUpdate: emit,
    onComplete: () => {
      releaseField(stage);
      done?.();
    },
  });
  return () => {
    tween.kill();
    releaseField(stage);
    done?.();
  };
}

/**
 * Lets the kinetic letters ease back to rest now: the field treats `pointerleave` on
 * its root as "pointer gone", which ends its 2s hold of the last synthetic point.
 * @param {HTMLElement} stage The kinetic root.
 */
export function releaseField(stage) {
  stage.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'pen' }));
}

/**
 * Tap ripple for touch: one synthetic point at the tap flexes the letters near it,
 * then the field is released after `hold` ms.
 * @param {HTMLElement} stage The kinetic root.
 * @param {number} x Viewport x.
 * @param {number} y Viewport y.
 * @param {number} [hold] Hold in ms.
 * @returns {() => void} Cancels the pending release.
 */
export function tapField(stage, x, y, hold = 900) {
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'pen', bubbles: true }));
  const timer = setTimeout(() => releaseField(stage), hold);
  return () => clearTimeout(timer);
}
