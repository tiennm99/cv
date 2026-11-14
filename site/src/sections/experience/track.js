/**
 * Pinned horizontal track for the experience section.
 *
 * One ScrollTrigger pins the stage and scrubs the track 1:1 with scroll (1px of
 * scroll = 1px of travel), so dragging, arrow keys and the rail dots can all map a
 * panel to an exact scroll position. Every layout read happens in `measure()`, which
 * runs only on ScrollTrigger refresh (resize, fonts, late content); the per-frame
 * update reads cached numbers and writes styles only.
 */
import { getLenis } from '../../lib/motion/runtime.js';

/** Display axes: condensed and heavy at rest, wide and light on arrival. */
const REST = { wght: 820, wdth: 64 };
const PEAK = { wght: 330, wdth: 128 };

/**
 * @param {number} value Raw value.
 * @returns {number} Value clamped to 0..1 and smoothed.
 */
const smooth = value => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

/**
 * @typedef {object} TrackOptions
 * @property {HTMLElement} node Section root.
 * @property {typeof import('gsap').gsap} gsap GSAP.
 * @property {typeof import('gsap/ScrollTrigger').ScrollTrigger} ScrollTrigger ScrollTrigger.
 * @property {(index: number) => void} onActive Called when the nearest panel changes.
 * @property {(stops: number[]) => void} onStops Called after measuring with each panel's 0..1 rail position.
 */

/**
 * Builds the pinned track. Call inside a gsap.context so the tweens revert with it.
 * @param {TrackOptions} options Options.
 * @returns {{ goTo: (index: number) => void, nearest: (x?: number) => number, current: () => number, destroy: () => void }} Controller.
 */
