<script>
  /**
   * Survival2D thesis card: a disclosure that morphs open with a View Transition
   * (instant under reduced motion or without the API). Renders the stable
   * `anchors.thesis` id so stack chips can cross-link here.
   */
  import { flushSync } from 'svelte';
  import { anchors } from '../../lib/content.js';
  import { reduced } from '../../lib/ui.svelte.js';
  import { refreshScroll } from '../../lib/motion/runtime.js';
  import { thesis } from './timeline-data.js';

  let open = $state(false);

  function toggle() {
    const flip = () => {
      open = !open;
      flushSync();
    };
    if (!document.startViewTransition || reduced()) flip();
    else document.startViewTransition(flip).finished.finally(refreshScroll);
    if (reduced()) refreshScroll();
  }
</script>

<div id={anchors.thesis} class="card" class:open tabindex="-1">
  <button
    class="head"
    type="button"
    aria-expanded={open}
    aria-controls="tl-thesis-body"
    data-cursor="link"
    onclick={toggle}
  >
    <span class="kicker label">Thesis · 2023</span>
    <span class="name">{thesis.name}</span>
    <span class="hint label">{open ? 'Close' : 'Open the thesis'}</span>
    <span class="plus" aria-hidden="true"></span>
  </button>

  <div id="tl-thesis-body" class="body" hidden={!open}>
    <p class="summary">{thesis.summary}</p>
    <ul class="stack" aria-label="Thesis stack">
      {#each thesis.stack as item (item)}<li>{item}</li>{/each}
    </ul>
    <dl class="grades">
      <div class="gpa">
        <dt class="label">GPA</dt>
        <dd>{thesis.gpa}</dd>
      </div>
      {#if thesis.awards.length}
        <div class="honours">
          <dt class="label">Honours</dt>
          {#each thesis.awards as award (award)}<dd>{award}</dd>{/each}
        </div>
      {/if}
    </dl>
    <p class="school label">{thesis.degree} · {thesis.school}</p>
  </div>
</div>

<style>
  .card {
    view-transition-name: tl-thesis;
    margin-top: var(--s-5);
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    outline-offset: 4px;
  }
  .card.open {
    background: var(--ink);
    color: var(--paper);
  }
  .head {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: "kicker plus" "name plus" "hint plus";
    gap: var(--s-1) var(--s-4);
    width: 100%;
    min-height: 44px;
    padding: var(--s-4) var(--s-5);
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    font: inherit;
  }
  .head:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
  .kicker { grid-area: kicker; color: inherit; }
  .open .kicker, .open .hint, .open .label { color: var(--paper); }
  .name {
    view-transition-name: tl-thesis-name;
    grid-area: name;
    font-family: var(--font-display-stack);
    font-size: var(--t-xl);
    line-height: 0.9;
    text-transform: uppercase;
    font-variation-settings: "wght" 820, "wdth" 68;
    transition: font-variation-settings var(--d-slow) var(--ease-out);
  }
  .head:hover .name, .open .name { font-variation-settings: "wght" 560, "wdth" 112; }
  .hint { grid-area: hint; color: var(--ink-2); }
  .plus {
    grid-area: plus;
    align-self: center;
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--accent);
    transition: transform var(--d-med) var(--ease-snap);
  }
  .plus::before, .plus::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 16px;
    height: 2px;
    margin: -1px 0 0 -8px;
    background: var(--accent-ink);
  }
  .plus::after { transform: rotate(90deg); }
  .open .plus { transform: rotate(135deg); }

  .body {
    padding: 0 var(--s-5) var(--s-5);
    display: grid;
    gap: var(--s-5);
  }
  .summary { margin: 0; font-size: var(--t-lg); line-height: 1.4; max-width: 46ch; }
  .stack {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
  }
  .stack li {
    padding: var(--s-1) var(--s-3);
    border: 1px solid currentColor;
    border-radius: 999px;
    font: 500 var(--t-xs)/1.6 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .grades {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--s-4) var(--s-6);
    border-top: 1px solid currentColor;
    padding-top: var(--s-4);
  }
  .grades div { display: grid; gap: var(--s-1); align-content: start; }
  .grades dd { margin: 0; font-weight: 600; line-height: 1.3; }
  .gpa dd {
    font-family: var(--font-display-stack);
    font-size: var(--t-xl);
    font-variation-settings: "wght" 820, "wdth" 68;
    line-height: 0.9;
    /* The open card sits on --ink, light in one theme and dark in the other. Fall back
       to the card text colour, then derive a vermilion whose lightness mirrors the
       surface: bright on the dark card, deep on the light one (both above 4.5:1). */
    color: inherit;
    color: oklch(from var(--ink) calc(0.72 - 0.25 * l) 0.2 31);
  }
  .school { margin: 0; }

  :global(::view-transition-group(tl-thesis)),
  :global(::view-transition-group(tl-thesis-name)) {
    animation-duration: 560ms;
    animation-timing-function: cubic-bezier(.16, 1, .3, 1);
  }
  :global(::view-transition-old(tl-thesis)),
  :global(::view-transition-new(tl-thesis)) {
    height: 100%;
    object-fit: none;
    object-position: top left;
  }
  :global(::view-transition-new(tl-thesis)) {
    animation: tl-clip-in 560ms cubic-bezier(.16, 1, .3, 1) both;
  }
  :global(::view-transition-old(tl-thesis)) {
    animation: tl-fade-out 200ms linear both;
  }
  @keyframes -global-tl-clip-in {
    from { clip-path: inset(0 0 100% 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  @keyframes -global-tl-fade-out {
    to { opacity: 0; }
  }
  @media (forced-colors: active) {
    .card.open { border: 2px solid CanvasText; }
  }
</style>
