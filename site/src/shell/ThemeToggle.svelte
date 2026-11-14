<script>
  import { ui, toggleTheme } from '../lib/ui.svelte.js';

  /** @param {MouseEvent} event Click (keyboard clicks have no pointer position). */
  function onclick(event) {
    const rect = /** @type {HTMLElement} */ (event.currentTarget).getBoundingClientRect();
    toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }
</script>

<button class="toggle" type="button" {onclick} aria-pressed={ui.theme === 'invert'} aria-label="Invert theme" title="Invert theme">
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
  </svg>
</button>

<style>
  .toggle {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 36px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    transition: border-color var(--d-fast);
  }
  .toggle:hover { border-color: var(--ink); }
  svg { transition: transform var(--d-slow) var(--ease-io); }
  .toggle[aria-pressed='true'] svg { transform: rotate(180deg); }
</style>
