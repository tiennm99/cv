/**
 * localStorage access that never throws (private mode, blocked storage, previews).
 * Each helper takes an optional Storage so tests can pass a fake one.
 */

/**
 * @returns {Storage | null} window.localStorage when reachable.
 */
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key Storage key.
 * @param {Storage | null} [storage] Storage to use.
 * @returns {any} Parsed JSON or null.
 */
export function readJson(key, storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key Storage key.
 * @param {any} value JSON-serialisable value.
 * @param {Storage | null} [storage] Storage to use.
 */
export function writeJson(key, value, storage = defaultStorage()) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or blocked storage: the site works without the cache.
  }
}

/**
 * @param {string} key Storage key.
 * @param {Storage | null} [storage] Storage to use.
 * @returns {string | null} Raw string value.
 */
export function readString(key, storage = defaultStorage()) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key Storage key.
 * @param {string | null} value String value, or null to remove.
 * @param {Storage | null} [storage] Storage to use.
 */
export function writeString(key, value, storage = defaultStorage()) {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // ignore
  }
}
