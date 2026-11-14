<script>
  import { gh, refreshGitHub, canRefresh } from '../lib/live/github.svelte.js';
  import { localTime } from '../lib/time.js';

  const state = $derived(gh.loading && gh.status === 'connecting' ? 'connecting' : gh.status);
  const text = $derived(
    state === 'connecting' ? 'Connecting'
      : state === 'fresh' ? `Live · ${localTime(gh.asOf ?? Date.now())}`
        : state === 'stale' ? `Cached · as of ${localTime(gh.asOf ?? Date.now())}`
          : 'Offline',
  );
  const resetAt = $derived(gh.rateReset ? localTime(gh.rateReset) : null);
</script>

<button class="chip" type="button" popovertarget="live-popover" data-state={state} aria-label={`Live data: ${text}. Details`}>
  <i aria-hidden="true"></i><span class="text">{text}</span>
</button>

<div id="live-popover" class="pop" popover>
  <p class="label">Live data</p>
  <p>Numbers on this page come from <strong>api.github.com</strong> and the blog feed, fetched in your browser. Nothing is stored in the site.</p>
  <dl>
    <dt class="label">Status</dt><dd aria-live="polite">{text}</dd>
    {#if gh.rateRemaining !== null}
      <dt class="label">API calls left</dt><dd>{gh.rateRemaining}{resetAt ? ` · resets ${resetAt}` : ''}</dd>
    {/if}
  </dl>
  <button class="btn" type="button" disabled={!canRefresh()} onclick={() => refreshGitHub()}>
    {gh.loading ? 'Refreshing…' : 'Refresh'}
  </button>
</div>

<style>
  .chip {
    anchor-name: --live-chip;
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    min-height: 36px;
    padding: 0 var(--s-3);
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .chip:hover { border-color: var(--ink); }
  .chip i {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink-2);
    flex: none;
  }
  /* The live pulse is a ring scaled and faded on the compositor (transform and opacity
     only): this chip is always on screen, so a painted property would repaint every frame. */
  .chip[data-state='fresh'] i { background: var(--accent); }
  .chip[data-state='fresh'] i::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0;
    will-change: transform, opacity;
    animation: pulse 2s ease-out infinite;
  }
  .chip[data-state='stale'] i { background: transparent; border: 2px solid var(--ink-2); }
  .chip[data-state='connecting'] i { animation: blink 0.8s steps(2) infinite; }
  @keyframes pulse {
    from { transform: scale(1); opacity: 0.45; }
    to { transform: scale(2.5); opacity: 0; }
  }
  @keyframes blink { 50% { opacity: 0.2; } }
  .text { display: none; white-space: nowrap; }
  @media (min-width: 1024px) {
    .text { display: inline; }
  }

  .pop {
    position: fixed;
    inset: auto;
    top: calc(var(--bar-h) + var(--s-2));
    right: var(--gutter);
    width: min(320px, calc(100vw - 2 * var(--gutter)));
    margin: 0;
    padding: var(--s-4);
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    font-size: var(--t-sm);
  }
  @supports (position-anchor: --live-chip) {
    .pop {
      position-anchor: --live-chip;
      top: calc(anchor(bottom) + var(--s-2));
      right: auto;
      left: anchor(left);
      position-try-fallbacks: flip-inline;
    }
  }
  .pop p { margin: 0 0 var(--s-3); }
  dl { display: grid; grid-template-columns: auto 1fr; gap: var(--s-1) var(--s-3); margin: 0 0 var(--s-4); }
  dt { align-self: center; }
  dd { margin: 0; }
</style>
