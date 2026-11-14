/**
 * Motion runtime: GSAP plugins registered once, Lenis smooth scroll on the GSAP
 * ticker, and a per-section helper that builds timelines inside a gsap.context
 * and rebuilds them when the motion preference flips.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, ScrambleTextPlugin);
gsap.ticker.lagSmoothing(0);
gsap.defaults({ ease: 'expo.out', duration: 0.7 });

export { gsap, ScrollTrigger, SplitText, Flip, ScrambleTextPlugin };

/** GSAP eases mirroring the CSS motion tokens. */
export const EASE = { out: 'expo.out', io: 'power3.inOut', snap: 'back.out(1.4)' };
/** Durations in seconds mirroring --d-fast, --d-med, --d-slow. */
export const DUR = { fast: 0.18, med: 0.32, slow: 0.7 };

/** @type {Lenis | null} */
let lenis = null;
let isReduced = false;
/** @type {Set<(reduced: boolean) => void>} */
const listeners = new Set();
/** @type {(time: number) => void} */
const raf = time => lenis?.raf(time * 1000);

/** @returns {boolean} Current effective reduced-motion state. */
export const motionReduced = () => isReduced;

/** @returns {Lenis | null} The Lenis instance, or null under reduced motion. */
export const getLenis = () => lenis;

/**
 * Applies the effective motion state: creates or destroys Lenis and tells sections.
 * Called by App.svelte whenever the reduced-motion state changes.
 * @param {boolean} reduced Effective reduced-motion state.
 */
export function setMotionReduced(reduced) {
  isReduced = reduced;
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  if (reduced && lenis) {
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  } else if (!reduced && !lenis) {
    lenis = new Lenis({ autoRaf: false, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
  }
  for (const listener of listeners) listener(reduced);
  ScrollTrigger.refresh();
}

/**
 * Smooth-scrolls to a section or element id (instant under reduced motion), then focuses it.
 * @param {string} id Element id without '#'.
 */
export function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const focus = () => {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };
  if (lenis) lenis.scrollTo(target, { offset: -56, duration: 1.2, onComplete: focus });
  else {
    target.scrollIntoView({ block: 'start' });
    focus();
  }
  history.replaceState(null, '', `#${id}`);
}

/**
 * @typedef {object} MotionContext
 * @property {HTMLElement} node Section root.
 * @property {boolean} reduced Effective reduced-motion state; build static/fade variants when true.
 * @property {typeof gsap} gsap GSAP.
 * @property {typeof ScrollTrigger} ScrollTrigger ScrollTrigger.
 */

/**
 * Svelte action: `use:sectionMotion={(ctx) => { ...build timelines...; return cleanup }}`.
 * Everything created inside runs in a gsap.context scoped to the node and is reverted
 * on destroy and before each rebuild (motion toggle).
 * @param {HTMLElement} node Section root.
 * @param {(ctx: MotionContext) => (void | (() => void))} setup Timeline builder.
 * @returns {{ destroy: () => void }} Action handle.
 */
export function sectionMotion(node, setup) {
  /** @type {gsap.Context | null} */
  let ctx = null;
  /** @type {void | (() => void)} */
  let cleanup;
  const build = reduced => {
    cleanup?.();
    ctx?.revert();
    ctx = gsap.context(() => {
      cleanup = setup({ node, reduced, gsap, ScrollTrigger });
    }, node);
  };
  build(isReduced);
  listeners.add(build);
  return {
    destroy() {
      listeners.delete(build);
      cleanup?.();
      ctx?.revert();
    },
  };
}

/**
 * Recomputes every ScrollTrigger (after late content, fonts or lazy sections).
 * @returns {void}
 */
export const refreshScroll = () => ScrollTrigger.refresh();
