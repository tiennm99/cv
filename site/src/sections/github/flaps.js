/**
 * Split-flap helpers for the GitHub departures board: the drum of characters a
 * tile can show, the route a tile flips through, and text-to-tiles layout.
 */

/** Characters on each flap drum, in drum order. The em dash marks "no data". */
export const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#+-.,:·—';

/** Placeholder shown on value tiles while connecting or offline. */
export const DASH = '—';

/**
 * Maps any character onto the drum (uppercased; unknown characters become a space).
 * @param {string} char Input character.
 * @returns {string} A drum character.
 */
export function normalise(char) {
  const upper = (char ?? ' ').toUpperCase();
  return DRUM.includes(upper) ? upper : ' ';
}

/**
 * The characters a tile flips through to go from `from` to `to`, walking the drum
 * forward like a real split-flap unit. Long walks are cut to the last `max` steps;
 * `min` forces a visible cycle even when the character does not change.
 * @param {string} from Current character.
 * @param {string} to Target character.
 * @param {{ max?: number, min?: number }} [options] Step limits.
 * @returns {string[]} Characters to show in order; the last one is `to`.
 */
export function route(from, to, { max = 10, min = 0 } = {}) {
  const start = DRUM.indexOf(normalise(from));
  const end = DRUM.indexOf(normalise(to));
  let distance = (end - start + DRUM.length) % DRUM.length;
  if (distance < min) distance += DRUM.length;
  const steps = [];
  for (let step = 1; step <= distance; step += 1) steps.push(DRUM[(start + step) % DRUM.length]);
  return steps.slice(-Math.max(max, min));
}

/**
 * Lays text out on a fixed row of tiles.
 * @param {string} text Text to show.
 * @param {number} width Number of tiles.
 * @param {'left' | 'right'} [align] Alignment inside the row.
 * @returns {string[]} One drum character per tile.
 */
export function tiles(text, width, align = 'left') {
  const chars = [...String(text)].map(normalise).slice(0, width);
  const pad = Array.from({ length: width - chars.length }, () => ' ');
  return align === 'right' ? [...pad, ...chars] : [...chars, ...pad];
}

/** Short drum-safe names for GitHub languages too long for a name row. */
export const ABBR = {
  'Jupyter Notebook': 'JUPYTER',
  'Objective-C': 'OBJ-C',
  'Objective-C++': 'OBJ-C++',
  'Visual Basic .NET': 'VB.NET',
  'Visual Basic 6.0': 'VB6',
  'WebAssembly': 'WASM',
  'CoffeeScript': 'COFFEE',
  'Common Lisp': 'LISP',
  'Emacs Lisp': 'ELISP',
  'Dockerfile': 'DOCKER',
  'Game Maker Language': 'GML',
  'Protocol Buffer': 'PROTOBUF',
  'Vim Script': 'VIMSCRIPT',
};

/**
 * A label that fits `width` tiles: the abbreviation when one exists, else the
 * name cut short with a closing '.' so a cut never reads as a whole word.
 * @param {string} name Full name.
 * @param {number} width Tile count.
 * @returns {string} Label of at most `width` characters.
 */
export function fit(name, width) {
  const text = String(name);
  if (text.length <= width) return text;
  const short = ABBR[/** @type {keyof typeof ABBR} */ (text)];
  if (short && short.length <= width) return short;
  return `${text.slice(0, width - 1).trimEnd()}.`;
}

/**
 * GitHub repository list of tiennm99 filtered by a primary language.
 * @param {string} name GitHub language name.
 * @returns {string} URL.
 */
export const languageRepos = name => `https://github.com/tiennm99?tab=repositories&type=source&language=${encodeURIComponent(name.toLowerCase())}`;

/**
 * A row of em dashes, right-aligned, for a value that is not known.
 * @param {number} width Number of tiles.
 * @param {number} [count] How many dashes.
 * @returns {string[]} Tiles.
 */
export const dashes = (width, count = width) => tiles(DASH.repeat(Math.min(count, width)), width, 'right');
