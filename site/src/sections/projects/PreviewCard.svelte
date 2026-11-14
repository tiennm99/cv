<script>
  /**
   * The floating preview card for the projects index. Purely visual (aria-hidden):
   * every fact it shows is also in the row or its inline details, so screen readers
   * lose nothing. The parent positions the root element; this renders a small
   * kinetic-type poster of the repo (its name opening from condensed to wide, banded
   * in the repo's GitHub language colour) and swaps it when the active row changes.
   * Live facts appear only when GitHub answered; nothing is filled from guesses.
   */
  import { relativeTime } from '../../lib/time.js';
  import { langColor } from './project-model.js';

  /**
   * @type {{ row: import('./project-model.js').Row | null, now: number, live: boolean, root?: HTMLElement | null }}
   */
  let { row, now, live, root = $bindable(null) } = $props();

  const language = $derived(live ? row?.live?.language || '' : '');
  const color = $derived(langColor(language));
  const stars = $derived(live && row?.live ? row.live.stars : 0);
  const pushed = $derived(live && row?.live?.pushedAt ? relativeTime(row.live.pushedAt, now) : '');
</script>

<div class="card" bind:this={root} aria-hidden="true">
  {#if row}
    {#key row.key}
      <div class="swap" style:--lang={color || undefined}>
        <div class="poster">
          <span class="no">{row.no}</span>
          <p class="name">{row.item.title}</p>
          <span class="repo">{row.key}</span>
        </div>
        <div class="body">
          <p class="desc">{row.description}</p>
          <ul class="stack">
            {#each row.item.stack as tech (tech)}<li>{tech}</li>{/each}
          </ul>
          {#if language || stars > 0 || pushed}
            <dl class="facts">
              {#if language}
                <div><dt>Language</dt><dd><span class="swatch" class:plain={!color}></span>{language}</dd></div>
              {/if}
              {#if stars > 0}
                <div><dt>Stars</dt><dd class="big">{stars}<span class="star">★</span></dd></div>
              {/if}
              {#if pushed}
                <div><dt>Pushed</dt><dd>{pushed}</dd></div>
              {/if}
            </dl>
          {/if}
          <p class="host">
            <span class="verb">{row.host ? 'Open' : 'Source'}</span>
            {row.host ? row.host : `github.com/${row.key}`} ↗
          </p>
        </div>
      </div>
    {/key}
  {/if}
</div>

<style>
  .card {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 60;
    width: min(360px, calc(100vw - 32px));
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 0 var(--line), 0 24px 60px -24px oklch(0 0 0 / 0.45);
    transform-origin: 0 0;
    will-change: transform;
  }
  .swap {
    --lang: var(--accent);
    animation: swap 420ms var(--ease-out);
  }
  @keyframes swap {
    from { clip-path: inset(0 0 100% 0); }
    to { clip-path: inset(0 0 0 0); }
  }

  /* The poster: ink ground, the name opening from condensed to wide, a language band. */
  .poster {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: var(--s-2) var(--s-3);
    padding: var(--s-4) var(--s-4) var(--s-3) calc(var(--s-4) + 8px);
    background: var(--ink);
    color: var(--paper);
    overflow: hidden;
  }
  .poster::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 8px;
    background: var(--lang);
    transform-origin: 50% 0;
    animation: band 620ms var(--ease-out);
  }
  @keyframes band { from { transform: scaleY(0); } }
  .no {
    grid-column: 2;
    grid-row: 1;
    font: 800 var(--t-sm)/1 var(--font-mono-stack);
    font-variant-numeric: tabular-nums;
    color: var(--paper);
  }
  .name {
    grid-column: 1;
    grid-row: 1;
    margin: 0;
    font: 400 var(--t-xl)/0.88 var(--font-display-stack);
    font-variation-settings: "wght" 300, "wdth" 132;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
    animation: open 700ms var(--ease-out);
  }
  @keyframes open {
    from { font-variation-settings: "wght" 820, "wdth" 68; }
  }
  .repo {
    grid-column: 1 / -1;
    font: 500 var(--t-xs)/1.3 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: color-mix(in oklch, var(--paper) 78%, var(--ink));
    overflow-wrap: anywhere;
  }

  .body { padding: var(--s-4); }
  .desc { margin: 0 0 var(--s-4); font-size: var(--t-sm); line-height: 1.45; color: var(--ink); }
  .stack {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-1);
    margin: 0 0 var(--s-4);
    padding: 0;
    list-style: none;
  }
  .stack li {
    padding: 2px var(--s-2);
    border: 1px solid var(--line);
    font: 500 var(--t-xs)/1.5 var(--font-mono-stack);
    color: var(--ink-2);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--s-3) var(--s-5);
    margin: 0 0 var(--s-4);
    padding-top: var(--s-3);
    border-top: 1px solid var(--line);
  }
  .facts div { min-width: 0; }
  dt {
    font: 500 var(--t-xs)/1.4 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  dd { display: flex; align-items: center; gap: var(--s-2); margin: 2px 0 0; font-size: var(--t-sm); line-height: 1.3; }
  .swatch { width: 10px; height: 10px; border-radius: 50%; background: var(--lang); box-shadow: 0 0 0 1px var(--line); }
  .swatch.plain { background: var(--ink-2); }
  .big {
    align-items: baseline;
    gap: 2px;
    font: 800 var(--t-xl)/1 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 68;
  }
  .star { color: var(--accent-text); font-size: 0.8em; }
  .host {
    margin: 0;
    font: 500 var(--t-xs)/1.4 var(--font-mono-stack);
    letter-spacing: 0.02em;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .verb {
    display: inline-block;
    margin-right: var(--s-2);
    padding: 1px var(--s-2);
    background: var(--ink);
    color: var(--paper);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>
