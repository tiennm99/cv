<script>
  /**
   * 06 Stack: "Java by day, everything else."
   * Six sticky cards with staggered tops; the finished stair of tabs spells the heading.
   * Each card keeps full brightness until the next card actually overlaps it, then
   * recedes (scale, tilt, fog) on the root scroll() timeline over exactly that overlap,
   * measured in JS on resize. (A view() timeline on a sticky subject reports offsets
   * that drift once it sticks, so the range is set in page pixels instead.) Every card has its own layout: a giant Java button,
   * a ledger split by "by", numbered rows, a terminal listing, a vertical word with
   * pills, and a closing word that bleeds off the last card. Linked chips open
   * anchor-positioned popovers; skills the page does not show are plain tags.
   * Without view timelines it is a plain stacked list.
   */
  import { onMount } from 'svelte';
  import { gh } from '../../lib/live/github.svelte.js';
  import { localTime } from '../../lib/time.js';
  import { sectionMotion, scrollToId, getLenis, motionReduced } from '../../lib/motion/runtime.js';
  import { splitLines } from '../../lib/motion/actions.js';
  import { cards, HEADING, SOURCE_LABELS, whereUsed, repoCount, languageUrl, isLinked } from './stack-data.js';

  /** @typedef {import('./stack-data.js').Skill} Skill */

  /** @type {HTMLOListElement | null} */
  let deck = $state(null);
  /** True once the recede ranges are measured. */
  let ranged = $state(false);
  const live = $derived(gh.status === 'fresh' || gh.status === 'stale');
  const lead = /** @type {Skill} */ (cards[0].skills.find(skill => skill.lead));

  /**
   * Inline style per card: index and word length (the word fills its share of the width).
   * @param {number} i Card index.
   * @returns {string} Style attribute.
   */
  const cardStyle = i => `--i:${i}; --chars:${cards[i].word.length};`;

  /**
   * @param {Skill[]} skills Chips.
   * @returns {number} CV items (skills list and experience).
   */
  const inCv = skills => skills.filter(s => s.source !== 'repos').length;

  /**
   * Document tops of the cards as if none were sticky.
   * @param {HTMLElement[]} items Cards.
   * @returns {number[]} Natural tops in page pixels.
   */
  function naturalTops(items) {
    if (!deck || items.length === 0) return [];
    // Flex column: no margin collapsing, so each step is height + row gap (the per-card
    // margin-bottom set in layout() is cancelled by the next card's negative margin-top).
    const gap = parseFloat(getComputedStyle(deck).rowGap) || 0;
    let y = deck.getBoundingClientRect().top + scrollY;
    return items.map((card, i) => {
      if (i > 0) y += items[i - 1].offsetHeight + gap;
      return y;
    });
  }

  /**
   * Sticky stair and recede ranges. Each top is at least the previous top plus one tab,
   * so no card ever covers an earlier tab. The recede of card i runs on the root scroll
   * timeline from the moment the next card's top passes card i's bottom to the moment
   * that card lands on its own top, so every card rests at full brightness first.
   */
  function layout() {
    if (!deck) return;
    const items = /** @type {HTMLElement[]} */ ([...deck.children]);
    /** @type {number[]} */
    const tops = [];
    items.forEach((card, i) => {
      const tab = /** @type {HTMLElement | null} */ (card.querySelector('.tab'))?.offsetHeight ?? 0;
      card.style.setProperty('--floor', i === 0 ? '0px' : `${tops[i - 1] + tab}px`);
      tops.push(parseFloat(getComputedStyle(card).top));
    });
    if (tops.some(Number.isNaN)) return;
    // A sticky card lets go once its margin box reaches the end of the deck, so cards of
    // different heights would leave at different moments and break the stair. Padding each
    // card's margin-bottom up to the lowest stuck bottom makes them all leave together.
    const bottoms = items.map((card, i) => tops[i] + card.offsetHeight);
    const lowest = Math.max(...bottoms);
    items.forEach((card, i) => {
      const pad = Math.round(lowest - bottoms[i]);
      card.style.marginBottom = `${pad}px`;
      const next = items[i + 1];
      if (next) next.style.marginTop = `${-pad}px`;
    });
    const natural = naturalTops(items);
    items.forEach((card, i) => {
      if (i === items.length - 1) return;
      const start = Math.max(0, natural[i + 1] - tops[i] - card.offsetHeight);
      const end = Math.max(start + 1, natural[i + 1] - tops[i + 1]);
      card.style.setProperty('--r0', `${Math.round(start)}px`);
      card.style.setProperty('--r1', `${Math.round(end)}px`);
    });
    // Attach the recede only once real ranges exist: Chrome can keep a start time
    // computed from a placeholder range.
    if (!ranged) requestAnimationFrame(() => (ranged = true));
  }

  onMount(() => {
    if (!deck) return undefined;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const node = /** @type {HTMLElement} */ (entry.target);
        if (node === document.body) continue;
        node.style.setProperty('--h', `${Math.ceil(entry.borderBoxSize[0]?.blockSize ?? node.offsetHeight)}px`);
      }
      layout();
    });
    for (const card of deck.children) observer.observe(card);
    // Sections above can change height after load (fonts, live data), which moves the deck.
    observer.observe(document.body);
    addEventListener('resize', layout, { passive: true });
    return () => {
      observer.disconnect();
      removeEventListener('resize', layout);
      stopWatch();
    };
  });

  /**
   * Keeps a focused control clear of the next card stacked over it (WCAG 2.4.11):
   * after the browser's own focus scroll, scrolls back up by the overlap.
   * @param {FocusEvent} event Focus entering the deck.
   */
  function onDeckFocus(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const next = target.closest('.card')?.nextElementSibling;
    if (!next) return;
    requestAnimationFrame(() => {
      const overlap = target.getBoundingClientRect().bottom + 16 - next.getBoundingClientRect().top;
      if (overlap <= 0) return;
      const y = Math.max(0, scrollY - overlap);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else scrollTo({ top: y, behavior: 'instant' });
    });
  }

  /**
   * Scrolls so card `i` has just landed on its sticky top; when it is already there,
   * nudges its tab instead so the click still answers.
   * @param {number} i Card index.
   */
  function jump(i) {
    if (!deck) return;
    const items = /** @type {HTMLElement[]} */ ([...deck.children]);
    const target = items[i];
    const stickyTop = parseFloat(getComputedStyle(target).top) || 0;
    const y = Math.max(0, naturalTops(items)[i] - stickyTop);
    if (Math.abs(y - scrollY) < 4) {
      if (!motionReduced()) {
        target.querySelector('.tab')?.animate(
          [{ transform: 'none' }, { transform: 'translateY(-6px)' }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' },
        );
      }
    } else {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 1 });
      else scrollTo({ top: y, behavior: 'instant' });
    }
    target.querySelector('h3')?.focus({ preventScroll: true });
  }

  /**
   * Follows a cross-link on this page (smooth scroll + flash); when the target is not
   * rendered (isolate mode) the plain `./#id` href opens it on the full page.
   * @param {MouseEvent} event Click.
   * @param {string} id Target anchor id.
   * @param {string} popId Popover to close.
   */
  function follow(event, id, popId) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    document.getElementById(popId)?.hidePopover();
    scrollToId(id);
    if (motionReduced()) return;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    target.animate(
      [
        { outline: `3px solid ${accent}`, outlineOffset: '8px' },
        { outline: '3px solid transparent', outlineOffset: '2px' },
      ],
      { duration: 1600, delay: 900, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
  }

  /** @type {HTMLElement | null} Open popover being watched for its card receding. */
  let watched = null;
  function checkWatched() {
    if (!watched) return;
    const card = watched.closest('.card');
    const next = card?.nextElementSibling;
    const anchor = card?.querySelector(`[popovertarget="${watched.id}"]`);
    if (next && anchor && next.getBoundingClientRect().top < anchor.getBoundingClientRect().bottom) watched.hidePopover();
  }
  function stopWatch() {
    watched = null;
    removeEventListener('scroll', checkWatched);
  }

  /**
   * Closes an open popover once the next card slides over its chip, so it never
   * floats detached over another card.
   * @param {ToggleEvent} event Popover toggle.
   */
  function onToggle(event) {
    const pop = /** @type {HTMLElement} */ (event.currentTarget);
    if (event.newState === 'open') {
      stopWatch();
      watched = pop;
      addEventListener('scroll', checkWatched, { passive: true });
    } else if (watched === pop) stopWatch();
  }

  /**
   * Chip entrance per card (motion on only; CSS owns the stacking).
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   * @returns {void | (() => void)} Cleanup.
   */
  const motion = ({ node, reduced, gsap }) => {
    if (reduced) return;
    /** @type {Array<() => void>} */
    const offs = [];
    for (const card of node.querySelectorAll('.card')) {
      // Opacity only (never visibility), so the chips stay in the tab order; focus finishes the entrance.
      const tween = gsap.from(card.querySelectorAll('.chips > li'), {
        y: 18,
        scaleX: 0.7,
        transformOrigin: '0% 50%',
        opacity: 0,
        duration: 0.8,
        stagger: { each: 0.04, from: card.classList.contains('v-split') ? 'edges' : 'start' },
        ease: 'back.out(1.6)',
        scrollTrigger: { trigger: card, start: 'top 72%', once: true },
      });
      const finish = () => tween.progress(1);
      card.addEventListener('focusin', finish);
      offs.push(() => card.removeEventListener('focusin', finish));
    }
    return () => offs.forEach(off => off());
  };
</script>

{#snippet popover(/** @type {Skill} */ skill, /** @type {string} */ popId)}
  {@const where = whereUsed(skill.name)}
  {@const count = repoCount(skill.name, gh.languages)}
  {@const ghUrl = languageUrl(skill.name)}
  <div class="pop" id={popId} popover="auto" data-lenis-prevent style="position-anchor: --a-{skill.id}" ontoggle={onToggle}>
    <p class="pop-name">{skill.name}</p>
    <p class="pop-src label">{SOURCE_LABELS[skill.source]}{skill.lead ? ' · strongest' : ''}</p>
    {#if where.length}
      <p class="pop-h label">Shows up in</p>
      <ul class="pop-links">
        {#each where as link (link.id)}
          <li>
            <a href="./#{link.id}" onclick={event => follow(event, link.id, popId)}>
              <span class="pop-sec">{link.section}</span>
              <span class="pop-title">{link.title}</span>
              <span aria-hidden="true">→</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
    {#if ghUrl}
      <a class="pop-gh" href={ghUrl} target="_blank" rel="noopener">
        {#if live && count !== null}
          <span class="pop-count">{count}</span>
          <span>public side-project {count === 1 ? 'repo' : 'repos'} with {skill.name.split('/')[0]} as main language{gh.status === 'stale' ? `, as of ${localTime(gh.asOf)}` : ''}</span>
        {:else}
          <span>Public repos in {skill.name.split('/')[0]} on GitHub</span>
        {/if}
        <span aria-hidden="true">↗</span>
      </a>
    {/if}
    <button class="pop-close" type="button" popovertarget={popId} popovertargetaction="hide" aria-label="Close">×</button>
  </div>
{/snippet}

{#snippet chip(/** @type {Skill} */ skill)}
  {#if isLinked(skill.name)}
    {@const popId = `stack-pop-${skill.id}`}
    {@const count = gh.status === 'fresh' ? repoCount(skill.name, gh.languages) : null}
    <li>
      <button class="chip {skill.source}" type="button" popovertarget={popId} style="anchor-name: --a-{skill.id}">
        <span class="nm">{skill.name}</span>
        {#if count !== null}<sup class="cnt"><span aria-hidden="true">{count}</span><span class="sr-only">, {count} public repos</span></sup>{/if}
        <span class="plus" aria-hidden="true"></span>
      </button>
      {@render popover(skill, popId)}
    </li>
  {:else}
    <li><span class="tag {skill.source}">{skill.name}</span></li>
  {/if}
{/snippet}

<section class="stack section" aria-labelledby="stack-title" use:sectionMotion={motion}>
  <div class="cols" aria-hidden="true">{#each Array(12) as _, n (n)}<i></i>{/each}</div>

  <header class="intro grid-12">
    <p class="label num">(06) Stack</p>
    <h2 id="stack-title" class="sr-only">{HEADING}</h2>
    <p class="intro-lead" use:splitLines>
      Java is the day job: real-time backends for live multiplayer games, since 2020. Everything else is what
      the public side projects run on.
    </p>
    <ul class="legend label" aria-label="Chip key">
      <li><span class="key cv" aria-hidden="true"></span>{SOURCE_LABELS.cv}</li>
      <li><span class="key xp" aria-hidden="true"></span>{SOURCE_LABELS.xp}</li>
      <li><span class="key repos" aria-hidden="true"></span>{SOURCE_LABELS.repos}</li>
      <li><span class="key plain" aria-hidden="true">Aa</span>Plain: listed, no showcase here</li>
    </ul>
  </header>

  <ol class="deck" class:ranged bind:this={deck} onfocusin={onDeckFocus}>
    {#each cards as card, i (card.key)}
      {@const cv = card.skills.filter(s => s.source !== 'repos' && !s.lead)}
      {@const repos = card.skills.filter(s => s.source === 'repos')}
      <li class="card v-{card.variant}" style={cardStyle(i)} aria-labelledby="stack-{card.key}-title">
        <button class="tab" type="button" onclick={() => jump(i)} aria-label="Jump to {card.label}, {card.skills.length} skills">
          <span class="tab-num">06.{i + 1}</span>
          <span class="tab-word">{card.word}</span>
          <span class="tab-label">{card.label}</span>
          <span class="tab-count">{card.skills.length} skills</span>
          <span class="tab-arrow" aria-hidden="true">↥</span>
        </button>

        <div class="body">
          {#if card.variant === 'accent'}
            <div class="word-box">
              <button class="word display word-btn" type="button" popovertarget="stack-pop-{lead.id}" style="anchor-name: --a-{lead.id}" aria-label="Java, strongest skill: where it shows up">
                {card.word}
              </button>
              <p class="lead-tag label">
                <span>Strongest</span><span>Java 21 · Netty · Vert.x at work</span><span>since 2020</span>
              </p>
              {@render popover(lead, `stack-pop-${lead.id}`)}
            </div>
          {:else}
            <p class="word display" aria-hidden="true">{card.word}</p>
          {/if}

          <div class="head">
            <h3 id="stack-{card.key}-title" tabindex="-1">{card.label}</h3>
            <p class="meta label">
              <span>{inCv(card.skills)} in the CV</span>
              {#if repos.length}<span>{repos.length} from public repos</span>{/if}
            </p>
            <p class="note">{card.note}</p>
          </div>

          {#if card.variant === 'split'}
            <div class="side side-cv">
              <p class="label sub">At work · {SOURCE_LABELS.cv}</p>
              <ul class="chips">{#each cv as skill (skill.id)}{@render chip(skill)}{/each}</ul>
            </div>
            <div class="side side-repos">
              <p class="label sub">After hours · {SOURCE_LABELS.repos}</p>
              <ul class="chips">{#each repos as skill (skill.id)}{@render chip(skill)}{/each}</ul>
            </div>
          {:else if card.variant === 'mono'}
            <div class="term">
              <p class="prompt" aria-hidden="true"><span class="ps">~/infra $</span> ls</p>
              <ul class="chips">{#each card.skills as skill (skill.id)}{@render chip(skill)}{/each}</ul>
            </div>
          {:else}
            <ul class="chips">{#each card.skills.filter(s => !s.lead) as skill (skill.id)}{@render chip(skill)}{/each}</ul>
          {/if}
        </div>
      </li>
    {/each}
  </ol>

  <p class="foot label"><span>Repo counts load live from api.github.com · public side projects only; the day-job Java lives in private repositories.</span></p>
</section>

<style>
  @property --dim {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }

  .stack {
    --tab: 44px;
    --deck-top: calc(var(--bar-h) + var(--s-3));
    --fog: oklch(0.1 0.01 270);
    --fog-max: 0.34;
    --lift: oklch(0.1 0.01 270 / 0.45);
  }
  /* Invert theme: dark fog on dark paper vanishes, so fog goes deeper and the lift becomes a light rim. */
  :global(:root[data-theme="invert"]) .stack {
    --fog: oklch(0 0 0);
    --fog-max: 0.62;
    --lift: oklch(0.97 0.01 95 / 0.22);
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme="light"])) .stack {
      --fog: oklch(0 0 0);
      --fog-max: 0.62;
      --lift: oklch(0.97 0.01 95 / 0.22);
    }
  }
  @media (max-width: 767px) {
    .stack { --tab: 36px; }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* ---------- intro ---------- */
  .intro {
    position: relative;
    row-gap: var(--s-5);
    margin-bottom: var(--s-8);
  }
  .num { grid-column: 1 / -1; margin: 0; color: var(--ink); }
  .intro-lead {
    grid-column: 1 / -1;
    margin: 0;
    font: 500 var(--t-xl)/1.12 var(--font-body-stack);
    letter-spacing: -0.015em;
    text-wrap: balance;
  }
  .legend {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2) var(--s-3);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    padding: var(--s-1) var(--s-2);
    background: var(--paper);
  }
  .key { width: 22px; height: 12px; border: 1px solid var(--ink); }
  .key.cv { background: var(--ink); }
  .key.xp { border: 3px double var(--ink); }
  .key.repos { border-style: dashed; }
  .key.plain { width: auto; height: auto; border: 0; font: 600 var(--t-xs)/1 var(--font-body-stack); text-transform: none; }
  @media (min-width: 1024px) {
    .num { grid-column: 1 / 4; padding-top: 0.6em; }
    .intro-lead { grid-column: 4 / 12; }
    .legend { grid-column: 4 / 12; }
  }

  /* ---------- deck ---------- */
  .deck {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--s-9);
    max-width: var(--max);
    margin: 0 auto;
    padding: 0;
    list-style: none;
  }
  .card {
    --top: max(var(--floor, 0px), min(calc(var(--deck-top) + var(--i) * var(--tab)), calc(100svh - var(--h, 0px) - var(--s-3))));
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--paper);
    color: var(--ink);
    border: 1px solid var(--ink);
    overflow: clip;
    transform-origin: 50% 0;
  }
  @media (min-width: 900px) {
    .card { min-height: min(600px, calc(100svh - var(--deck-top) - 5 * var(--tab) - var(--s-3))); }
  }

  /* Fog for receded cards; leaves the tab readable. Zero until the next card overlaps. */
  .card::after {
    content: "";
    position: absolute;
    inset: var(--tab) 0 0;
    background: var(--fog);
    opacity: calc(var(--dim) * var(--fog-max));
    pointer-events: none;
  }

  @supports (animation-timeline: view()) {
    .card {
      position: sticky;
      top: var(--top);
      box-shadow: 0 -18px 40px -26px var(--lift);
    }
    .ranged > .card {
      animation: stack-recede linear both;
      animation-timeline: scroll(root);
      animation-range: var(--r0) var(--r1);
    }
    .ranged > .card:last-child { animation: none; }
    .deck { padding-bottom: var(--s-9); }
    .word {
      animation: stack-ink linear both;
      animation-timeline: view();
      animation-range: entry 10% entry 90%;
    }
  }
  @keyframes stack-recede {
    to {
      transform: perspective(1800px) rotateX(3deg) scale(0.94);
      --dim: 1;
    }
  }
  @keyframes stack-ink {
    from {
      font-variation-settings: "wght" 110, "wdth" 50;
      letter-spacing: 0.04em;
    }
  }
  :global(:root[data-motion="reduced"]) .card,
  :global(:root[data-motion="reduced"]) .word {
    animation: none;
  }
  @media (prefers-reduced-motion: reduce) {
    :global(:root:not([data-motion="full"])) .card,
    :global(:root:not([data-motion="full"])) .word {
      animation: none;
    }
  }

  /* ---------- tab strip: the finished stair reads the heading ---------- */
  .tab {
    display: flex;
    align-items: center;
    gap: var(--s-4);
    flex: none;
    width: 100%;
    height: var(--tab);
    padding: 0 var(--s-4);
    border: 0;
    border-bottom: 1px solid currentColor;
    background: transparent;
    color: inherit;
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: left;
  }
  .tab-word {
    min-width: 6.2ch;
    font: 820 1.5rem/1 var(--font-display-stack);
    font-variation-settings: var(--axes-rest);
    letter-spacing: 0;
    transition: font-variation-settings var(--d-med) var(--ease-out);
  }
  .tab-label { flex: 1; font-weight: 700; }
  .tab-arrow {
    font-size: 1rem;
    transition: transform var(--d-med) var(--ease-snap);
  }
  .tab:hover .tab-arrow,
  .tab:focus-visible .tab-arrow { transform: translateY(-3px); }
  .tab:hover .tab-word,
  .tab:focus-visible .tab-word { font-variation-settings: "wght" 900, "wdth" 100; }
  .tab:focus-visible { outline-offset: -4px; }

  /* ---------- body ---------- */
  .body {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: var(--s-4);
    padding: var(--s-4) var(--s-4) var(--s-5);
    container-type: inline-size;
  }
  .word {
    margin: 0;
    /* Fill the given share of the card width; Anybody at rest axes averages about 0.5em per capital. */
    font-size: min(var(--cap, 20rem), calc(var(--span, 96) * 1cqi / (var(--chars) * 0.5)));
    line-height: 0.8;
    white-space: nowrap;
  }
  .head { display: flex; flex-direction: column; gap: var(--s-2); min-width: 0; }
  h3 {
    margin: 0;
    font: 700 var(--t-lg)/1.2 var(--font-body-stack);
    letter-spacing: -0.01em;
  }
  h3:focus { outline: none; }
  h3:focus-visible { outline: 2px solid currentColor; }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-1) var(--s-4);
    margin: 0;
    color: inherit;
  }
  .meta span + span::before { content: "/ "; }
  .note { margin: 0; max-width: 56ch; font-size: var(--t-md); }
  .sub { margin: 0 0 var(--s-2); color: inherit; }

  @media (min-width: 900px) {
    .body {
      gap: var(--s-5) var(--s-7);
      padding: var(--s-6) var(--s-6) var(--s-7);
    }
  }

  /* ---------- chips ---------- */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip,
  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    min-height: 40px;
    padding: 0 var(--s-3) 0 var(--s-4);
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    font: 500 var(--t-sm)/1.2 var(--font-body-stack);
    text-align: left;
  }
  .chip { transition: background var(--d-fast), color var(--d-fast), transform var(--d-med) var(--ease-snap); }
  /* Plain tags: no box and no plus, so they never pass for buttons. */
  .tag { border-color: transparent; padding-inline: var(--s-2); }
  .tag::before { content: "·"; margin-right: var(--s-1); }
  @media (pointer: coarse) { .chip { min-height: 44px; } }
  .chip.repos { border-style: dashed; }
  .chip.xp { border: 3px double currentColor; }
  .nm {
    font-variation-settings: "wght" 500, "wdth" 100;
    transition: font-variation-settings var(--d-med) var(--ease-out);
  }
  .chip:hover .nm,
  .chip:focus-visible .nm { font-variation-settings: "wght" 700, "wdth" 82; }
  .chip:hover,
  .chip:focus-visible,
  li:has(> .pop:popover-open) > .chip {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
    border-style: solid;
  }
  .chip:active { transform: scale(0.96); }
  .cnt {
    margin-left: -4px;
    font: 700 0.6875rem/1 var(--font-mono-stack);
    vertical-align: super;
  }
  .plus {
    position: relative;
    width: 10px;
    height: 10px;
    flex: none;
    transition: transform var(--d-med) var(--ease-snap);
  }
  .plus::before,
  .plus::after {
    content: "";
    position: absolute;
    inset: 4px 0;
    background: currentColor;
  }
  .plus::after { inset: 0 4px; }
  li:has(> .pop:popover-open) > .chip .plus { transform: rotate(45deg); }

  /* ---------- 06.1 Languages: the giant word is the Java button ---------- */
  .v-accent { background: var(--accent); color: var(--accent-ink); border-color: var(--accent-ink); }
  .v-accent .word-box { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--s-3) var(--s-6); }
  .word-btn {
    --span: 92;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    transition: font-variation-settings var(--d-slow) var(--ease-out), color var(--d-fast);
  }
  .word-btn:hover,
  .word-btn:focus-visible,
  .word-box:has(> .pop:popover-open) .word-btn {
    font-variation-settings: "wght" 960, "wdth" 54;
    animation: none;
  }
  .word-btn:focus-visible { outline: 3px solid currentColor; outline-offset: 6px; }
  .lead-tag {
    display: flex;
    flex-direction: column;
    gap: var(--s-1);
    margin: 0 0 0.6em;
    color: inherit;
    font-weight: 600;
  }
  .lead-tag span:first-child { align-self: flex-start; padding: 2px 6px; background: var(--accent-ink); color: var(--accent); }
  @media (min-width: 900px) {
    .v-accent .body {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      grid-template-areas: "word word" "head chips";
      grid-template-rows: 1fr auto;
    }
    .v-accent .word-box { grid-area: word; align-self: center; }
    .v-accent .head { grid-area: head; }
    .v-accent .chips { grid-area: chips; align-self: end; }
    .word-btn { --span: 68; --cap: 24rem; }
  }

  /* ---------- 06.2 Frameworks: a ledger split by "by" ---------- */
  .v-split .word { --span: 40; text-align: center; color: var(--accent-text); }
  .side { min-width: 0; }
  .side-repos .chips { justify-content: flex-start; }
  @media (min-width: 900px) {
    .v-split .body {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      grid-template-areas: "head head head" "cv word repos";
      align-items: center;
      align-content: center;
    }
    .v-split .head { grid-area: head; align-items: center; text-align: center; }
    .v-split .note { max-width: 62ch; }
    .v-split .word { --span: 26; grid-area: word; padding-inline: var(--s-4); }
    .side-cv { grid-area: cv; text-align: right; }
    .side-cv .chips { justify-content: flex-end; }
    .side-repos { grid-area: repos; }
    .side { align-self: stretch; display: flex; flex-direction: column; justify-content: center; }
    .side-cv { border-right: 1px solid var(--line); padding-right: var(--s-5); }
    .side-repos { border-left: 1px solid var(--line); padding-left: var(--s-5); }
  }

  /* ---------- 06.3 Data: numbered rows, word anchored bottom right ---------- */
  .v-rows .chips {
    counter-reset: row;
    flex-direction: column;
    gap: 0;
    border-top: 2px solid var(--ink);
  }
  .v-rows .chips > li { counter-increment: row; }
  .v-rows .chip,
  .v-rows .tag {
    width: 100%;
    min-height: 48px;
    padding: 0 var(--s-2);
    border: 0;
    border-bottom: 1px solid var(--line);
    font: 600 var(--t-lg)/1 var(--font-body-stack);
    transition: background var(--d-fast), color var(--d-fast), padding var(--d-med) var(--ease-out);
  }
  .v-rows .chip::before,
  .v-rows .tag::before {
    content: counter(row, decimal-leading-zero);
    min-width: 3ch;
    margin: 0;
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
  }
  .v-rows .tag { font-weight: 400; }
  .v-rows .nm { flex: 1; }
  .v-rows .chip.repos::after {
    content: "repos";
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    order: 1;
  }
  .v-rows .chip .plus { order: 2; }
  .v-rows .chip:hover,
  .v-rows .chip:focus-visible { padding-left: var(--s-4); }
  .v-rows .word { --span: 92; text-align: right; }
  @media (min-width: 900px) {
    .v-rows .body {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      grid-template-areas: "chips head" "chips word";
      grid-template-rows: auto 1fr;
    }
    .v-rows .chips { grid-area: chips; align-self: start; }
    .v-rows .head { grid-area: head; }
    .v-rows .word { --span: 40; grid-area: word; align-self: end; }
  }
  @media (min-width: 1200px) {
    .v-rows .chips { display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--s-5); }
  }

  /* ---------- 06.4 Infra: outlined word over a terminal listing ---------- */
  .v-mono {
    background-color: var(--paper);
    background-image: radial-gradient(circle, var(--line) 1px, transparent 1.4px);
    background-size: 16px 16px;
  }
  .v-mono .word {
    --span: 90;
    color: transparent;
    -webkit-text-stroke: 2px var(--ink);
  }
  .v-mono .word::after {
    content: "";
    display: inline-block;
    width: 0.08em;
    height: 0.7em;
    margin-left: 0.06em;
    background: var(--accent);
    animation: caret 1.1s steps(1) infinite;
  }
  @keyframes caret { 50% { opacity: 0; } }
  .term {
    padding: var(--s-3) var(--s-4) var(--s-4);
    background: var(--ink);
    color: var(--paper);
  }
  .prompt { margin: 0 0 var(--s-3); font: 500 var(--t-sm)/1.2 var(--font-mono-stack); }
  .ps { font-weight: 700; }
  .term .chips {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17ch, 1fr));
    gap: 0 var(--s-2);
  }
  .term .chip,
  .term .tag {
    width: 100%;
    min-height: 36px;
    padding: 0 var(--s-2);
    border: 0;
    font: 500 var(--t-sm)/1.2 var(--font-mono-stack);
  }
  .term .chip .nm::before { content: "› "; }
  .term .chip.repos .nm::after { content: "*"; }
  .term .tag::before { content: "  "; white-space: pre; margin: 0; }
  .term .chip:hover,
  .term .chip:focus-visible,
  .term li:has(> .pop:popover-open) > .chip { background: var(--paper); color: var(--ink); }
  .term .chip:focus-visible { outline-color: var(--paper); }
  @media (pointer: coarse) { .term .chip { min-height: 44px; } }
  @media (min-width: 900px) {
    .v-mono .body {
      grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
      grid-template-areas: "head word" "term term";
      grid-template-rows: auto 1fr;
    }
    .v-mono .head { grid-area: head; align-self: start; }
    .v-mono .word { --span: 62; grid-area: word; text-align: right; align-self: start; -webkit-text-stroke-width: 3px; }
    .term { grid-area: term; align-self: end; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(:root:not([data-motion="full"])) .v-mono .word::after { animation: none; }
  }
  :global(:root[data-motion="reduced"]) .v-mono .word::after { animation: none; }

  /* ---------- 06.5 Engineering: vertical word, pill cloud ---------- */
  .v-pills { background: var(--paper-2); }
  .v-pills .chip,
  .v-pills .tag { border-radius: 999px; padding-inline: var(--s-4); font-size: var(--t-md); }
  .v-pills .chips > li:nth-child(3n + 1) .chip { font-size: var(--t-lg); min-height: 48px; }
  .v-pills .word { --span: 96; }
  @media (min-width: 900px) {
    .v-pills .body {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas: "word head" "word chips";
      grid-template-rows: auto 1fr;
      padding-left: var(--s-5);
    }
    .v-pills .word {
      grid-area: word;
      writing-mode: vertical-rl;
      rotate: 180deg;
      font-size: clamp(6rem, 14cqw, 11rem);
      line-height: 0.78;
      border-left: 1px solid var(--line);
      padding-left: var(--s-4);
    }
    .v-pills .head { grid-area: head; }
    .v-pills .chips { grid-area: chips; align-content: center; gap: var(--s-3); }
  }

  /* ---------- 06.6 AI: the closing word bleeds off the last card ---------- */
  .v-ink { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .v-ink .chip:hover,
  .v-ink .chip:focus-visible,
  .v-ink li:has(> .pop:popover-open) > .chip {
    background: var(--paper);
    color: var(--ink);
    border-color: var(--paper);
  }
  .v-ink .word { --span: 100; --cap: 40rem; order: 3; margin-bottom: -0.12em; }
  @media (min-width: 900px) {
    .v-ink .body {
      grid-template-columns: minmax(0, 6fr) minmax(0, 6fr);
      grid-template-areas: "head chips" "word word";
      grid-template-rows: auto 1fr;
      padding-bottom: 0;
    }
    .v-ink .head { grid-area: head; }
    .v-ink .chips { grid-area: chips; flex-direction: column; align-items: flex-start; }
    .v-ink .word { grid-area: word; align-self: end; }
  }

  /* Phones: the tab already names the card, so the body sheds repeats; the word leads. */
  @media (max-width: 599px) {
    .meta { display: none; }
    h3 {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .tab { gap: var(--s-3); padding-inline: var(--s-3); }
    .tab-word { font-size: 1.15rem; }
    .tab-count { display: none; }
    .note { font-size: var(--t-sm); }
    .chips { gap: 6px; }
    .chip, .tag { padding: 0 var(--s-2) 0 var(--s-3); font-size: 0.8125rem; }
    .v-pills .chip, .v-pills .tag { font-size: var(--t-sm); }
    .v-pills .chips > li:nth-child(3n + 1) .chip { font-size: var(--t-sm); min-height: 40px; }
    .v-pills .chip, .v-pills .tag { padding-inline: var(--s-3); }
    .v-rows .chip, .v-rows .tag { min-height: 44px; font-size: var(--t-md); }
    .term { padding-inline: var(--s-2); }
    .term .chips { grid-template-columns: 1fr 1fr; }
    .term .chip, .term .tag { font-size: 0.75rem; }
    .v-ink .word { order: 0; margin-bottom: 0; }
  }

  /* ---------- popovers ---------- */
  .pop {
    width: min(340px, calc(100vw - 2 * var(--s-4)));
    max-height: min(70svh, 460px);
    overflow: auto;
    padding: var(--s-4) var(--s-4) var(--s-3);
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 6px 6px 0 var(--ink);
    font-size: var(--t-sm);
    text-align: left;
  }
  @supports (anchor-name: --a) {
    .pop {
      inset: auto;
      margin: var(--s-2) 0;
      position-area: block-end span-inline-end;
      position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
      position-visibility: anchors-visible;
    }
  }
  .pop:popover-open { animation: pop-in var(--d-med) var(--ease-snap); }
  @keyframes pop-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  }
  .pop-name {
    margin: 0 var(--s-7) 0 0;
    font: 820 var(--t-xl)/0.9 var(--font-display-stack);
    font-variation-settings: var(--axes-rest);
    text-transform: uppercase;
  }
  .pop-src { margin: var(--s-2) 0 var(--s-3); color: var(--ink-2); }
  .pop-h { margin: var(--s-3) 0 var(--s-1); color: var(--ink-2); }
  .pop-links { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
  .pop-links a,
  .pop-gh {
    display: flex;
    align-items: center;
    gap: var(--s-3);
    min-height: 44px;
    padding: var(--s-2) 0;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
  }
  .pop-links a:hover .pop-title,
  .pop-links a:focus-visible .pop-title,
  .pop-gh:hover span:not(.pop-count) { text-decoration: underline; text-underline-offset: 3px; }
  .pop-sec {
    flex: none;
    width: 11.5ch;
    font: 500 var(--t-xs)/1.2 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .pop-title { flex: 1; font-weight: 600; }
  .pop-gh { margin-top: var(--s-2); border-top: 1px solid var(--line); }
  .pop-count {
    flex: none;
    min-width: 2ch;
    font: 820 var(--t-xl)/1 var(--font-display-stack);
    font-variation-settings: var(--axes-rest);
    color: var(--accent-text);
  }
  .pop-close {
    position: absolute;
    top: var(--s-2);
    right: var(--s-2);
    width: 36px;
    height: 36px;
    border: 1px solid var(--line);
    background: transparent;
    color: inherit;
    font-size: 1.2rem;
    line-height: 1;
  }
  .pop-close:hover { background: var(--ink); color: var(--paper); }

  .foot {
    position: relative;
    max-width: var(--max);
    margin: var(--s-6) auto 0;
    color: var(--ink-2);
  }
  .foot span {
    padding: 2px var(--s-2);
    background: var(--paper);
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  @media (forced-colors: active) {
    .card::after { display: none; }
    .v-mono .word { color: CanvasText; -webkit-text-stroke: 0; }
  }
</style>
