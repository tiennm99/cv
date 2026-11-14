/**
 * Shared UI state for the shell and sections: theme, motion preference, toast,
 * palette, active section and the rendering quality tier.
 */
import { activeTheme } from './tokens.js';
import { readString, writeString } from './live/storage.js';

const MOTION_KEY = 'ui:motion';
const THEME_KEY = 'ui:theme';

const media = query => (typeof matchMedia === 'function' ? matchMedia(query) : null);
const reducedQuery = media('(prefers-reduced-motion: reduce)');
const forcedQuery = media('(forced-colors: active)');

/** @type {'on' | 'off' | null} */
const storedMotion = /** @type {any} */ (readString(MOTION_KEY));

export const ui = $state({
  /** @type {import('./tokens.js').Theme} */
  theme: typeof document === 'undefined' ? 'light' : activeTheme(),
  /** User override: 'on' | 'off', or null to follow prefers-reduced-motion. */
  motionPref: storedMotion === 'on' || storedMotion === 'off' ? storedMotion : null,
  systemReduced: reducedQuery?.matches ?? false,
  forcedColors: forcedQuery?.matches ?? false,
  /** @type {'high' | 'mid' | 'low' | 'off'} */
  quality: 'mid',
  paletteOpen: false,
  /** Id of the section most in view. */
  active: 'hero',
  /** @type {{ id: number, text: string } | null} */
  toast: null,
});

reducedQuery?.addEventListener('change', event => { ui.systemReduced = event.matches; });
forcedQuery?.addEventListener('change', event => { ui.forcedColors = event.matches; });

/** @returns {boolean} True when motion should be reduced (user toggle wins over the media query). */
export const reduced = () => (ui.motionPref ? ui.motionPref === 'off' : ui.systemReduced);

/** @returns {boolean} True when a WebGL moment may run (motion on, tier not off, no forced colours). */
export const webglAllowed = () => !reduced() && !ui.forcedColors && ui.quality !== 'off';

/** Flips the motion preference and remembers it. */
export function toggleMotion() {
  ui.motionPref = reduced() ? 'on' : 'off';
  writeString(MOTION_KEY, ui.motionPref);
  document.documentElement.dataset.motion = ui.motionPref === 'off' ? 'reduced' : 'full';
}

/**
 * Applies a theme, with a circular View Transition from `origin` when motion is on.
 * Fires a `themechange` event on window so WebGL can re-read the tokens.
 * @param {{ x: number, y: number }} [origin] Viewport point the reveal grows from.
 */
export function toggleTheme(origin) {
  const nextTheme = ui.theme === 'invert' ? 'light' : 'invert';
  const apply = () => {
    document.documentElement.dataset.theme = nextTheme;
    ui.theme = nextTheme;
    writeString(THEME_KEY, nextTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: nextTheme }));
  };
  if (!document.startViewTransition || reduced()) {
    apply();
    return;
  }
  const x = origin?.x ?? innerWidth - 40;
  const y = origin?.y ?? 28;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(apply);
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

let toastId = 0;
/**
 * Shows a short polite toast.
 * @param {string} text Message.
 */
export function toast(text) {
  const id = ++toastId;
  ui.toast = { id, text };
  setTimeout(() => { if (ui.toast?.id === id) ui.toast = null; }, 2600);
}

/**
 * Copies text to the clipboard and toasts the result.
 * @param {string} text Text to copy.
 * @param {string} done Toast on success.
 */
export async function copyText(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast(`Copy failed: ${text}`);
  }
}
