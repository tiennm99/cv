<script>
  /**
   * The craft terminal: command chips, a `role=log` transcript and a prompt with
   * Tab completion and history. Each run appends one block whose lines arrive
   * whole (screen readers hear each line once) and are revealed by a stepped CSS
   * clip, so typing costs no JS per character. A new run finishes the previous
   * block instantly instead of overlapping it. Below 768px a strip under the bar
   * mirrors the lit diagram nodes, since the figure sits below the terminal there.
   */
  import { tick } from 'svelte';
  import { profile } from '../../lib/profile.js';
  import { COMMANDS, commandByName, complete, segments } from './craft-data.js';

  /**
   * @type {{ active: string, reduced: boolean, onselect: (name: string, manual: boolean) => void, mode: 'tour' | 'manual' | 'free', onresume: () => void }}
   */
  let { active, reduced, onselect, mode, onresume } = $props();

  /**
   * @typedef {{ kind: 'in' | 'cmt' | 'step' | 'ok' | 'out' | 'err', text: string, delay: number, dur: number, steps: number }} Line
   * @typedef {{ id: number, lines: Line[], done: boolean }} Block
   */

  /** @type {Block[]} */
  let blocks = $state([]);
  let value = $state('');
  /** @type {string[]} */
  const history = [];
  let historyAt = -1;
  let blockId = 0;
  /** @type {HTMLElement | null} */
  let logEl = $state(null);
  /** @type {HTMLInputElement | null} */
  let inputEl = $state(null);

  const suggestion = $derived(complete(value));
  const ghost = $derived(suggestion ? suggestion.slice(value.trim().length) : '');
  const PER_CHAR = 0.042;

  /**
   * Builds a block of lines with cumulative reveal delays.
   * @param {string} input The command as typed.
   * @param {{ kind: Line['kind'], text: string }[]} output Output lines.
   * @returns {Line[]} Timed lines.
   */
  function timed(input, output) {
    const typeDur = reduced ? 0 : Math.max(0.18, input.length * PER_CHAR);
    /** @type {Line[]} */
    const lines = [{ kind: 'in', text: input, delay: 0, dur: typeDur, steps: Math.max(1, input.length) }];
    let at = typeDur + (reduced ? 0 : 0.22);
    for (const line of output) {
      const plain = line.text.replace(/\*/g, '');
      const dur = reduced ? 0 : Math.min(0.5, 0.12 + plain.length * 0.006);
      lines.push({ ...line, delay: at, dur, steps: Math.min(28, Math.max(6, Math.round(plain.length / 2))) });
      at += reduced ? 0 : dur + 0.09;
    }
    return lines;
  }

  /**
   * Runs a command: tour commands, built-ins, or a not-found message.
   * Exposed to Craft.svelte for the scroll tour.
   * @param {string} raw Command text.
   * @param {boolean} [manual] True when the visitor asked for it.
   * @param {boolean} [instant] Print the block already finished (a tour chapter scrolled past).
   */
  export async function run(raw, manual = false, instant = false) {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    if (name === 'clear') {
      blocks = [];
      return;
    }
    const command = commandByName(name);
    /** @type {{ kind: Line['kind'], text: string }[]} */
    let output;
    if (command) {
      output = command.lines;
      onselect(command.name, manual);
    } else if (name === 'help') {
      output = [
        { kind: 'cmt', text: 'each command illustrates one method from the CV' },
        ...[...COMMANDS.map(entry => [entry.name, entry.title]), ['clear', 'empty the screen'], ['whoami', 'who wrote this']]
          .map(([cmd, what]) => ({ kind: /** @type {const} */ ('out'), text: `*${cmd}*${' '.repeat(10 - cmd.length)}${what}` })),
      ];
    } else if (name === 'whoami') {
      output = [
        { kind: 'out', text: `*${profile.name}*` },
        { kind: 'out', text: profile.headline },
      ];
    } else {
      output = [{ kind: 'err', text: `command not found: ${name.slice(0, 40)}. Try *help*.` }];
    }
    blocks = [...blocks.map(block => ({ ...block, done: true })), { id: ++blockId, lines: timed(raw.trim(), output), done: instant }].slice(-8);
    await tick();
    const last = logEl?.lastElementChild;
    if (logEl && last instanceof HTMLElement) {
      logEl.scrollTo({ top: Math.max(0, last.offsetTop - 12), behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /** @param {SubmitEvent} event Submit. */
  function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    history.push(text);
    historyAt = history.length;
    value = '';
    run(text, true);
  }

  /** @param {KeyboardEvent} event Keydown on the prompt. */
  function keydown(event) {
    const atEnd = inputEl && inputEl.selectionStart === value.length;
    if ((event.key === 'Tab' && !event.shiftKey) || (event.key === 'ArrowRight' && atEnd)) {
      if (!ghost) return;
      event.preventDefault();
      value = suggestion;
    } else if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyAt = Math.max(0, historyAt - 1);
      value = history[historyAt] ?? '';
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyAt = Math.min(history.length, historyAt + 1);
      value = history[historyAt] ?? '';
    } else if (event.key === 'Escape' && value) {
      value = '';
    }
  }

  const activeCommand = $derived(commandByName(active));
  const lit = $derived(new Set(activeCommand?.nodes ?? []));
  /** In-terminal strip: the nodes inside the JVM, then the stores. */
  const IN_JVM = ['netty', 'handler', 'gameplay'];
  const STORES = ['couchbase', 'redis', 'kafka'];
</script>

<div class="frame">
<div class="term" id="craft-terminal" tabindex="-1">
  <header class="bar">
    <span class="label who">tty/craft</span>
    <span class="now label" aria-hidden="true">{activeCommand ? activeCommand.title : 'idle'}</span>
    {#if mode === 'manual'}
      <button type="button" class="label mode resume" onclick={onresume}>Resume tour</button>
    {:else}
      <span class="label mode">{mode === 'tour' ? 'Scroll tour' : 'Interactive'}</span>
    {/if}
    <span class="progress" aria-hidden="true"></span>
  </header>

  <div class="strip" aria-hidden="true">
    <span class="s-node" class:on={lit.has('load')} class:off={!lit.has('load')}>load</span>
    <span class="s-arrow">›</span>
    <span class="s-node" class:on={lit.has('client')}>client</span>
    <span class="s-arrow">›</span>
    <span class="s-jvm" class:on={lit.has('jvm')}>
      {#each IN_JVM as id, i (id)}
        {#if i}<span class="s-arrow">›</span>{/if}<span class="s-node" class:on={lit.has(id)}>{id}</span>
      {/each}
    </span>
    <span class="s-arrow">›</span>
    {#each STORES as id (id)}<span class="s-node store" class:on={lit.has(id)}>{id}</span>{/each}
  </div>

  <div class="chips" role="group" aria-label="Run a command">
    {#each COMMANDS as command, i (command.name)}
      <button
        type="button"
        class="chip"
        aria-pressed={active === command.name}
        aria-label="Run {command.name}: {command.title}"
        onclick={() => run(command.name, true)}
      >
        <span class="idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{command.name}
      </button>
    {/each}
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="log" role="log" aria-live={mode === 'tour' ? 'off' : 'polite'} aria-label="Craft terminal output" tabindex="0" bind:this={logEl} data-lenis-prevent data-cursor="type">
    {#if !blocks.length}
      <p class="hint">Pick a command above, or type <b>help</b> below.</p>
    {/if}
    {#each blocks as block (block.id)}
      <div class="block" class:done={block.done}>
        {#each block.lines as line, li (li)}
          <p class="line {line.kind}" style="--delay:{line.delay}s; --dur:{line.dur}s; --steps:{line.steps}">
            {#if line.kind === 'in'}
              <span class="ps" aria-hidden="true">$</span> <span class="cmd">{line.text}</span>
            {:else}
              {#if line.kind === 'cmt'}<span class="mk" aria-hidden="true">#</span>{/if}
              {#if line.kind === 'step'}<span class="mk" aria-hidden="true">›</span>{/if}
              {#if line.kind === 'ok'}<span class="mk ok-mk">ok</span>{/if}
              {#if line.kind === 'err'}<span class="mk" aria-hidden="true">!</span>{/if}
              <span class="txt">{#each segments(line.text) as part, pi (pi)}{#if part.tool}<b>{part.text}</b>{:else}{part.text}{/if}{/each}</span>
            {/if}
          </p>
        {/each}
      </div>
    {/each}
  </div>

  <form class="prompt" onsubmit={submit} data-cursor="type">
    <label class="ps" for="craft-input"><span aria-hidden="true">$</span><span class="sr">Type a command</span></label>
    <span class="field">
      <span class="ghost" aria-hidden="true"><span class="typed">{value}</span>{ghost}</span>
      <input
        id="craft-input"
        bind:this={inputEl}
        bind:value
        onkeydown={keydown}
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="go"
        aria-describedby="craft-keys"
        placeholder="help"
      />
    </span>
    <span class="keys label" id="craft-keys">Tab completes · ↑↓ history · Enter runs</span>
  </form>
</div>
</div>

<style>
  .frame {
    position: relative;
    height: 100%;
  }
  /* Riso halftone offset shadow, the page's print motif. */
  .frame::before {
    content: "";
    position: absolute;
    inset: 14px -14px -14px 14px;
    background: radial-gradient(circle, var(--ink) 1px, transparent 1.5px) 0 0 / 5px 5px;
    opacity: 0.55;
  }
  .term {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 26rem;
    background: var(--paper-2);
    border: 1px solid var(--ink);
    font: 400 0.875rem/1.6 var(--font-mono-stack);
    color: var(--ink);
    outline: none;
  }

  .bar {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--s-3);
    padding: var(--s-3) var(--s-4);
    border-bottom: 1px solid var(--ink);
    background: var(--ink);
  }
  .bar .label { color: var(--paper); }
  .bar .now { text-align: center; font-weight: 700; }
  .resume {
    min-height: 36px;
    padding: 0 var(--s-2);
    border: 1px solid var(--paper);
    background: transparent;
  }
  .resume:hover { background: var(--paper); color: var(--ink); }
  .who::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: var(--s-2);
    background: var(--accent);
    vertical-align: 1px;
  }
  .progress {
    position: absolute;
    left: 0;
    bottom: -1px;
    height: 3px;
    width: 100%;
    background: var(--accent);
    transform-origin: 0 50%;
    transform: scaleX(var(--flow, 0));
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s-2);
    padding: var(--s-3) var(--s-4);
    border-bottom: 1px solid var(--line);
  }
  .chip {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-height: 36px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font: 500 0.8125rem/1.4 var(--font-mono-stack);
    transition: background var(--d-fast), border-color var(--d-fast), color var(--d-fast), transform var(--d-fast) var(--ease-snap);
  }
  .chip .idx { color: var(--ink-2); font-size: 0.75rem; }
  .chip:hover { border-color: var(--ink); transform: translateY(-2px); }
  .chip[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .chip[aria-pressed="true"] .idx { color: var(--paper); }

  .log {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: var(--s-4);
    scrollbar-width: thin;
    scrollbar-color: var(--ink-2) transparent;
  }
  .log:focus-visible { outline: 2px solid var(--accent-text); outline-offset: -2px; }
  .hint { margin: 0; color: var(--ink-2); }
  .hint b { color: var(--ink); }
  .block + .block { margin-top: var(--s-4); }
  .block.done .ps { color: var(--ink-2); }
  .line {
    margin: 0;
    display: grid;
    grid-template-columns: 2.2ch 1fr;
    animation: type var(--dur) steps(var(--steps), end) var(--delay) both;
  }
  .block.done .line { animation: none; }
  @keyframes type {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  /* Output prints whole lines, as a terminal does; a clip would uncover every wrapped row at once. */
  .line:not(.in) { animation: print var(--dur) var(--ease-out) var(--delay) both; }
  @keyframes print {
    from { opacity: 0; transform: translateX(-0.6ch); }
  }
  .line.in { margin-bottom: 2px; font-weight: 700; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ps { color: var(--accent-text); font-weight: 700; }
  .mk { color: var(--ink-2); }
  .cmt .txt { color: var(--ink-2); font-style: italic; }
  .step .mk { color: var(--accent-text); font-weight: 700; }
  .ok .ok-mk {
    align-self: start;
    margin-top: 3px;
    padding: 0 3px;
    font-size: 0.7rem;
    line-height: 1.5;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--accent);
    color: var(--accent-ink);
  }
  .ok { grid-template-columns: auto 1fr; column-gap: 1ch; }
  .ok .txt { font-weight: 600; }
  .err .txt, .err .mk { color: var(--accent-text); }
  .out { display: block; }
  .out .txt { white-space: pre-wrap; }
  .txt b {
    font-weight: 700;
    color: var(--ink);
    background: color-mix(in oklch, var(--accent) 16%, transparent);
    padding-inline: 2px;
  }

  .prompt {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: var(--s-2);
    padding: var(--s-3) var(--s-4);
    border-top: 1px solid var(--ink);
    background: var(--paper);
  }
  .field { position: relative; display: block; }
  .field input, .ghost {
    font: 500 1rem/1.5 var(--font-mono-stack);
    letter-spacing: 0;
  }
  .field input {
    position: relative;
    width: 100%;
    min-height: 32px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    caret-color: var(--accent);
    outline: none;
  }
  .field input::placeholder { color: var(--ink-2); }
  .ghost {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    white-space: pre;
    color: var(--ink-2);
    pointer-events: none;
    overflow: hidden;
  }
  .ghost .typed { visibility: hidden; }
  .prompt:focus-within { box-shadow: inset 0 0 0 2px var(--accent-text); }
  .keys { grid-column: 1 / -1; margin-top: 2px; text-transform: none; letter-spacing: 0.02em; }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Lit-node strip: only where the figure is out of view (stacked layout). */
  .strip {
    display: none;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
    padding: var(--s-2) var(--s-3);
    border-bottom: 1px solid var(--line);
    font: 600 0.625rem/1.2 var(--font-mono-stack);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .s-node {
    padding: 3px 5px;
    border: 1px solid var(--ink-2);
    color: var(--ink);
    transition: background var(--d-fast), color var(--d-fast), border-color var(--d-fast);
  }
  .s-node.off { border-style: dashed; color: var(--ink-2); }
  .s-node.on { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  .s-node.store + .s-node.store { margin-left: -1px; }
  .s-arrow { color: var(--ink-2); }
  .s-jvm {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 2px;
    border: 1px dashed var(--ink-2);
  }
  .s-jvm.on { border: 2px solid var(--accent); }

  /* Wide stage: the log may hold its own scroll. Narrower, a swipe hands back to the page
     (this overrides Lenis's own `contain` on [data-lenis-prevent]). */
  @media (max-width: 1199px) {
    .log { overscroll-behavior: auto; }
  }
  @media (max-width: 767px) {
    .strip { display: flex; }
    .term { min-height: 0; }
    .log { flex: none; height: 15rem; }
  }

  @media (max-width: 479px) {
    .bar .now { display: none; }
    .bar { grid-template-columns: 1fr auto; }
    .log { padding: var(--s-3); }
    .term { font-size: 0.8125rem; }
    .frame::before { inset: 8px -8px -8px 8px; }
  }
</style>
