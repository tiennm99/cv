<script>
  /**
   * Custom cursor: an ink dot plus a ring (mix-blend difference), only for fine
   * hover pointers with motion on and no forced colours. States come from the
   * nearest `[data-cursor="link|view|drag|type"]` (label from `data-cursor-label`);
   * links and buttons default to "link". The native cursor stays visible.
   */
  import { gsap } from '../lib/motion/runtime.js';
  import { ui, reduced } from '../lib/ui.svelte.js';

  let dot = $state(/** @type {HTMLElement | null} */ (null));
  let ring = $state(/** @type {HTMLElement | null} */ (null));
  let mode = $state('default');
  let label = $state('');
  let visible = $state(false);
  const fine = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  const enabled = $derived(fine && !reduced() && !ui.forcedColors && !ui.paletteOpen);

  $effect(() => {
    if (!enabled || !dot || !ring) return;
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'expo.out' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'expo.out' });
    /** @param {PointerEvent} event Move. */
    const move = event => {
      if (event.pointerType !== 'mouse') return;
      visible = true;
      dx(event.clientX);
      dy(event.clientY);
      rx(event.clientX);
      ry(event.clientY);
    };
    /** @param {PointerEvent} event Over. */
    const over = event => {
      const target = /** @type {Element} */ (event.target);
      const tagged = target.closest?.('[data-cursor]');
      if (tagged) {
        mode = tagged.getAttribute('data-cursor') ?? 'default';
        label = tagged.getAttribute('data-cursor-label') ?? (mode === 'view' ? 'Open' : mode === 'drag' ? 'Drag' : '');
      } else if (target.closest?.('input, textarea, select, dialog')) {
        mode = 'native';
        label = '';
      } else if (target.closest?.('a, button, [role="button"], summary, label')) {
        mode = 'link';
        label = '';
      } else {
        mode = 'default';
        label = '';
      }
    };
    const leave = () => { visible = false; };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
      gsap.killTweensOf([dot, ring]);
    };
  });
</script>

{#if enabled}
  <div class="cursor" class:visible data-mode={mode} aria-hidden="true">
    <span class="ring" bind:this={ring}><span class="ring-shape"><span class="ring-label">{label}</span></span></span>
    <span class="dot" bind:this={dot}><span class="dot-shape"></span></span>
  </div>
{/if}

<style>
  .cursor {
    position: fixed;
    inset: 0;
    z-index: 90;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--d-fast);
  }
  .cursor.visible { opacity: 1; }
  .cursor[data-mode='native'] { opacity: 0; }
  .dot, .ring { position: fixed; left: 0; top: 0; }
  .dot-shape, .ring-shape {
    position: absolute;
    left: 0;
    top: 0;
    translate: -50% -50%;
    border-radius: 50%;
    transition: width var(--d-med) var(--ease-out), height var(--d-med) var(--ease-out), background var(--d-med), border-radius var(--d-med);
  }
  .dot-shape { width: 10px; height: 10px; background: #fff; mix-blend-mode: difference; }
  .dot { mix-blend-mode: difference; }
  .ring { mix-blend-mode: difference; }
  .ring-shape {
    width: 36px;
    height: 36px;
    border: 1px solid #fff;
    display: grid;
    place-items: center;
  }
  .ring-label {
    font: 600 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #000;
    opacity: 0;
    transition: opacity var(--d-fast);
  }
  [data-mode='link'] .ring-shape { width: 56px; height: 56px; }
  [data-mode='view'] .ring-shape, [data-mode='drag'] .ring-shape { width: 84px; height: 84px; background: #fff; }
  [data-mode='view'] .ring-label, [data-mode='drag'] .ring-label { opacity: 1; }
  [data-mode='view'] .dot-shape, [data-mode='drag'] .dot-shape { width: 0; height: 0; }
  [data-mode='type'] .dot-shape { width: 2px; height: 22px; border-radius: 1px; }
  [data-mode='type'] .ring-shape { width: 0; height: 0; border-width: 0; }
</style>
