<script>
  /**
   * Section 09: a split-flap departures board for the live public GitHub numbers.
   * Tiles stay blank until the board scrolls into view, then flip to live data
   * (em dashes while connecting, one NO SIGNAL row when offline). The last title
   * word follows the data status. A language row with featured projects marks
   * them in section 05 and keeps the mark for a few seconds after a jump there.
   */
  import { onDestroy } from 'svelte';
  import Flap from './Flap.svelte';
  import { tiles, dashes, fit, languageRepos } from './flaps.js';
  import { gh, repo, refreshGitHub, canRefresh } from '../../lib/live/github.svelte.js';
  import { featured, projectAnchor } from '../../lib/content.js';
  import { reduced, toast } from '../../lib/ui.svelte.js';
  import { localTime, localDate, yearsSince, TIME_ZONE } from '../../lib/time.js';
  import { sectionMotion, scrollToId } from '../../lib/motion/runtime.js';
  import { inView } from '../../lib/motion/actions.js';

  /** Tiles per title row: wide boards use two rows, narrow ones four. */
  const WIDE_W = 17;
  const NARROW_W = 9;
  /** Board width (px, border box) below which the narrow title is mounted. */
  const NARROW_BELOW = 600;
  const STAT_W = 5;
  const NAME_W = 10;
  const COUNT_W = 3;
  const LANG_ROWS = 6;
  /** How long a jump keeps section 05 marked, scroll time included. */
  const PIN_MS = 6500;
  /** Grace before a hover mark clears, so moving between rows does not flicker. */
  const LEAVE_MS = 320;
  /** Rows sliding under a still pointer during the jump scroll must not steal the mark. */
  const SCROLL_GUARD_MS = 1600;

  let armed = $state(false);
  let spin = $state(0);
  let boardWidth = $state(0);
  /** @type {string | null} */
  let activeLang = $state(null);
  let pinned = $state(false);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let pinTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let leaveTimer;
  let pinnedAt = 0;

  const instant = $derived(reduced());
  const known = $derived(armed && gh.totals !== null);
  const narrow = $derived(boardWidth > 0 && boardWidth < NARROW_BELOW);
  const noSignal = $derived(armed && gh.status === 'offline' && gh.totals === null);

  const since = $derived(gh.user?.createdAt
    ? new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, month: 'short', year: 'numeric' }).format(Date.parse(gh.user.createdAt))
    : null);

  const stats = $derived([
    { code: '01', label: 'Total stars', note: 'Non-fork repos, both accounts, archived included', value: gh.totals?.stars },
    { code: '02', label: 'Public repos', note: 'Non-fork, tiennm99 + tiennm99dev', value: gh.totals?.repos },
    { code: '03', label: 'Followers', note: 'github.com/tiennm99', value: gh.user?.followers },
    { code: '04', label: 'Years on GitHub', note: since ? `Since ${since}` : 'Since the account opened', value: gh.user?.createdAt ? yearsSince(gh.user.createdAt.slice(0, 7)) : undefined },
  ]);

  /**
   * Featured projects whose live primary language is `name`.
   * @param {string} name Language name.
   * @returns {{ anchor: string, short: string }[]} Section 05 anchors and repo names.
   */
  const matches = name => featured
    .filter(item => repo(item.repo)?.language === name)
    .map(item => ({ anchor: projectAnchor(item.repo), short: item.repo.split('/')[1] }));

  /** Day-job notes on a language row, from the CV facts (section 03). */
  const NOTES = /** @type {Record<string, string>} */ ({ Java: 'Day job: Java backends · 03' });

  const langs = $derived(Array.from({ length: LANG_ROWS }, (_, index) => {
    const lang = known ? gh.languages[index] : undefined;
    return { rank: String(index + 1).padStart(2, '0'), lang, featured: lang ? matches(lang.name) : [], note: lang ? NOTES[lang.name] : undefined };
  }));

  const statusWord = $derived(gh.loading && gh.status !== 'connecting' ? 'REFRESHING' : ({ connecting: 'CONNECTING', fresh: 'LIVE', stale: 'CACHED', offline: 'OFFLINE' })[gh.status]);
  /** The title's last word: what the numbers really are right now. */
  const titleWord = $derived(({ connecting: '···', fresh: 'LIVE', stale: 'CACHED', offline: 'OFFLINE' })[gh.status]);
  const kicker = $derived(({ connecting: 'connecting', fresh: 'live board', stale: 'cached board', offline: 'offline board' })[gh.status]);
  const asOfTiles = $derived(armed && gh.asOf ? tiles(localTime(gh.asOf), 5) : ['—', '—', ':', '—', '—']);

  /**
   * Title rows: the status word is right-aligned on the last row, in accent tiles.
   * @type {{ chars: string[], accentFrom: number }[]}
   */
  const titleRows = $derived.by(() => {
    const width = narrow ? NARROW_W : WIDE_W;
    const lines = narrow ? ['PUBLIC', 'SIDE', 'PROJECTS,'] : ['PUBLIC SIDE', 'PROJECTS,'];
    const word = armed ? titleWord : '';
    const rows = lines.map(line => ({ chars: tiles(armed ? line : '', width), accentFrom: width }));
    if (narrow) rows.push({ chars: tiles(word, width, 'right'), accentFrom: width - word.length });
    else {
      const last = rows[rows.length - 1];
      last.chars.splice(width - word.length, word.length, ...tiles(word, word.length));
      last.accentFrom = width - word.length;
    }
    return rows;
  });

  const rateNote = $derived.by(() => {
    if (gh.loading) return 'Asking api.github.com…';
    if (!canRefresh()) return `Rate limit low. Refresh opens again at ${gh.rateReset ? localTime(gh.rateReset) : 'the next reset'}.`;
    if (gh.rateRemaining !== null) return `${gh.rateRemaining} anonymous API calls left this hour.`;
    return 'Uses the anonymous GitHub API limit.';
  });

  const caption = $derived.by(() => {
    if (gh.status === 'connecting') return 'Waiting for api.github.com.';
    if (gh.status === 'offline') return 'GitHub did not answer, so the numbers stay hidden.';
    const when = gh.asOf ? `${localTime(gh.asOf)}, ${localDate(gh.asOf)} (Ho Chi Minh City)` : '';
    return gh.status === 'stale' ? `Cached copy from ${when}; GitHub did not answer just now.` : `As of ${when}.`;
  });

  /**
   * Tiles for a value that may not be known yet.
   * @param {number | undefined} value Value.
   * @param {number} width Tile count.
   * @returns {string[]} Tiles.
   */
  const valueTiles = (value, width) => (known && typeof value === 'number' ? tiles(String(value), width, 'right') : dashes(width, 1));

  /**
   * Repo names for a row hint: two names, then a count of the rest.
   * @param {{ short: string }[]} list Matches.
   * @returns {string} Hint text.
   */
  const names = list => list.slice(0, 2).map(item => item.short).join(', ') + (list.length > 2 ? ` +${list.length - 2}` : '');

  /** Removes every highlight this board placed on section 05. */
  function clearHighlight() {
    if (typeof document === 'undefined') return;
    delete document.documentElement.dataset.ghLang;
    for (const node of document.querySelectorAll('[data-gh-lang-hit]')) node.removeAttribute('data-gh-lang-hit');
  }

  /**
   * Marks the featured project rows written in a language (or clears the marks).
   * Section 05 also hears it through the `projects:highlight` window event.
   * @param {string | null} name Language, or null to clear.
   */
  function highlight(name) {
    if (name === activeLang) return;
    clearHighlight();
    activeLang = name;
    const anchors = name ? matches(name).map(item => item.anchor) : [];
    if (name) {
      document.documentElement.dataset.ghLang = name;
      for (const id of anchors) document.getElementById(id)?.setAttribute('data-gh-lang-hit', '');
    }
    window.dispatchEvent(new CustomEvent('github:language', { detail: { language: name, anchors } }));
    window.dispatchEvent(new CustomEvent('projects:highlight', { detail: { language: name } }));
  }

  function stopTimers() {
    clearTimeout(pinTimer);
    clearTimeout(leaveTimer);
  }

  /**
   * A new hover or focus takes over from any pinned mark.
   * @param {string} name Language.
   * @param {boolean} [pointer] Whether a pointer (not focus) entered the row.
   */
  function enter(name, pointer = false) {
    if (pointer && pinned && Date.now() - pinnedAt < SCROLL_GUARD_MS) return;
    stopTimers();
    pinned = false;
    highlight(name);
  }

  /** Leaving a row clears the mark after a short grace, unless a jump pinned it. */
  function leave() {
    if (pinned) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => highlight(null), LEAVE_MS);
  }

  /**
   * Jumps to the first matching project row and keeps it marked for a while,
   * so the mark is still there when the scroll lands.
   * @param {string} name Language.
   */
  function jump(name) {
    const target = matches(name).map(item => item.anchor).find(id => document.getElementById(id));
    if (!target) {
      toast('The projects index is not on this page.');
      return;
    }
    stopTimers();
    activeLang = null;
    highlight(name);
    pinned = true;
    pinnedAt = Date.now();
    pinTimer = setTimeout(() => {
      pinned = false;
      highlight(null);
    }, PIN_MS);
    scrollToId(target);
  }

  async function refresh() {
    if (!canRefresh()) return;
    await refreshGitHub();
    spin += 1;
    toast(gh.status === 'fresh' ? 'Board refreshed from api.github.com' : 'GitHub did not answer; showing what we have');
  }

  /** @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context. */
  function boardMotion({ node, reduced: isReduced, gsap }) {
    if (isReduced) return;
    const board = node.querySelector('.board');
    gsap.from(board, {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: board, start: 'top 88%', once: true },
    });
    gsap.from(node.querySelectorAll('.frame .w'), {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.035,
      ease: 'expo.out',
      scrollTrigger: { trigger: node, start: 'top 80%', once: true },
    });
  }

  const FRAME = 'Public side projects only. The day-job Java lives in private repositories.';

  onDestroy(() => {
    stopTimers();
    clearHighlight();
  });
