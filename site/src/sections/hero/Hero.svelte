<script>
  /**
   * 01 Hero, "the magician". A riso-printed stage: the name set across the 12-column
   * grid in three staggered lines whose per-character axes follow the pointer, over the
   * hero's own two-plate WebGL print (vermilion 15°, ink 45°). The dots shrink and part
   * around the real glyph shapes, the print is clipped to the hero and fades out above
   * its bottom edge, and it drains on scroll. Touch visitors tap to send a ripple.
   * Falls back to a static two-plate CSS print (reduced motion, no WebGL).
   */
  import { onMount } from 'svelte';
  import { profile } from '../../lib/profile.js';
  import { positioning, links } from '../../lib/content.js';
  import { gh } from '../../lib/live/github.svelte.js';
  import { clock } from '../../lib/clock.svelte.js';
  import { localTime } from '../../lib/time.js';
  import { reduced, webglAllowed } from '../../lib/ui.svelte.js';
  import { createKinetic, AXES } from '../../lib/motion/kinetic.js';
  import { gsap, sectionMotion, scrollToId } from '../../lib/motion/runtime.js';
  import { castSpell, tapField } from './cast-spell.js';
  import { createGlyphShapes } from './glyph-shapes.js';
  import { createHeroInk } from './hero-ink.js';

  const AVATAR_FALLBACK = 'https://github.com/tiennm99.png';
  const words = profile.name.trim().split(/\s+/);
  const headline = profile.headline.split('|').map(part => part.trim()).filter(Boolean);
  const since = positioning.gamesSince.slice(0, 4);

  /** @type {HTMLElement | null} */
  let section = $state(null);
  /** @type {HTMLElement | null} */
  let title = $state(null);
  /** @type {HTMLCanvasElement | null} */
  let inkCanvas = $state(null);
  /** @type {ReturnType<typeof createKinetic> | null} */
  let kinetic = $state.raw(null);
  /** @type {ReturnType<typeof createGlyphShapes> | null} */
  let shapes = $state.raw(null);
  let glFailed = $state(false);
  let avatarFailed = $state(false);
  let casting = $state(false);
  /** @type {(() => void) | null} */
  let cancelCast = null;
  /** @type {(() => void) | null} */
  let cancelTap = null;
  /** @type {import('./hero-ink.js').InkHandle | null} */
  let ink = null;
  /** True once the intro has set the type, so the print can knock out the final shapes. */
  let landed = false;
  let pointerSeen = false;

  const glOn = $derived(webglAllowed() && !glFailed);
  const liveBio = $derived(gh.user?.bio?.trim() ?? '');
  const bio = $derived(liveBio || positioning.bioFallback);
  const avatar = $derived.by(() => {
    const url = gh.user?.avatarUrl;
    if (!url || avatarFailed) return AVATAR_FALLBACK;
    return `${url}${url.includes('?') ? '&' : '?'}s=256`;
  });
  const time = $derived(localTime(clock.now, true));

  onMount(() => {
    if (!title || !section) return;
    const host = section;
    const root = title;
    // Phones: a narrower rest width lets the name set larger (see the 520px container
    // rule), and every narrow screen caps the peak so a line never outgrows its box.
    // The field is rebuilt when the width class changes (rotation, window resize).
    const phoneQuery = matchMedia('(max-width: 559px)');
    const narrowQuery = matchMedia('(max-width: 767px)');
    let rest = AXES.rest;
    /** @type {ReturnType<typeof createKinetic>} */
    let controller;
    const mountField = () => {
      const phone = phoneQuery.matches;
      rest = phone ? { wght: 820, wdth: 54 } : AXES.rest;
      const peak = phone ? { wght: 260, wdth: 88 } : narrowQuery.matches ? { wght: 240, wdth: 104 } : AXES.peak;
      if (phone) root.style.setProperty('--axes-rest', `"wght" ${rest.wght}, "wdth" ${rest.wdth}`);
      else root.style.removeProperty('--axes-rest');
      const glyphs = createGlyphShapes({ rest, peak });
      controller = createKinetic(root, {
        radius: 1.05,
        idleWave: false,
        rest,
        peak,
        onLayout: chars => {
          glyphs.measure(host, chars, root.querySelector('.avatar'), root.querySelector('.stop'));
          ink?.measure();
        },
      });
      kinetic = controller;
      shapes = glyphs;
    };
    mountField();
    const remount = () => {
      controller.destroy();
      mountField();
    };
    phoneQuery.addEventListener('change', remount);
    narrowQuery.addEventListener('change', remount);

    // The field stops easing within 1 wght of rest (about 817); snap the last step once
    // the pointer has been still, so the type and the knock-out settle exactly.
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let settleTimer;
    const settle = () => {
      const axes = `"wght" ${rest.wght}, "wdth" ${rest.wdth}`;
      for (const char of controller.chars()) {
        if (char.wght === rest.wght && char.wdth === rest.wdth) continue;
        if (Math.abs(char.wght - rest.wght) > 6) continue;
        char.el.style.fontVariationSettings = axes;
        char.wght = rest.wght;
        char.wdth = rest.wdth;
      }
    };
    const moved = (/** @type {PointerEvent} */ event) => {
      if (event.isTrusted && event.pointerType === 'mouse') pointerSeen = true;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 2800);
    };
    addEventListener('pointermove', moved, { passive: true });

    /** @type {gsap.core.Timeline | null} */
    let intro = null;
    const land = () => {
      landed = true;
      ink?.show();
    };
    if (!reduced()) {
      const lines = root.querySelectorAll('[data-line]');
      const chars = root.querySelectorAll('.ch, .stop');
      intro = gsap.timeline({
        onComplete: () => {
          gsap.set(lines, { clearProps: 'clipPath' });
          controller.measure();
          land();
          if (!pointerSeen) cast();
        },
      });
      intro
        .set(lines, { clipPath: 'inset(-0.2em -50vw 0 -50vw)' })
        .from(chars, { yPercent: 108, duration: 1.15, stagger: 0.035, ease: 'expo.out' }, 0.1)
        .from(root.querySelectorAll('.avatar'), { scale: 0, rotate: -90, duration: 0.9, ease: 'back.out(1.4)' }, 0.55)
        .from(host.querySelectorAll('[data-rise]'), { y: 18, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, 0.45);
    } else land();
    return () => {
      phoneQuery.removeEventListener('change', remount);
      narrowQuery.removeEventListener('change', remount);
      removeEventListener('pointermove', moved);
      clearTimeout(settleTimer);
      intro?.kill();
      cancelCast?.();
      cancelTap?.();
      controller.destroy();
      root.style.removeProperty('--axes-rest');
      kinetic = null;
      shapes = null;
    };
  });

  $effect(() => {
    if (!glOn || !kinetic || !shapes || !section || !inkCanvas) return;
    const handle = createHeroInk(section, inkCanvas, {
      shapes: shapes.write,
      onFallback: () => { glFailed = true; },
    });
    ink = handle;
    if (landed) handle.show();
    return () => {
      handle.detach();
      ink = null;
    };
  });

  /**
   * Scroll exit: the furniture lifts away while the print grows and drains (inside the
   * hero only; the canvas is clipped to it).
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   */
  const exit = ({ node, reduced: isReduced }) => {
    if (isReduced) return;
    gsap.to(node.querySelectorAll('[data-exit]'), {
      opacity: 0,
      y: -48,
      ease: 'none',
      stagger: 0.04,
      scrollTrigger: { trigger: node, start: 'top top', end: 'bottom 35%', scrub: true },
    });
  };

  function cast() {
    if (!title || casting || reduced()) return;
    casting = true;
    cancelCast = castSpell(title, () => {
      casting = false;
      cancelCast = null;
    });
  }

  /**
   * Touch has no hover, and pan-y scrolling cancels pointermove almost at once, so a
   * tap sends a ripple through the print and flexes the letters near it for a moment.
   * @param {PointerEvent} event Pointer down anywhere in the hero.
   */
  function tap(event) {
    if (event.pointerType !== 'touch' || reduced() || casting || !title) return;
    ink?.ripple(event.clientX, event.clientY);
    cancelTap?.();
    cancelTap = tapField(title, event.clientX, event.clientY);
  }

  /** @param {MouseEvent} event Click on the scroll cue. */
  function next(event) {
    if (!document.getElementById('now')) return;
    event.preventDefault();
    scrollToId('now');
  }
