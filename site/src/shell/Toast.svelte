<script>
  import { ui } from '../lib/ui.svelte.js';
</script>

<div class="toast-region" role="status" aria-live="polite">
  {#if ui.toast}
    {#key ui.toast.id}
      <p class="toast">{ui.toast.text}</p>
    {/key}
  {/if}
</div>

<style>
  .toast-region {
    position: fixed;
    left: 50%;
    bottom: var(--s-6);
    z-index: 80;
    transform: translateX(-50%);
    pointer-events: none;
    max-width: calc(100vw - 2 * var(--gutter));
  }
  .toast {
    margin: 0;
    padding: var(--s-3) var(--s-4);
    background: var(--ink);
    color: var(--paper);
    font: 500 var(--t-sm)/1.3 var(--font-mono-stack);
    animation: toast-in var(--d-med) var(--ease-snap);
  }
  @keyframes toast-in {
    from { transform: translateY(12px); opacity: 0; }
  }
</style>