</script>

<section
  class="section gh"
  aria-labelledby="github-title"
  use:sectionMotion={boardMotion}
  use:inView={{ once: true, rootMargin: '0px 0px -12% 0px', onChange: visible => { if (visible) armed = true; } }}
>
  <div class="cols" aria-hidden="true">{#each Array(12) as _, index (index)}<i></i>{/each}</div>

  <div class="intro grid-12">
    <p class="label kicker">(09) GitHub <span aria-hidden="true">·</span> {kicker}</p>
    <p class="frame">
      {#each FRAME.split(' ') as word, index (index)}<span class="mask"><span class="w" class:java={word === 'Java'}>{word}</span></span> {/each}
    </p>
    <p class="aside">
      The board counts non-fork public repos of tiennm99 and tiennm99dev, archived ones included,
      fetched live from the GitHub API in your browser. Nothing on it is stored in this site.
    </p>
  </div>

  <div class="board" bind:clientWidth={boardWidth}>
    <header class="head">
      <div class="head-meta">
        <span class="b-label">Board 09 <span aria-hidden="true">·</span> tiennm99 + tiennm99dev</span>
        <div class="status">
          <span class="b-label" aria-hidden="true">Status</span>
          <span class="tile-row" aria-hidden="true">
            {#each tiles(armed ? statusWord : '', 10) as char, col (col)}
              <Flap {char} {instant} accent delay={300 + col * 30} />
            {/each}
          </span>
          <span class="sr-only" aria-live="polite">GitHub data status: {statusWord.toLowerCase()}</span>
          <span class="b-label" aria-hidden="true">As of</span>
          <span class="tile-row" aria-hidden="true">
            {#each asOfTiles as char, col (col)}
              <Flap {char} {instant} {spin} delay={420 + col * 40} />
            {/each}
          </span>
        </div>
      </div>
      <h2 id="github-title" class="title" class:narrow>
        <span class="sr-only">Public side projects on GitHub</span>
        <span class="tiles" aria-hidden="true">
          {#each titleRows as line, row (row)}
            <span class="tile-row">
              {#each line.chars as char, col (col)}
                <Flap {char} {instant} accent={col >= line.accentFrom} max={narrow ? 5 : 9} delay={row * 160 + col * 34} step={58} />
              {/each}
            </span>
          {/each}
        </span>
      </h2>
    </header>

    <div class="body">
      <div class="panel stats">
        <div class="thead b-label" aria-hidden="true"><span>Nº</span><span>Metric</span><span class="r">Count</span></div>
        <dl>
          {#each stats as stat, row (stat.code)}
            <div class="srow">
              <span class="code b-label" aria-hidden="true">{stat.code}</span>
              <dt>
                <span class="metric">{stat.label}</span>
                <span class="note">{stat.note}</span>
              </dt>
              <dd>
                <span class="tile-row" aria-hidden="true">
                  {#each valueTiles(stat.value, STAT_W) as char, col (col)}
                    <Flap {char} {instant} {spin} delay={500 + row * 120 + col * 45} />
                  {/each}
                </span>
                <span class="sr-only">{known && typeof stat.value === 'number' ? stat.value : 'not available'}</span>
              </dd>
            </div>
          {/each}
        </dl>
      </div>

      <div class="panel langs">
        <div class="thead b-label" aria-hidden="true"><span>Nº</span><span>Primary language</span><span class="r">Repos</span></div>
        {#if noSignal}
          <div class="lrow idle signal" aria-hidden="true">
            <span class="code b-label">—</span>
            <span class="tile-row name">
              {#each tiles('NO SIGNAL', NAME_W) as char, col (col)}
                <Flap {char} {instant} {spin} accent={col < 9} delay={900 + col * 38} />
              {/each}
            </span>
            <span class="mid"><span class="hint-static">{gh.rateReset ? `Retry after ${localTime(gh.rateReset)}` : 'Try Refresh below'}</span></span>
            <span class="tile-row count">
              {#each dashes(COUNT_W, 1) as char, col (col)}
                <Flap {char} {instant} delay={1150 + col * 45} />
              {/each}
            </span>
          </div>
          <p class="sr-only">Language counts are hidden because GitHub did not answer.</p>
        {:else}
          <ol aria-label="Top primary languages by public repo count">
            {#each langs as item, row (item.rank)}
              <li>
                {#if item.lang && item.featured.length}
                  {@const name = item.lang.name}
                  <button
                    type="button"
                    class="lrow"
                    class:on={activeLang === name}
                    data-cursor="link"
                    onpointerenter={() => enter(name, true)}
                    onpointerleave={leave}
                    onfocus={() => enter(name)}
                    onblur={leave}
                    onclick={() => jump(name)}
                    aria-label="{name}: {item.lang.count} public repos. Featured in Projects: {item.featured.map(f => f.short).join(', ')}; jump there.{item.note ? ` ${item.note}.` : ''}"
                  >
                    {@render row_(item, row, `${names(item.featured)} → 05`)}
                  </button>
                {:else if item.lang}
                  <a
                    class="lrow"
                    href={languageRepos(item.lang.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="link"
                    aria-label="{item.lang.name}: {item.lang.count} public repos. Open the list on GitHub (new tab).{item.note ? ` ${item.note}.` : ''}"
                  >
                    {@render row_(item, row, 'Repos on GitHub ↗')}
                  </a>
                {:else}
                  <div class="lrow idle" aria-hidden="true">{@render row_(item, row, '')}</div>
                {/if}
              </li>
            {/each}
          </ol>
          {#if !known}<p class="sr-only">Language counts appear when GitHub answers.</p>{/if}
        {/if}
      </div>
    </div>

    <footer class="foot">
      <div class="caption">
        <p class="b-label src">Source · api.github.com · public, non-fork repos of tiennm99 and tiennm99dev</p>
        <p class="asof">{caption}</p>
      </div>
      <div class="refresh">
        <button type="button" class="rbtn" onclick={refresh} disabled={!canRefresh()} aria-describedby="github-rate" data-cursor="link">
          <span class="dot" class:busy={gh.loading} aria-hidden="true"></span>
          {gh.loading ? 'Refreshing' : 'Refresh board'}
        </button>
        <p id="github-rate" class="rate">{rateNote}</p>
      </div>
    </footer>
  </div>
</section>

{#snippet row_(/** @type {{ rank: string, lang: { name: string, count: number } | undefined, note: string | undefined }} */ item, /** @type {number} */ row, /** @type {string} */ hint)}
  <span class="code b-label" aria-hidden="true">{item.rank}</span>
  <span class="tile-row name" aria-hidden="true">
    {#each item.lang ? tiles(fit(item.lang.name, NAME_W), NAME_W) : dashes(NAME_W, 1).reverse() as char, col (col)}
      <Flap {char} {instant} {spin} delay={900 + row * 110 + col * 38} />
    {/each}
  </span>
  <span class="mid" aria-hidden="true">
    {#if item.note}<span class="tag">{item.note}</span>{/if}
    {#if hint}<span class="hint">{hint}</span>{/if}
  </span>
  <span class="tile-row count" aria-hidden="true">
    {#each item.lang ? tiles(String(item.lang.count), COUNT_W, 'right') : dashes(COUNT_W, 1) as char, col (col)}
      <Flap {char} {instant} {spin} delay={1150 + row * 110 + col * 45} />
    {/each}
  </span>
{/snippet}

<style>
  .gh { overflow-x: clip; }

  /* ---------- intro on paper ---------- */
  .intro { position: relative; row-gap: var(--s-5); margin-bottom: var(--s-8); }
  .kicker { grid-column: 1 / -1; color: var(--ink); }
  .frame {
    grid-column: 1 / -1;
    margin: 0;
    max-width: 22ch;
    font-family: var(--font-display-stack);
    font-size: var(--t-xl);
    font-weight: 600;
    font-variation-settings: "wght" 600, "wdth" 84;
    line-height: 1.02;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }
  .mask { display: inline-block; overflow: clip; vertical-align: top; padding-bottom: 0.08em; margin-right: 0.24em; }
  .w { display: inline-block; }
  .java { font-variation-settings: "wght" 860, "wdth" 128; color: var(--accent-text); }
  .aside { grid-column: 1 / -1; margin: 0; max-width: 46ch; color: var(--ink-2); font-size: var(--t-md); }
  @media (min-width: 1024px) {
    .frame { grid-column: 1 / span 8; font-size: clamp(2.2rem, 1rem + 2.6vw, 3.6rem); }
    .aside { grid-column: 9 / span 4; align-self: end; }
  }

  /* ---------- the board ---------- */
  /* Real departures boards are black: the board keeps its own dark palette in
     every theme, lifted a step and outlined when the page itself is dark. */
  .board {
    --ink: oklch(0.17 0.012 270);
    --paper: oklch(0.965 0.01 95);
    --accent: oklch(0.63 0.235 31);
    --accent-ink: oklch(0.17 0.012 270);
    --board: var(--ink);
    --board-ink: var(--paper);
    --board-dim: color-mix(in oklch, var(--paper) 76%, var(--ink));
    --board-line: color-mix(in oklch, var(--paper) 16%, transparent);
    position: relative;
    max-width: var(--max);
    margin-inline: auto;
    padding: clamp(14px, 2.6vw, 40px);
    background: var(--board);
    color: var(--board-ink);
    border-radius: 6px;
    container-type: inline-size;
  }
  .b-label {
    font-family: var(--font-mono-stack);
    font-size: var(--t-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--board-dim);
  }
  .tile-row { display: inline-flex; gap: calc(var(--tw) * 0.1); }

  .head {
    display: grid;
    gap: var(--s-5);
    padding-bottom: var(--s-6);
    border-bottom: 1px solid var(--board-line);
  }
  .head-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-4); }
  /* N tiles and N-1 gaps of 0.1 tile fill the board edge to edge (17 wide, 9 narrow). */
  .title { margin: 0; font-size: inherit; --tw: calc(100cqi / 18.6); }
  .title.narrow { --tw: calc(100cqi / 9.8); }
  .tiles { display: grid; gap: calc(var(--tw) * 0.14); }
  .status {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: var(--s-2) var(--s-3);
    --tw: clamp(16px, 4.6cqi, 24px);
  }
  @container (min-width: 700px) {
    .status { grid-template-columns: auto auto auto auto; column-gap: var(--s-3); }
  }

  .body { display: grid; gap: var(--s-7); padding-block: var(--s-6); }
  @container (min-width: 900px) {
    .body { grid-template-columns: 5fr 7fr; gap: clamp(32px, 4cqi, 72px); }
  }
  .panel { container-type: inline-size; min-width: 0; }
  .thead {
    display: grid;
    grid-template-columns: 2.6em 1fr auto;
    padding-bottom: var(--s-3);
    border-bottom: 1px solid var(--board-line);
  }
  .r { text-align: right; }
  dl, ol { margin: 0; padding: 0; list-style: none; }

  .stats { --tw: min(8.4cqi, 40px); }
  .srow {
    display: grid;
    grid-template-columns: 2.6em 1fr auto;
    align-items: center;
    gap: var(--s-3);
    padding-block: var(--s-4);
    border-bottom: 1px solid var(--board-line);
  }
  .srow .code { align-self: start; padding-top: 0.2em; }
  dt { display: grid; gap: 2px; min-width: 0; }
  dd { margin: 0; }
  .metric {
    font-family: var(--font-display-stack);
    font-size: var(--t-lg);
    font-weight: 700;
    font-variation-settings: "wght" 700, "wdth" 96;
    text-transform: uppercase;
    line-height: 1.05;
  }
  .note { color: var(--board-dim); font-size: var(--t-sm); line-height: 1.35; overflow-wrap: anywhere; }
  @container (max-width: 480px) {
    .stats { --tw: clamp(24px, 7.4cqi, 40px); }
    .srow, .stats .thead { grid-template-columns: 2em 1fr auto; gap: var(--s-2); }
  }

  .langs { --tw: min(5.2cqi, 34px); }
  .lrow {
    position: relative;
    display: grid;
    grid-template-columns: 2.6em auto 1fr auto;
    align-items: center;
    gap: var(--s-3);
    width: 100%;
    min-height: 44px;
    padding: var(--s-3) 0;
    border: 0;
    border-bottom: 1px solid var(--board-line);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  /* The boarding bar: a vermilion strip that wipes in on hover and focus. */
  .lrow::before {
    content: "";
    position: absolute;
    left: calc(-1 * var(--s-3));
    top: 0;
    bottom: -1px;
    width: 4px;
    background: var(--accent);
    transform: scaleY(0);
    transform-origin: 50% 0;
    transition: transform var(--d-med) var(--ease-out);
  }
  .lrow:hover::before, .lrow.on::before, .lrow:focus-visible::before { transform: scaleY(1); }
  .lrow:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  a.lrow { text-decoration: none; }
  /* The middle cell: a standing note (Java) that gives way to the hover hint. */
  .mid { display: grid; justify-items: end; min-width: 0; text-align: right; }
  .tag, .hint, .hint-static {
    grid-area: 1 / 1;
    font-family: var(--font-mono-stack);
    font-size: var(--t-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.3;
  }
  .tag { color: var(--board-ink); transition: opacity var(--d-fast); }
  .hint-static { justify-self: end; text-align: right; color: var(--board-ink); }
  .hint {
    color: var(--board-ink);
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity var(--d-fast), transform var(--d-med) var(--ease-out);
  }
  .lrow:hover .hint, .lrow.on .hint, .lrow:focus-visible .hint { opacity: 1; transform: none; }
  .lrow:hover .tag, .lrow.on .tag, .lrow:focus-visible .tag { opacity: 0; }
  .idle { cursor: default; }
  /* Phones: names stay at least 17px, counts 22px; the rank column goes and
     the standing note drops to its own line under the name. */
  @container (max-width: 520px) {
    .langs { --tw: clamp(15px, 5.5cqi, 34px); }
    .count { --tw: clamp(22px, 7cqi, 34px); }
    .lrow { grid-template-columns: auto 1fr auto; gap: var(--s-2) var(--s-3); }
    .lrow > .code, .langs .thead > :first-child { display: none; }
    .langs .thead { grid-template-columns: 1fr auto; }
    .hint { display: none; }
    .mid { grid-column: 1 / -1; grid-row: 2; justify-items: start; text-align: left; }
    .lrow > .name { grid-column: 1; grid-row: 1; }
    .lrow > .count { grid-column: -2; grid-row: 1; }
    .mid:not(:has(.tag, .hint-static)) { display: none; }
    .tag { opacity: 1 !important; }
    .hint-static { justify-self: start; text-align: left; }
  }

  .foot {
    display: grid;
    gap: var(--s-5);
    padding-top: var(--s-5);
    border-top: 1px solid var(--board-line);
  }
  @container (min-width: 900px) {
    .foot { grid-template-columns: 1fr auto; align-items: center; }
  }
  .caption p { margin: 0; }
  .asof { margin-top: var(--s-2) !important; font-size: var(--t-sm); color: var(--board-ink); }
  .refresh { display: grid; gap: var(--s-2); justify-items: start; }
  @container (min-width: 900px) { .refresh { justify-items: end; text-align: right; } }
  .rbtn {
    display: inline-flex;
    align-items: center;
    gap: var(--s-3);
    min-height: 44px;
    padding: 0 var(--s-5);
    border: 1px solid var(--board-ink);
    border-radius: 999px;
    background: transparent;
    color: var(--board-ink);
    font: 600 var(--t-sm)/1 var(--font-body-stack);
    transition: background var(--d-fast), color var(--d-fast), border-color var(--d-fast);
  }
  .rbtn:hover:not(:disabled) { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  .rbtn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .rbtn:disabled { opacity: 0.55; cursor: not-allowed; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
  .dot.busy { animation: pulse 0.9s var(--ease-io) infinite; }
  .rbtn:hover:not(:disabled) .dot { background: var(--accent-ink); }
  @keyframes pulse { 50% { transform: scale(0.4); opacity: 0.4; } }
  .rate { margin: 0; font-size: var(--t-sm); color: var(--board-dim); }

  /* Cross-section highlight: section 05 rows marked by this board. */
  :global(html[data-gh-lang] [data-gh-lang-hit]) {
    box-shadow: inset 4px 0 0 var(--accent);
    background-color: color-mix(in oklch, var(--accent) 10%, transparent);
    transition: background-color var(--d-fast), box-shadow var(--d-fast), opacity var(--d-fast);
  }
  :global(html[data-gh-lang] #projects li[id^="project-"]:not([data-gh-lang-hit])) {
    opacity: 0.45;
    transition: opacity var(--d-fast);
  }

  :global(:root[data-theme="invert"]) .board {
    --ink: oklch(0.2 0.014 270);
    box-shadow: 0 0 0 1px oklch(0.34 0.012 270);
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme="light"])) .board {
      --ink: oklch(0.2 0.014 270);
      box-shadow: 0 0 0 1px oklch(0.34 0.012 270);
    }
  }

  @media (forced-colors: active) {
    .board { border: 1px solid CanvasText; }
    .lrow::before { background: Highlight; }
  }
</style>
