<script>
  /**
   * 07 Timeline. The year is the heading: a sticky odometer rolls to the year of the
   * entry on the reading line (50% of the viewport). One ScrollTrigger per entry
   * marks where it reaches that line; a single section trigger picks the active
   * entry from those cached positions, so nothing is measured while scrolling. The
   * tail positions are squeezed under the maximum scroll so the last entry can
   * always become active. On wide screens each entry's article sticks to the
   * reading line, where the hairline from the year ends. Year rail buttons jump
   * with Lenis; hovering or focusing one previews that entry in the readout.
   */
  import { sectionMotion, getLenis } from '../../lib/motion/runtime.js';
  import { gh } from '../../lib/live/github.svelte.js';
  import { yearsSince } from '../../lib/time.js';
  import Odometer from './Odometer.svelte';
  import ThesisCard from './ThesisCard.svelte';
  import { entries, railYears, railTarget, blogPosts, KIND_LABEL, WHOLE_YEAR } from './timeline-data.js';

  let active = $state(0);
  /** Entry index previewed from the rail (hover or focus), or null. */
  /** @type {number | null} */
  let preview = $state(null);
  /** Entry index a rail jump is heading to; scroll picks are ignored meanwhile. */
  let locked = -1;
  /** @type {HTMLElement | undefined} */
  let stage = $state();

  const shown = $derived(preview ?? active);
  const current = $derived(entries[shown]);
  /** Static from the account date in the content brief; the live API only adds the pulse. */
  const githubYears = $derived(yearsSince(gh.user?.createdAt?.slice(0, 7) ?? '2018-05'));
  const maxPosts = Math.max(...blogPosts.map(bucket => bucket.count));
  const firstYear = railYears[0].year;
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');

  /**
   * Tracks the active entry: per-entry start positions cached on refresh, picked on scroll.
   * Runs in both motion modes (ScrollTrigger only observes here).
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   */
  function track({ node, ScrollTrigger }) {
    const items = /** @type {HTMLElement[]} */ ([...node.querySelectorAll('[data-entry]')]);
    const marks = items.map(item => ScrollTrigger.create({ trigger: item, start: 'top 50%' }));
    /** @type {number[]} */
    let starts = [];
    /**
     * Caches the starts (one layout read per refresh). Wide: the previous article
     * sticks to the line, so hand over halfway through its exit, when the outgoing
     * and incoming markers are equally far from the line. Starts the page cannot
     * scroll to are squeezed under the end.
     */
    const measure = () => {
      const sticky = matchMedia('(min-width: 1024px)').matches;
      const handover = items.map((item, i) => {
        if (!sticky || i === 0) return 0;
        const before = items[i - 1];
        const article = /** @type {HTMLElement} */ (before.querySelector('article'));
        return (article.offsetHeight + parseFloat(getComputedStyle(before).paddingBottom)) / 2;
      });
      let limit = ScrollTrigger.maxScroll(window) - 2;
      starts = marks.map((mark, i) => mark.start - handover[i]);
      for (let i = starts.length - 1; i >= 0; i--) {
        starts[i] = Math.min(starts[i], limit);
        limit = starts[i] - 1;
      }
    };
    /** @param {number} scroll Scroll position. */
    const pick = scroll => {
      if (locked !== -1) return;
      let index = 0;
      for (let i = 0; i < starts.length; i++) if (scroll >= starts[i]) index = i;
      active = index;
    };
    ScrollTrigger.create({
      trigger: node,
      start: 'top bottom',
      end: 'bottom top',
      onRefresh: self => { measure(); pick(self.scroll()); },
      onUpdate: self => pick(self.scroll()),
    });
  }

  /** @param {number} index Entry index to jump to. */
  function jump(index) {
    const target = document.getElementById(entries[index].id);
    if (!target) return;
    const article = /** @type {HTMLElement | null} */ (target.querySelector('article'));
    locked = index;
    active = index;
    preview = null;
    // One read on click (not per frame). Wide: the entry top lands on the reading
    // line, where its article sticks. Narrow: just under the sticky band.
    const wide = matchMedia('(min-width: 1024px)').matches;
    const offset = wide ? Math.round(innerHeight / 2) - 2 : 56 + (stage?.offsetHeight ?? 96) + 16;
    const done = () => {
      locked = -1;
      article?.focus({ preventScroll: true });
    };
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { offset: -offset, duration: 1.4, onComplete: done });
    else {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset });
      done();
    }
  }

  /**
   * In-page link: smooth jump through Lenis when the target exists (full page);
   * otherwise let the browser follow the hash.
   * @param {MouseEvent} event Click.
   * @param {string} href Link target.
   */
  function follow(event, href) {
    if (!href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { offset: -56, duration: 1.2 });
    else target.scrollIntoView({ block: 'start' });
    history.replaceState(null, '', href);
  }
