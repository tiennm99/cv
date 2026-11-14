<script>
  /**
   * One split-flap tile. When `char` (or `spin`) changes it walks the drum one
   * flap at a time: the upper leaf of the old character folds down while the
   * lower leaf of the next one swings into place. `instant` skips the walk and
   * `max` caps how many flaps one change walks through.
   */
  import { untrack } from 'svelte';
  import { route, normalise } from './flaps.js';

  /** @type {{ char?: string, delay?: number, instant?: boolean, spin?: number, step?: number, max?: number, accent?: boolean }} */
  let { char = ' ', delay = 0, instant = false, spin = 0, step = 62, max = 9, accent = false } = $props();

  let shown = $state(' ');
  let prev = $state(' ');
  let flips = $state(0);
  let lastSpin = 0;

  $effect(() => {
    const target = normalise(char);
    const forced = spin !== lastSpin;
    lastSpin = spin;
    if (instant) {
      shown = target;
      prev = target;
      return;
    }
    const path = route(untrack(() => shown), target, { max, min: forced ? Math.min(5, max) : 0 });
    if (!path.length) return;
    let index = 0;
    /** @type {ReturnType<typeof setTimeout>} */
    let timer;
    const next = () => {
      prev = untrack(() => shown);
      shown = path[index];
      flips += 1;
      index += 1;
      if (index < path.length) timer = setTimeout(next, step);
    };
    timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  });
</script>

<span class="flap" class:accent class:blank={shown === ' '} style:--step="{step}ms" aria-hidden="true">
  <span class="half top"><span class="glyph" data-c={shown}>{shown}</span></span>
  <span class="half bottom"><span class="glyph" data-c={prev}>{prev}</span></span>
  {#key flips}
    {#if flips}
      <span class="half top leaf fall"><span class="glyph" data-c={prev}>{prev}</span></span>
      <span class="half bottom leaf land"><span class="glyph" data-c={shown}>{shown}</span></span>
    {/if}
  {/key}
</span>

<style>
  .flap {
    --tile: color-mix(in oklch, var(--ink) 86%, var(--paper));
    --tile-lo: color-mix(in oklch, var(--ink) 92%, var(--paper));
    --glyph: var(--paper);
    /* The hinge thins with the tile so it never crosses small glyphs as a bar. */
    --hinge-w: clamp(0.5px, calc(var(--tw, 18px) * 0.03), 1.5px);
    --hinge: color-mix(in oklch, var(--tile) 62%, black);
    position: relative;
    display: inline-block;
    flex: none;
    width: var(--tw, 1.1em);
    height: calc(var(--tw, 1.1em) * 1.42);
    perspective: calc(var(--tw, 1.1em) * 6);
    font-family: var(--font-display-stack);
    font-size: calc(var(--tw, 1.1em) * 1.02);
    font-weight: 700;
    font-variation-settings: "wght" 700, "wdth" 92;
    line-height: 1;
    color: var(--glyph);
    /* Sub-pixel seams between the halves show tile, not black board, across the glyph. */
    background: var(--tile-lo);
    border-radius: 2px;
    contain: layout paint;
  }
  .accent:not(.blank) {
    --tile: var(--accent);
    --tile-lo: color-mix(in oklch, var(--accent) 90%, var(--ink));
    --glyph: var(--accent-ink);
    --hinge: color-mix(in oklch, var(--tile) 80%, black);
  }
  .half {
    position: absolute;
    left: 0;
    right: 0;
    height: 50%;
    overflow: hidden;
    background: var(--tile);
    border-radius: 2px;
  }
  /* The hinge is painted under the glyph, so strokes cross it intact (8 stays 8). */
  .top {
    top: 0;
    transform-origin: 50% 100%;
    background: linear-gradient(to top, var(--hinge) var(--hinge-w), var(--tile) var(--hinge-w));
  }
  .bottom { bottom: 0; background: var(--tile-lo); transform-origin: 50% 0; }
  .glyph {
    position: absolute;
    left: 0;
    right: 0;
    height: 200%;
    display: grid;
    place-items: center;
    padding-top: 0.06em;
  }
  .bottom .glyph { top: -100%; }
  /* The font's plus is a small math sign; draw a cap-height one so C++ reads clearly. */
  .glyph[data-c="+"] { font-size: 0; padding: 0; }
  .glyph[data-c="+"]::before {
    content: "";
    width: calc(var(--tw, 1.1em) * 0.56);
    aspect-ratio: 1;
    background:
      linear-gradient(var(--glyph), var(--glyph)) center / 100% 22% no-repeat,
      linear-gradient(var(--glyph), var(--glyph)) center / 22% 100% no-repeat;
  }
  .glyph[data-c="#"] { font-size: 1.2em; }
  .leaf { backface-visibility: hidden; will-change: transform; }
  .fall { z-index: 2; animation: fall var(--step) cubic-bezier(.55, 0, .9, .5) both; }
  .land { z-index: 2; animation: land var(--step) cubic-bezier(.1, .5, .3, 1.25) var(--step) both; transform: rotateX(90deg); }
  /* A fallen leaf ends edge-on; hiding it stops it showing as a dark bar across the glyph. */
  @keyframes fall { from { transform: rotateX(0); } to { transform: rotateX(-90deg); filter: brightness(.7); visibility: hidden; } }
  @keyframes land { from { transform: rotateX(90deg); filter: brightness(1.25); } to { transform: rotateX(0); } }

  @media (forced-colors: active) {
    .half { background: Canvas; border: 1px solid CanvasText; }
    .flap { color: CanvasText; }
  }
</style>
