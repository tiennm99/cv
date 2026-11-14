/**
 * Helpers for the writing section ("The miti99 Desk"): language detection, newsletter
 * numbering, lede titles, summary clean-up and post ages over feed posts.
 */

/** Letters that only Vietnamese uses among the scripts the blog writes in. */
const VIETNAMESE = /[ăâđêôơưàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]/i;

/**
 * Guesses the post language from its title and summary (the blog writes in Vietnamese and English).
 * @param {{ title: string, summary?: string }} post Feed post.
 * @returns {'vi' | 'en'} BCP 47 language tag for the article element.
 */
export function postLang(post) {
  return VIETNAMESE.test(`${post.title} ${post.summary ?? ''}`) ? 'vi' : 'en';
}

/**
 * Issue number of a "Newsletter #N" post, or null for any other title.
 * @param {string} title Post title.
 * @returns {number | null} Issue number.
 */
export function newsletterNo(title) {
  const match = /^newsletter\s*#\s*(\d+)\s*$/i.exec(title.trim());
  return match ? Number(match[1]) : null;
}

/**
 * Drops the newsletter greeting ("Mời bạn thưởng thức Newsletter #139.") so the card
 * opens on the first linked story, and decodes the few entities the feed leaves in.
 * @param {string} summary Plain-text summary from the feed.
 * @returns {string} Cleaned summary.
 */
export function cleanSummary(summary) {
  return summary
    .replace(/&[lr]dquo;/g, '"')
    .replace(/&[lr]squo;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/&hellip;/g, '…')
    .replace(/^[^.]*newsletter\s*#\s*\d+\s*[.:]\s*/i, '')
    .trim();
}

/** Invisible separator that ends a newsletter's lede title inside the plain-text summary. */
export const LEDE_MARK = '\u2063';

/**
 * Moves a newsletter's first story title out of its description HTML and puts it in front of
 * the body text, ended by LEDE_MARK, so the plain-text summary keeps the two apart. The
 * "Mời bạn thưởng thức Newsletter #N." greeting goes too. Descriptions that do not open on a
 * heading (long reads) come back unchanged.
 * @param {string} html Description HTML from the feed.
 * @param {DOMParser} parser Parser for the HTML.
 * @returns {string} Description HTML, marked when it opens on a heading.
 */
export function markLede(html, parser) {
  const body = parser.parseFromString(html, 'text/html').body;
  let first = body?.firstElementChild;
  if (first?.tagName === 'P' && /newsletter\s*#\s*\d+/i.test(first.textContent ?? '')) {
    first.remove();
    first = body.firstElementChild;
  }
  if (!first || !/^H[1-4]$/.test(first.tagName)) return html;
  const lede = (first.textContent ?? '').replace(/\s+/g, ' ').replace(/</g, '‹').trim();
  if (!lede) return html;
  first.remove();
  return `${lede}${LEDE_MARK} ${body.innerHTML}`;
}

/**
 * A DOMParser stand-in for `loadPosts({ parser })`: parses the feed, then marks each item's
 * lede title (see markLede) before the feed parser flattens the description to text.
 * @param {DOMParser} [base] Real parser (injectable for tests).
 * @returns {DOMParser} Parser with the same parseFromString contract.
 */
export function ledeParser(base = new DOMParser()) {
  return /** @type {DOMParser} */ (/** @type {unknown} */ ({
    /**
     * @param {string} text Document text.
     * @param {DOMParserSupportedType} type MIME type.
     * @returns {Document} Parsed document.
     */
    parseFromString(text, type) {
      const doc = base.parseFromString(text, type);
      for (const node of doc.getElementsByTagName('description')) {
        node.textContent = markLede(node.textContent ?? '', base);
      }
      return doc;
    },
  }));
}

/**
 * Splits a summary into its lede title (newsletters) and body text.
 * @param {string} summary Plain-text summary, possibly holding LEDE_MARK.
 * @returns {{ lede: string, body: string }} Lede ('' when none) and body.
 */
export function splitLede(summary) {
  const at = summary.indexOf(LEDE_MARK);
  if (at < 0) return { lede: '', body: cleanSummary(summary) };
  return { lede: cleanSummary(summary.slice(0, at)), body: cleanSummary(summary.slice(at + 1)) };
}

/**
 * How long ago a post went up, rounded down so ten days never reads as two weeks.
 * @param {string} iso Post date.
 * @param {number} [now] Reference instant.
 * @returns {string} "today", "yesterday", "10 days ago", "3 weeks ago", "5 months ago", "2 years ago".
 */
export function ago(iso, now = Date.now()) {
  const days = Math.floor((now - Date.parse(iso)) / 864e5);
  if (Number.isNaN(days)) return '';
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 61) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 730) return `${Math.floor(days / 30.44)} months ago`;
  return `${Math.floor(days / 365.25)} years ago`;
}
