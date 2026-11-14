<script>
  /**
   * Command palette (also the mobile menu): native <dialog>, combobox + listbox,
   * fuzzy matching from lib/commands.js. Opens on Cmd/Ctrl+K and "/".
   */
  import { buildCommands, filterCommands, GROUPS } from '../lib/commands.js';
  import { profile } from '../lib/profile.js';
  import { links } from '../lib/content.js';
  import { ui, toggleTheme, toggleMotion, copyText, toast } from '../lib/ui.svelte.js';
  import { gh, refreshGitHub, canRefresh } from '../lib/live/github.svelte.js';
  import { scrollToId } from '../lib/motion/runtime.js';

  const commands = buildCommands(profile);
  let dialog = $state(/** @type {HTMLDialogElement | null} */ (null));
  let input = $state(/** @type {HTMLInputElement | null} */ (null));
  let query = $state('');
  let index = $state(0);

  const results = $derived(filterCommands(commands, query));
  const grouped = $derived(query.trim() ? [{ group: 'Results', items: results }] : GROUPS.map(group => ({ group, items: results.filter(command => command.group === group) })));
  const activeId = $derived(results[index] ? `cmd-${results[index].id.replace(/[^a-z0-9-]/gi, '-')}` : undefined);

  $effect(() => {
    if (!dialog) return;
    if (ui.paletteOpen && !dialog.open) {
      query = '';
      index = 0;
      dialog.showModal();
      input?.focus();
    } else if (!ui.paletteOpen && dialog.open) dialog.close();
  });

  $effect(() => {
    /** @param {KeyboardEvent} event Key. */
    const onKey = event => {
      const typing = /** @type {HTMLElement} */ (event.target).closest?.('input, textarea, [contenteditable="true"]');
      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        ui.paletteOpen = !ui.paletteOpen;
      } else if (event.key === '/' && !typing && !ui.paletteOpen) {
        event.preventDefault();
        ui.paletteOpen = true;
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  /** @param {KeyboardEvent} event Key in the combobox. */
  function onInputKey(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      index = (index + 1) % Math.max(1, results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      index = (index - 1 + results.length) % Math.max(1, results.length);
    } else if (event.key === 'Home') {
      index = 0;
    } else if (event.key === 'End') {
      index = Math.max(0, results.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[index]) run(results[index]);
    }
  }

  $effect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  });

  /** @param {import('../lib/commands.js').Command} command Command to run. */
  function run(command) {
    ui.paletteOpen = false;
    if (command.href) {
      window.open(command.href, '_blank', 'noopener');
      return;
    }
    const action = command.action ?? '';
    if (action.startsWith('jump:')) {
      const id = action.slice(5);
      if (document.getElementById(id)) scrollToId(id);
      else location.assign(`./#${id}`);
    } else if (action === 'download-cv') {
      const a = document.createElement('a');
      a.href = links.cvPdf;
      a.download = links.cvDownloadName;
      a.click();
    } else if (action === 'copy-email') copyText(profile.email, 'Email copied');
    else if (action === 'toggle-theme') toggleTheme();
    else if (action === 'toggle-motion') {
      toggleMotion();
      toast(ui.motionPref === 'off' ? 'Motion reduced' : 'Motion on');
    } else if (action === 'refresh') {
      if (canRefresh()) {
        refreshGitHub()
          .then(() => toast(gh.status === 'fresh' ? 'Live data refreshed' : 'GitHub is unreachable right now'))
          .catch(() => toast('GitHub is unreachable right now'));
      }
      else toast('GitHub rate limit reached; try again later');
    }
  }
</script>

<dialog
  bind:this={dialog}
  class="palette"
  aria-label="Command palette"
  onclose={() => (ui.paletteOpen = false)}
  onclick={event => { if (event.target === dialog) ui.paletteOpen = false; }}
>
  <div class="box">
    <div class="field">
      <span class="label" aria-hidden="true">›</span>
      <input
        bind:this={input}
        bind:value={query}
        oninput={() => (index = 0)}
        onkeydown={onInputKey}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-list"
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label="Type a command or search"
        placeholder="Jump, do or open…"
        autocomplete="off"
        spellcheck="false"
      />
      <kbd class="label">Esc</kbd>
    </div>
    <div id="palette-list" class="list" role="listbox" aria-label="Commands">
      {#each grouped as { group, items } (group)}
        {#if items.length}
          <div role="group" aria-labelledby={`grp-${group.replace(/\W/g, '')}`}>
            <p class="label head" id={`grp-${group.replace(/\W/g, '')}`} role="presentation">{group}</p>
            {#each items as command (command.id)}
              {@const position = results.indexOf(command)}
              <div
                id={`cmd-${command.id.replace(/[^a-z0-9-]/gi, '-')}`}
                class="option"
                role="option"
                tabindex="-1"
                aria-selected={position === index}
                onpointermove={() => (index = position)}
                onclick={() => run(command)}
                onkeydown={() => {}}
              >
                <span>{command.label}</span>
                {#if command.hint}<span class="hint">{command.hint}</span>{/if}
                {#if command.href}<span class="hint" aria-hidden="true">↗</span>{/if}
              </div>
            {/each}
          </div>
        {/if}
      {/each}
      {#if !results.length}<p class="empty">No match for “{query}”.</p>{/if}
    </div>
  </div>
</dialog>

<style>
  .palette {
    width: min(640px, calc(100vw - 2 * var(--gutter)));
    max-height: min(70svh, 560px);
    margin: 12svh auto auto;
    padding: 0;
    border: 1px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: auto;
  }
  .palette::backdrop { background: color-mix(in oklch, var(--paper) 60%, transparent); backdrop-filter: blur(4px); }
  .palette[open] { animation: drop var(--d-med) var(--ease-out); }
  @keyframes drop { from { transform: translateY(-8px); opacity: 0; } }
  .box { display: flex; flex-direction: column; max-height: inherit; }
  .field { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); border-bottom: 1px solid var(--line); }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 500 var(--t-lg)/1.2 var(--font-body-stack);
    outline: none;
  }
  input::placeholder { color: var(--ink-2); }
  kbd { font-family: var(--font-mono-stack); }
  .list { overflow-y: auto; padding: var(--s-2) 0 var(--s-3); overscroll-behavior: contain; }
  .head { margin: var(--s-3) var(--s-4) var(--s-1); }
  .option {
    display: flex;
    align-items: baseline;
    gap: var(--s-3);
    min-height: 44px;
    align-content: center;
    padding: var(--s-3) var(--s-4);
    cursor: pointer;
  }
  .option[aria-selected='true'] { background: var(--ink); color: var(--paper); }
  .option[aria-selected='true'] .hint { color: inherit; }
  .hint { margin-left: auto; color: var(--ink-2); font: 500 var(--t-xs)/1.2 var(--font-mono-stack); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hint + .hint { margin-left: 0; }
  .empty { margin: var(--s-4); color: var(--ink-2); }
</style>
