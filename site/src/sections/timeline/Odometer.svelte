<script>
  /**
   * Mechanical year counter: one column of 0-9 per digit, rolled with a CSS
   * transform. Each column is as wide as its digit's real advance, so the year
   * sets as one word. Only the columns whose digit changes move: they roll, thin
   * out (wght), flash vermilion and stretch tall for a beat, then settle.
   * Decorative: the parent heading carries the accessible text.
   */
  import { digitsOf, DIGIT_ADVANCE } from './timeline-data.js';

  /** @type {{ year: number }} */
  let { year } = $props();

  const digits = $derived(digitsOf(year));
  const strip = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  /** Per column: true while that column is rolling to a new digit. */
  let kicked = $state([false, false, false, false]);
  /** Digits last shown, to find the columns that change (null before the first run). Not reactive on purpose. */
  /** @type {number[] | null} */
  let shown = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  $effect(() => {
    const next = digitsOf(year);
    const before = shown;
    shown = next;
    if (!before) return;
    const changed = next.map((digit, index) => digit !== before[index]);
    if (!changed.some(Boolean)) return;
    kicked = changed;
    clearTimeout(timer);
    timer = setTimeout(() => { kicked = [false, false, false, false]; }, 760);
  });

  $effect(() => () => clearTimeout(timer));
</script>

<span class="odo" aria-hidden="true">
  {#each digits as digit, index (index)}
    <span
      class="col"
      class:last={index === digits.length - 1}
      class:kick={kicked[index]}
      style:--d={digit}
      style:--w={DIGIT_ADVANCE[digit]}
      style:--i={index}
    >
      <span class="strip">
        {#each strip as n (n)}<span class="n">{n}</span>{/each}
      </span>
    </span>
  {/each}
</span>

<style>
  .odo {
    display: inline-flex;
    font-family: var(--font-display-stack);
    font-variant-numeric: lining-nums proportional-nums;
    line-height: 1;
    /* One digit cell; the gap around each glyph keeps neighbours out of the window. */
    --step: 1.3em;
    /* Fade the strip in and out at the window edges so rolling digits read as a drum. */
    --fade: linear-gradient(to bottom, transparent 0, #000 11%, #000 89%, transparent 100%);
  }
  .col {
    position: relative;
    display: block;
    width: calc(var(--w) * 1em);
    height: var(--step);
    overflow: hidden;
    mask-image: var(--fade);
    transition: width 900ms var(--ease-out), color 600ms var(--ease-out);
    transition-delay: calc(var(--i) * 70ms);
  }
  .strip {
    display: flex;
    flex-direction: column;
    transform: translate3d(0, calc(var(--d) * -1 * var(--step)), 0);
    transition: transform 900ms var(--ease-out), scale 700ms var(--ease-snap);
    transition-delay: calc(var(--i) * 70ms);
    transform-origin: 50% calc((var(--d) + 0.5) * var(--step));
    will-change: transform;
  }
  .n {
    display: block;
    height: var(--step);
    line-height: var(--step);
    text-align: center;
    font-variation-settings: "wght" 820, "wdth" 68;
    transition: font-variation-settings 420ms var(--ease-out);
    transition-delay: calc(var(--i) * 70ms + 280ms);
  }
  .last { color: var(--accent); }
  /* The changing columns only: thin, vermilion, a tall stretch; the others hold still. */
  .kick { color: var(--accent); transition-duration: 160ms; }
  .kick .strip { scale: 1 1.12; transition-duration: 900ms, 160ms; }
  .kick .n {
    font-variation-settings: "wght" 240, "wdth" 68;
    transition-duration: 160ms;
    transition-delay: calc(var(--i) * 70ms);
  }
</style>