</script>

<section bind:this={section} class="hero" aria-labelledby="hero-title" onpointerdown={tap} use:sectionMotion={exit}>
  {#if glOn}
    <canvas bind:this={inkCanvas} class="ink" aria-hidden="true"></canvas>
  {:else}
    <div class="fallback" aria-hidden="true"><i class="pa"></i><i class="pb"></i></div>
  {/if}
  <div class="cols" aria-hidden="true">{#each { length: 12 } as _, i (i)}<i></i>{/each}</div>
  <svg class="marks" aria-hidden="true" focusable="false">
    <defs>
      <g id="hero-mark" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="12" r="6" /><path d="M12 0v24M0 12h24" />
      </g>
    </defs>
    <use href="#hero-mark" x="0" y="0" />
    <use href="#hero-mark" x="100%" y="0" transform="translate(-24 0)" />
  </svg>

  <header class="meta" data-exit>
    <p class="label m1" data-rise><span class="chip"><b>Nº 001</b><span class="m1-rest">&nbsp;— Portfolio 2026</span></span></p>
    <p class="label m2" data-rise>
      <span class="chip">{profile.location}</span>
      <span class="chip time"><span class="dot" aria-hidden="true"></span><time aria-label="Local time in Ho Chi Minh City">{time}</time> GMT+7</span>
    </p>
    <div class="m3" data-rise>
      {#if !reduced()}
        <button class="cast" type="button" onclick={cast} aria-disabled={casting} aria-describedby="hero-cast-hint">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 14 11 5M12 1v3M15 4h-3M9.5 1.5l1 1M14.5 6.5l-1-1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" /></svg>
          <span>{casting ? 'Casting…' : 'Cast a spell'}</span>
        </button>
        <span id="hero-cast-hint" class="sr-only">Sweeps a wand through the name to animate the letters and the ink.</span>
      {/if}
    </div>
  </header>

  <div class="stage">
    <h1 id="hero-title" bind:this={title} class="display name">
      {#each words as word, i (i)}
        <span class="line l{Math.min(i + 1, 3)}" data-line>
          <span data-kinetic-line>{word}</span>{#if i === 0}<span class="avatar" aria-hidden="true"><img src={avatar} alt="" width="256" height="256" decoding="async" onerror={() => { avatarFailed = true; }} /></span>{/if}{#if i === words.length - 1}<span class="stop" aria-hidden="true">.</span>{/if}
        </span>
      {/each}
    </h1>

    <figure class="bio" data-rise data-exit>
      <blockquote cite={links.github}>
        <p><span class="qm" aria-hidden="true">“</span>{bio}<span class="qm" aria-hidden="true">”</span></p>
      </blockquote>
      <figcaption class="label">
        GitHub bio · <a href={links.github} rel="me">@tiennm99</a>{#if liveBio}<span class="live">&nbsp;· live</span>{/if}
      </figcaption>
    </figure>
  </div>

  <footer class="foot" data-exit>
    <div class="role" data-rise>
      <p class="headline">
        {#each headline as part, i (i)}<span class="part">{#if i}<span class="sep" aria-hidden="true">/</span><span class="sr-only">,&nbsp;</span>{/if}{part}</span>{/each}
      </p>
      <p class="label hook"><span class="chip"><i class="sw" aria-hidden="true"></i>{positioning.employer} · Java backends for multiplayer games since {since}</span></p>
    </div>
    <a class="scroll label" href="#now" onclick={next} data-rise>
      <span class="chip">Scroll</span><span class="rule" aria-hidden="true"></span>
    </a>
  </footer>
</section>

<style>
  .hero {
    --cols: 12;
    --col: calc((100% + var(--s-4)) / 12);
    position: relative;
    min-height: 100svh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    row-gap: var(--s-6);
    padding: calc(var(--bar-h) + var(--s-5)) var(--gutter) var(--s-5);
    container-type: inline-size;
    overflow: clip;
  }
  /* Review-only isolate mode: its banner already clears the bar, so keep one screen. */
  :global(.isolate + #hero) .hero {
    min-height: calc(100svh - var(--bar-h) - 2 * var(--s-2) - 1.4em);
    padding-top: var(--s-5);
  }
  :global(.isolate + #hero) .name { --fit-h: calc((100svh - 2 * var(--bar-h) - 19rem) / 2.46); }
  .hero > :not(.ink, .fallback, .cols, .marks) { position: relative; z-index: 1; }
  .ink {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--d-med) linear;
  }

  /* Static two-plate print (reduced motion, no WebGL): a vermilion field bleeding in
     from the bottom left, with a sparse, off-register ink plate over its edge. */
  .fallback { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .fallback i { position: absolute; inset: 0; overflow: hidden; }
  .pa, .pb {
    mask-composite: intersect;
    -webkit-mask-composite: source-in;
  }
  /* Both plates stop short of the foot so the role line stays on clean paper. */
  .pa {
    mask-image:
      radial-gradient(ellipse 58% 62% at 0% 78%, #000 0%, rgb(0 0 0 / 0.75) 40%, transparent 74%),
      linear-gradient(to top, transparent 9rem, #000 16rem);
  }
  .pb {
    mask-image:
      radial-gradient(ellipse 22% 24% at 31% 58%, rgb(0 0 0 / 0.85), transparent 70%),
      linear-gradient(to top, transparent 9rem, #000 16rem);
  }
  .fallback i::before {
    content: "";
    position: absolute;
    inset: -50%;
    rotate: 15deg;
    background-image: radial-gradient(circle, var(--accent) 2.6px, transparent 3.1px);
    background-size: 8px 8px;
  }
  .fallback .pb::before {
    rotate: 45deg;
    translate: 1px 1px;
    background-image: radial-gradient(circle, var(--ink) 1.5px, transparent 2px);
    background-size: 9.2px 9.2px;
  }
  .marks {
    position: absolute;
    inset: calc(var(--bar-h) + var(--s-2)) var(--s-2) auto;
    width: calc(100% - 2 * var(--s-2));
    height: 24px;
    color: var(--ink-2);
    pointer-events: none;
    z-index: 0;
  }

  /* ---------- micro furniture ---------- */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    padding: 3px 7px;
    background: var(--paper);
    color: var(--ink);
  }
  .chip b { font-weight: 700; }
  .meta, .foot {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--s-4);
    align-items: center;
    width: 100%;
    max-width: var(--max);
    margin-inline: auto;
  }
  .meta p, .foot p { margin: 0; }
  .m1 { grid-column: 1 / 5; white-space: nowrap; }
  .m2 { grid-column: 5 / 10; display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .m3 { grid-column: 10 / 13; justify-self: end; }
  .time { font-variant-numeric: tabular-nums; }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s var(--ease-io) infinite;
  }
  @keyframes pulse { 50% { opacity: 0.25; } }

  .cast {
    display: inline-flex;
    align-items: center;
    gap: var(--s-2);
    min-height: 44px;
    padding: 0 var(--s-4);
    border: 1px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--t-sm)/1 var(--font-body-stack);
    white-space: nowrap;
    transition: background var(--d-fast), color var(--d-fast), border-color var(--d-fast);
  }
  .cast svg { width: 16px; height: 16px; transition: transform var(--d-med) var(--ease-snap); }
  .cast:hover:not([aria-disabled="true"]) { background: var(--ink); color: var(--paper); }
  .cast:hover:not([aria-disabled="true"]) svg { transform: rotate(-24deg); }
  .cast[aria-disabled="true"] { cursor: progress; border-color: var(--accent); }

  /* ---------- the name ---------- */
  .stage {
    align-self: center;
    width: 100%;
    max-width: var(--max);
    margin-inline: auto;
  }
  .name {
    --fit: 21cqi;
    /* Three display lines plus the meta and foot rows must fit one screen. */
    --fit-h: calc((100svh - var(--bar-h) - 19rem) / 2.46);
    margin: 0;
    font-size: max(3.5rem, min(var(--t-hero), var(--fit), var(--fit-h)));
    touch-action: pan-y;
    color: var(--ink);
  }
  .line {
    display: block;
    height: calc(1em * var(--lh-display));
    line-height: var(--lh-display);
    white-space: nowrap;
    contain: layout;
  }
  .l2 { padding-left: calc(var(--col) * 2); }
  .l3 { text-align: right; }
  .stop { display: inline-block; color: var(--accent); }
  .avatar {
    position: relative;
    display: inline-block;
    width: 0.5em;
    height: 0.5em;
    margin-left: 0.12em;
    vertical-align: 0.04em;
  }
  .avatar::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--accent);
    translate: 0.045em 0.03em;
  }
  .avatar img {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: max(2px, 0.012em) solid var(--ink);
    object-fit: cover;
    filter: grayscale(1) contrast(1.15);
    background: var(--paper-2);
  }

  /* ---------- bio ---------- */
  .bio {
    position: absolute;
    top: 0;
    right: 0;
    width: calc(var(--col) * 4 - var(--s-4));
    margin: 0;
    padding: var(--s-4) var(--s-4) var(--s-3);
    background: var(--paper);
    border-top: 2px solid var(--ink);
  }
  .bio blockquote { margin: 0; }
  .bio p {
    margin: 0 0 var(--s-3);
    font: 500 var(--t-xl)/1.08 var(--font-body-stack);
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .qm { color: var(--accent); font-weight: 700; }
  .bio a { color: var(--ink); text-underline-offset: 3px; }
  .live { color: var(--ink); }

  /* ---------- foot ---------- */
  /* The professional line answers the magician quote: role first, then the studio. */
  .role { grid-column: 1 / 9; display: grid; gap: var(--s-3); justify-items: start; }
  .headline {
    font: 600 clamp(1.3rem, 0.9rem + 1.2vw, 2.2rem)/1.05 var(--font-body-stack);
    letter-spacing: -0.02em;
    display: flex;
    flex-wrap: wrap;
    gap: 0;
  }
  .headline .part { background: var(--paper); padding-right: 0.3em; }
  .sep { color: var(--accent-text); margin-right: 0.3em; }
  .hook .chip { display: inline; box-decoration-break: clone; -webkit-box-decoration-break: clone; line-height: 1.9; }
  .sw { display: inline-block; width: 9px; height: 9px; margin-right: var(--s-2); border-radius: 50%; background: var(--accent); vertical-align: 0; }
  .scroll {
    grid-column: 10 / 13;
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: var(--s-3);
    min-height: 44px;
    text-decoration: none;
  }
  .rule {
    position: relative;
    width: 56px;
    height: 1px;
    background: var(--line);
    overflow: hidden;
  }
  .rule::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--ink);
    transform-origin: left;
    animation: drain 2.4s var(--ease-io) infinite;
  }
  @keyframes drain {
    0% { transform: scaleX(0); }
    50% { transform: scaleX(1); transform-origin: left; }
    50.1% { transform-origin: right; }
    100% { transform: scaleX(0); transform-origin: right; }
  }
  .scroll:hover .chip { background: var(--ink); color: var(--paper); }

  /* ---------- narrow ---------- */
  @container (max-width: 900px) {
    .bio { position: static; width: auto; margin-top: var(--s-6); max-width: 34rem; }
    .m1 { grid-column: 1 / 8; }
    .m2 { grid-column: 1 / 13; grid-row: 2; margin-top: var(--s-2); }
    .m3 { grid-column: 8 / 13; grid-row: 1; }
    .role { grid-column: 1 / 13; }
    .scroll { grid-column: 1 / 13; justify-self: start; }
    .name { --fit: 26.5cqi; }
    .l2 { padding-left: var(--col); }
    .marks { display: none; }
  }
  @container (max-width: 520px) {
    .m1-rest { display: none; }
    /* Phones: fit each line to the width instead of the longest one, so the name takes
       close to half the screen. Sizes leave room for a tap's local swell (narrow peak). */
    .name { --fit: 34cqi; font-size: max(3.5rem, min(var(--fit), var(--fit-h))); }
    .l1 { font-size: 1.35em; }
    .l3 { font-size: 1.3em; }
    .hero { row-gap: var(--s-5); }
    .stage { align-self: stretch; display: flex; flex-direction: column; justify-content: center; }
    .bio { margin-top: var(--s-5); }
    .bio p { font-size: var(--t-lg); }
  }

  @media (forced-colors: active) {
    .ink, .fallback { display: none; }
    .avatar::before { display: none; }
    .chip, .bio, .headline .part { background: Canvas; }
  }
</style>
