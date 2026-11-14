<script>
  /**
   * Full-bleed marquee of the curated featured repos. CSS animates the track; it
   * pauses on hover, focus, touch and off-screen, and scroll velocity skews it and
   * bends its speed (and direction). Each name is a link with an anchor-positioned
   * popover; on touch the first tap opens the popover and the second navigates.
   * Each name reserves its resting width, so the hover weight change never
   * shoves its neighbours. The first copy is the only interactive one; the
   * clones that close the loop are inert. Reduced motion: a static wrapped row.
   */
  import { onMount } from 'svelte';
  import { sectionMotion } from '../../lib/motion/runtime.js';
  import { relativeTime } from '../../lib/time.js';

  /** @type {{ items: import('./now-data.js').TickerItem[], now: number, hot?: string | null }} */
  let { items, now, hot = $bindable(null) } = $props();

  /** How long a touch holds the ticker still, in ms. */
  const HOLD_MS = 4500;

  const COPIES = 4;
  const clones = Array.from({ length: COPIES - 1 }, (_, i) => i);

  /** @type {HTMLDivElement} */ let band;
  /** @type {HTMLDivElement} */ let track;
  /** @type {HTMLDivElement} */ let skew;
  let onscreen = $state(false);
  let held = $state(false);
  /** Index of the open popover, or -1. */
  let openIdx = -1;
  /** Pointer type of the last press on a name; a keyboard click reads as 'mouse'. */
  let pressedWith = 'mouse';
  /** @type {ReturnType<typeof setTimeout> | undefined} */ let holdTimer;

  // About 7 seconds per name keeps the read speed steady whatever the item count.
  const duration = $derived(Math.max(28, items.length * 7));

  /**
   * The marquee's CSS animation. Svelte scopes keyframe names (a hash prefix),
   * so match on the suffix.
   * @returns {Animation | undefined} The animation.
   */
  const marquee = () => track?.getAnimations().find(anim => String(/** @type {any} */ (anim).animationName).endsWith('now-marquee'));

  /**
   * Keyboard focus pauses the loop; move it so the focused name sits in view.
   * One layout read per focus, never per frame. Names keep their resting width
   * when hot, so the measurement holds after the focus style applies.
   * @param {FocusEvent} event Focus event from a ticker link.
   */
  function bringIntoView(event) {
    const item = /** @type {HTMLElement} */ (event.target).closest('li');
    const anim = marquee();
    if (!item || !anim) return;
    const loop = track.scrollWidth / COPIES;
    const timing = anim.effect?.getComputedTiming();
    const total = Number(timing?.duration) || 0;
    const left = Math.max(0, item.offsetLeft - band.clientWidth * 0.12);
    anim.currentTime = Math.min(left / loop, 0.999) * total;
    // Where overflow: clip is missing, focus may have scrolled the band; undo it.
    band.scrollLeft = 0;
  }

  /**
   * @param {number} index Item index.
   * @param {boolean} open Show or hide.
   */
  function popover(index, open) {
    if (open && openIdx !== -1 && openIdx !== index) popover(openIdx, false);
    const pop = document.getElementById(`now-pop-${index}`);
    if (!pop) return;
    try {
      if (open && !pop.matches(':popover-open')) pop.showPopover();
      if (!open && pop.matches(':popover-open')) pop.hidePopover();
    } catch {
      // Popover API missing: the link still works and the title stays readable.
    }
    if (open) openIdx = index;
    else if (openIdx === index) openIdx = -1;
    hot = open ? items[index].key : hot === items[index].key ? null : hot;
  }

  /**
   * A touch or pen press holds the ticker still for a few seconds, then lets
   * it run again and closes any popover the tap opened.
   * @param {PointerEvent} event Press on the band.
   */
  function hold(event) {
    if (event.pointerType === 'mouse') return;
    held = true;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      held = false;
      if (openIdx !== -1 && !band.contains(document.activeElement)) popover(openIdx, false);
    }, HOLD_MS);
  }

  /**
   * On touch the first tap shows the popover; a second tap on the same name
   * follows the link.
   * @param {MouseEvent} event Click on a name.
   * @param {number} index Item index.
   */
  function tap(event, index) {
    const touch = pressedWith !== 'mouse';
    pressedWith = 'mouse';
    if (!touch || openIdx === index) return;
    event.preventDefault();
    popover(index, true);
  }

  onMount(() => {
    const io = new IntersectionObserver(([entry]) => { onscreen = entry.isIntersecting; });
    io.observe(band);
    return () => {
      io.disconnect();
      clearTimeout(holdTimer);
    };
  });

  /**
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   * @returns {void | (() => void)} Cleanup.
   */
  function motion({ reduced, gsap, ScrollTrigger }) {
    if (reduced) return;
    const skewTo = gsap.quickTo(skew, 'skewX', { duration: 0.5, ease: 'power3.out' });
    const rate = { value: 1 };
    const apply = () => {
      const anim = marquee();
      if (anim) anim.playbackRate = rate.value;
    };
    ScrollTrigger.create({
      trigger: band,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        const velocity = self.getVelocity();
        const push = gsap.utils.clamp(-5, 5, velocity / 450);
        skewTo(gsap.utils.clamp(-9, 9, -velocity / 260));
        gsap.killTweensOf(rate);
        // Scrolling back up runs the ticker backwards for a beat.
        rate.value = Math.abs(push) < 0.4 ? 1 : push;
        apply();
        gsap.to(rate, { value: 1, duration: 1.1, ease: 'power3.out', onUpdate: apply, delay: 0.05 });
        gsap.delayedCall(0.12, () => skewTo(0));
      },
    });
    return () => {
      rate.value = 1;
      apply();
    };
  }
