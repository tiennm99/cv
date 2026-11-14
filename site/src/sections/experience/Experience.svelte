<script>
  /**
   * 03 Experience: "keeping live games alive".
   * Wide screens with motion on: the stage pins and five panels scrub sideways
   * (track.js), with a rotated heading at the left edge that fills vermilion as
   * the track advances, a hairline rail with dot buttons, panel titles that widen
   * on arrival, drag, arrow keys and focus-follow. Under 1024px or reduced motion
   * the same markup is a plain vertical stack.
   */
  import { sectionMotion } from '../../lib/motion/runtime.js';
  import { yearsSince } from '../../lib/time.js';
  import { createTrack } from './track.js';
  import { PANELS, zingplay, chaos, live, quality, ai } from './panels.js';

  const years = yearsSince(zingplay.start);

  let active = $state(0);
  /** Horizontal (pinned) mode; panels are focus targets only here. */
  let horizontal = $state(false);
  let stops = $state(PANELS.map((_, index) => index / (PANELS.length - 1)));
  /** @type {ReturnType<typeof createTrack> | null} */
  let ctrl = null;
  /** @type {HTMLElement[]} */
  const panelEls = [];
  /** @type {HTMLButtonElement[]} */
  const stopEls = $state([]);

  /**
   * @param {number} index Panel index.
   * @returns {void}
   */
  const go = index => ctrl?.goTo(index);

  /**
   * Arrow keys step the track. On the rail the dots are a roving-tabindex group:
   * arrows, Home and End move focus to the target panel's dot as well.
   * @param {KeyboardEvent} event Key on anything inside the section.
   */
  function onkeydown(event) {
    if (!ctrl || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const last = PANELS.length - 1;
    const stop = stopEls.indexOf(/** @type {HTMLButtonElement} */ (event.target));
    const from = stop >= 0 ? stop : ctrl.nearest();
    /** @type {Record<string, number>} */
    const keys = { ArrowRight: from + 1, ArrowLeft: from - 1 };
    if (stop >= 0) Object.assign(keys, { Home: 0, End: last });
    if (!(event.key in keys)) return;
    const next = Math.max(0, Math.min(last, keys[event.key]));
    event.preventDefault();
    ctrl.goTo(next);
    (stop >= 0 ? stopEls[next] : panelEls[next])?.focus({ preventScroll: true });
  }

  /** @param {FocusEvent} event Focus moving into the section. */
  function onfocusin(event) {
    if (!ctrl) return;
    const panel = /** @type {Element} */ (event.target).closest('[data-panel]');
    const index = panel ? panelEls.indexOf(/** @type {HTMLElement} */ (panel)) : -1;
    if (index >= 0 && index !== ctrl.nearest()) ctrl.goTo(index);
  }

  /**
   * Builds the motion for the current mode; reverted and rebuilt on motion toggle.
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   * @returns {() => void} Cleanup.
   */
  const setup = ({ node, reduced, gsap, ScrollTrigger }) => {
    const mm = gsap.matchMedia();
    const viewport = /** @type {HTMLElement} */ (node.querySelector('[data-viewport]'));
    // Looping decorations (probe pulse, CI packet) run only while the section is on screen.
    ScrollTrigger.create({
      trigger: node,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => { if (self.isActive) node.dataset.visible = ''; else delete node.dataset.visible; },
    });
    mm.add('(min-width: 1024px)', () => {
      if (reduced) return undefined;
      node.dataset.mode = 'h';
      horizontal = true;
      viewport.dataset.cursor = 'drag';
      ctrl = createTrack({
        node,
        gsap,
        ScrollTrigger,
        onActive: index => { active = index; },
        onStops: next => { if (next.some((value, index) => Math.abs(value - stops[index]) > 0.001)) stops = next; },
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
      // Resize events fire before media-query changes in the same frame, so this snapshot
      // still sees the pinned track when the breakpoint flips and the pin is reverted.
      let pinnedPanel = -1;
      const snapshot = () => { pinnedPanel = node.dataset.pinned === 'true' && ctrl ? ctrl.current() : -1; };
      addEventListener('resize', snapshot);
      return () => {
        // Leaving the pinned mode mid-track (resize): keep the panel the reader was on in view.
        removeEventListener('resize', snapshot);
        const keep = pinnedPanel;
        ctrl?.destroy();
        ctrl = null;
        delete node.dataset.mode;
        delete viewport.dataset.cursor;
        horizontal = false;
        active = 0;
        if (keep >= 0) requestAnimationFrame(() => requestAnimationFrame(() => panelEls[keep]?.scrollIntoView({ block: 'start' })));
      };
    });
    mm.add('(max-width: 1023.98px)', () => {
      if (reduced) return;
      for (const panel of panelEls) {
        gsap.from(panel.querySelectorAll('[data-in]'), {
          opacity: 0,
          y: 32,
          duration: 0.9,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
        });
      }
    });
    return () => {
      mm.revert();
      delete node.dataset.visible;
    };
  };
</script>

<!-- Arrow keys move the track; panels are its focus stops (horizontal mode only). -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class="xp" aria-labelledby="experience-title" use:sectionMotion={setup} {onkeydown} {onfocusin}>
  <div class="stage" data-stage>
    <header class="spine">
      <p class="label spine-num">(03) Experience</p>
      <h2 id="experience-title" class="spine-title display">
        <span class="spine-base"><span class="ln">Keeping live</span> <span class="ln">games alive<span class="dot">.</span></span></span>
        <span class="spine-fill" data-heading-fill aria-hidden="true"><span class="ln">Keeping live</span> <span class="ln">games alive<span class="dot">.</span></span></span>
      </h2>
      <p class="label spine-foot">{zingplay.from} → {zingplay.to}</p>
    </header>

    <div class="viewport" data-viewport data-cursor-label="Drag">
      <ol class="track" data-track aria-label="Five panels about the work at {zingplay.company}">
        <!-- 1 · ZingPlay: the arc -->
        <li class="slot s-0">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <article id={PANELS[0].id} class="panel" data-panel tabindex={horizontal ? 0 : undefined} aria-labelledby="{PANELS[0].id}-t" bind:this={panelEls[0]}>
            <div class="p-top">
              <div class="p-head" data-in><span class="label">03.1</span><span class="label">{PANELS[0].kind}</span></div>
              <h3 id="{PANELS[0].id}-t" class="p-title display" data-title><span class="ln">ZingPlay</span></h3>
              <span class="numeral" data-numeral aria-hidden="true">01</span>
            </div>
            <p class="z-co" data-in>Game Studios, VNG Corp. · {zingplay.location}</p>

            <p class="z-range" data-in>
              <span class="sr-only">From {zingplay.from} to the present.</span>
              <span class="z-y" aria-hidden="true"><small>Jul</small>2020</span>
              <span class="z-arrow" aria-hidden="true"><i></i></span>
              <span class="z-y z-now" aria-hidden="true">Now<span class="dot">.</span></span>
            </p>

            <div class="z-foot">
              <ol class="z-ladder" data-in aria-label="Role progression">
                <li><span class="label">Started as</span><span class="z-role z-from">Entry-level game programmer</span></li>
                <li><span class="label">Today</span><span class="z-role"><span class="z-up" aria-hidden="true">↗</span>{zingplay.position}</span></li>
              </ol>
              <p class="z-years" data-in><span class="z-n">{years}</span><span>years building and maintaining Java backends for multiplayer games.</span></p>
            </div>
            <p class="caption h-hide" data-in>{zingplay.summary}</p>
          </article>
        </li>

        <!-- 2 · Chaos Age 2: systems + spec sheet -->
        <li class="slot s-1">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <article id={PANELS[1].id} class="panel" data-panel tabindex={horizontal ? 0 : undefined} aria-labelledby="{PANELS[1].id}-t" bind:this={panelEls[1]}>
            <div class="p-top">
              <div class="p-head" data-in><span class="label">03.2</span><span class="label">{PANELS[1].kind}</span></div>
              <h3 id="{PANELS[1].id}-t" class="p-title display" data-title><span class="ln">Chaos Age 2</span></h3>
              <span class="numeral" data-numeral aria-hidden="true">02</span>
            </div>
            <p class="c-role" data-in><span class="pip" aria-hidden="true"></span>{chaos.role}</p>

            <div class="c-grid">
              <div data-in>
                <p class="label c-cap">What I build</p>
                <ol class="c-systems">
                  {#each chaos.systems as system, index (system)}
                    <li><span class="c-i">{String(index + 1).padStart(2, '0')}</span><span class="c-s">{system}</span></li>
                  {/each}
                </ol>
              </div>
              <div data-in>
                <p class="label c-cap">Stack</p>
                <dl class="c-spec">
                  {#each chaos.stack as row (row.k)}
                    <div><dt class="label">{row.k}</dt><dd>{row.v}</dd></div>
                  {/each}
                </dl>
                {#if chaos.store}
                  <a class="btn store" href={chaos.store} target="_blank" rel="noopener" data-cursor="link">Chaos Age 2 on Google Play <span aria-hidden="true">↗</span></a>
                {/if}
              </div>
            </div>
          </article>
        </li>

        <!-- 3 · Live games: the roster + forensics -->
        <li class="slot s-2">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <article id={PANELS[2].id} class="panel" data-panel tabindex={horizontal ? 0 : undefined} aria-labelledby="{PANELS[2].id}-t" bind:this={panelEls[2]}>
            <div class="p-top">
              <div class="p-head" data-in><span class="label">03.3</span><span class="label">{PANELS[2].kind}</span></div>
              <h3 id="{PANELS[2].id}-t" class="p-title display" data-title><span class="ln">Live games</span></h3>
              <span class="numeral" data-numeral aria-hidden="true">03</span>
            </div>
            <div class="g-grid">
              <ul class="g-list" data-in aria-label="Games maintained, with Google Play links">
                {#each live.games as game (game.name)}
                  <li>
                    <a class="g-link" href={game.store} target="_blank" rel="noopener" data-cursor="link">
                      <span class="g-name">{game.name}</span>
                      <span class="label g-store">Google Play <span aria-hidden="true">↗</span></span>
                    </a>
                  </li>
                {/each}
              </ul>
              <div class="g-side">
                <div data-in>
                  <p class="label c-cap">Maintained</p>
                  <ul class="tags">
                    {#each live.duties as duty (duty)}<li>{duty}</li>{/each}
                  </ul>
                </div>
                <div class="probe" data-in>
                  <p class="label probe-cap"><span class="pulse" aria-hidden="true"></span>High CPU · memory pressure</p>
                  <ol class="probe-list">
                    {#each live.forensics as tool, index (tool)}
                      <li style:--i={index}><span class="probe-i" aria-hidden="true">&gt;</span>{tool}{index === live.forensics.length - 1 ? ' that reproduce game-server workloads' : ''}</li>
                    {/each}
                    <li class="probe-out" style:--i={live.forensics.length}><span class="probe-i" aria-hidden="true">✓</span>{live.lead}</li>
                  </ol>
                </div>
              </div>
            </div>
          </article>
        </li>

        <!-- 4 · Engineering quality: a delivery line -->
        <li class="slot s-3">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <article id={PANELS[3].id} class="panel" data-panel tabindex={horizontal ? 0 : undefined} aria-labelledby="{PANELS[3].id}-t" bind:this={panelEls[3]}>
            <div class="p-top">
              <div class="p-head" data-in><span class="label">03.4</span><span class="label">{PANELS[3].kind}</span></div>
              <h3 id="{PANELS[3].id}-t" class="p-title display" data-title><span class="ln">Engineering</span> <span class="ln">quality</span></h3>
              <span class="numeral" data-numeral aria-hidden="true">04</span>
            </div>
            <p class="lead h-hide" data-in>{quality.line}</p>

            <ol class="line" aria-label="From code to delivery">
              {#each quality.stations as station, index (station.tool)}
                <li class="station" data-in style:--i={index}>
                  <span class="st-dot" aria-hidden="true"></span>
                  <span class="label st-n">{String(index + 1).padStart(2, '0')}</span>
                  <span class="st-tool">{station.tool}</span>
                  <span class="st-note">{station.note}</span>
                </li>
              {/each}
            </ol>
          </article>
        </li>

        <!-- 5 · AI tooling: the inverted finale card -->
        <li class="slot s-4">
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <article id={PANELS[4].id} class="panel" data-panel tabindex={horizontal ? 0 : undefined} aria-labelledby="{PANELS[4].id}-t" bind:this={panelEls[4]}>
            <div class="p-top">
              <div class="p-head" data-in><span class="label">03.5</span><span class="label">{PANELS[4].kind}</span></div>
              <h3 id="{PANELS[4].id}-t" class="p-title display" data-title><span class="ln">AI-assisted</span> <span class="ln">development</span></h3>
              <span class="numeral" data-numeral aria-hidden="true">05</span>
            </div>

            <div class="card" data-in>
              <p class="card-k">Internal · Claude Code</p>
              <p class="card-t">Plugin &amp; skill marketplace</p>
              <ul class="card-facts">
                {#each ai.facts as fact (fact)}<li>{fact}</li>{/each}
              </ul>
            </div>
            <p class="caption h-hide" data-in>{ai.line}</p>
          </article>
        </li>
      </ol>
    </div>

    <nav class="rail" data-rail aria-label="Experience panels">
      <span class="label count" aria-hidden="true"><b>{String(active + 1).padStart(2, '0')}</b> / {String(PANELS.length).padStart(2, '0')}</span>
      <div class="rail-line">
        <span class="rail-track" aria-hidden="true"><span class="rail-fill" data-fill></span></span>
        {#each PANELS as panel, index (panel.id)}
          <button
            type="button"
            class="stop"
            bind:this={stopEls[index]}
            tabindex={active === index ? 0 : -1}
            style:left="{stops[index] * 100}%"
            aria-label="Panel {index + 1} of {PANELS.length}: {panel.short}"
            aria-current={active === index ? 'step' : undefined}
            onclick={() => go(index)}
          >
            <span class="stop-dot" aria-hidden="true"></span>
            <span class="label stop-label" aria-hidden="true">{panel.short}</span>
          </button>
        {/each}
      </div>
      <span class="label hint" aria-hidden="true">Drag · scroll · ← →</span>
    </nav>
  </div>
</section>

<style>
  /* ============ shared (both modes) ============ */
  .xp {
    position: relative;
    --rail-h: 76px;
    --spine-w: clamp(112px, 13vw, 232px);
  }
  .stage { position: relative; }
  .dot { color: var(--accent); }
  .ln { white-space: nowrap; }

  .spine-title { margin: 0; position: relative; }
  .spine-fill { display: none; }

  .panel {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--s-4);
    outline: none;
    isolation: isolate;
  }
  .panel:focus-visible { outline: 2px solid var(--accent-text); outline-offset: -2px; }
  /* Head + title + numeral: the numeral hangs below the title, right-aligned, so it
     never crosses the kind label or a widened title. */
  .p-top { position: relative; display: flex; flex-direction: column; gap: var(--s-4); }
  .p-head { display: flex; justify-content: space-between; gap: var(--s-4); border-top: 1px solid var(--ink); padding-top: var(--s-2); }
  .p-head .label:first-child { color: var(--ink); }
  .p-title {
    margin: 0;
    font-size: clamp(2.6rem, min(1rem + 6.4vw, 13svh), 8rem);
    font-variation-settings: "wght" 820, "wdth" 64;
    line-height: 0.84;
    display: flex;
    flex-direction: column;
  }
  .numeral {
    position: absolute;
    right: 0;
    top: calc(100% + var(--s-3));
    z-index: -1;
    font: 800 clamp(7rem, 3rem + 12vw, 18rem)/0.8 var(--font-display-stack);
    font-variation-settings: "wght" 900, "wdth" 50;
    color: transparent;
    -webkit-text-stroke: 1px var(--line);
    pointer-events: none;
    user-select: none;
    will-change: transform;
  }
  .lead { margin: 0; max-width: 44ch; font-size: var(--t-lg); line-height: 1.4; color: var(--ink); text-wrap: pretty; }
  .caption { margin: 0; max-width: 62ch; font-size: var(--t-sm); line-height: 1.55; color: var(--ink-2); }

  /* --- 1 ZingPlay --- */
  .z-co { margin: 0; font-size: var(--t-lg); color: var(--ink); }
  .z-range {
    margin: var(--s-2) 0 0;
    display: flex;
    align-items: flex-end;
    gap: var(--s-4);
    font: 820 clamp(2.6rem, 1rem + 9vw, 10rem)/0.8 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 70;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
  .z-y { display: inline-flex; align-items: flex-start; gap: 0.08em; }
  .z-y small { font: 500 var(--t-xs)/1 var(--font-mono-stack); letter-spacing: 0.04em; color: var(--ink-2); padding-top: 0.4em; }
  .z-now { font-variation-settings: "wght" 260, "wdth" 128; }
  .z-arrow { flex: 1; min-width: 28px; height: 0.42em; position: relative; }
  .z-arrow i { position: absolute; left: 0; right: 0.1em; top: 50%; border-top: 2px solid var(--ink); transform-origin: left; }
  .z-arrow i::after { content: ""; position: absolute; right: -2px; top: -7px; width: 12px; height: 12px; border-top: 2px solid var(--ink); border-right: 2px solid var(--ink); transform: rotate(45deg); }
  .z-foot { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--s-6); align-items: end; border-top: 1px solid var(--line); padding-top: var(--s-4); }
  .z-ladder { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-3); }
  .z-ladder li { display: grid; gap: 2px; }
  .z-role { font-size: var(--t-lg); font-weight: 600; }
  .z-from { color: var(--ink-2); font-weight: 400; }
  .z-up { color: var(--accent-text); margin-right: 0.3em; font-weight: 700; }
  .z-years { margin: 0; display: flex; align-items: flex-end; gap: var(--s-3); font-size: var(--t-sm); line-height: 1.4; color: var(--ink-2); }
  .z-n { font: 820 clamp(3rem, 2rem + 3vw, 5.4rem)/0.78 var(--font-display-stack); color: var(--accent); }

  /* --- 2 Chaos Age 2 --- */
  .c-role { margin: 0; display: flex; align-items: center; gap: var(--s-3); font-size: var(--t-lg); font-weight: 600; }
  .pip { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); flex: none; }
  .c-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: var(--s-7); }
  .c-cap { margin: 0 0 var(--s-2); }
  .c-systems { list-style: none; margin: 0; padding: 0; counter-reset: none; }
  .c-systems li { display: flex; align-items: baseline; gap: var(--s-4); padding: var(--s-2) 0; border-top: 1px solid var(--line); }
  .c-systems li:last-child { border-bottom: 1px solid var(--line); }
  .c-i { font: 500 var(--t-xs)/1 var(--font-mono-stack); color: var(--ink-2); }
  .c-s { font: 700 clamp(1.6rem, 1rem + 2vw, 3.2rem)/1 var(--font-display-stack); font-variation-settings: "wght" 700, "wdth" 80; text-transform: uppercase; transition: font-variation-settings var(--d-med) var(--ease-out), color var(--d-fast); }
  .c-systems li:hover .c-s { font-variation-settings: "wght" 380, "wdth" 125; }
  .c-spec { margin: 0 0 var(--s-5); display: grid; }
  .c-spec div { display: grid; grid-template-columns: 7.5em 1fr; gap: var(--s-3); padding: var(--s-2) 0; border-top: 1px dashed var(--line); align-items: baseline; }
  .c-spec dd { margin: 0; font: 500 var(--t-md)/1.3 var(--font-mono-stack); color: var(--ink); }
  .store { text-decoration: none; }

  /* --- 3 Live games --- */
  .g-grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: var(--s-7); align-items: start; }
  .g-list { list-style: none; margin: 0; padding: 0; }
  .g-link { display: flex; align-items: baseline; justify-content: space-between; gap: var(--s-4); padding: var(--s-2) 0; border-top: 1px solid var(--ink); text-decoration: none; }
  .g-list li:last-child .g-link { border-bottom: 1px solid var(--ink); }
  .g-name {
    font: 820 clamp(2.4rem, min(1rem + 5.6vw, 12svh), 7.4rem)/0.9 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 72;
    text-transform: uppercase;
    transition: font-variation-settings var(--d-slow) var(--ease-out), color var(--d-fast);
  }
  .g-link:hover .g-name, .g-link:focus-visible .g-name { font-variation-settings: "wght" 300, "wdth" 132; color: var(--accent); }
  .g-store { flex: none; }
  .g-link:hover .g-store, .g-link:focus-visible .g-store { color: var(--ink); }
  .g-side { display: grid; gap: var(--s-5); }
  .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .tags li { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 999px; font-size: var(--t-sm); }
  .probe { background: var(--paper-2); border: 1px solid var(--line); padding: var(--s-4); }
  .probe-cap { margin: 0 0 var(--s-3); display: flex; align-items: center; gap: var(--s-2); color: var(--ink); }
  .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: pulse 1.6s var(--ease-io) infinite; }
  .probe-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font: 400 var(--t-sm)/1.45 var(--font-mono-stack); }
  .probe-i { color: var(--ink-2); margin-right: var(--s-2); }
  .probe-out { margin-top: var(--s-2); padding-top: var(--s-2); border-top: 1px dashed var(--line); color: var(--ink); font-weight: 600; }
  .probe-out .probe-i { color: var(--accent-text); }

  /* --- 4 Engineering quality --- */
  .line { list-style: none; margin: var(--s-4) 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); position: relative; }
  .line::before { content: ""; position: absolute; left: 6px; right: 0; top: 6px; border-top: 1px solid var(--ink); }
  .line::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 0;
    width: 7px;
    height: 7px;
    background: var(--accent);
    border-radius: 50%;
    offset-path: none;
    animation: packet 3.6s var(--ease-io) infinite;
    opacity: 0;
  }
  .station { display: grid; align-content: start; gap: var(--s-2); padding-right: var(--s-4); position: relative; }
  .st-dot { width: 13px; height: 13px; border-radius: 50%; border: 1px solid var(--ink); background: var(--paper); position: relative; z-index: 1; }
  .st-n { margin-top: var(--s-3); }
  .st-tool { font: 820 clamp(1.6rem, 1rem + 1.8vw, 3rem)/0.92 var(--font-display-stack); font-variation-settings: "wght" 780, "wdth" 78; text-transform: uppercase; }
  .st-note { font-size: var(--t-sm); color: var(--ink-2); line-height: 1.4; }
  .station:hover .st-dot { background: var(--accent); border-color: var(--accent); }

  /* --- 5 AI tooling --- */
  .card { background: var(--ink); color: var(--paper); padding: clamp(var(--s-5), 3vw, var(--s-7)); display: grid; gap: var(--s-4); position: relative; overflow: hidden; }
  .card::after { content: ""; position: absolute; right: calc(var(--orb) * -0.3); top: calc(var(--orb) * -0.3); width: var(--orb); height: var(--orb); border-radius: 50%; background: var(--accent); }
  .card { --orb: clamp(56px, 9vw, 132px); }
  .card-k { margin: 0; font: 500 var(--t-xs)/1 var(--font-mono-stack); letter-spacing: 0.04em; text-transform: uppercase; }
  .card-t { margin: 0; font: 820 clamp(2rem, 1rem + 3vw, 4rem)/0.9 var(--font-display-stack); font-variation-settings: "wght" 300, "wdth" 120; text-transform: uppercase; max-width: 14ch; position: relative; z-index: 1; }
  .card-facts { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
  .card-facts li { padding: var(--s-2) 0; border-top: 1px solid color-mix(in oklch, var(--paper) 30%, transparent); font-size: var(--t-md); }
  .card-facts li::before { content: "+ "; font-family: var(--font-mono-stack); }

  /* ============ rail (horizontal mode only) ============ */
  .rail { display: none; }

  /* ============ vertical stack (default; <768px and reduced motion) ============ */
  .xp:not(:global([data-mode='h'])) {
    padding: var(--s-9) var(--gutter);
  }
  .xp:not(:global([data-mode='h'])) .spine { max-width: var(--max); margin: 0 auto var(--s-7); }
  .xp:not(:global([data-mode='h'])) .spine-title { font-size: var(--t-sec); }
  .xp:not(:global([data-mode='h'])) .spine-title .ln { display: block; }
  .xp:not(:global([data-mode='h'])) .spine-foot { margin: var(--s-4) 0 0; color: var(--ink); }
  .xp:not(:global([data-mode='h'])) .spine-num { margin: 0 0 var(--s-4); }
  .xp:not(:global([data-mode='h'])) .track { list-style: none; margin: 0 auto; padding: 0; max-width: var(--max); display: grid; gap: var(--s-9); }
  .xp:not(:global([data-mode='h'])) .slot { min-width: 0; }
  /* The stack has no empty middle to hang the numeral in; the 03.x label carries the count. */
  .xp:not(:global([data-mode='h'])) .numeral { display: none; }
  .xp:not(:global([data-mode='h'])) .p-title { font-size: clamp(2.4rem, 1rem + 7vw, 5rem); font-variation-settings: "wght" 560, "wdth" 96; }
  @media (max-width: 1023.98px) {
    .c-grid, .g-grid, .z-foot { grid-template-columns: 1fr; gap: var(--s-6); }
    .line { grid-template-columns: 1fr; gap: var(--s-5); padding-left: var(--s-6); }
    .line::before { left: 6px; right: auto; top: 6px; bottom: 0; border-top: 0; border-left: 1px solid var(--ink); }
    .line::after { display: none; }
    .station { padding-right: 0; }
    .st-dot { position: absolute; left: calc(-1 * var(--s-6)); top: 0; }
    .st-n { margin-top: 0; }
  }
  @media (max-width: 479.98px) {
    .z-range { gap: var(--s-2); }
    .g-link { flex-direction: column; gap: var(--s-1); }
  }

  /* ============ pinned horizontal track ============ */
  .xp:global([data-mode='h']) .stage {
    height: 100svh;
    display: grid;
    grid-template-columns: var(--spine-w) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) var(--rail-h);
    padding-top: var(--bar-h);
    box-sizing: border-box;
    background: var(--paper);
    overflow: clip;
  }
  .xp:global([data-mode='h']) .spine {
    grid-row: 1 / 3;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: var(--s-5) 0 var(--s-5);
    border-right: 1px solid var(--ink);
  }
  .xp:global([data-mode='h']) .spine-num,
  .xp:global([data-mode='h']) .spine-foot {
    margin: 0;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    color: var(--ink);
  }
  .xp:global([data-mode='h']) .spine-title {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: clamp(3rem, min(6.4vw, 11svh), 7.5rem);
    line-height: 0.86;
    font-variation-settings: "wght" 820, "wdth" 62;
    flex: 1;
    display: grid;
    place-items: center;
    margin-block: var(--s-4);
  }
  .xp:global([data-mode='h']) .spine-title .ln { display: block; }
  .xp:global([data-mode='h']) .spine-base,
  .xp:global([data-mode='h']) .spine-fill { display: block; grid-area: 1 / 1; }
  .xp:global([data-mode='h']) .spine-fill {
    color: var(--accent);
    clip-path: inset(0 0 100% 0);
    pointer-events: none;
  }
  .xp:global([data-mode='h']) .spine-fill .dot { color: var(--ink); }

  .xp:global([data-mode='h']) .viewport {
    position: relative;
    overflow: clip;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }
  .xp:global([data-mode='h']) .viewport { cursor: grab; }
  .xp:global([data-dragging]) .viewport { cursor: grabbing; }
  .xp:global([data-mode='h']) .track {
    list-style: none;
    margin: 0;
    padding: 0 18vw 0 0;
    height: 100%;
    display: flex;
    width: max-content;
    will-change: transform;
  }
  .xp:global([data-mode='h']) .slot {
    height: 100%;
    padding: clamp(var(--s-5), 4svh, var(--s-7)) clamp(var(--s-5), 3vw, var(--s-8));
    box-sizing: border-box;
    border-right: 1px solid var(--line);
    display: flex;
    overflow: clip;
  }
  .xp:global([data-mode='h']) .s-0 { width: min(74vw, 1120px); }
  .xp:global([data-mode='h']) .s-1 { width: min(80vw, 1240px); }
  .xp:global([data-mode='h']) .s-2 { width: min(84vw, 1280px); }
  .xp:global([data-mode='h']) .s-3 { width: min(88vw, 1320px); }
  .xp:global([data-mode='h']) .s-4 { width: min(78vw, 1140px); border-right: 0; }
  .xp:global([data-mode='h']) .panel { flex: 1; min-width: 0; justify-content: flex-start; }
  .xp:global([data-mode='h']) .h-hide { display: none; }
  /* The finale card fills the space below its title; its orb is the panel's mark. */
  .xp:global([data-mode='h']) .s-4 .numeral { display: none; }
  .xp:global([data-mode='h']) .z-range { margin-top: auto; }
  .xp:global([data-mode='h']) .c-grid,
  .xp:global([data-mode='h']) .g-grid { margin-top: auto; }
  .xp:global([data-mode='h']) .line { margin-top: auto; }
  .xp:global([data-mode='h']) .card { margin-top: auto; }
  .xp:global([data-mode='h']) .s-3 .panel:global([data-arrived]) .line::after { opacity: 1; }
  /* Live games probe types itself out, line by line, the first time the panel arrives. */
  .xp:global([data-mode='h']) .panel:global([data-arrived]) .probe-list li {
    animation: type 0.5s steps(14, end) both;
    animation-delay: calc(0.5s + var(--i) * 0.38s);
  }

  /* rail */
  .xp:global([data-mode='h']) .rail {
    grid-column: 2;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--s-6);
    padding: 0 clamp(var(--s-5), 3vw, var(--s-8));
    border-top: 1px solid var(--ink);
    background: var(--paper);
    position: relative;
    z-index: 2;
  }
  .count { color: var(--ink); font-size: var(--t-sm); }
  .count b { font-weight: 700; }
  .rail-line { position: relative; height: 44px; margin-right: var(--s-6); }
  .rail-track { position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--line); }
  .rail-fill { position: absolute; inset: -0.5px 0; background: var(--ink); transform: scaleX(0); transform-origin: left; }
  .stop {
    outline: none;
    position: absolute;
    top: 0;
    height: 44px;
    min-width: 44px;
    transform: translateX(-50%);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    display: grid;
    place-items: center;
  }
  .stop-dot { width: 11px; height: 11px; border-radius: 50%; border: 1px solid var(--ink); background: var(--paper); transition: transform var(--d-med) var(--ease-snap), background var(--d-fast); }
  .stop:hover .stop-dot { transform: scale(1.4); }
  .stop[aria-current] .stop-dot { background: var(--accent); border-color: var(--accent); transform: scale(1.5); }
  .stop-label {
    position: absolute;
    top: calc(50% + 14px);
    white-space: nowrap;
    color: var(--ink);
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity var(--d-fast), transform var(--d-med) var(--ease-out);
  }
  .stop:hover .stop-label, .stop:focus-visible .stop-label, .stop[aria-current] .stop-label { opacity: 1; transform: none; }
  .stop:first-of-type .stop-label { left: 50%; transform: translateX(-6px); }
  .stop:last-of-type .stop-label { right: 50%; transform: translateX(6px); }
  .stop:first-of-type:hover .stop-label, .stop:first-of-type[aria-current] .stop-label, .stop:first-of-type:focus-visible .stop-label { transform: translateX(-6px); }
  .stop:last-of-type:hover .stop-label, .stop:last-of-type[aria-current] .stop-label, .stop:last-of-type:focus-visible .stop-label { transform: translateX(6px); }
  /* Focus: ring the dot and underline the label, instead of a box across the label. */
  .stop:focus-visible .stop-dot { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--accent-text); }
  .stop:focus-visible .stop-label { text-decoration: underline 2px var(--accent-text); text-underline-offset: 4px; }
  .hint { color: var(--ink-2); }

  @media (max-height: 760px) {
    .xp:global([data-mode='h']) .caption { display: none; }
    .xp:global([data-mode='h']) .p-title { font-size: clamp(2.4rem, 9svh, 5rem); }
    .xp:global([data-mode='h']) .z-range { font-size: clamp(3rem, 14svh, 7rem); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.7); }
  }
  @keyframes packet {
    0% { left: 0; }
    70%, 100% { left: calc(100% - 7px); }
  }
  @keyframes type {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }
  .xp:not(:global([data-visible])) .pulse,
  .xp:not(:global([data-visible])) .line::after { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) {
    .pulse, .line::after, .probe-list li { animation: none !important; }
  }
  :global(html[data-motion='reduced']) .pulse,
  :global(html[data-motion='reduced']) .line::after { animation: none; }
  @media (forced-colors: active) {
    .numeral { display: none; }
    .stop:focus-visible .stop-dot { outline: 2px solid CanvasText; outline-offset: 3px; }
  }
</style>
