/**
 * Type shapes for the hero ink knock-out, written every frame without layout reads.
 *
 * Anybody's advance width does not scale linearly with `wdth`, so a linear estimate
 * drifts, worst on a right-aligned line where the error accumulates. Instead each
 * char's advance is measured once at five points along its rest-to-peak axis path
 * (the kinetic field moves `wght` and `wdth` together) and interpolated per frame.
 * Vertical extents are the real ink (cap height, descenders) from canvas
 * `measureText`, placed on the baseline, so the shapes hug the letters, not the
 * taller line boxes. The avatar is a circle; the full stop is its own small box.
 */

/** Points along the rest-to-peak path where advances are measured (0 = rest). */
export const STOPS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Linear interpolation in a table sampled at `STOPS`.
 * @param {ArrayLike<number>} table Values at each stop.
 * @param {number} k Position along the path, clamped to 0..1.
 * @returns {number} Interpolated value.
 */
export function interpolate(table, k) {
  const f = Math.min(1, Math.max(0, k)) * (table.length - 1);
  const i = Math.min(table.length - 2, Math.floor(f));
  return table[i] + (table[i + 1] - table[i]) * (f - i);
}

/**
 * Lays out one line's glyph centres from their current advances.
 * @param {number[]} advances Current advance widths, in reading order.
 * @param {'left' | 'right'} align Line alignment.
 * @param {number} anchor Rest left edge (left) or rest right edge (right).
 * @returns {number[]} Glyph centre x positions.
 */
export function layoutLine(advances, align, anchor) {
  const total = advances.reduce((sum, value) => sum + value, 0);
  let x = align === 'right' ? anchor - total : anchor;
  return advances.map(advance => {
    const centre = x + advance / 2;
    x += advance;
    return centre;
  });
}

/**
 * @typedef {import('../../lib/motion/kinetic.js').KineticChar} KineticChar
 * @typedef {{ wght: number, wdth: number }} Axes
 * @typedef {{ char: KineticChar, widths: Float32Array, cy: number, hh: number }} Glyph
 * @typedef {{ align: 'left' | 'right', anchor: number, glyphs: Glyph[] }} Line
 */

/**
 * @param {{ rest: Axes, peak: Axes }} axes The axes the kinetic field moves between.
 * @returns {{ measure: (host: HTMLElement, chars: KineticChar[], avatar: Element | null, stop: Element | null) => void, write: (out: Float32Array, max: number) => number }} Shapes.
 */
