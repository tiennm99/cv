<script>
  /**
   * 05 Projects: "built after hours". A full-width index on an ink band. The
   * table's own header row is the heading, set in display type that compresses
   * from wdth 138 to 68 as it scrolls in. Filter chips and a sort control reorder
   * rows with GSAP Flip; a preview card follows the cursor on fine pointers and
   * anchors to the row on keyboard focus; every row also expands inline (the touch
   * path). Live stars, push dates and descriptions come from the shared GitHub state.
   */
  import { tick } from 'svelte';
  import { featured, projectFilters, projectAnchor, links } from '../../lib/content.js';
  import { gh, repo } from '../../lib/live/github.svelte.js';
  import { clock } from '../../lib/clock.svelte.js';
  import { localTime, localDate, relativeTime } from '../../lib/time.js';
  import { gsap, Flip, sectionMotion, motionReduced, getLenis } from '../../lib/motion/runtime.js';
  import { buildRows, sortRows, matches, filterCounts, SORTS } from './project-model.js';
  import PreviewCard from './PreviewCard.svelte';

  const counts = filterCounts(featured, projectFilters);

  let filter = $state('All');
  let sort = $state(/** @type {typeof SORTS[number]} */ ('Curated'));
  /** @type {Record<string, boolean>} */
  let open = $state({});
  let activeKey = $state(/** @type {string | null} */ (null));
  /** Language highlighted from another section (see the window event below). */
  let highlight = $state(/** @type {string | null} */ (null));
  let list = $state(/** @type {HTMLOListElement | null} */ (null));
  let card = $state(/** @type {HTMLElement | null} */ (null));

  const live = $derived(gh.totals !== null);
  const rows = $derived(buildRows(featured, name => repo(name)));
  const ordered = $derived(sortRows(rows, sort));
  const shown = $derived(rows.filter(row => matches(row, filter)).length);
  const activeRow = $derived(rows.find(row => row.key === activeKey) ?? null);
  const more = $derived(gh.totals ? Math.max(0, gh.totals.repos - featured.length) : null);
  /** Live columns (stars, last push) and live sorts only exist while numbers are known. */
  const connecting = $derived(gh.status === 'connecting');
  const showNumbers = $derived(live || connecting);
  const sorts = $derived(live ? SORTS : SORTS.filter(mode => mode === 'Curated'));

  // Losing live data mid-session drops a live sort back to curated order.
  $effect(() => {
    if (!live && !connecting && sort !== 'Curated') sort = 'Curated';
  });
  const statusText = $derived(
    gh.status === 'connecting' ? 'connecting…'
      : gh.status === 'offline' || !live ? 'offline, numbers hidden'
        : `${gh.status === 'fresh' ? 'live' : 'cached'} · as of ${gh.asOf ? localTime(gh.asOf) : '—'}`,
  );

  /**
   * Applies a filter or sort change, animating rows from their old boxes with Flip.
   * @param {() => void} change State mutation.
   */
  async function reorder(change) {
    if (!list || motionReduced()) {
      change();
      return;
    }
    const targets = list.querySelectorAll('[data-flip]');
    const state = Flip.getState(targets);
    hideCard();
    change();
    await tick();
    Flip.from(state, {
      targets: list.querySelectorAll('[data-flip]'),
      duration: 0.75,
      ease: 'expo.out',
      stagger: 0.025,
      absolute: true,
      nested: false,
      onEnter: els => gsap.fromTo(els, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'expo.out', delay: 0.15 }),
      onLeave: els => gsap.to(els, { opacity: 0, yPercent: -30, duration: 0.3, ease: 'power2.in' }),
    });
  }

  /** @param {string} value Chip label. */
  const setFilter = value => { if (value !== filter) reorder(() => { filter = value; }); };
  /** @param {typeof SORTS[number]} value Sort mode. */
  const setSort = value => { if (value !== sort) reorder(() => { sort = value; }); };

  // ---------- preview card ----------
  let cardW = 360;
  let cardH = 320;
  let shownCard = false;
  /** @type {null | ((value: number) => void)} */
  let toX = null;
  /** @type {null | ((value: number) => void)} */
  let toY = null;
  /** @type {null | ((value: number) => void)} */
  let toR = null;
  let lastX = 0;
  /** @type {gsap.core.Tween | null} */
  let settle = null;

  $effect(() => {
    if (!card) return;
    toX = gsap.quickTo(card, 'x', { duration: 0.55, ease: 'expo.out' });
    toY = gsap.quickTo(card, 'y', { duration: 0.55, ease: 'expo.out' });
    toR = gsap.quickTo(card, 'rotation', { duration: 0.8, ease: 'expo.out' });
    return () => gsap.killTweensOf(card);
  });

  /**
   * @param {number} x Viewport x.
   * @param {number} y Viewport y.
   * @param {boolean} instant Jump instead of easing.
   */
  function placeCard(x, y, instant) {
    if (!card) return;
    const left = Math.max(16, Math.min(x, innerWidth - cardW - 16));
    const top = Math.max(64, Math.min(y, innerHeight - cardH - 16));
    if (instant || motionReduced() || !toX || !toY) {
      gsap.set(card, { x: left, y: top });
      toX?.(left);
      toY?.(top);
      gsap.set(card, { x: left, y: top });
    } else {
      toX(left);
      toY(top);
    }
  }

  /** @param {{ x: number, y: number }} at First position (no easing in from 0,0). */
  async function showCard(at) {
    if (!card) return;
    const wasShown = shownCard;
    shownCard = true;
    if (!wasShown) {
      await tick();
      cardW = card.offsetWidth;
      cardH = card.offsetHeight;
      placeCard(at.x, at.y, true);
      // Rotation belongs to the quickTo tween alone; killing or tweening it elsewhere breaks its resetTo.
      gsap.killTweensOf(card, 'autoAlpha,scale');
      if (motionReduced()) {
        gsap.set(card, { autoAlpha: 1, scale: 1 });
        toR?.(0, 0);
      } else {
        gsap.fromTo(card, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
        toR?.(0, -3);
      }
    } else {
      await tick();
      cardH = card.offsetHeight;
    }
  }

  function hideCard() {
    if (!card || !shownCard) return;
    shownCard = false;
    gsap.killTweensOf(card, 'autoAlpha,scale');
    if (motionReduced()) gsap.set(card, { autoAlpha: 0 });
    else gsap.to(card, { autoAlpha: 0, scale: 0.92, duration: 0.2, ease: 'power2.in' });
  }

  /** @param {PointerEvent} event Pointer move over the list. */
  function onMove(event) {
    // Mouse only: touch and pen use the inline details instead.
    if (event.pointerType !== 'mouse') return;
    const row = /** @type {HTMLElement | null} */ (/** @type {Element} */ (event.target).closest?.('[data-key]'));
    // Narrow layouts and open rows already show everything inline.
    if (!row || innerWidth < 768 || open[row.dataset.key ?? '']) {
      activeKey = null;
      hideCard();
      return;
    }
    activeKey = row.dataset.key ?? null;
    const at = { x: event.clientX + 56, y: event.clientY + 32 };
    if (!shownCard) showCard(at);
    else {
      placeCard(at.x, at.y, false);
      // The card leans into horizontal motion, then settles: a swing, not a jitter.
      if (!motionReduced() && toR) {
        toR(Math.max(-7, Math.min(7, (event.clientX - lastX) * 0.6)));
        settle?.kill();
        settle = gsap.delayedCall(0.12, () => toR?.(0));
      }
    }
    lastX = event.clientX;
  }

  /** @param {FocusEvent} event Focus entering a row link. */
  function onFocusIn(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    if (!target.matches?.('.row-link:focus-visible')) return;
    const row = /** @type {HTMLElement | null} */ (target.closest('[data-key]'));
    if (!row || innerWidth < 768 || open[row.dataset.key ?? '']) return;
    activeKey = row.dataset.key ?? null;
    // One measurement per focus change, never per frame.
    const rect = row.getBoundingClientRect();
    const x = innerWidth >= 1024 ? rect.left + rect.width * 0.5 : rect.left + 16;
    const below = rect.bottom + 8;
    const y = below + cardH > innerHeight - 16 ? rect.top - cardH - 8 : below;
    if (!shownCard) showCard({ x, y });
    else placeCard(x, y, false);
  }

  /** @param {FocusEvent} event Focus leaving a row. */
  function onFocusOut(event) {
    const next = /** @type {Node | null} */ (event.relatedTarget);
    if (!next || !list?.contains(next) || !(/** @type {Element} */ (next)).matches?.('.row-link')) {
      activeKey = null;
      hideCard();
    }
  }

  // Scrolling moves rows under a still cursor; hide rather than show a stale card.
  $effect(() => {
    const onScroll = () => { if (shownCard && !list?.contains(document.activeElement)) { activeKey = null; hideCard(); } };
    addEventListener('scroll', onScroll, { passive: true });
    /** @param {Event} event `projects:highlight` with `{ detail: { language: string | null } }`. */
    const onHighlight = event => { highlight = /** @type {CustomEvent} */ (event).detail?.language ?? null; };
    addEventListener('projects:highlight', onHighlight);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('projects:highlight', onHighlight);
    };
  });

  /**
   * Opens or closes a row's details. An opened panel is brought into view once its
   * height transition ends (through Lenis when it runs), keeping the row's top clear
   * of the fixed top bar.
   * @param {string} key Row key.
   * @param {string} panelId Details panel id.
   */
  const toggle = (key, panelId) => {
    open[key] = !open[key];
    activeKey = null;
    hideCard();
    if (open[key]) revealPanel(panelId);
  };

  /** @param {string} panelId Details panel id. */
  function revealPanel(panelId) {
    const panel = document.getElementById(panelId);
    const row = panel?.closest('.row');
    if (!panel || !row) return;
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      panel.removeEventListener('transitionend', onEnd);
      const panelRect = panel.getBoundingClientRect();
      const rowTop = row.getBoundingClientRect().top;
      const top = 72;
      const bottom = innerHeight - 24;
      if (panelRect.bottom <= bottom && rowTop >= top) return;
      // "nearest": scroll just enough to show the panel's end, never past the row's top.
      const delta = rowTop < top ? rowTop - top : Math.min(panelRect.bottom - bottom, rowTop - top);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(scrollY + delta, { duration: 0.8 });
      else scrollBy({ top: delta });
    };
    /** @param {TransitionEvent} event Transition end. */
    const onEnd = event => { if (event.target === panel) run(); };
    panel.addEventListener('transitionend', onEnd);
    // Reduced motion (or no transition) never fires transitionend.
    setTimeout(run, motionReduced() ? 0 : 900);
  }

  // ---------- scroll motion ----------
  /**
   * Header compression (scrubbed), rules drawing in and rows lifting in, all inside the section's gsap.context.
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   * @returns {void | (() => void)} Cleanup that reverts the matchMedia set.
   */
  const motion = ({ node, reduced, gsap: g }) => {
    const head = node.querySelector('.head');
    const inner = node.querySelectorAll('.row-inner');
    const rules = node.querySelectorAll('.rule');
    if (reduced) {
      g.set(head, { '--wdth': 68, '--wght': 820 });
      return;
    }
    // Narrow screens start less wide so the three header words never collide.
    const mm = g.matchMedia();
    mm.add({ narrow: '(max-width: 767px)', wide: '(min-width: 768px)' }, context => {
      const from = context.conditions?.narrow ? 100 : 138;
      g.fromTo(head, { '--wdth': from, '--wght': 200 }, {
        '--wdth': 68,
        '--wght': 820,
        ease: 'none',
        scrollTrigger: { trigger: head, start: 'top 95%', end: 'top 35%', scrub: 0.6 },
      });
    });
    g.from(rules, {
      scaleX: 0,
      transformOrigin: '0 50%',
      duration: 1.4,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: list, start: 'top 95%', once: true },
    });
    g.from(inner, {
      yPercent: 70,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: list, start: 'top 95%', once: true },
    });
    return () => mm.revert();
  };

  /**
   * @param {string} iso ISO date.
   * @returns {string} "14 Nov 2026".
   */
  const fullDate = iso => localDate(Date.parse(iso));