</script>

{#snippet rail(/** @type {string} */ where)}
  <nav class="rail rail-{where}" aria-label="Timeline years">
    <ol>
      {#each railYears as tick (tick.year)}
        {@const to = railTarget(tick.indices, active)}
        <li>
          {#if to >= 0}
            <button
              type="button"
              class="year"
              class:on={entries[active].year === tick.year}
              aria-current={entries[active].year === tick.year ? 'step' : undefined}
              aria-label={`${tick.year}: ${entries[to].title}`}
              data-cursor="link"
              onclick={() => jump(to)}
              onpointerenter={() => { preview = to; }}
              onpointerleave={() => { preview = null; }}
              onfocus={() => { preview = to; }}
              onblur={() => { preview = null; }}
            >
              <span class="full">{tick.year}</span><span class="short" aria-hidden="true">’{String(tick.year).slice(2)}</span>
              {#if tick.indices.length > 1}
                <span class="subs" aria-hidden="true">
                  {#each tick.indices as index (index)}<i class:here={index === active}></i>{/each}
                </span>
              {/if}
            </button>
          {:else}
            <span class="year quiet" aria-hidden="true"><span class="full">{tick.year}</span><span class="short">’{String(tick.year).slice(2)}</span></span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/snippet}

<section class="section tl" aria-labelledby="timeline-title" use:sectionMotion={track}>
  <div class="cols" aria-hidden="true">{#each Array(12) as _, i (i)}<i></i>{/each}</div>

  <div class="tl-body grid-12">
    <div class="stage" bind:this={stage}>
      <p class="label kicker" aria-hidden="true">(07) Timeline · 2017 → 2026</p>
      <h2 id="timeline-title" class="year-heading">
        <span class="sr">Timeline, 2017 to 2026</span>
        <Odometer year={current.year} />
      </h2>
      <p class="meta" class:previewing={preview !== null}>
        <span class="month">{current.month}</span>
        <span class="reach" aria-hidden="true"></span>
        <span class="label meta-line">
          <i class="mk" data-kind={current.kind} aria-hidden="true"></i>
          {#if preview !== null}<span class="tag">Preview</span>{/if}
          {KIND_LABEL[current.kind]} · {pad(shown + 1)}/{pad(entries.length)}
        </span>
      </p>
      {@render rail('stage')}

      <figure class="ledger">
        <figcaption class="label">Posts on miti99.com</figcaption>
        <ol>
          {#each blogPosts as bucket (bucket.from)}
            <li
              class:on={current.year >= bucket.from && current.year <= bucket.to}
              style:grid-column="{bucket.from - firstYear + 1} / span {bucket.to - bucket.from + 1}"
              style:--h={bucket.count / maxPosts}
            >
              <span class="count">{bucket.count}{bucket.soFar ? '+' : ''}</span>
              <span class="sr">
                posts {bucket.from === bucket.to ? `in ${bucket.from}` : `from ${bucket.from} to ${bucket.to}`}{bucket.soFar ? ' so far' : ''}
              </span>
              <span class="bar" aria-hidden="true"></span>
            </li>
          {/each}
        </ol>
      </figure>
    </div>

    <div class="flow">
      <p class="lead">
        Student, then game-server engineer, then the senior who debugs production,
        then a builder of side projects in Go, JS, Rust and three.js.
      </p>

      <div class="list-wrap">
      <span class="spine" aria-hidden="true"><span class="fill"></span></span>
      <ol class="list">
        {#each entries as entry, index (entry.id)}
          <li class="entry" class:active={index === active} id={entry.id} data-entry>
            <article tabindex="-1" aria-labelledby="{entry.id}-t">
              <i class="mk" data-kind={entry.kind} aria-hidden="true"></i>
              <p class="label when">
                <time datetime={entry.date}>{entry.month === WHOLE_YEAR ? `${entry.year} · ${WHOLE_YEAR}` : `${entry.month} ${entry.year}`}</time>
                <span aria-hidden="true">·</span> {KIND_LABEL[entry.kind]}
              </p>
              <h3 id="{entry.id}-t" class="title">{entry.title}</h3>
              <p class="body">{entry.body}</p>

              {#if entry.facts.length || entry.liveGitHub}
                <ul class="facts">
                  {#each entry.facts as fact (fact)}<li>{fact}</li>{/each}
                  {#if entry.liveGitHub}
                    <li class:live={gh.user}>
                      {#if gh.user}<span class="pulse" aria-hidden="true"></span>{/if}{githubYears} years on GitHub{gh.user ? ' · live' : ''}
                    </li>
                  {/if}
                </ul>
              {/if}

              {#if entry.links.length}
                <ul class="links">
                  {#each entry.links as link (link.href)}
                    <li>
                      <a
                        href={link.href}
                        data-cursor="link"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener' : undefined}
                        onclick={event => follow(event, link.href)}
                      >{link.label}<span aria-hidden="true">{link.external ? ' ↗' : ' →'}</span></a>
                    </li>
                  {/each}
                </ul>
              {/if}

              {#if entry.thesis}<ThesisCard />{/if}
            </article>
          </li>
        {/each}
      </ol>
      </div>
    </div>
  </div>
</section>

<style>
  .tl { overflow-x: clip; }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ---------- stage: the sticky year ---------- */
  .tl-body { position: relative; align-items: start; }
  .stage {
    grid-column: 1 / -1;
    position: sticky;
    top: var(--bar-h);
    z-index: 2;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas: "kicker kicker" "year meta" "rail rail";
    align-items: end;
    column-gap: var(--s-4);
    margin-inline: calc(var(--gutter) * -1);
    padding: var(--s-3) var(--gutter) var(--s-2);
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  .kicker { grid-area: kicker; margin: 0 0 var(--s-1); color: var(--ink); }
  .year-heading {
    grid-area: year;
    margin: -0.16em 0 -0.12em;
    font-size: min(var(--t-mega), 21vw);
    font-weight: 820;
    line-height: 1;
    color: var(--ink);
  }
  .meta {
    grid-area: meta;
    margin: 0 0 0.6em;
    display: grid;
    gap: var(--s-1);
    justify-items: start;
  }
  .month {
    font-family: var(--font-display-stack);
    font-size: var(--t-xl);
    line-height: 0.9;
    text-transform: uppercase;
    font-variation-settings: "wght" 820, "wdth" 68;
  }
  .meta-line { display: inline-flex; align-items: center; gap: var(--s-2); color: var(--ink); }
  /* A rail preview shows another entry: the readout goes outlined so it is not mistaken for the scroll position. */
  .tag {
    padding: 0 var(--s-1);
    border: 1px solid currentColor;
  }
  .previewing .month {
    color: transparent;
    -webkit-text-stroke: 1.5px var(--ink);
  }
  .reach { display: none; }
  /* Narrow: the rail rides in the sticky band, so jumping stays one tap away. */
  .rail-stage { grid-area: rail; margin-top: var(--s-2); }
  .ledger { display: none; }

  /* ---------- rail ---------- */
  .rail ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    border-top: 1px solid var(--ink);
  }
  .rail li { display: flex; }
  .year {
    position: relative;
    flex: 1;
    display: flex;
    align-items: flex-start;
    min-height: 36px;
    padding: var(--s-2) 0 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-align: left;
  }
  .year::before {
    content: "";
    position: absolute;
    left: 0;
    top: -1px;
    width: 1px;
    height: 10px;
    background: var(--ink);
  }
  button.year::after {
    content: "";
    position: absolute;
    left: 0;
    right: 4px;
    top: -2px;
    height: 3px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--d-med) var(--ease-out);
  }
  button.year:hover::after { transform: scaleX(0.4); }
  button.year.on::after { transform: scaleX(1); animation: tl-tick 640ms var(--ease-out); }
  button.year.on { color: var(--ink); font-weight: 800; }
  .year.quiet { color: var(--ink-2); font-weight: 400; }
  .year.quiet::before { height: 5px; background: var(--ink-2); }
  .year .full { display: none; }
  /* One sub-tick per entry in a year with several; the active one is vermilion. */
  .subs {
    position: absolute;
    left: 0;
    bottom: 6px;
    display: flex;
    gap: 3px;
  }
  .subs i {
    width: 5px;
    height: 5px;
    border: 1px solid var(--ink);
    border-radius: 50%;
  }
  .subs i.here { background: var(--accent); border-color: var(--accent); }
  .year:focus-visible { outline-offset: 2px; }

  /* ---------- flow: entries ---------- */
  .flow { grid-column: 1 / -1; padding-top: var(--s-7); }
  .lead {
    margin: 0 0 var(--s-6);
    max-width: 34ch;
    font-size: var(--t-lg);
    line-height: 1.4;
    color: var(--ink);
  }
  .list-wrap {
    position: relative;
    view-timeline: --tl-list block;
    /* Ignore the page's scroll-padding so the fill tip sits exactly on the 50% reading line. */
    view-timeline-inset: 0px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0 0 0 var(--s-6);
  }
  .spine {
    position: absolute;
    left: 5px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--line);
  }
  .fill {
    position: absolute;
    inset: 0;
    width: 3px;
    left: -1px;
    background: var(--accent);
    transform-origin: top;
    transform: scaleY(0);
  }
  .entry {
    position: relative;
    min-height: 36svh;
    padding-bottom: var(--s-8);
  }
  .entry:last-child { min-height: 0; padding-bottom: 0; }
  article {
    /* Vertical centre of the entry marker, from the article top. */
    --mk-mid: calc(0.15em + 4.5px);
    position: relative;
    outline-offset: 6px;
  }
  article:focus { outline: none; }
  article:focus-visible { outline: 2px solid var(--accent-text); }

  /* Marker shape per kind: study ring, work square, writing bar, build dot, github diamond. */
  .mk {
    display: inline-block;
    flex: none;
    width: 11px;
    height: 11px;
    background: var(--ink);
    transition: background var(--d-med), transform var(--d-med) var(--ease-snap);
  }
  .mk[data-kind="study"] { background: transparent; border: 2px solid var(--ink); border-radius: 50%; }
  .mk[data-kind="build"] { border-radius: 50%; }
  .mk[data-kind="writing"] { height: 4px; width: 13px; }
  .mk[data-kind="github"] { transform: rotate(45deg) scale(0.85); }
  .entry .mk {
    position: absolute;
    left: calc(var(--s-6) * -1);
    top: 0.15em;
    outline: 4px solid var(--paper);
  }
  .entry .mk[data-kind="writing"] { top: calc(0.15em + 3.5px); }
  .entry.active .mk { background: var(--accent); border-color: var(--accent); transform: scale(1.5); }
  .entry.active .mk[data-kind="github"] { transform: rotate(45deg) scale(1.3); }

  .when { margin: 0 0 var(--s-3); color: var(--ink); }
  .title {
    margin: 0 0 var(--s-4);
    max-width: 16ch;
    font-family: var(--font-display-stack);
    font-size: var(--t-xl);
    font-weight: 820;
    line-height: 0.92;
    text-transform: uppercase;
    font-variation-settings: "wght" 820, "wdth" 68;
    letter-spacing: -0.005em;
    text-wrap: balance;
  }
  .body {
    margin: 0;
    max-width: 52ch;
    color: var(--ink-2);
    line-height: 1.55;
  }
  .entry.active .body { color: var(--ink); }
  .facts, .links {
    list-style: none;
    margin: var(--s-4) 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
  }
  .facts li {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    padding: var(--s-1) var(--s-3);
    background: var(--paper-2);
    font: 500 var(--t-xs)/1.6 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: tl-pulse 1.6s var(--ease-io) infinite;
  }
  .links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s-1);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 4px;
    text-decoration-color: var(--line);
    transition: text-decoration-color var(--d-fast), color var(--d-fast);
  }
  .links { column-gap: var(--s-5); row-gap: 0; }
  .links a { padding: 0; }
  .links a:hover { color: var(--accent-text); text-decoration-color: currentColor; }

  @keyframes tl-pulse {
    50% { transform: scale(0.5); opacity: 0.4; }
  }

  /* Scroll-driven polish (motion on only; runtime sets data-motion). */
  @supports (animation-timeline: view()) {
    :global(:root[data-motion="full"]) .fill {
      animation: tl-fill linear both;
      animation-timeline: --tl-list;
      animation-range: entry 50% exit 50%;
    }
    :global(:root[data-motion="full"]) .title {
      animation: tl-arrive linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 35%;
    }
  }
  @keyframes tl-fill { to { transform: scaleY(1); } }
  /* Titles rise out of their own baseline: clip and translate only, so the text never
     re-wraps and no frame needs layout. */
  @keyframes tl-arrive {
    from { clip-path: inset(100% -0.1em -0.2em -0.1em); translate: 0 0.45em; }
    to { clip-path: inset(-0.2em -0.1em -0.2em -0.1em); translate: 0 0; }
  }
  @keyframes tl-tick {
    from { transform: scaleX(1) scaleY(3); }
  }

  /* ---------- wide: stage on the left, entries in a right-hand column ---------- */
  @media (min-width: 768px) {
    .year .full { display: inline; }
    .year .short { display: none; }
    .entry { min-height: 40svh; }
  }
  @media (min-width: 1024px) {
    .stage {
      grid-column: 1 / span 6;
      /* Puts the readout (and its connector) on the 50% reading line, where the spine fill ends. */
      top: max(calc(var(--bar-h) + var(--s-6)), calc(50svh - 1.02 * var(--t-mega) - 76px));
      grid-template-columns: 1fr;
      grid-template-areas: "kicker" "year" "meta" "rail" "ledger";
      align-items: start;
      margin: 0;
      padding: 0;
      background: none;
      border: 0;
    }
    .kicker { margin-bottom: var(--s-5); }
    .year-heading { font-size: var(--t-mega); margin-left: -0.04em; }
    .meta {
      display: flex;
      align-items: center;
      gap: var(--s-5);
      margin: var(--s-4) 0 var(--s-7);
    }
    /* Hairline from the year readout to the spine, ending where the vermilion fill stops. */
    .reach {
      --colw: calc((min(100vw - 2 * var(--gutter), var(--max)) - 11 * var(--s-4)) / 12);
      order: 3;
      display: block;
      position: relative;
      flex: 1;
      height: 1px;
      margin-right: calc(-1 * (var(--colw) + 2 * var(--s-4) + 6px));
      background: var(--ink);
    }
    .reach::after {
      content: "";
      position: absolute;
      right: -4px;
      top: -3px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
    }
    .rail-stage { margin: 0; max-width: 34rem; }
    .year { min-height: 44px; }
    .flow { grid-column: 8 / -1; padding-top: 0; }
    .lead { margin-bottom: var(--s-9); }
    .entry { min-height: 68svh; }
    /* The article rides the reading line (its marker on the hairline's end) while its
       year is active, then scrolls on. */
    .entry article { position: sticky; top: calc(50svh - var(--mk-mid)); }

    /* Lower left: posts per year, on the rail's columns. */
    .ledger {
      grid-area: ledger;
      display: block;
      max-width: 34rem;
      margin: var(--s-5) 0 0;
    }
    .ledger figcaption { margin-bottom: var(--s-2); color: var(--ink); }
    .ledger ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(10, minmax(0, 1fr));
      column-gap: 4px;
      align-items: end;
      height: 112px;
      border-bottom: 1px solid var(--ink);
    }
    .ledger li {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      height: 100%;
    }
    .count { font: 600 var(--t-xs)/1.4 var(--font-mono-stack); color: var(--ink); }
    .bar {
      height: calc(var(--h) * 84px);
      min-height: 2px;
      background: var(--ink);
      transform-origin: bottom;
      transition: background var(--d-med);
    }
    .ledger li.on .bar { background: var(--accent); }
  }

  @media (min-width: 1024px) and (max-height: 759px) {
    .reach, .ledger { display: none; }
  }

  @media (forced-colors: active) {
    .fill, button.year::after { background: Highlight; }
    .entry.active .mk { background: Highlight; }
  }
</style>
