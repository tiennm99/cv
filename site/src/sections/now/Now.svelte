<script>
  /**
   * 02 Now: "right now". No display heading: a mono label and a lead set in
   * --t-xl that reveals line by line. Asymmetric 5/7 split: a Saigon "instrument
   * panel" (live clock, 24-hour ruler, years in games, role facts) and the five
   * most recently pushed curated side projects (featured or bench repos only;
   * selected featured rows when GitHub is unreachable). A full-bleed ticker of
   * the featured set closes the section.
   */
  import { profile, formatYm } from '../../lib/profile.js';
  import { positioning, featured, links, anchors } from '../../lib/content.js';
  import { gh } from '../../lib/live/github.svelte.js';
  import { clock } from '../../lib/clock.svelte.js';
  import { localDate, relativeTime, yearsSince } from '../../lib/time.js';
  import { sectionMotion } from '../../lib/motion/runtime.js';
  import { inView, splitLines } from '../../lib/motion/actions.js';
  import { tickerItems, curatedRecent, featuredRows, saigonParts, monthsSince } from './now-data.js';
  import Ticker from './Ticker.svelte';

  const job = profile.experience[0];
  const since = positioning.gamesSince;
  const pad = n => String(n).padStart(2, '0');

  // Lead: the brief's positioning line, with its subject phrase set apart.
  const LEAD = positioning.lines[1];
  const MARK = 'live multiplayer games';
  const markAt = LEAD.indexOf(MARK);
  const rest = markAt < 0 ? '' : LEAD.slice(markAt + MARK.length);
  // Punctuation right after the marked phrase stays glued to it when lines wrap.
  const glue = rest.match(/^[,.;:!?]*/)?.[0] ?? '';
  const lead = markAt < 0
    ? { before: LEAD, mark: '', glue: '', after: '' }
    : { before: LEAD.slice(0, markAt), mark: MARK, glue, after: rest.slice(glue.length) };

  const time = $derived(saigonParts(clock.now));
  const years = $derived(yearsSince(since, clock.now));
  const months = $derived(monthsSince(since, clock.now));
  const daytime = $derived(time.h >= 6 && time.h < 18);
  const dayPos = $derived((time.h + time.m / 60 + time.s / 3600) / 24);

  const recentRows = $derived(curatedRecent(gh.repos, featured));
  const live = $derived(recentRows.length > 0);
  const rows = $derived(live ? recentRows : featuredRows(featured));
  const items = $derived(tickerItems(featured, gh.byName));
  const waiting = $derived(gh.status === 'connecting' && !live);

  /** Key of the repo hovered in the list or the ticker; both light up together. */
  let hot = $state(/** @type {string | null} */ (null));
  let shown = $state(false);
  /** Animated stand-in for the years numeral during the count-up. */
  let countUp = $state(/** @type {number | null} */ (null));

  /** @type {HTMLElement} */ let yearsEl;

  /**
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   * @returns {void | (() => void)} Cleanup.
   */
  function motion({ reduced, gsap, ScrollTrigger }) {
    if (reduced) {
      countUp = null;
      return;
    }
    countUp = 0;
    const proxy = { v: 0 };
    ScrollTrigger.create({
      trigger: yearsEl,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(proxy, {
        v: years,
        duration: 1.6,
        ease: 'expo.out',
        onUpdate: () => { countUp = Math.round(proxy.v); },
        onComplete: () => { countUp = null; },
      }),
    });
    return () => { countUp = null; };
  }
</script>