export function createGlyphShapes({ rest, peak }) {
  /** @type {Line[]} */
  let lines = [];
  /** @type {{ gap: number, cy: number, r: number } | null} */
  let avatar = null;
  /** @type {[number, number, number, number] | null} */
  let stopBox = null;
  const ctx = document.createElement('canvas').getContext('2d');
  const span = peak.wdth - rest.wdth || 1;

  /**
   * Ink extents of `text` set in `el`'s font, on the baseline of `rect`.
   * @param {Element} el Element whose computed font is used.
   * @param {DOMRect} rect Its line box (inline-block with the display line-height).
   * @param {string} text Glyph(s) to measure.
   * @param {number} top Rect top in host px.
   * @returns {{ cy: number, hh: number }} Centre and half-height in host px.
   */
  const inkBox = (el, rect, text, top) => {
    const style = getComputedStyle(el);
    const size = parseFloat(style.fontSize) || 100;
    if (!ctx) return { cy: top + rect.height / 2, hh: rect.height * 0.42 };
    ctx.font = `${style.fontWeight} 100px ${style.fontFamily}`;
    const shown = style.textTransform === 'uppercase' ? text.toUpperCase() : text;
    const m = ctx.measureText(shown);
    const scale = size / 100;
    const ascent = m.fontBoundingBoxAscent * scale;
    const descent = m.fontBoundingBoxDescent * scale;
    // Half-leading model: the content area is centred in the line box.
    const baseline = top + (rect.height - ascent - descent) / 2 + ascent;
    const up = m.actualBoundingBoxAscent * scale;
    const down = m.actualBoundingBoxDescent * scale;
    return { cy: baseline + (down - up) / 2, hh: (up + down) / 2 };
  };

  /**
   * Measures once at rest (and the advance table along the axis path). Layout reads
   * happen only here; call it from the kinetic controller's `onLayout`.
   * @param {HTMLElement} host Element the shapes are relative to (the hero section).
   * @param {KineticChar[]} chars Kinetic chars, at rest axes.
   * @param {Element | null} avatarEl Avatar after line 1, if any.
   * @param {Element | null} stopEl Full stop after the last line, if any.
   */
  const measure = (host, chars, avatarEl, stopEl) => {
    const hostRect = host.getBoundingClientRect();
    const widths = chars.map(() => new Float32Array(STOPS.length));
    STOPS.forEach((k, s) => {
      const axes = `"wght" ${(rest.wght + (peak.wght - rest.wght) * k).toFixed(0)}, "wdth" ${(rest.wdth + span * k).toFixed(1)}`;
      for (const char of chars) char.el.style.fontVariationSettings = axes;
      chars.forEach((char, i) => { widths[i][s] = char.el.getBoundingClientRect().width; });
    });
    const restAxes = `"wght" ${rest.wght}, "wdth" ${rest.wdth}`;
    for (const char of chars) char.el.style.fontVariationSettings = restAxes;

    /** @type {Map<number, Line>} */
    const byLine = new Map();
    chars.forEach((char, i) => {
      const rect = char.el.getBoundingClientRect();
      const { cy, hh } = inkBox(char.el, rect, char.el.textContent ?? '', rect.top - hostRect.top);
      let line = byLine.get(char.line);
      if (!line) {
        const lineEl = char.el.closest('[data-kinetic-line]');
        const align = lineEl && /right|end/.test(getComputedStyle(lineEl).textAlign) ? 'right' : 'left';
        line = { align, anchor: 0, glyphs: [] };
        byLine.set(char.line, line);
      }
      line.glyphs.push({ char, widths: widths[i], cy, hh });
    });
    lines = [...byLine.values()];
    for (const line of lines) {
      const first = line.glyphs[0].char.el.getBoundingClientRect();
      const last = line.glyphs.at(-1)?.char.el.getBoundingClientRect() ?? first;
      line.anchor = (line.align === 'right' ? last.right : first.left) - hostRect.left;
    }

    avatar = null;
    if (avatarEl && lines[0]) {
      const rect = avatarEl.getBoundingClientRect();
      const lastRight = lines[0].glyphs.at(-1)?.char.el.getBoundingClientRect().right ?? rect.left;
      avatar = { gap: rect.left + rect.width / 2 - lastRight, cy: rect.top + rect.height / 2 - hostRect.top, r: rect.width / 2 };
    }
    stopBox = null;
    if (stopEl) {
      const rect = stopEl.getBoundingClientRect();
      const { cy, hh } = inkBox(stopEl, rect, '.', rect.top - hostRect.top);
      stopBox = [rect.left + rect.width / 2 - hostRect.left, cy, rect.width * 0.32, hh];
    }
  };

  /**
   * Writes the current shapes (host px: cx, cy, halfW, halfH; halfH < 0 = circle).
   * @param {Float32Array} out Destination, 4 floats per shape.
   * @param {number} max Maximum shapes.
   * @returns {number} Shapes written.
   */
  const write = (out, max) => {
    let n = 0;
    const push = (x, y, w, h) => {
      if (n >= max) return;
      out[n * 4] = x;
      out[n * 4 + 1] = y;
      out[n * 4 + 2] = w;
      out[n * 4 + 3] = h;
      n++;
    };
    lines.forEach((line, index) => {
      const advances = line.glyphs.map(glyph => interpolate(glyph.widths, (glyph.char.wdth - rest.wdth) / span));
      const centres = layoutLine(advances, line.align, line.anchor);
      line.glyphs.forEach((glyph, i) => {
        if (glyph.hh > 0) push(centres[i], glyph.cy, advances[i] / 2, glyph.hh);
      });
      if (index === 0 && avatar) {
        const right = (centres.at(-1) ?? 0) + (advances.at(-1) ?? 0) / 2;
        push(right + avatar.gap, avatar.cy, avatar.r + 2, -1);
      }
    });
    if (stopBox) push(...stopBox);
    return n;
  };

  return { measure, write };
}
