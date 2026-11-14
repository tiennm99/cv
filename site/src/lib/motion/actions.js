/**
 * Small Svelte actions shared by sections. Each respects reduced motion through
 * the runtime and cleans up on destroy.
 */
import { gsap, SplitText, motionReduced } from './runtime.js';

/**
 * Runs `onChange(true|false)` as the node enters or leaves the viewport.
 * `use:inView={{ onChange, rootMargin, threshold, once }}`
 * @param {Element} node Observed element.
 * @param {{ onChange: (visible: boolean, entry: IntersectionObserverEntry) => void, rootMargin?: string, threshold?: number | number[], once?: boolean }} options Options.
 * @returns {{ destroy: () => void }} Action handle.
 */
export function inView(node, { onChange, rootMargin = '0px', threshold = 0, once = false }) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      onChange(entry.isIntersecting, entry);
      if (once && entry.isIntersecting) observer.disconnect();
    }
  }, { rootMargin, threshold });
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}

/**
 * Fades and lifts the node in once it enters (200ms fade only under reduced motion).
 * `use:reveal={{ y: 24, delay: 0 }}`
 * @param {HTMLElement} node Element to reveal.
 * @param {{ y?: number, delay?: number }} [options] Offset and delay.
 * @returns {{ destroy: () => void }} Action handle.
 */
export function reveal(node, { y = 24, delay = 0 } = {}) {
  // Opacity only (never visibility), so focusable content stays in the tab order;
  // focus shows it at once.
  gsap.set(node, { opacity: 0 });
  const show = () => {
    gsap.killTweensOf(node);
    gsap.set(node, { opacity: 1, y: 0 });
  };
  node.addEventListener('focusin', show);
  const io = inView(node, {
    once: true,
    rootMargin: '0px 0px -10% 0px',
    onChange: visible => {
      if (!visible) return;
      if (motionReduced()) gsap.to(node, { opacity: 1, duration: 0.2, delay, ease: 'none' });
      else gsap.fromTo(node, { opacity: 0, y }, { opacity: 1, y: 0, duration: 0.9, delay, ease: 'expo.out' });
    },
  });
  return {
    destroy() {
      io.destroy();
      node.removeEventListener('focusin', show);
      gsap.killTweensOf(node);
    },
  };
}

/**
 * Splits text into masked lines that slide up when the node enters.
 * `use:splitLines={{ stagger: 0.08 }}`
 * @param {HTMLElement} node Text block.
 * @param {{ stagger?: number, delay?: number }} [options] Stagger per line and delay.
 * @returns {{ destroy: () => void }} Action handle.
 */
export function splitLines(node, { stagger = 0.08, delay = 0 } = {}) {
  /** @type {SplitText | null} */
  let split = null;
  /** @type {gsap.core.Tween | null} */
  let tween = null;
  const io = inView(node, {
    once: true,
    rootMargin: '0px 0px -10% 0px',
    onChange: visible => {
      if (!visible) return;
      if (motionReduced()) {
        gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' });
        return;
      }
      split = SplitText.create(node, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: self => {
          tween = gsap.from(self.lines, { yPercent: 110, duration: 1, stagger, delay, ease: 'expo.out' });
          return tween;
        },
      });
    },
  });
  return {
    destroy() {
      io.destroy();
      tween?.kill();
      split?.revert();
    },
  };
}

/**
 * Pulls the node toward the pointer within `radius` px (fine pointers, motion on).
 * `use:magnetic={{ strength: 0.35, radius: 120 }}`
 * @param {HTMLElement} node Button or link.
 * @param {{ strength?: number, radius?: number }} [options] Pull strength (0-1) and radius.
 * @returns {{ destroy: () => void }} Action handle.
 */
export function magnetic(node, { strength = 0.35, radius = 120 } = {}) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return { destroy() {} };
  const toX = gsap.quickTo(node, 'x', { duration: 0.6, ease: 'expo.out' });
  const toY = gsap.quickTo(node, 'y', { duration: 0.6, ease: 'expo.out' });
  /** @type {DOMRect | null} */
  let rect = null;
  const measure = () => { rect = node.getBoundingClientRect(); };
  const move = event => {
    if (motionReduced() || !rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const inside = Math.hypot(dx, dy) < radius + Math.max(rect.width, rect.height) / 2;
    toX(inside ? dx * strength : 0);
    toY(inside ? dy * strength : 0);
  };
  const leave = () => { toX(0); toY(0); rect = null; };
  const area = node.parentElement ?? node;
  area.addEventListener('pointerenter', measure);
  area.addEventListener('pointermove', move);
  area.addEventListener('pointerleave', leave);
  return {
    destroy() {
      area.removeEventListener('pointerenter', measure);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(node);
    },
  };
}

/**
 * Drives the CSS halftone fallback: writes --hx/--hy (px within the node) on pointer move.
 * Pair with the `.halftone-css` class from app.css.
 * @param {HTMLElement} node Element with `.halftone-css`.
 * @returns {{ destroy: () => void }} Action handle.
 */
export function halftonePointer(node) {
  /** @type {DOMRect | null} */
  let rect = null;
  const enter = () => { rect = node.getBoundingClientRect(); };
  const move = event => {
    if (motionReduced()) return;
    rect ??= node.getBoundingClientRect();
    node.style.setProperty('--hx', `${event.clientX - rect.left}px`);
    node.style.setProperty('--hy', `${event.clientY - rect.top}px`);
  };
  const reset = () => { rect = null; };
  node.addEventListener('pointerenter', enter);
  node.addEventListener('pointermove', move);
  window.addEventListener('scroll', reset, { passive: true });
  window.addEventListener('resize', reset);
  return {
    destroy() {
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', reset);
      window.removeEventListener('resize', reset);
    },
  };
}