<section class="now" aria-labelledby="now-title" use:sectionMotion={motion}>
  <div class="cols" aria-hidden="true">{#each Array(12) as _, i (i)}<i></i>{/each}</div>

  <div class="frame">
    <header class="head">
      <p class="label"><span class="num">(02)</span> Now</p>
      <span class="travel" aria-hidden="true"></span>
      <p class="label stamp"><span class="pulse" aria-hidden="true"></span>{localDate(clock.now)} · Saigon</p>
    </header>

    <h2 id="now-title" class="sr-only">Now: right now</h2>
    <div class="lead">
      <p class="sr-only">{LEAD}</p>
      <div aria-hidden="true" use:splitLines={{ stagger: 0.09 }}>
        {lead.before}<span class="nobr"><em>{lead.mark}</em>{lead.glue}</span>{lead.after}
      </div>
    </div>

    <div class="split" class:in={shown} use:inView={{ once: true, rootMargin: '0px 0px -12% 0px', onChange: visible => { if (visible) shown = true; } }}>
      <!-- 5 columns: the instrument panel -->
      <div class="panel">
        <div class="dials">
          <div class="dial clock">
            <p class="label">Local time · GMT+7</p>
            <p class="big">
              <time datetime={`${pad(time.h)}:${pad(time.m)}`}>{pad(time.h)}<span class="colon">:</span>{pad(time.m)}</time>
              <span class="secs" aria-hidden="true">{pad(time.s)}</span>
            </p>
            <p class="small">{daytime ? 'Daytime' : 'Night'} in Ho Chi Minh City</p>
          </div>
          <div class="dial years" bind:this={yearsEl}>
            <p class="label">Years in games</p>
            <p class="big"><span class="sr-only">{years}+</span><span class="yr" aria-hidden="true">{countUp ?? years}</span><span class="plus" aria-hidden="true">+</span></p>
            <p class="small">since {formatYm(since)} · {months} months</p>
          </div>
        </div>

        <div class="ruler" style:--pos={dayPos} aria-hidden="true">
          <div class="ticks">{#each Array(25) as _, h (h)}<i class:major={h % 6 === 0} class:past={h <= time.h} style:--h={h}></i>{/each}</div>
          <div class="hand"><span>{pad(time.h)}:{pad(time.m)}</span></div>
          <div class="hours"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
        </div>

        <dl class="facts">
          <div style:--i={0}><dt class="label">Role</dt><dd>{job.position}</dd></div>
          <div style:--i={1}><dt class="label">Employer</dt><dd>{job.company}</dd></div>
          <div style:--i={2}><dt class="label">Based in</dt><dd>{profile.location}</dd></div>
          <div style:--i={3}><dt class="label">Day job</dt><dd><a class="xp" href={`#${anchors.zingplay}`}>Java backends for live multiplayer games</a></dd></div>
        </dl>
      </div>

      <!-- 7 columns: recently pushed -->
      <div class="recent">
        <div class="recent-head">
          <h3 class="label">{live || waiting ? 'Recently pushed' : 'Selected projects'}</h3>
          <p class="label">{live || waiting ? 'Public side projects · live from GitHub' : 'Public side projects · curated'}</p>
        </div>

        {#if waiting}
          <ol class="rows skeleton" aria-label="Loading recent activity">
            {#each Array(5) as _, i (i)}<li style:--i={i}><span></span></li>{/each}
          </ol>
        {:else}
          <ol class="rows">
            {#each rows as row, i (row.key)}
              <li class:hot={hot === row.key} style:--i={i} onpointerenter={() => { hot = row.key; }} onpointerleave={() => { hot = null; }}>
                <a href={row.href} data-cursor="link" onfocus={() => { hot = row.key; }} onblur={() => { hot = null; }}>
                  <span class="idx" aria-hidden="true">{pad(i + 1)}</span>
                  <span class="who">
                    <span class="owner">{row.owner}/</span>
                    <span class="name">{row.name}</span>
                    {#if row.desc}<span class="desc">{row.desc}</span>{/if}
                  </span>
                  <span class="meta">
                    {#if row.tag}<span class="lang">{row.tag}</span>{/if}
                    {#if row.pushedAt}<time datetime={row.pushedAt}>{relativeTime(row.pushedAt, clock.now)}</time>{/if}
                  </span>
                  <span class="arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            {/each}
          </ol>
          {#if !live}
            <p class="offline">Live GitHub activity is unavailable right now. Everything is on <a href={links.github}>github.com/tiennm99</a> and <a href={links.githubOrg}>tiennm99dev</a>.</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <Ticker {items} now={clock.now} bind:hot />
</section>

<style>
  .now {
    position: relative;
    padding-top: var(--s-9);
  }
  @media (min-width: 1024px) {
    .now { padding-top: var(--s-10); }
  }
  .frame {
    position: relative;
    max-width: var(--max);
    margin-inline: auto;
    padding-inline: var(--gutter);
    padding-bottom: var(--s-9);
  }
  .cols { z-index: 0; }
  .frame > * { position: relative; }

  /* ---------- head + lead ---------- */
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--s-4);
    padding-bottom: var(--s-3);
    border-bottom: 1px solid var(--ink);
  }
  .head .label { margin: 0; color: var(--ink); }
  .num { color: var(--ink-2); }
  .stamp { display: inline-flex; align-items: center; gap: var(--s-2); }
  .head { position: relative; container-type: inline-size; }
  /* A dot runs along the rule as the section scrolls in (scroll-driven where supported). */
  .travel { display: none; }
  @supports (animation-timeline: view()) {
    .travel {
      display: block;
      position: absolute;
      left: 0;
      bottom: -4px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      animation: now-travel linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 45%;
    }
    @keyframes now-travel {
      from { transform: translateX(0); }
      to { transform: translateX(calc(100cqw - 7px)); }
    }
    :global(:root[data-motion="reduced"]) .travel { display: none; }
  }
  .pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: now-pulse 2s var(--ease-io) infinite;
  }
  @keyframes now-pulse {
    50% { scale: 0.55; opacity: 0.55; }
  }

  .lead {
    position: relative;
    margin: var(--s-7) 0 var(--s-8);
    max-width: 30ch;
    font-size: var(--t-xl);
    line-height: 1.12;
    font-weight: 520;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }
  @media (min-width: 1024px) {
    .lead { max-width: 30ch; margin-left: calc((100% + var(--s-4)) / 12); }
  }
  .nobr { white-space: nowrap; }
  .lead em {
    font-style: normal;
    font-family: var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 74;
    text-transform: uppercase;
    letter-spacing: 0;
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 0.09em;
    text-underline-offset: 0.12em;
  }

  /* ---------- 5/7 split ---------- */
  .split {
    display: grid;
    gap: var(--s-8) var(--s-4);
  }
  @media (min-width: 1024px) {
    .split { grid-template-columns: repeat(12, minmax(0, 1fr)); }
    .panel { grid-column: 1 / span 5; }
    .recent { grid-column: 7 / span 6; }
  }
  @media (min-width: 1280px) {
    .recent { grid-column: 6 / span 7; padding-left: var(--s-7); }
  }

  /* instrument panel */
  .dials {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    border: 1px solid var(--ink);
    background: var(--paper);
  }
  .dial {
    padding: var(--s-4) var(--s-4) var(--s-3);
    min-width: 0;
  }
  .dial + .dial { border-left: 1px solid var(--ink); }
  .dial p { margin: 0; }
  .big {
    display: flex;
    align-items: flex-start;
    margin-block: var(--s-3) var(--s-2) !important;
    font-family: var(--font-display-stack);
    font-size: clamp(3.6rem, 2rem + 6vw, 7.4rem);
    font-variation-settings: "wght" 820, "wdth" 62;
    font-variant-numeric: tabular-nums;
    line-height: 0.8;
    letter-spacing: -0.02em;
  }
  .colon {
    display: inline-block;
    color: var(--accent);
    animation: now-blink 1s steps(1) infinite;
  }
  @keyframes now-blink {
    50% { opacity: 0.3; }
  }
  .secs {
    margin-left: var(--s-2);
    font-family: var(--font-mono-stack);
    font-size: var(--t-sm);
    font-weight: 600;
    color: var(--ink-2);
    line-height: 1;
  }
  .years .big { color: var(--ink); }
  .plus {
    font-size: 0.42em;
    color: var(--accent);
    font-variation-settings: "wght" 400, "wdth" 100;
    line-height: 1;
    margin-left: 0.04em;
  }
  .small { font-size: var(--t-sm); color: var(--ink-2); }

  /* 24-hour ruler */
  .ruler {
    position: relative;
    margin-top: var(--s-5);
    padding-top: 30px;
  }
  .ticks {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 22px;
    border-bottom: 1px solid var(--ink);
  }
  .ticks i {
    width: 1px;
    height: 8px;
    background: var(--ink-2);
    transform-origin: bottom;
  }
  .ticks i.major { height: 18px; background: var(--ink); }
  .split.in .ticks i { animation: now-tick 0.7s var(--ease-snap) both; animation-delay: calc(var(--h) * 22ms); }
  @keyframes now-tick {
    from { scale: 1 0; }
  }
  /* The hand moves by transform (ruler-width container units), never by layout. */
  .ruler { container-type: inline-size; }
  .hand {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 2px;
    margin-left: -1px;
    background: var(--accent);
    transform: translateX(calc(var(--pos) * 100cqw));
    transition: transform 1s linear;
  }
  .hand span {
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% 0;
    padding: 2px 6px;
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--t-xs)/1.3 var(--font-mono-stack);
    white-space: nowrap;
  }
  .hours {
    display: flex;
    justify-content: space-between;
    margin-top: var(--s-2);
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
    color: var(--ink-2);
  }
  .hours span:first-child { translate: 0; }

  .facts { margin: var(--s-6) 0 0; }
  .facts div {
    display: grid;
    grid-template-columns: 7.5rem 1fr;
    gap: var(--s-3);
    padding-block: var(--s-3);
    border-bottom: 1px solid var(--line);
  }
  .facts div:first-child { border-top: 1px solid var(--line); }
  .split.in .facts div { animation: now-rise 0.9s var(--ease-out) both; animation-delay: calc(200ms + var(--i) * 80ms); }
  .facts dt { padding-top: 0.2em; }
  .facts dd { margin: 0; font-size: var(--t-lg); line-height: 1.3; }
  .xp {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
    transition: text-decoration-thickness var(--d-fast);
  }
  .xp:hover { text-decoration-thickness: 3px; }

  /* recently pushed */
  .recent-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-1) var(--s-4);
    padding-bottom: var(--s-3);
  }
  .recent-head > * { margin: 0; }
  .recent-head h3 { color: var(--ink); }
  .rows { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--ink); }
  .rows li { position: relative; }
  .rows li::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 1px;
    background: var(--line);
    transform-origin: left;
  }
  .split.in .rows li { animation: now-rise 0.9s var(--ease-out) both; animation-delay: calc(120ms + var(--i) * 90ms); }
  .split.in .rows li::after { animation: now-draw 1.1s var(--ease-out) both; animation-delay: calc(220ms + var(--i) * 90ms); }
  @keyframes now-rise {
    from { opacity: 0; translate: 0 18px; }
  }
  @keyframes now-draw {
    from { scale: 0 1; }
  }
  .rows a {
    display: grid;
    grid-template-columns: 2.4rem minmax(0, 1fr) auto 1.5rem;
    align-items: baseline;
    gap: var(--s-3);
    padding: var(--s-4) var(--s-2) var(--s-4) 0;
    text-decoration: none;
    transition: background var(--d-fast), padding var(--d-med) var(--ease-out);
  }
  .rows li.hot a { background: var(--paper-2); padding-left: var(--s-3); }
  .idx { font: 500 var(--t-xs)/1 var(--font-mono-stack); color: var(--ink-2); }
  .who { display: grid; min-width: 0; }
  .owner { font: 500 var(--t-xs)/1.4 var(--font-mono-stack); color: var(--ink-2); }
  .name {
    font-family: var(--font-display-stack);
    font-size: clamp(1.7rem, 1.2rem + 1.8vw, 3rem);
    font-variation-settings: "wght" 800, "wdth" 66;
    text-transform: uppercase;
    line-height: 0.92;
    overflow-wrap: anywhere;
    transition: font-variation-settings var(--d-slow) var(--ease-out), color var(--d-fast);
  }
  .rows li.hot .name { font-variation-settings: "wght" 360, "wdth" 96; color: var(--accent-text); }
  .desc {
    margin-top: var(--s-1);
    font-size: var(--t-sm);
    color: var(--ink-2);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta {
    display: grid;
    justify-items: end;
    gap: 2px;
    font: 500 var(--t-xs)/1.3 var(--font-mono-stack);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-2);
    white-space: nowrap;
  }
  .lang { color: var(--ink); }
  .arrow {
    font-size: var(--t-lg);
    color: var(--ink-2);
    transition: translate var(--d-med) var(--ease-snap), color var(--d-fast);
  }
  .rows li.hot .arrow { translate: 3px -3px; color: var(--accent-text); }

  .skeleton li { height: 86px; }
  .skeleton span {
    position: absolute;
    inset: 22px 30% 22px 3.2rem;
    background: var(--paper-2);
    animation: now-wait 1.4s var(--ease-io) infinite alternate;
    animation-delay: calc(var(--i) * 120ms);
  }
  @keyframes now-wait {
    to { opacity: 0.4; }
  }
  .offline {
    margin: var(--s-4) 0 0;
    font-size: var(--t-sm);
    color: var(--ink-2);
    max-width: 52ch;
  }
  .offline a {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  /* Below the desktop split the hairline grid would run through text: back the blocks with paper. */
  @media (max-width: 1023px) {
    .lead, .panel, .recent { background: var(--paper); }
  }

  @media (max-width: 479px) {
    .rows a { grid-template-columns: 1.8rem minmax(0, 1fr) auto; }
    .arrow { display: none; }
    .desc { -webkit-line-clamp: 2; }
    .facts div { grid-template-columns: 6rem 1fr; }
    .dial { padding-inline: var(--s-3); }
  }
</style>
