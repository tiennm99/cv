<script>
  import { SECTIONS } from '../lib/sections.js';
  import { ui } from '../lib/ui.svelte.js';
  import { scrollToId } from '../lib/motion/runtime.js';
  import LiveChip from './LiveChip.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  /** @type {{ sections?: typeof SECTIONS }} */
  let { sections = SECTIONS } = $props();

  const activeIndex = $derived(Math.max(0, sections.findIndex(section => section.id === ui.active)));
  const current = $derived(sections[activeIndex]);

  /**
   * @param {MouseEvent} event Click.
   * @param {string} id Target id.
   */
  function jump(event, id) {
    event.preventDefault();
    scrollToId(id);
  }

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
</script>

<header class="bar">
  <a class="monogram" href="#top" onclick={event => { event.preventDefault(); scrollToId('top'); }} aria-label="miti99, back to top">
    miti<b>99</b>
  </a>

  <nav class="ruler" aria-label="Sections">
    <ol>
      {#each sections as section, index (section.id)}
        <li>
          <a
            href={`#${section.id}`}
            aria-current={index === activeIndex ? 'location' : undefined}
            onclick={event => jump(event, section.id)}
          >
            <span class="num">{section.num}</span><span class="name">{section.label}</span>
          </a>
        </li>
      {/each}
    </ol>
    <span class="progress" aria-hidden="true"></span>
  </nav>

  <p class="compact label" aria-hidden="true">{current?.num ?? '01'}/{String(SECTIONS.length).padStart(2, '0')}</p>

  <div class="tools">
    <LiveChip />
    <button class="kbd" type="button" onclick={() => (ui.paletteOpen = true)} aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K /">
      <span class="wide"><kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd></span>
      <span class="narrow">Menu</span>
    </button>
    <ThemeToggle />
  </div>
</header>

<style>
  .bar {
    position: fixed;
    inset: 0 0 auto 0;
    height: var(--bar-h);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: var(--s-4);
    padding-inline: var(--gutter);
    background: color-mix(in oklch, var(--paper) 86%, transparent);
    backdrop-filter: blur(10px) saturate(1.2);
    border-bottom: 1px solid var(--line);
  }
  .monogram {
    font: 800 1.2rem/1 var(--font-display-stack);
    font-variation-settings: "wdth" 120;
    text-decoration: none;
    letter-spacing: -0.01em;
    flex: none;
  }
  .monogram b { color: var(--accent-text); font-weight: inherit; }

  .ruler { position: relative; flex: 1; min-width: 0; display: none; height: 100%; }
  .ruler ol { display: flex; justify-content: center; gap: var(--s-1); height: 100%; margin: 0; padding: 0; list-style: none; }
  .ruler a {
    display: flex;
    align-items: center;
    gap: var(--s-1);
    height: 100%;
    padding-inline: var(--s-2);
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink-2);
  }
  .ruler a:hover, .ruler a[aria-current] { color: var(--ink); }
  .ruler a[aria-current] .num { color: var(--accent-text); }
  .ruler .name { display: none; }
  @media (min-width: 1440px) {
    .ruler .name { display: inline; }
  }
  .progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: var(--accent);
    transform-origin: 0 50%;
    transform: scaleX(var(--progress, 0));
  }
  @supports (animation-timeline: scroll()) {
    .progress {
      animation: grow linear both;
      animation-timeline: scroll(root block);
    }
  }
  @keyframes grow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  .compact { margin: 0 0 0 auto; color: var(--ink); }
  .tools { display: flex; align-items: center; gap: var(--s-2); flex: none; }
  .kbd {
    display: inline-flex;
    align-items: center;
    gap: var(--s-1);
    min-height: 36px;
    min-width: 44px;
    padding: 0 var(--s-3);
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .kbd:hover { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  .kbd kbd { font: inherit; }
  .kbd .wide { display: none; gap: 2px; }

  @media (min-width: 768px) {
    .ruler { display: block; }
    .compact { display: none; }
    .kbd .wide { display: inline-flex; }
    .kbd .narrow { display: none; }
  }
</style>
