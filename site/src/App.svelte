<script>
  /**
   * Page shell. Sections load lazily through import.meta.glob so that, in isolate
   * mode (`?section=<id>`), only that section's module is requested and a broken
   * component elsewhere cannot break it. The hero is the exception: it is the first
   * paint and the LCP, so it is bundled with the shell and renders without a placeholder
   * (a lazy hero shifted every slot below it). In full mode each section is wrapped in
   * its own error boundary.
   */
  import { onMount } from 'svelte';
  import { SECTIONS, isolatedSection } from './lib/sections.js';
  import { ui, reduced } from './lib/ui.svelte.js';
  import { setMotionReduced, scrollToId, refreshScroll } from './lib/motion/runtime.js';
  import { watchQuality } from './lib/motion/quality.js';
  import { startGitHub } from './lib/live/github.svelte.js';
  import { startClock } from './lib/clock.svelte.js';
  import Nav from './shell/Nav.svelte';
  import Palette from './shell/Palette.svelte';
  import Cursor from './shell/Cursor.svelte';
  import Toast from './shell/Toast.svelte';
  import Hero from './sections/hero/Hero.svelte';

  const HERO_FILE = 'hero/Hero.svelte';
  const modules = import.meta.glob(['./sections/*/*.svelte', '!./sections/hero/Hero.svelte']);
  const isolated = isolatedSection(location.search);
  const visible = isolated ? [isolated] : SECTIONS;
  const slots = visible.map(section => {
    const loader = modules[`./sections/${section.file}`];
    /** @type {any} A component, or a promise of one (`{#await}` renders a plain value at once). */
    const promise = section.file === HERO_FILE ? Hero
      : loader ? loader().then(module => /** @type {any} */ (module).default) : Promise.reject(new Error(`Missing ${section.file}`));
    return { ...section, promise };
  });

  $effect(() => {
    setMotionReduced(reduced());
  });

  onMount(() => {
    startClock();
    startGitHub();
    const stopQuality = watchQuality(tier => { ui.quality = tier; });

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) ui.active = /** @type {HTMLElement} */ (entry.target).id;
    }, { rootMargin: '-45% 0px -50% 0px' });

    Promise.allSettled(slots.map(slot => slot.promise)).then(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-section]').forEach(node => observer.observe(node));
        refreshScroll();
        document.fonts?.ready.then(refreshScroll);
        const hash = decodeURIComponent(location.hash.slice(1));
        if (hash && document.getElementById(hash)) scrollToId(hash);
      });
    });

    return () => {
      stopQuality();
      observer.disconnect();
    };
  });
</script>

<span id="top" tabindex="-1"></span>
<a class="skip" href="#main">Skip to content</a>
<Nav sections={visible} />

<main id="main" tabindex="-1">
  {#if isolated}
    <p class="isolate label">Isolate mode · {isolated.num} {isolated.id} · <a href="./">full page</a></p>
  {/if}
  {#each slots as slot (slot.id)}
    <div id={slot.id} class="slot" data-section={slot.id}>
      {#await slot.promise}
        <div class="loading" aria-hidden="true"></div>
      {:then Section}
        <svelte:boundary onerror={error => console.error(`Section ${slot.id} failed`, error)}>
          <Section />
          {#snippet failed(error, reset)}
            <div class="broken" role="alert">
              <p class="label">{slot.num} {slot.label}</p>
              <p>This section failed to render.</p>
              {#if import.meta.env.DEV}<pre>{String(error)}</pre>{/if}
              <button class="btn btn-ghost" type="button" onclick={reset}>Retry</button>
            </div>
          {/snippet}
        </svelte:boundary>
      {:catch error}
        <div class="broken" role="alert">
          <p class="label">{slot.num} {slot.label}</p>
          <p>This section failed to load.</p>
          {#if import.meta.env.DEV}<pre>{String(error)}</pre>{/if}
        </div>
      {/await}
    </div>
  {/each}
</main>

<Palette />
<Cursor />
<Toast />

<style>
  .skip {
    position: fixed;
    left: var(--s-4);
    top: -100px;
    z-index: 100;
    padding: var(--s-2) var(--s-4);
    background: var(--ink);
    color: var(--paper);
  }
  .skip:focus { top: var(--s-2); }
  main { outline: none; }
  .slot { position: relative; }
  .loading { min-height: 60svh; }
  .isolate {
    margin: 0;
    padding: calc(var(--bar-h) + var(--s-2)) var(--gutter) var(--s-2);
    color: var(--ink);
  }
  .broken {
    padding: var(--s-9) var(--gutter);
    border-block: 1px dashed var(--line);
  }
  .broken pre { white-space: pre-wrap; font: var(--t-xs)/1.4 var(--font-mono-stack); color: var(--ink-2); }
</style>