export function createTrack({ node, gsap, ScrollTrigger, onActive, onStops }) {
  const stage = /** @type {HTMLElement} */ (node.querySelector('[data-stage]'));
  const viewport = /** @type {HTMLElement} */ (node.querySelector('[data-viewport]'));
  const track = /** @type {HTMLElement} */ (node.querySelector('[data-track]'));
  const fill = /** @type {HTMLElement} */ (node.querySelector('[data-fill]'));
  const heading = /** @type {HTMLElement} */ (node.querySelector('[data-heading-fill]'));
  const panels = /** @type {HTMLElement[]} */ ([...node.querySelectorAll('[data-panel]')]);
  const titles = panels.map(panel => /** @type {HTMLElement} */ (panel.querySelector('[data-title]')));
  const numerals = panels.map(panel => /** @type {HTMLElement | null} */ (panel.querySelector('[data-numeral]')));
  const entered = panels.map(() => false);

  let maxX = 1;
  let span = 1;
  /** @type {number[]} */
  let offsets = panels.map(() => 0);
  let active = -1;
  /** Document scroll position where the pin starts, cached on refresh. */
  let pinStart = 0;
  /** @type {number[]} */
  const lastArrival = panels.map(() => -1);

  const measure = () => {
    const first = panels[0].offsetLeft;
    const raw = panels.map(panel => panel.offsetLeft - first);
    // The track ends with the last panel parked where every other panel parks, so its
    // rail stop is exactly 100% and the trailing padding is only run-out room.
    maxX = Math.max(1, Math.min(track.scrollWidth - viewport.clientWidth, raw[raw.length - 1]));
    span = Math.max(1, viewport.clientWidth * 0.62);
    offsets = raw.map(offset => Math.min(offset, maxX));
    onStops(offsets.map(offset => offset / maxX));
  };

  // Panel contents arrive once, staggered, the first time the panel nears centre or
  // becomes the nearest panel, so the panel the rail points at is never blank.
  for (const panel of panels) gsap.set(panel.querySelectorAll('[data-in]'), { opacity: 0, y: 28 });
  /** @param {number} index Panel index. */
  const enter = index => {
    if (entered[index]) return;
    entered[index] = true;
    panels[index].dataset.arrived = '';
    gsap.to(panels[index].querySelectorAll('[data-in]'), { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', overwrite: true, clearProps: 'transform,opacity' });
  };

  /** @param {number} progress Track progress 0..1. */
  const update = progress => {
    const x = progress * maxX;
    fill.style.transform = `scaleX(${progress})`;
    heading.style.clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
    let nearest = 0;
    for (let index = 0; index < panels.length; index++) {
      const delta = x - offsets[index];
      if (Math.abs(delta) < Math.abs(x - offsets[nearest])) nearest = index;
      const arrival = smooth(1 - Math.abs(delta) / span);
      if (Math.abs(arrival - lastArrival[index]) > 0.004) {
        lastArrival[index] = arrival;
        const wght = REST.wght + (PEAK.wght - REST.wght) * arrival;
        const wdth = REST.wdth + (PEAK.wdth - REST.wdth) * arrival;
        titles[index].style.fontVariationSettings = `"wght" ${wght.toFixed(1)}, "wdth" ${wdth.toFixed(1)}`;
      }
      if (arrival > 0.35) enter(index);
      const numeral = numerals[index];
      // Parallax only drifts the numeral in from the left; it never passes the panel's
      // right padding edge, so it cannot be cut off by the next slot or the viewport.
      if (numeral && Math.abs(delta) < span * 2.5) numeral.style.transform = `translate3d(${Math.min(0, Math.max(-span * 0.5, delta * 0.42)).toFixed(1)}px,0,0)`;
    }
    if (nearest !== active) {
      active = nearest;
      enter(nearest);
      onActive(nearest);
    }
  };

  const tween = gsap.to(track, {
    x: () => -maxX,
    ease: 'none',
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${maxX}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onRefreshInit: measure,
      onRefresh: self => {
        pinStart = self.start;
        update(self.animation ? self.animation.progress() : 0);
      },
      onToggle: self => { node.dataset.pinned = self.isActive ? 'true' : 'false'; },
    },
  });
  const trigger = /** @type {ScrollTrigger} */ (tween.scrollTrigger);
  // Scrub smoothing lags behind scroll; keep the visuals on the tween's own progress.
  tween.eventCallback('onUpdate', () => update(tween.progress()));

  // The first panel is already in place when the section scrolls in: arrive it on entry.
  ScrollTrigger.create({ trigger: stage, start: 'top 70%', once: true, onEnter: () => enter(0) });

  /**
   * @param {number} y Document scroll position.
   * @param {boolean} immediate Jump without easing.
   */
  const scrollTo = (y, immediate) => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true, force: true } : { duration: 1.1, force: true, easing: t => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
  };

  /** @param {number} index Panel index. */
  const goTo = index => {
    const clamped = Math.max(0, Math.min(panels.length - 1, index));
    scrollTo(trigger.start + offsets[clamped] + (clamped ? 1 : 0), false);
  };

  /**
   * @param {number} [x] Track position in px; defaults to the tween's.
   * @returns {number} Index of the panel nearest to that position.
   */
  const nearest = (x = tween.progress() * maxX) => {
    let best = 0;
    for (let index = 1; index < offsets.length; index++) if (Math.abs(x - offsets[index]) < Math.abs(x - offsets[best])) best = index;
    return best;
  };

  // Drag with mouse or pen: 1px of drag = 1px of scroll. Touch keeps native vertical scroll.
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let suppressClick = false;
  /** @param {PointerEvent} event Pointer down. */
  const down = event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = trigger.scroll();
    moved = false;
  };
  /** @param {PointerEvent} event Pointer move. */
  const move = event => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      viewport.setPointerCapture(pointerId);
      node.dataset.dragging = 'true';
    }
    if (moved) scrollTo(Math.min(trigger.end, Math.max(trigger.start, startY - dx * 1.15)), true);
  };
  /** @param {PointerEvent} event Pointer up or cancel. */
  const up = event => {
    if (event.pointerId !== pointerId) return;
    pointerId = -1;
    if (!moved) return;
    delete node.dataset.dragging;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    // Throw toward the panel the drag was heading for.
    const dx = event.clientX - startX;
    const here = nearest();
    const target = Math.abs(dx) > 80 ? (dx < 0 ? Math.max(here, active) : Math.min(here, active)) : here;
    goTo(target);
  };
  /** @param {MouseEvent} event Click after a drag. */
  const click = event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  };
  /**
   * @param {DragEvent} event Native drag of links.
   * @returns {void}
   */
  const noNativeDrag = event => event.preventDefault();

  viewport.addEventListener('pointerdown', down);
  viewport.addEventListener('pointermove', move);
  viewport.addEventListener('pointerup', up);
  viewport.addEventListener('pointercancel', up);
  viewport.addEventListener('click', click, true);
  viewport.addEventListener('dragstart', noNativeDrag);

  return {
    goTo,
    nearest,
    /**
     * Panel the reader is on, from the scroll position alone. Safe to call while the
     * pin is being reverted, when the tween's progress has already snapped back.
     * @returns {number} Panel index.
     */
    current: () => nearest(Math.min(maxX, Math.max(0, window.scrollY - pinStart))),
    destroy() {
      viewport.removeEventListener('pointerdown', down);
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('pointerup', up);
      viewport.removeEventListener('pointercancel', up);
      viewport.removeEventListener('click', click, true);
      viewport.removeEventListener('dragstart', noNativeDrag);
      delete node.dataset.dragging;
      delete node.dataset.pinned;
      for (const panel of panels) delete panel.dataset.arrived;
      for (const title of titles) title.style.fontVariationSettings = '';
      for (const numeral of numerals) if (numeral) numeral.style.transform = '';
      fill.style.transform = '';
      heading.style.clipPath = '';
    },
  };
}
