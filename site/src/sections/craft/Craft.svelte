<script>
  /**
   * 04 Craft: production forensics and real-time systems.
   * Heading typed at a prompt; a sticky terminal on the left runs scripted method
   * logs; a simplified flow diagram on the right lights the nodes of the active
   * command while scroll scrubs packet pulses along its paths. On wide screens with
   * motion on, scrolling through the stage tours the six commands until the visitor
   * takes over. All scroll work writes one custom property; nothing reads layout
   * per frame.
   */
  import { untrack } from 'svelte';
  import { sectionMotion } from '../../lib/motion/runtime.js';
  import { inView } from '../../lib/motion/actions.js';
  import { profile } from '../../lib/profile.js';
  import { COMMANDS, commandByName, segments } from './craft-data.js';
  import Terminal from './Terminal.svelte';
  import FlowDiagram from './FlowDiagram.svelte';

  const TITLE = ['production forensics', '& real-time systems'];
  const TOTAL = TITLE.reduce((sum, line) => sum + line.length, 0);

  const zingplay = profile.experience[0];
  const pick = (/** @type {string} */ needle) => zingplay?.highlights.find(item => item.text.includes(needle))?.text ?? '';
  const forensics = pick('thread dumps');
  const quality = pick('packet handlers');

  let active = $state('');
  /** @type {'tour' | 'manual' | 'free'} */
  let mode = $state('free');
  let tourOn = $state(false);
  let isReduced = $state(false);
  let typed = $state(TOTAL);
  let live = $state(false);
  let started = false;
  let chapter = 0;

  /** @type {{ run: (raw: string, manual?: boolean, instant?: boolean) => Promise<void> } | null} */
  let term = $state(null);
  /** @type {HTMLElement | null} */
  let titleEl = $state(null);
  /** @type {HTMLElement | null} */
  let stageEl = $state(null);
  /** @type {HTMLElement | null} */
  let figureEl = $state(null);

  const current = $derived(commandByName(active) ?? null);
  /** Typed characters per heading line. */
  const shown = $derived.by(() => {
    let left = typed;
    return TITLE.map(line => {
      const count = Math.max(0, Math.min(line.length, left));
      left -= line.length;
      return count;
    });
  });
  const caretLine = $derived.by(() => {
    const open = shown.findIndex((count, i) => count < TITLE[i].length);
    return open === -1 ? TITLE.length - 1 : open;
  });

  /**
   * @param {string} name Command picked.
   * @param {boolean} manual True when the visitor chose it.
   */
  function select(name, manual) {
    active = name;
    if (manual && tourOn) mode = 'manual';
  }

  function resume() {
    mode = 'tour';
    term?.run(COMMANDS[chapter].name);
  }

  /** First run when the terminal first shows up. */
  function start() {
    if (started || active) return;
    started = true;
    term?.run(COMMANDS[chapter].name);
  }

  /** @type {(ctx: import('../../lib/motion/runtime.js').MotionContext) => () => void} */
  const setup = ctx => untrack(() => build(ctx));

  /** @type {(ctx: import('../../lib/motion/runtime.js').MotionContext) => () => void} */
  const build = ({ node, reduced, gsap, ScrollTrigger }) => {
    isReduced = reduced;
    const mm = gsap.matchMedia();

    if (reduced) {
      typed = TOTAL;
      node.style.setProperty('--flow', '0.12');
    } else {
      typed = 0;
      const counter = { n: 0 };
      ScrollTrigger.create({
        trigger: titleEl,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(counter, {
          n: TOTAL,
          duration: TOTAL * 0.045,
          ease: `steps(${TOTAL})`,
          delay: 0.25,
          onUpdate: () => { typed = Math.round(counter.n); },
        }),
      });
    }

    mm.add({ wide: '(min-width: 1200px)', narrow: '(max-width: 1199px)' }, context => {
      const wide = Boolean(context.conditions?.wide);
      const tour = wide && !reduced;
      tourOn = tour;
      mode = tour ? 'tour' : 'free';
      if (reduced) return undefined;
      if (wide) {
        gsap.fromTo(node, { '--flow': 0 }, {
          '--flow': 1,
          ease: 'none',
          scrollTrigger: { trigger: stageEl, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
        });
        ScrollTrigger.create({
          trigger: stageEl,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: self => {
            const next = Math.min(COMMANDS.length - 1, Math.floor(self.progress * COMMANDS.length));
            if (next === chapter) return;
            const from = chapter;
            chapter = next;
            if (mode !== 'tour') return;
            // A fast scroll or a jump skips chapters: print those finished, so the log tells the whole story.
            const dir = Math.sign(next - from);
            for (let i = from + dir; i !== next; i += dir) term?.run(COMMANDS[i].name, false, true);
            term?.run(COMMANDS[next].name);
          },
        });
      } else {
        gsap.fromTo(node, { '--flow': 0 }, {
          '--flow': 1,
          ease: 'none',
          scrollTrigger: { trigger: figureEl, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
      }
      return () => { tourOn = false; };
    });

    return () => mm.revert();
  };
</script>

<section class="section craft" aria-labelledby="craft-title" use:sectionMotion={setup}>
  <div class="cols" aria-hidden="true">{#each { length: 12 } as _, i (i)}<i></i>{/each}</div>

  <header class="head grid-12">
    <p class="label kicker">(04) Craft</p>
    <p class="label aside">Java game servers · JVM forensics</p>

    <div class="title-wrap">
      <p class="path" aria-hidden="true"><span class="host">miti99</span>:<span class="dir">~/craft</span>$ whoami --craft</p>
      <h2 id="craft-title" class="title" bind:this={titleEl}>
        <span class="sr">Production forensics and real-time systems</span>
        <span class="vis" aria-hidden="true">
          <span class="sign">$</span>
          {#each TITLE as line, i (i)}
            <span class="tl">
              <span class="ghost">{line}</span>
              <span class="typed">{line.slice(0, shown[i])}{#if i === caretLine}<span class="caret"></span>{/if}</span>
            </span>
          {/each}
        </span>
      </h2>
    </div>

    <div class="lead">
      {#if forensics}<p class="lead-1">{forensics}</p>{/if}
      {#if quality}<p class="lead-2">{quality}</p>{/if}
    </div>
  </header>

  <div class="stage" class:tour={tourOn} bind:this={stageEl}>
    <div class="pin grid-12">
      <div class="t-col" use:inView={{ once: true, threshold: 0.25, onChange: visible => { if (visible) start(); } }}>
        <Terminal bind:this={term} {active} reduced={isReduced} onselect={select} {mode} onresume={resume} />
        <p class="cap label">The method, illustrated: tools and steps from the CV, no production numbers.</p>
      </div>

      <figure class="f-col" bind:this={figureEl} use:inView={{ onChange: visible => { live = visible; } }}>
        <div class="fig-head">
          <span class="label">Fig. 04 · Request path, simplified</span>
          <span class="label step">{current ? `${String(COMMANDS.indexOf(current) + 1).padStart(2, '0')} / ${String(COMMANDS.length).padStart(2, '0')}` : '— / 06'}</span>
        </div>
        <FlowDiagram command={current} {live} />
        <figcaption>
          {#key active}
            <span class="active-title">{current ? current.title : 'Pick a command'}</span>
            {#if current}
              <span class="source"><span class="from">From the CV</span>“{#each segments(current.source) as part, pi (pi)}{#if part.tool}<b>{part.text}</b>{:else}{part.text}{/if}{/each}”</span>
            {:else}
              <span class="source">Each command lights the part of a game server it is about.</span>
            {/if}
          {/key}
          <span class="label note">A generic game-server path, not a map of a production system.</span>
        </figcaption>
      </figure>
    </div>
  </div>
</section>

<style>
  .craft { overflow-x: clip; }

  /* ---------- heading: typed at a prompt ---------- */
  .head { position: relative; row-gap: var(--s-5); }
  .kicker { grid-column: 1 / 7; margin: 0; color: var(--ink); }
  .aside { grid-column: 7 / -1; margin: 0; text-align: right; }
  .title-wrap { grid-column: 1 / -1; }
  .path {
    margin: 0 0 var(--s-3);
    font: 500 var(--t-sm)/1.4 var(--font-mono-stack);
    color: var(--ink-2);
  }
  .path .host { color: var(--ink); font-weight: 700; }
  .path .dir { color: var(--accent-text); }
  .title {
    margin: 0;
    font: 700 clamp(1.5rem, 0.8rem + 4.6vw, 6rem)/1.02 var(--font-mono-stack);
    letter-spacing: -0.045em;
    color: var(--ink);
  }
  .vis { position: relative; display: block; padding-left: 1.1ch; }
  .sign { position: absolute; left: 0; top: 0; color: var(--accent); }
  .tl { display: grid; }
  .tl > span { grid-area: 1 / 1; white-space: pre-wrap; }
  .ghost { visibility: hidden; }
  .caret {
    display: inline-block;
    width: 0.56em;
    height: 0.86em;
    margin-left: 0.04em;
    margin-right: -0.6em;
    vertical-align: -0.06em;
    background: var(--accent);
    animation: blink 1.05s steps(1) infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .lead {
    grid-column: 6 / -1;
    display: grid;
    gap: var(--s-4);
    max-width: 62ch;
  }
  .lead p { margin: 0; }
  .lead-1 { font-size: var(--t-lg); line-height: 1.45; color: var(--ink); }
  .lead-2 { font-size: var(--t-md); color: var(--ink-2); }

  /* ---------- stage ---------- */
  .stage { position: relative; margin-top: var(--s-8); }
  .pin { row-gap: var(--s-7); align-items: start; }
  .t-col { grid-column: 1 / -1; display: grid; gap: var(--s-4); }
  .t-col :global(.frame) { height: 30rem; }
  .f-col { grid-column: 1 / -1; margin: 0; display: grid; gap: var(--s-4); align-content: start; }
  .cap { margin: 0; text-transform: none; letter-spacing: 0.01em; }

  .fig-head {
    display: flex;
    justify-content: space-between;
    gap: var(--s-4);
    padding-bottom: var(--s-2);
    border-bottom: 1px solid var(--ink);
  }
  .fig-head .label { color: var(--ink); }
  .step { font-variant-numeric: tabular-nums; white-space: nowrap; }

  figcaption {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-1);
    padding-top: var(--s-3);
    border-top: 1px solid var(--line);
  }
  .active-title {
    font: 820 var(--t-xl)/0.9 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 74;
    text-transform: uppercase;
    animation: swap var(--d-slow) var(--ease-out) both;
  }
  .source { color: var(--ink); max-width: 60ch; animation: swap var(--d-slow) var(--ease-out) 60ms both; }
  .from { display: block; margin-bottom: 2px; color: var(--ink-2); font-family: var(--font-mono-stack); font-size: var(--t-xs); text-transform: uppercase; letter-spacing: 0.04em; }
  .source b { font-weight: 650; background: color-mix(in oklch, var(--accent) 16%, transparent); padding-inline: 2px; }
  .note { margin-top: var(--s-2); text-transform: none; letter-spacing: 0.01em; }
  @keyframes swap {
    from { opacity: 0; transform: translateY(8px); font-variation-settings: "wght" 300, "wdth" 130; }
  }

  @media (min-width: 768px) {
    .lead { grid-column: 5 / -1; }
  }
  /* Tablets and small laptops: terminal and diagram side by side, the terminal held in view. */
  @media (min-width: 768px) and (max-width: 1199px) {
    .t-col {
      grid-column: 1 / 7;
      position: sticky;
      top: calc(var(--bar-h) + var(--s-4));
    }
    .f-col { grid-column: 7 / -1; }
    .t-col :global(.frame) { height: min(34rem, calc(100svh - var(--bar-h) - 120px)); }
    .f-col :global(svg) { max-height: min(36rem, calc(100svh - var(--bar-h) - 200px)); }
  }
  @media (max-width: 767px) {
    .t-col :global(.frame) { height: auto; }
    .lead { grid-column: 1 / -1; }
    .aside { display: none; }
    .kicker { grid-column: 1 / -1; }
  }

  @media (min-width: 1200px) {
    .t-col { grid-column: 1 / 6; }
    .f-col { grid-column: 6 / -1; padding-left: var(--s-6); }
    .t-col :global(.frame) { height: min(40rem, calc(100svh - var(--bar-h) - 160px)); }

    /* Scroll tour: the stage gets scroll length and the pair stays in view. */
    .stage.tour { height: 300svh; }
    .stage.tour .pin {
      position: sticky;
      top: calc(var(--bar-h) + var(--s-5));
      height: calc(100svh - var(--bar-h) - var(--s-5) - var(--s-5));
      grid-template-rows: minmax(0, 1fr);
    }
    .stage.tour .t-col { height: 100%; grid-template-rows: minmax(0, 1fr) auto; }
    .stage.tour .t-col :global(.frame) { height: 100%; }
    .stage.tour .t-col :global(.term) { min-height: 0; }
    .stage.tour .f-col :global(.flow) { align-self: center; }
    .stage.tour .f-col { height: 100%; grid-template-rows: auto minmax(0, 1fr) auto; }
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
