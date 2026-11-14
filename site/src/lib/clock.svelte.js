/**
 * A shared ticking clock: `clock.now` updates every second while the page is visible.
 * Read it inside markup or `$derived` (e.g. `localTime(clock.now)`).
 */
export const clock = $state({ now: Date.now() });

let timer = 0;

/** Starts the clock once (App does this). */
export function startClock() {
  if (timer) return;
  const tick = () => { if (!document.hidden) clock.now = Date.now(); };
  timer = window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick);
}
