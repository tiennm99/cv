/** Time helpers. The site's local time is always Asia/Saigon. */

export const TIME_ZONE = 'Asia/Saigon';

/**
 * @param {number | Date} value Instant.
 * @param {boolean} [seconds] Include seconds.
 * @returns {string} "14:05" (24h) in Asia/Saigon.
 */
export function localTime(value, seconds = false) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), hour12: false }).format(value);
}

/**
 * @param {number | Date} value Instant.
 * @returns {string} "14 Nov 2026" in Asia/Saigon.
 */
export function localDate(value) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' }).format(value);
}

/**
 * Whole years elapsed since a YYYY-MM month, e.g. years in games since 2020-07.
 * @param {string} ym "YYYY-MM".
 * @param {number} [now] Reference instant.
 * @returns {number} Completed years.
 */
export function yearsSince(ym, now = Date.now()) {
  const [year, month] = ym.split('-').map(Number);
  const date = new Date(now);
  const months = (date.getUTCFullYear() - year) * 12 + (date.getUTCMonth() + 1 - (month || 1));
  return Math.max(0, Math.floor(months / 12));
}

const UNITS = /** @type {Array<[Intl.RelativeTimeFormatUnit, number]>} */ ([
  ['year', 365 * 864e5],
  ['month', 30 * 864e5],
  ['week', 7 * 864e5],
  ['day', 864e5],
  ['hour', 36e5],
  ['minute', 6e4],
]);

/**
 * @param {string | number} value ISO date or epoch ms.
 * @param {number} [now] Reference instant.
 * @returns {string} "3 days ago", "last month", "just now".
 */
export function relativeTime(value, now = Date.now()) {
  const diff = (typeof value === 'number' ? value : Date.parse(value)) - now;
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of UNITS) if (Math.abs(diff) >= ms) return format.format(Math.round(diff / ms), unit);
  return 'just now';
}
