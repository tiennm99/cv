/**
 * Rendering quality tier: 'high' | 'mid' | 'low' | 'off'.
 * Starts from WebGL2 support, devicePixelRatio and hardwareConcurrency, then measures
 * FPS in windows of 60 frames and drops a tier whenever it falls below 45: for the first
 * 20 windows, and afterwards for as long as a WebGL moment is drawing (`setGlActive`),
 * so a heavy scene far down the page is still seen.
 */

/** @typedef {'high' | 'mid' | 'low' | 'off'} Tier */

const ORDER = /** @type {Tier[]} */ (['off', 'low', 'mid', 'high']);

/** @returns {boolean} WebGL2 available (a throwaway context is created and lost). */
export function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Static first guess at the tier.
 * @param {{ webgl2: boolean, dpr: number, cores: number, saveData?: boolean }} env Device facts.
 * @returns {Tier} Initial tier.
 */
export function initialTier({ webgl2, dpr, cores, saveData = false }) {
  if (!webgl2) return 'off';
  if (saveData || cores <= 2) return 'low';
  if (cores >= 8 && dpr <= 2) return 'high';
  return 'mid';
}

/**
 * @param {Tier} tier Current tier.
 * @returns {Tier} One tier lower ('off' stays 'off').
 */
export const dropTier = tier => ORDER[Math.max(0, ORDER.indexOf(tier) - 1)];

/** WebGL loops currently drawing. */
let glActive = 0;
/** @type {(() => void) | null} Restarts a paused FPS monitor. */
let resumeMonitor = null;

/**
 * Called by each WebGL loop when it starts (true) and stops (false) drawing.
 * @param {boolean} on Loop running.
 */
export function setGlActive(on) {
  glActive = Math.max(0, glActive + (on ? 1 : -1));
  if (glActive > 0) resumeMonitor?.();
}

/**
 * Detects the tier, then watches FPS and calls `onChange` when it drops.
 * @param {(tier: Tier) => void} onChange Called with the initial tier and each drop.
 * @returns {() => void} Stops the FPS monitor.
 */
export function watchQuality(onChange) {
  const nav = /** @type {any} */ (navigator);
  let tier = initialTier({
    // `?nogl` forces the no-WebGL fallback (for testing the CSS posters).
    webgl2: !new URLSearchParams(location.search).has('nogl') && hasWebGL2(),
    dpr: devicePixelRatio || 1,
    cores: nav.hardwareConcurrency || 4,
    saveData: Boolean(nav.connection?.saveData),
  });
  onChange(tier);
  if (tier === 'off') return () => {};
  let frames = 0;
  let start = 0;
  let id = 0;
  let windows = 0;
  let stopped = false;
  const tick = time => {
    id = 0;
    if (document.hidden) {
      start = 0;
      frames = 0;
    } else if (!start) start = time;
    else if (++frames === 60) {
      const fps = (frames * 1000) / (time - start);
      if (fps < 45 && tier !== 'low') {
        tier = dropTier(tier);
        onChange(tier);
      }
      frames = 0;
      start = time;
      if (tier === 'low') return;
      windows++;
    }
    // After the start-up windows, pause while no WebGL loop is drawing.
    if (windows >= 20 && glActive === 0) {
      start = 0;
      frames = 0;
      return;
    }
    id = requestAnimationFrame(tick);
  };
  resumeMonitor = () => {
    if (!stopped && !id && tier !== 'low') id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    resumeMonitor = null;
    cancelAnimationFrame(id);
  };
}