</script>

<section class="projects" aria-labelledby="projects-title" use:sectionMotion={motion}>
  <div class="cols" aria-hidden="true">{#each { length: 12 } as _, i (i)}<i></i>{/each}</div>

  <div class="frame">
    <header class="top">
      <p class="label kicker"><span class="tick" aria-hidden="true"></span>(05) Projects</p>
      <p class="lede">
        Built after hours. Ten public side projects, picked from a GitHub full of them:
        real-time games, edge apps, bots and 3D toys. Day-job code stays private;
        these are the ones you can open.
      </p>

      <div class="controls">
        <div class="chips" role="group" aria-label="Filter projects">
          {#each projectFilters as label (label)}
            <button
              type="button"
              class="chip"
              aria-pressed={filter === label}
              onclick={() => setFilter(label)}
            >{label}<span class="count" aria-label={`${counts[label]} projects`}>{counts[label]}</span></button>
          {/each}
        </div>
        {#if live}
          <div class="sort" role="group" aria-label="Sort projects">
            <span class="label sort-label" aria-hidden="true">Sort</span>
            {#each sorts as mode (mode)}
              <button
                type="button"
                class="seg"
                aria-pressed={sort === mode}
                onclick={() => setSort(mode)}
              >{mode}</button>
            {/each}
          </div>
        {:else}
          <p class="label sort-note">
            {connecting ? 'Loading GitHub numbers…' : 'Curated order · sorting by stars or recency needs live GitHub data'}
          </p>
        {/if}
      </div>
      <p class="sr-only" aria-live="polite">Showing {shown} of {featured.length} projects, sorted by {sort.toLowerCase()}.</p>
    </header>

    <div class="index" class:offline={!showNumbers} data-hl={highlight || undefined} data-sort={sort}>
      <h2 id="projects-title" class="head">
        <span class="sr-only">Projects: built after hours</span>
        <span class="hc c-no" aria-hidden="true">Nº</span>
        <span class="hc c-title" aria-hidden="true">Project</span>
        <span class="hc c-stack" aria-hidden="true">Stack</span>
        {#if showNumbers}
          <span class="hc c-stars" class:sorted={sort === 'Stars'} aria-hidden="true">★{#if sort === 'Stars'}<span class="dir">↓</span>{/if}</span>
          <span class="hc c-date" class:sorted={sort === 'Recent'} aria-hidden="true">{#if sort === 'Recent'}<span class="dir">↓</span>{/if}Updated</span>
        {/if}
      </h2>

      <ol
        class="rows"
        bind:this={list}
        onpointermove={onMove}
        onpointerleave={() => { activeKey = null; hideCard(); }}
        onfocusin={onFocusIn}
        onfocusout={onFocusOut}
      >
        {#each ordered as row (row.key)}
          {@const isOpen = Boolean(open[row.key])}
          {@const panel = `${projectAnchor(row.key)}-more`}
          <li
            id={projectAnchor(row.key)}
            class="row"
            class:out={!matches(row, filter)}
            class:active={activeKey === row.key}
            class:open={isOpen}
            class:hl={highlight && row.live?.language === highlight}
            data-flip
            data-flip-id={row.key}
            data-key={row.key}
            data-lang={row.live?.language || undefined}
          >
            <span class="rule" aria-hidden="true"></span>
            <div class="row-inner">
              <span class="c-no no" aria-hidden="true">{row.no}</span>
              <div class="c-title">
                <a class="row-link" href={row.url} data-cursor="view" data-cursor-label="Open">
                  <span class="title"><span class="t-live">{row.item.title}</span><span class="t-ghost" aria-hidden="true">{row.item.title}</span></span><span class="sr-only">, number {row.no}, on GitHub</span>
                </a>
                <p class="blurb">{row.item.blurb}</p>
              </div>
              <ul class="c-stack stack" aria-label="Stack">
                {#each row.item.stack as tech (tech)}<li>{tech}</li>{/each}
              </ul>
              {#if showNumbers}
                <span class="c-stars stars">
                  {#if live && row.live}
                    <!-- Most repos have no stars; an empty cell reads cleaner than a wall of zeros. -->
                    {#if row.live.stars > 0}<span class="num">{row.live.stars}</span><span class="sr-only"> stars</span>{/if}
                  {:else if connecting}
                    <span class="skel" aria-hidden="true"></span>
                  {/if}
                </span>
                <span class="c-date date">
                  {#if live && row.live?.pushedAt}
                    <span class="sr-only">Updated </span><time datetime={row.live.pushedAt} title={fullDate(row.live.pushedAt)}>{relativeTime(row.live.pushedAt, clock.now)}</time>
                  {:else if connecting}
                    <span class="skel wide" aria-hidden="true"></span>
                  {/if}
                </span>
              {/if}
              <button
                type="button"
                class="c-more toggle"
                aria-expanded={isOpen}
                aria-controls={panel}
                onclick={() => toggle(row.key, panel)}
              ><span class="sr-only">Details for {row.item.title}</span><span class="plus" aria-hidden="true"></span></button>
            </div>
            <div class="more" id={panel} inert={!isOpen}>
              <div class="more-inner">
                {#if row.live?.description && row.description !== row.item.blurb}
                  <p class="more-desc">
                    <span class="label">From GitHub</span>
                    {row.description}
                  </p>
                {/if}
                <dl class="more-facts">
                  <div><dt class="label">Repo</dt><dd>{row.key}</dd></div>
                  {#if live && row.live?.language}<div><dt class="label">Language</dt><dd>{row.live.language}</dd></div>{/if}
                  {#if live && row.live}<div><dt class="label">Stars</dt><dd>{row.live.stars}</dd></div>{/if}
                  {#if live && row.live?.pushedAt}<div><dt class="label">Last push</dt><dd>{fullDate(row.live.pushedAt)}</dd></div>{/if}
                </dl>
                <div class="more-links">
                  {#if row.demo}<a class="btn" href={row.demo}>Open {row.host} <span aria-hidden="true">↗</span></a>{/if}
                  <a class="btn btn-ghost" href={row.url}>Source on GitHub <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </div>
          </li>
        {/each}

        <li class="row rest" data-flip data-flip-id="rest">
          <span class="rule" aria-hidden="true"></span>
          <div class="row-inner">
            <span class="c-no no" aria-hidden="true">+</span>
            <div class="c-title rest-title">
              <a class="rest-link" href={`${links.github}?tab=repositories`} data-cursor="view" data-cursor-label="All">
                <span class="title">{more ? `${more} more on GitHub` : 'Every other repo'}</span>
              </a>
              <p class="blurb">
                {#if more}Counted across tiennm99 and the <a href={links.githubOrg}>tiennm99dev</a> organisation:
                  experiments, tools and work in progress.
                {:else}Experiments, tools and work in progress also live in the
                  <a href={links.githubOrg}>tiennm99dev</a> organisation.{/if}
              </p>
            </div>
            <span class="rest-arrow" aria-hidden="true">→</span>
          </div>
        </li>
      </ol>
    </div>

    <footer class="foot">
      <p class="label">
        <span class="dot" class:on={gh.status === 'fresh'} aria-hidden="true"></span>
        Stars and dates load live from api.github.com · <span aria-live="polite">{statusText}</span>
      </p>
      <p class="label"><a href={`${links.github}?tab=repositories`}>All repositories ↗</a></p>
    </footer>
  </div>

  <PreviewCard row={activeRow} now={clock.now} {live} bind:root={card} />
</section>

<style>
  /* The band inverts the page: ink ground, paper type. In the invert theme it flips back to light. */
  .projects {
    --b-bg: var(--ink);
    --b-fg: var(--paper);
    --b-fg-2: color-mix(in oklch, var(--paper) 74%, var(--ink));
    --b-line: color-mix(in oklch, var(--paper) 16%, transparent);
    --b-line-strong: color-mix(in oklch, var(--paper) 34%, transparent);
    /* The index sits on the page's 12-column grid, so the hairline columns line up with the table. */
    --tpl: repeat(12, minmax(0, 1fr));
    position: relative;
    padding: var(--s-9) var(--gutter) var(--s-8);
    background: var(--b-bg);
    color: var(--b-fg);
    overflow-x: clip;
  }
  @media (min-width: 1024px) {
    .projects { padding-block: var(--s-9); }
  }
  .projects :global(:focus-visible) { outline-color: var(--b-fg); }
  .projects .label { color: var(--b-fg-2); }
  .cols :global(i) { border-color: var(--b-line); }
  .cols { opacity: 0.6; }

  .frame { position: relative; max-width: var(--max); margin-inline: auto; }

  /* ---------- top: kicker, lede, controls ---------- */
  .top {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--s-4);
    row-gap: var(--s-5);
    margin-bottom: var(--s-8);
  }
  .kicker {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: var(--s-2);
    margin: 0;
  }
  .tick { width: 10px; height: 10px; background: var(--accent); }
  .lede {
    grid-column: 1 / -1;
    margin: 0;
    max-width: 46ch;
    font-size: var(--t-lg);
    line-height: 1.4;
    text-wrap: pretty;
  }
  .controls {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--s-4) var(--s-6);
  }
  @media (min-width: 1024px) {
    .kicker { grid-column: 1 / 4; align-self: start; padding-top: 0.4em; }
    .lede { grid-column: 4 / 10; }
    .controls { grid-column: 4 / -1; }
  }

  .chips { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .chip, .seg {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    min-height: 44px;
    padding: 0 var(--s-4);
    border: 1px solid var(--b-line-strong);
    border-radius: 999px;
    background: transparent;
    color: var(--b-fg);
    font: 500 var(--t-sm)/1 var(--font-body-stack);
    transition: background var(--d-fast), color var(--d-fast), border-color var(--d-fast), translate var(--d-med) var(--ease-snap);
  }
  .chip:hover, .seg:hover:not(:disabled) { border-color: var(--b-fg); translate: 0 -2px; }
  .chip[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  .count {
    font: 600 var(--t-xs)/1 var(--font-mono-stack);
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
  }
  /* Full strength on the accent fill: 0.85 drops the count below AA. */
  .chip[aria-pressed='true'] .count { opacity: 1; }
  .sort {
    display: inline-flex;
    align-items: center;
    gap: 0;
    border: 1px solid var(--b-line-strong);
    border-radius: 999px;
    padding: 0;
  }
  .sort-label { padding: 0 var(--s-3) 0 var(--s-4); }
  .seg { border-color: transparent; min-height: 44px; padding: 0 var(--s-4); }
  .seg[aria-pressed='true'] { background: var(--b-fg); color: var(--b-bg); }
  .sort-note { margin: 0; max-width: 34ch; align-self: center; }

  /* ---------- the index ---------- */
  .index { container-type: inline-size; }
  .head {
    --wdth: 68;
    --wght: 820;
    display: grid;
    grid-template-columns: var(--tpl);
    column-gap: var(--s-4);
    align-items: end;
    margin: 0 0 var(--s-3);
    padding-bottom: var(--s-3);
    border-bottom: 2px solid var(--b-fg);
    font-family: var(--font-display-stack);
    font-size: clamp(2rem, 4.6cqi, 7rem);
    font-variation-settings: "wght" var(--wght), "wdth" var(--wdth);
    font-weight: 820;
    line-height: var(--lh-display);
    text-transform: uppercase;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .hc { display: block; min-width: 0; }
  .head .c-stars { color: var(--accent); }
  .c-no { grid-column: 1 / 2; }
  .c-title { grid-column: 2 / 6; }
  .c-stack { grid-column: 6 / 9; }
  .c-stars { grid-column: 9 / 10; }
  .c-date { grid-column: 10 / 12; }
  .c-more { grid-column: 12 / 13; }
  /* The header word ends where the dates end; it may grow leftwards over the narrow ★ cell. */
  .head .c-date { display: flex; justify-content: flex-end; }
  /* Without live numbers the two live columns go, and title and stack take the room. */
  .offline .c-title { grid-column: 2 / 8; }
  .offline .c-stack { grid-column: 8 / 12; }
  .offline .head .c-stack { grid-column: 8 / 13; }
  /* The active sort marks its header cell: accent underline and a direction glyph. */
  .head .sorted { text-decoration: underline var(--accent) 0.08em; text-underline-offset: 0.12em; }
  .head .c-date.sorted { color: var(--b-fg); }
  .dir { display: inline-block; font-size: 0.5em; vertical-align: 0.6em; color: var(--accent); }
  .head .c-date .dir { margin-right: 0.15em; }

  .rows { margin: 0; padding: 0; list-style: none; position: relative; }
  .row { position: relative; }
  /* Keyboard focus lands clear of the top bar, with room below for the preview card. */
  .row-link { scroll-margin: 96px 0 min(400px, 45vh); }
  .row.out { display: none; }
  .rule {
    position: absolute;
    inset: auto 0 0;
    height: 1px;
    background: var(--b-line-strong);
  }
  .row-inner {
    position: relative;
    display: grid;
    grid-template-columns: var(--tpl);
    column-gap: var(--s-4);
    align-items: baseline;
    padding: var(--s-5) 0;
  }
  /* Hover wash: a band of the foreground colour wipes in from the left. */
  .row-inner::before {
    content: "";
    position: absolute;
    inset: 0 calc(-1 * var(--s-3));
    background: color-mix(in oklch, var(--b-fg) 7%, transparent);
    transform: scaleX(0);
    transform-origin: 0 50%;
    transition: transform var(--d-slow) var(--ease-out);
    pointer-events: none;
  }
  .row.active .row-inner::before,
  .row:focus-within .row-inner::before { transform: scaleX(1); }

  .no {
    position: relative;
    font: 500 var(--t-sm)/1 var(--font-mono-stack);
    font-variant-numeric: tabular-nums;
    color: var(--b-fg-2);
    transition: color var(--d-med);
  }
  .no::before {
    content: "";
    position: absolute;
    left: calc(-1 * var(--s-3) - 1px);
    top: 50%;
    width: 4px;
    height: 0;
    translate: 0 -50%;
    background: var(--accent);
    transition: height var(--d-med) var(--ease-out);
  }
  .row.active .no, .row:focus-within .no { color: var(--b-fg); }
  .row.active .no::before, .row:focus-within .no::before { height: 1.6em; }

  .c-title { min-width: 0; }
  .row-link, .rest-link { text-decoration: none; display: inline-block; max-width: 100%; }
  .row-link:focus-visible, .rest-link:focus-visible { outline-offset: 6px; }
  .title {
    display: inline-grid;
    font: 400 var(--t-xl)/0.95 var(--font-display-stack);
    text-transform: uppercase;
    letter-spacing: -0.005em;
    overflow-wrap: anywhere;
    transition: opacity var(--d-med);
  }
  /* The hover cut and a hidden copy in it share one grid cell, so the row is already
     as tall as the wider hover cut needs and hovering never reflows the list. */
  .t-live, .t-ghost {
    grid-area: 1 / 1;
    font-variation-settings: "wght" 760, "wdth" 70;
  }
  .t-ghost { visibility: hidden; font-variation-settings: "wght" 360, "wdth" 92; }
  .t-live { transition: font-variation-settings var(--d-slow) var(--ease-out); }
  .row.active .t-live, .row:focus-within .t-live {
    font-variation-settings: "wght" 360, "wdth" 92;
  }
  .rows:has(.row.active) .row:not(.active) .title,
  .index[data-hl] .row:not(.hl):not(.rest) .title { opacity: 0.5; }
  .blurb {
    margin: var(--s-2) 0 0;
    max-width: 52ch;
    font-size: var(--t-sm);
    line-height: 1.45;
    color: var(--b-fg-2);
  }
  .blurb a { color: var(--b-fg); }

  .stack {
    --sep: 1.4em;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 0;
    /* Each item carries its separator in front; the list starts one separator to the
       left and clips it, so no line starts or ends with a stray "/". */
    margin: 0 0 0 calc(-1 * var(--sep));
    padding: 0;
    list-style: none;
    clip-path: inset(0 0 0 var(--sep));
    font: 500 var(--t-xs)/1.6 var(--font-mono-stack);
    letter-spacing: 0.02em;
    color: var(--b-fg-2);
  }
  .stack li { position: relative; padding-left: var(--sep); }
  .stack li::before {
    content: "/";
    position: absolute;
    left: 0;
    width: var(--sep);
    text-align: center;
    color: var(--b-line-strong);
  }

  .stars, .date { font-variant-numeric: tabular-nums; }
  .num {
    font: 800 var(--t-xl)/1 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 68;
  }
  .date {
    text-align: right;
    font: 500 var(--t-xs)/1.6 var(--font-mono-stack);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--b-fg-2);
  }
  .skel {
    display: inline-block;
    width: 1.6em;
    height: 0.9em;
    vertical-align: middle;
    background: linear-gradient(90deg, var(--b-line) 25%, var(--b-line-strong) 50%, var(--b-line) 75%) 0 0 / 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }
  .skel.wide { width: 6em; }
  @keyframes shimmer { to { background-position: -200% 0; } }

  .toggle {
    position: relative;
    align-self: center;
    justify-self: end;
    width: 44px;
    height: 44px;
    border: 1px solid var(--b-line-strong);
    border-radius: 50%;
    background: transparent;
    color: var(--b-fg);
    transition: background var(--d-fast), border-color var(--d-fast), rotate var(--d-med) var(--ease-snap);
  }
  .toggle:hover { border-color: var(--b-fg); }
  .row.open .toggle { background: var(--b-fg); color: var(--b-bg); rotate: 45deg; }
  .plus, .plus::after {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 14px;
    height: 1.5px;
    translate: -50% -50%;
    background: currentColor;
  }
  .plus::after { content: ""; rotate: 90deg; }

  /* Inline details: grid 0fr → 1fr so the height animates without measuring. */
  .more {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--d-slow) var(--ease-out);
  }
  .row.open .more { grid-template-rows: 1fr; }
  .more-inner {
    overflow: hidden;
    display: grid;
    grid-template-columns: var(--tpl);
    column-gap: var(--s-4);
  }
  .more-desc { grid-column: 2 / 6; margin: 0 0 var(--s-5); font-size: var(--t-md); line-height: 1.5; }
  .more-desc .label { display: block; margin-bottom: var(--s-2); }
  .more-facts {
    grid-column: 6 / 12;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-3) var(--s-4);
    margin: 0 0 var(--s-5);
  }
  .more-facts dd { margin: 2px 0 0; font-size: var(--t-sm); overflow-wrap: anywhere; }
  .more-links { grid-column: 2 / 12; display: flex; flex-wrap: wrap; gap: var(--s-2); margin-bottom: var(--s-6); }
  .more-links .btn { border-color: var(--b-fg); background: var(--b-fg); color: var(--b-bg); }
  .more-links .btn-ghost { background: transparent; color: var(--b-fg); }
  .more-links .btn:hover { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }

  /* The closing row: everything else. */
  .rest .row-inner { padding-block: var(--s-6); }
  .rest-title { grid-column: 2 / 9; }
  .rest .no { color: var(--accent); font: 800 var(--t-xl)/1 var(--font-display-stack); }
  .rest-arrow {
    grid-column: 10 / 13;
    justify-self: end;
    font: 300 var(--t-sec)/0.8 var(--font-display-stack);
    font-variation-settings: "wght" 200, "wdth" 68;
    color: var(--accent);
    transition: translate var(--d-slow) var(--ease-out), font-variation-settings var(--d-slow) var(--ease-out);
  }
  .rest:hover .rest-arrow, .rest:focus-within .rest-arrow { translate: var(--s-3) 0; font-variation-settings: "wght" 700, "wdth" 138; }

  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-3);
    margin-top: var(--s-5);
  }
  .foot p { margin: 0; display: flex; align-items: center; gap: var(--s-2); }
  .foot a { color: var(--b-fg); text-underline-offset: 3px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--b-fg-2); }
  .dot.on { background: var(--accent); box-shadow: 0 0 0 4px color-mix(in oklch, var(--accent) 30%, transparent); }

  /* ---------- narrow: rows become cards on a two-line grid ---------- */
  @media (max-width: 767px) {
    .projects { --tpl: 2.2rem minmax(0, 1fr) auto 44px; }
    .head {
      grid-template-columns: auto minmax(0, 1fr) auto;
      font-size: clamp(2rem, 12.5cqi, 3.6rem);
    }
    .cols { display: none; }
    .head .c-stack, .head .c-date { display: none; }
    .head .c-no, .head .c-title, .head .c-stars { grid-column: auto; }
    .row-inner {
      grid-template-columns: var(--tpl);
      grid-template-areas:
        "no title stars more"
        ". stack stack stack"
        ". date date date";
      row-gap: var(--s-2);
      padding-block: var(--s-4);
    }
    .row-inner .c-no { grid-area: no; }
    .row-inner .c-title { grid-area: title; }
    .row-inner .c-stack { grid-area: stack; }
    .row-inner .c-stars { grid-area: stars; text-align: right; }
    .row-inner .c-date { grid-area: date; text-align: left; }
    .row-inner .c-more { grid-area: more; align-self: start; }
    .offline .row:not(.rest) .row-inner { grid-template-areas: "no title title more" ". stack stack stack"; }
    .blurb { font-size: var(--t-sm); }
    .more-inner { grid-template-columns: 2.2rem minmax(0, 1fr); }
    .more-desc, .more-facts, .more-links { grid-column: 2 / 3; }
    .rest .row-inner { grid-template-areas: "no title title more"; }
    .rest-title { grid-area: title; }
    .rest-arrow { grid-area: more; font-size: var(--t-xl); align-self: center; }
    .sort { width: 100%; justify-content: space-between; }
  }

  @media (forced-colors: active) {
    .projects { background: Canvas; color: CanvasText; }
    .chip[aria-pressed='true'], .seg[aria-pressed='true'] { outline: 2px solid Highlight; }
  }
</style>