</script>

<div
  class="band"
  class:running={onscreen}
  class:held
  bind:this={band}
  use:sectionMotion={motion}
  onpointerdowncapture={hold}
  role="region"
  aria-label="Featured projects, scrolling"
>
  <div class="skew" bind:this={skew}>
    <div class="track" bind:this={track} style:--dur={`${duration}s`}>
      <ul class="group">
        {#each items as item, i (item.key)}
          <li class:hot={hot === item.key}>
            <a
              href={item.href}
              data-name={item.name}
              style:anchor-name={`--now-tk-${i}`}
              aria-describedby={`now-pop-about-${i}`}
              data-cursor="link"
              onpointerdown={event => { pressedWith = event.pointerType; }}
              onpointerenter={event => { if (event.pointerType === 'mouse') popover(i, true); }}
              onpointerleave={event => { if (event.pointerType === 'mouse') popover(i, false); }}
              onclick={event => tap(event, i)}
              onfocus={event => { bringIntoView(event); popover(i, true); }}
              onblur={() => popover(i, false)}
            ><span>{item.name}</span></a>
            <span class="tags" aria-hidden="true">
              {#each item.tags as tag (tag)}<span>{tag}</span>{/each}
            </span>
            <span class="sep" aria-hidden="true">✱</span>
          </li>
        {/each}
      </ul>
      {#each clones as copy (copy)}
        <ul class="group clone" aria-hidden="true" inert>
          {#each items as item (item.key)}
            <li class:hot={hot === item.key}>
              <a href={item.href} tabindex="-1" data-name={item.name}><span>{item.name}</span></a>
              <span class="tags">{#each item.tags as tag (tag)}<span>{tag}</span>{/each}</span>
              <span class="sep">✱</span>
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  </div>
</div>

{#each items as item, i (item.key)}
  <div id={`now-pop-${i}`} class="pop" popover="manual" style:position-anchor={`--now-tk-${i}`}>
    <p class="label pop-owner">{item.owner} /</p>
    <p class="pop-name">{item.name}</p>
    <p class="pop-about" id={`now-pop-about-${i}`}>{item.about}</p>
    <p class="label pop-meta">
      {#if item.tags.length}<span>{item.tags.join(' · ')}</span>{/if}
      {#if item.stars}<span>★ {item.stars}</span>{/if}
      {#if item.pushedAt}<span>pushed {relativeTime(item.pushedAt, now)}</span>{/if}
    </p>
  </div>
{/each}

<style>
  .band {
    position: relative;
    /* clip, not hidden: focusing a name must not scroll the band itself. */
    overflow: hidden;
    overflow: clip;
    background: var(--ink);
    color: var(--paper);
    border-block: 1px solid var(--ink);
    padding-block: clamp(14px, 2vw, 28px);
    contain: paint;
  }
  .skew { will-change: transform; }
  .track {
    display: flex;
    width: max-content;
    animation: now-marquee var(--dur) linear infinite;
    animation-play-state: paused;
  }
  .band.running .track { animation-play-state: running; }
  .band:hover .track,
  .band:focus-within .track,
  .band.held .track { animation-play-state: paused; }

  @keyframes now-marquee {
    to { transform: translate3d(-25%, 0, 0); }
  }

  .group {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.2vw, 20px);
    padding-inline: clamp(10px, 1.4vw, 22px);
    white-space: nowrap;
  }
  /* The hidden copy holds the resting width; the hot state only thins the weight. */
  a {
    display: inline-grid;
    font-family: var(--font-display-stack);
    font-size: clamp(2.4rem, 1.4rem + 4.2vw, 5.6rem);
    font-variation-settings: "wght" 820, "wdth" 68;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    text-decoration: none;
    color: var(--paper);
    padding-block: 0.06em;
    transition: font-variation-settings var(--d-med) var(--ease-out), color var(--d-fast);
  }
  a > span,
  a::after { grid-area: 1 / 1; }
  a::after {
    content: attr(data-name);
    visibility: hidden;
    font-variation-settings: "wght" 820, "wdth" 68;
  }
  a:hover,
  a:focus-visible,
  li.hot a {
    color: var(--accent);
    font-variation-settings: "wght" 260, "wdth" 68;
  }
  a:focus-visible { outline: 2px solid var(--paper); outline-offset: 4px; }
  .tags {
    display: grid;
    gap: 2px;
    font-family: var(--font-mono-stack);
    font-size: var(--t-xs);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.25;
    color: var(--paper);
  }
  .sep {
    font-size: clamp(1.4rem, 1rem + 1.6vw, 2.6rem);
    color: var(--accent);
    line-height: 1;
    transition: rotate var(--d-slow) var(--ease-snap);
  }
  li.hot .sep { rotate: 90deg; }

  /* Popover: a paper card above the hovered name. */
  .pop {
    width: min(340px, calc(100vw - 32px));
    margin: 0;
    padding: var(--s-4) var(--s-4) var(--s-3);
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 6px 6px 0 var(--accent);
    inset: auto var(--s-4) var(--s-4) auto;
  }
  @supports (position-anchor: --a) {
    .pop {
      inset: auto;
      position-area: block-start center;
      margin-block-end: var(--s-3);
      position-try-fallbacks: block-start span-inline-end, block-start span-inline-start, flip-block;
    }
  }
  .pop p { margin: 0; }
  .pop-owner { color: var(--ink-2); }
  .pop-name {
    font-family: var(--font-display-stack);
    font-size: var(--t-xl);
    font-variation-settings: "wght" 760, "wdth" 80;
    line-height: 0.95;
    text-transform: uppercase;
    margin-block: var(--s-1) var(--s-3) !important;
    overflow-wrap: anywhere;
  }
  .pop-about { font-size: var(--t-sm); line-height: 1.45; }
  .pop-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-1) var(--s-3);
    margin-top: var(--s-3) !important;
    padding-top: var(--s-2);
    border-top: 1px solid var(--line);
  }

  /* Reduced motion: no loop, no clones; the names wrap as a static row. */
  :global(:root[data-motion="reduced"]) .track {
    animation: none;
    width: auto;
    padding-inline: var(--gutter);
  }
  :global(:root[data-motion="reduced"]) .clone { display: none; }
  :global(:root[data-motion="reduced"]) .group { flex-wrap: wrap; row-gap: var(--s-2); }
  :global(:root[data-motion="reduced"]) .skew { will-change: auto; }

  @media (forced-colors: active) {
    .band { border-color: CanvasText; }
    a, .tags { color: LinkText; }
  }
</style>
