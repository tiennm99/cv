<script>
  /**
   * Section 10, contact: "the one-page version".
   * A giant kinetic "Download / the CV." (its own kinetic.js instance), the hero
   * halftone reprised in mode 1 with its waves centred on the magnetic download
   * disc, a copy-email line, a row of link tiles and the page footer.
   * Layout reads happen only on measure (mount, resize, fonts, ScrollTrigger refresh).
   */
  import { profile, formatYm } from '../../lib/profile.js';
  import { links, featured } from '../../lib/content.js';
  import { ui, webglAllowed, toast } from '../../lib/ui.svelte.js';
  import { clock } from '../../lib/clock.svelte.js';
  import { localTime } from '../../lib/time.js';
  import { sectionMotion, scrollToId, ScrollTrigger } from '../../lib/motion/runtime.js';
  import { magnetic, halftonePointer } from '../../lib/motion/actions.js';
  import { createKinetic, splitChars } from '../../lib/motion/kinetic.js';
  import { attachHalftone } from '../../lib/gl/halftone.js';

  const tiles = [
    { label: 'GitHub', handle: '@tiennm99', note: 'Side projects', href: links.github },
    { label: 'GitHub org', handle: '@tiennm99dev', note: 'Work in progress', href: links.githubOrg },
    { label: 'LinkedIn', handle: 'in/miti99', note: 'Career', href: links.linkedin },
    { label: 'Blog', handle: 'miti99.com', note: 'Writing since 2020', href: links.blog },
    { label: 'Link-in-bio', handle: 'iammiti99', note: 'Everything else', href: links.linkInBio },
  ];
  // Ends in a no-break space: SVG drops a trailing plain space, which tightened the seam.
  const ringText = 'Download the CV · PDF · one page ·\u00A0';

  /**
   * Display name for a yml project, through the same featured titles the Projects section shows
   * (the yml keeps its own wording; the site never uses miti99 as a product name).
   * @param {{ name: string, url: string }} project Project from the profile.
   * @returns {string} Title shown on the site.
   */
  const projectTitle = project => {
    const repo = project.url.match(/github\.com\/([^/]+\/[^/#?]+)/)?.[1] ?? '';
    return featured.find(item => item.repo === repo)?.title ?? project.name;
  };

  const job = profile.experience[0];
  const school = profile.education[0];
  /** What the one page holds, each row jumping to the matching section of this site. */
  const contents = [
    { id: 'experience', title: 'Experience', detail: job ? `${job.position}, ${job.company.split(',')[0]} · ${formatYm(job.start)} – ${formatYm(job.end)}` : '' },
    { id: 'projects', title: 'Projects', detail: profile.projects.map(projectTitle).join(' · ') },
    { id: 'stack', title: 'Skills', detail: profile.skills.map(group => group.items[0]).filter(Boolean).join(' · ') },
    { id: 'timeline', title: 'Education', detail: school ? `${school.degree} ${school.area} · ${school.end.slice(0, 4)}` : '' },
  ].filter(row => row.detail);

  /**
   * Jumps within the page when the section is rendered, otherwise lets the link load the full page.
   * @param {MouseEvent} event Click.
   * @param {string} id Section id.
   */
  const jump = (event, id) => {
    if (!document.getElementById(id)) return;
    event.preventDefault();
    scrollToId(id);
  };

  let stage = $state(/** @type {HTMLElement | null} */ (null));
  let title = $state(/** @type {HTMLElement | null} */ (null));
  let discWrap = $state(/** @type {HTMLElement | null} */ (null));
  let cssHalftone = $state(false);
  let copied = $state(false);

  /** @type {ReturnType<typeof createKinetic> | null} */
  let kinetic = null;
  /** Disc centre in page coordinates, refreshed only on measure. */
  const focusPoint = { x: 0, y: 0, ready: false };

  // Measures the wrapper, which never moves: the magnetic disc inside it may be translated.
  const measureFocus = () => {
    if (!discWrap) return;
    const rect = discWrap.getBoundingClientRect();
    focusPoint.x = rect.left + scrollX + rect.width / 2;
    focusPoint.y = rect.top + scrollY + rect.height / 2;
    focusPoint.ready = true;
  };

  /**
   * Fits each headline line to the measure at rest axes, so "Download" and "the CV."
   * share both edges and read as one justified slab. Layout reads run on measure only.
   */
  const fitLines = () => {
    if (!title || !kinetic) return;
    const lines = /** @type {HTMLElement[]} */ ([...title.querySelectorAll('[data-kinetic-line]')]);
    for (const line of lines) line.style.removeProperty('--fit');
    kinetic.measure(); // resets every glyph to the rest axes before reading widths
    const measureWidth = title.getBoundingClientRect().width;
    for (const line of lines) {
      const glyphs = line.querySelector('[aria-hidden]');
      const width = glyphs?.getBoundingClientRect().width ?? 0;
      if (width > 0) line.style.setProperty('--fit', Math.min(2, Math.max(0.5, (measureWidth / width) * 0.99)).toFixed(4));
    }
    kinetic.measure();
    measureFocus();
  };

  // Kinetic headline: split once, cached rects, own loop (paused off-screen and under reduced motion).
  $effect(() => {
    if (!title) return;
    kinetic = createKinetic(title, { radius: 1.2 });
    fitLines();
    // Refit only when the measure's width changes: fitLines itself changes the title's
    // height (the lines scale with --fit), which must not feed back into another fit.
    let lastWidth = title.getBoundingClientRect().width;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (Math.abs(width - lastWidth) < 0.5) return;
      lastWidth = width;
      fitLines();
    });
    ro.observe(title);
    document.fonts?.ready.then(fitLines);
    return () => {
      ro.disconnect();
      kinetic?.destroy();
      kinetic = null;
    };
  });

  /** null until checked; false when the URL does not serve a real PDF (dev server, broken build). */
  let pdfReady = $state(/** @type {boolean | null} */ (null));
  $effect(() => {
    const controller = new AbortController();
    fetch(links.cvPdf, { method: 'HEAD', signal: controller.signal })
      .then(response => { pdfReady = response.ok && (response.headers.get('content-type') ?? '').includes('application/pdf'); })
      .catch(() => {});
    return () => controller.abort();
  });
  /**
   * Stops the download when the URL is known not to be a PDF, so nobody saves an HTML page as .pdf.
   * @param {MouseEvent} event Click on a download link.
   */
  const guardPdf = event => {
    if (pdfReady !== false) return;
    event.preventDefault();
    toast('The PDF is not part of this build yet.');
  };

  // Focus point cache for the halftone convergence.
  $effect(() => {
    if (!discWrap || !stage) return;
    measureFocus();
    const ro = new ResizeObserver(measureFocus);
    ro.observe(stage);
    ScrollTrigger.addEventListener('refresh', measureFocus);
    document.fonts?.ready.then(measureFocus);
    return () => {
      ro.disconnect();
      ScrollTrigger.removeEventListener('refresh', measureFocus);
    };
  });

  // WebGL moment 2: a fixed canvas behind the section, mode 1. The CSS halftone stands in
  // without WebGL and on the 'low' tier (the quality monitor drops to it while this draws slowly).
  $effect(() => {
    if (!stage) return;
    if (!webglAllowed() || ui.quality === 'low') {
      cssHalftone = true;
      return;
    }
    cssHalftone = false;
    const handle = attachHalftone(stage, {
      mode: 1,
      boxes: (out, max) => kinetic?.boxes(out, max) ?? 0,
      focus: () => (focusPoint.ready ? { x: focusPoint.x - scrollX, y: focusPoint.y - scrollY } : null),
      onFallback: () => { cssHalftone = true; },
    });
    return () => handle.detach();
  });

  /** Copies the email; the button flips to "Copied" only when the clipboard write succeeded. */
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast(`Copied ${profile.email}`);
      copied = true;
      setTimeout(() => { copied = false; }, 2200);
    } catch {
      toast(`Copy failed: ${profile.email}`);
    }
  };

  /**
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   * @returns {void | (() => void)} Cleanup.
   */
  const motion = ({ node, reduced, gsap }) => {
    if (reduced) return;
    const titleEl = node.querySelector('.cta-title');
    const chars = titleEl ? splitChars(/** @type {HTMLElement} */ (titleEl)) : [];
    const tl = gsap.timeline({
      scrollTrigger: { trigger: node, start: 'top 72%', once: true },
      defaults: { ease: 'expo.out' },
    });
    // Opacity only (never visibility), so every link stays in the tab order; focus finishes the entrance.
    tl.from(chars, { yPercent: 70, opacity: 0, duration: 1.1, stagger: 0.035 })
      .from(node.querySelector('.disc-wrap'), { scale: 0.4, rotate: -40, opacity: 0, duration: 1, ease: 'back.out(1.4)' }, 0.35)
      .from(node.querySelectorAll('.rule-draw'), { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'power3.inOut' }, 0.2)
      .from(node.querySelectorAll('.tile'), { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.55)
      .from(node.querySelectorAll('.toc li, .mail'), { y: 24, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.45);
    const finish = () => tl.progress(1);
    node.addEventListener('focusin', finish);
    return () => node.removeEventListener('focusin', finish);
  };
</script>

<section
  class="contact"
  aria-labelledby="contact-title"
  bind:this={stage}
  use:halftonePointer
  use:sectionMotion={motion}
>
  {#if cssHalftone}
    <!-- CSS fallback layer; its pointer position inherits from the section (halftonePointer). -->
    <div class="ht-layer halftone-css" style="--hx: inherit; --hy: inherit" aria-hidden="true"></div>
  {/if}
  <div class="cols" aria-hidden="true">{#each { length: 12 }}<i></i>{/each}</div>

  <div class="inner">
    <header class="head">
      <p class="label chip"><span class="num">(10)</span> Contact — the one-page version</p>
      <p class="label chip right">PDF · built from the same source as this site</p>
    </header>

    <h2 id="contact-title" class="cta-title display" bind:this={title}>
      <a
        class="cta-link"
        href={links.cvPdf}
        download={links.cvDownloadName}
        onclick={guardPdf}
        data-cursor="view"
        data-cursor-label="PDF"
      >
        <span class="line l1" data-kinetic-line>Download</span>
        <span class="line l2" data-kinetic-line>the CV.</span>
      </a>
    </h2>

    <div class="rule rule-draw" aria-hidden="true"></div>

    <div class="deck">
      <div class="left">
      <div class="toc">
        <p class="label chip">Inside the PDF</p>
        <ol>
          {#each contents as row, i (row.id)}
            <li>
              <a class="toc-row" href={`./#${row.id}`} onclick={event => jump(event, row.id)}>
                <span class="toc-num">{String(i + 1).padStart(2, '0')}</span>
                <span class="toc-title">{row.title}</span>
                <span class="toc-lead" aria-hidden="true"></span>
                <span class="toc-detail">{row.detail}</span>
              </a>
            </li>
          {/each}
        </ol>
      </div>
      <div class="mail">
        <p class="label chip">Write to</p>
        <div class="mail-row">
          <a class="mail-addr" href={`mailto:${profile.email}`}>{profile.email}</a>
          <button class="copy" type="button" onclick={copyEmail} aria-label={`Copy email address ${profile.email}`}>
            <span class="copy-face" class:flip={copied}>
              <span>Copy</span>
              <span aria-hidden="true">Copied</span>
            </span>
          </button>
        </div>
        <p class="note">Based in {profile.location}. Local time <time>{localTime(clock.now, true)}</time> (GMT+7).</p>
      </div>
      </div>

      <div class="disc-area">
        <div class="disc-wrap" bind:this={discWrap}>
          <svg class="orbit" viewBox="0 0 200 200" aria-hidden="true">
            <defs><path id="contact-ring-path" d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" /></defs>
            <text textLength="527" lengthAdjust="spacing"><textPath href="#contact-ring-path" textLength="527" lengthAdjust="spacing">{ringText}{ringText}</textPath></text>
          </svg>
          <a
            class="disc"
            href={links.cvPdf}
            download={links.cvDownloadName}
            onclick={guardPdf}
            use:magnetic={{ strength: 0.4, radius: 90 }}
            data-cursor="link"
          >
            <span class="disc-arrow" aria-hidden="true">↓</span>
            <span class="disc-text">Download CV <span class="disc-sub">(PDF)</span></span>
          </a>
        </div>
      </div>
    </div>

    <nav class="tiles" aria-label="Elsewhere">
      <ol>
        {#each tiles as tile, i (tile.href)}
          <li>
            <a class="tile" href={tile.href} target="_blank" rel="noopener">
              <span class="t-top">
                <span class="t-num">{String(i + 1).padStart(2, '0')}</span>
                <span class="t-arrow" aria-hidden="true">↗</span>
              </span>
              <span class="t-label">{tile.label}</span>
              <span class="t-handle">{tile.handle}</span>
              <span class="t-note">{tile.note}<span class="sr-only"> (opens in a new tab)</span></span>
            </a>
          </li>
        {/each}
      </ol>
    </nav>

    <footer class="foot">
      <div class="rule" aria-hidden="true"></div>
      <div class="foot-row">
        <span>© 2026 {profile.name} · miti99</span>
        <span>Ho Chi Minh City · <time>{localTime(clock.now)}</time> GMT+7</span>
        <span>Data live from api.github.com · {ui.theme === 'invert' ? 'Ink' : 'Paper'} edition</span>
        <button class="top" type="button" onclick={() => scrollToId('top')}>Back to top <span aria-hidden="true">↑</span></button>
      </div>
    </footer>
  </div>
</section>

<style>
  .contact {
    position: relative;
    min-height: 100svh;
    padding: var(--s-9) var(--gutter) var(--s-6);
    overflow: clip;
    isolation: isolate;
  }
  @media (min-width: 1024px) {
    .contact { padding-top: var(--s-8); }
  }
  .contact { --hx: 82%; --hy: 62%; }
  .ht-layer {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }
  .cols { z-index: -1; }

  .inner {
    position: relative;
    max-width: var(--max);
    margin-inline: auto;
    display: grid;
    gap: var(--s-7);
  }

  /* Mono labels over the halftone get a paper backing. */
  .chip {
    display: inline-block;
    margin: 0;
    padding: var(--s-1) var(--s-2);
    background: var(--paper);
    color: var(--ink);
  }
  .num { color: var(--ink-2); }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-2);
  }

  /* ---------- the kinetic CTA ---------- */
  .cta-title {
    --cta: clamp(4.2rem, 21vw, 19rem);
    margin: 0;
    font-size: var(--cta);
    line-height: var(--lh-display);
  }
  .cta-link {
    display: block;
    text-decoration: none;
    color: var(--ink);
  }
  /* --fit (set on measure) scales each line so both span the full measure. */
  .line {
    display: block;
    font-size: calc(var(--cta) * var(--fit, 1));
    height: calc(var(--cta) * var(--fit, 1) * 0.86);
    white-space: nowrap;
    word-spacing: 0.14em; /* wdth 68 squeezes the space; keep "the CV." two words */
    contain: layout;
  }
  .l2 { text-align: right; }
  .cta-link :global(.l2 [aria-hidden] .ch:last-child) { color: var(--accent); }
  .cta-link:focus-visible { outline-offset: 8px; }
  .cta-link:hover :global(.l1 .ch),
  .cta-link:focus-visible :global(.l1 .ch) { color: var(--accent); transition: color var(--d-med) var(--ease-out); }
  .cta-link :global(.ch) { transition: color var(--d-med) var(--ease-out); }

  .rule {
    height: 1px;
    background: var(--ink);
  }

  /* ---------- deck: email + disc ---------- */
  .deck {
    display: grid;
    gap: var(--s-6);
    align-items: end;
  }
  .left {
    display: grid;
    gap: var(--s-6);
    min-width: 0;
  }
  @media (min-width: 900px) {
    .deck { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: var(--s-7); }
    .left { gap: var(--s-7); }
  }
  /* Tablet: the TOC runs full width, the mail block and the disc share the row below it. */
  @media (min-width: 600px) and (max-width: 899px) {
    .deck { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
    .left { display: contents; }
    .toc { grid-column: 1 / -1; }
  }
  .toc ol {
    list-style: none;
    margin: var(--s-3) 0 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .toc-row {
    display: grid;
    grid-template-columns: 2.5ch auto minmax(var(--s-5), 1fr) minmax(0, max-content);
    align-items: baseline;
    gap: var(--s-3);
    min-height: 44px;
    padding: var(--s-3) var(--s-2);
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
    transition: padding var(--d-med) var(--ease-out), background var(--d-fast);
  }
  .toc-row:hover, .toc-row:focus-visible { background: var(--paper-2); padding-left: var(--s-4); }
  .toc-num { font: 500 var(--t-xs)/1 var(--font-mono-stack); color: var(--ink-2); }
  .toc-title {
    font: 820 var(--t-lg)/1 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 80;
    text-transform: uppercase;
    transition: font-variation-settings var(--d-slow) var(--ease-out);
  }
  .toc-row:hover .toc-title, .toc-row:focus-visible .toc-title { font-variation-settings: "wght" 420, "wdth" 130; }
  .toc-lead { border-bottom: 1px dotted var(--ink-2); transform: translateY(-4px); }
  .toc-detail { font-size: var(--t-sm); color: var(--ink-2); text-align: right; }
  @media (max-width: 719px) {
    .toc-row { grid-template-columns: 2.5ch 1fr; row-gap: var(--s-1); }
    .toc-lead { display: none; }
    .toc-detail { grid-column: 2; text-align: left; }
  }
  .mail {
    display: grid;
    gap: var(--s-3);
    justify-items: start;
    min-width: 0;
  }
  .mail-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-3) var(--s-4);
    max-width: 100%;
    padding: var(--s-2) var(--s-3);
    margin-left: calc(-1 * var(--s-3));
    background: var(--paper);
  }
  .mail-addr {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font: 500 var(--t-xl)/1.1 var(--font-body-stack);
    letter-spacing: -0.02em;
    color: var(--ink);
    text-decoration: none;
    overflow-wrap: anywhere;
    background: linear-gradient(var(--accent), var(--accent)) 0 100% / 0% 3px no-repeat;
    transition: background-size var(--d-slow) var(--ease-out);
  }
  .mail-addr:hover, .mail-addr:focus-visible { background-size: 100% 3px; }
  .copy {
    position: relative;
    min-height: 44px;
    min-width: 96px;
    padding: 0 var(--s-4);
    border: 1px solid var(--ink);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: 600 var(--t-xs)/1 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    overflow: hidden;
    transition: background var(--d-fast), color var(--d-fast);
  }
  .copy:hover, .copy:focus-visible { background: var(--ink); color: var(--paper); }
  .copy-face {
    display: grid;
    height: 44px;
    transition: transform var(--d-med) var(--ease-snap);
  }
  .copy-face > span { height: 44px; display: grid; place-items: center; }
  .copy-face.flip { transform: translateY(-44px); }
  .copy { height: 44px; }
  .note {
    margin: 0;
    padding: var(--s-1) var(--s-2);
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--t-sm);
  }
  .note time { color: var(--ink); font-family: var(--font-mono-stack); font-variant-numeric: tabular-nums; }

  .disc-area {
    display: grid;
    place-items: center;
    padding: var(--s-4);
  }
  @media (min-width: 900px) {
    .disc-area { justify-items: end; }
  }
  .disc-wrap {
    position: relative;
    width: clamp(224px, 22vw, 280px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--paper);
  }
  .orbit {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    animation: spin 22s linear infinite;
    overflow: visible;
  }
  .orbit text {
    font: 600 11px var(--font-mono-stack);
    text-transform: uppercase;
    fill: var(--ink);
  }
  .disc-wrap:hover .orbit { animation-duration: 6s; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .disc {
    position: relative;
    width: 66%;
    aspect-ratio: 1;
    border-radius: 50%;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: var(--s-1);
    background: var(--accent);
    color: var(--accent-ink);
    text-decoration: none;
    text-align: center;
    box-shadow: 0 0 0 8px var(--paper);
    transition: background var(--d-med) var(--ease-out), color var(--d-med) var(--ease-out);
  }
  .disc:hover, .disc:focus-visible { background: var(--ink); color: var(--paper); }
  .disc:focus-visible { outline: 3px solid var(--accent-text); outline-offset: 10px; }
  .disc-arrow {
    font: 700 clamp(2rem, 3vw, 2.8rem)/1 var(--font-display-stack);
    transition: transform var(--d-med) var(--ease-snap);
  }
  .disc:hover .disc-arrow, .disc:focus-visible .disc-arrow { transform: translateY(6px); }
  .disc-text {
    display: grid;
    justify-items: center;
    white-space: nowrap; /* "Download CV" on one line, "(PDF)" below */
    font: 600 var(--t-sm)/1.2 var(--font-body-stack);
  }
  .disc-sub { font-family: var(--font-mono-stack); font-size: var(--t-xs); }

  /* ---------- link tiles ---------- */
  .tiles ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid var(--ink);
    border-left: 1px solid var(--line);
  }
  /* Five tiles, no orphan: 2+2+1 bar on phones, 2 wide + 3 narrow on tablets, one row on desktop. */
  .tiles li:last-child { grid-column: 1 / -1; }
  @media (min-width: 600px) {
    .tiles ol { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .tiles li, .tiles li:last-child { grid-column: span 2; }
    .tiles li:nth-child(-n + 2) { grid-column: span 3; }
  }
  @media (min-width: 1200px) {
    .tiles ol { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .tiles li, .tiles li:nth-child(-n + 2), .tiles li:last-child { grid-column: auto; }
  }
  .tiles li { display: grid; }
  .tile {
    position: relative;
    display: grid;
    gap: var(--s-1);
    padding: var(--s-4) var(--s-4) var(--s-5);
    min-height: 44px;
    background: var(--paper);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
    isolation: isolate;
    overflow: hidden;
  }
  .tile::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--ink);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform var(--d-med) var(--ease-out);
  }
  .tile:hover::before, .tile:focus-visible::before { transform: scaleY(1); }
  .tile:hover, .tile:focus-visible { color: var(--paper); }
  .tile:hover .t-num, .tile:focus-visible .t-num,
  .tile:hover .t-note, .tile:focus-visible .t-note { color: var(--paper); }
  .tile:focus-visible { outline-offset: -4px; outline-color: var(--accent); }
  .t-top {
    display: flex;
    justify-content: space-between;
    font: 500 var(--t-xs)/1 var(--font-mono-stack);
  }
  .t-num { color: var(--ink-2); }
  .t-arrow {
    font-size: var(--t-lg);
    transition: transform var(--d-med) var(--ease-snap);
  }
  .tile:hover .t-arrow, .tile:focus-visible .t-arrow { transform: translate(3px, -3px) rotate(45deg); color: var(--accent); }
  .t-label {
    margin-top: var(--s-5);
    font: 820 var(--t-xl)/0.9 var(--font-display-stack);
    font-variation-settings: "wght" 820, "wdth" 68;
    text-transform: uppercase;
    transition: font-variation-settings var(--d-slow) var(--ease-out);
  }
  .tile:hover .t-label, .tile:focus-visible .t-label { font-variation-settings: "wght" 300, "wdth" 120; }
  .t-handle { font: 500 var(--t-sm)/1.3 var(--font-mono-stack); }
  .t-note { color: var(--ink-2); font-size: var(--t-sm); }

  /* ---------- footer ---------- */
  .foot { display: grid; gap: var(--s-4); margin-top: var(--s-6); }
  .foot .rule { background: var(--line); }
  .foot-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--s-2) var(--s-5);
    font: 500 var(--t-xs)/1.4 var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .foot-row > span { background: var(--paper); padding: var(--s-1) 0; }
  .foot-row time { font-variant-numeric: tabular-nums; }
  .top {
    min-height: 44px;
    padding: 0 var(--s-4);
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
  }
  .top:hover, .top:focus-visible { border-color: var(--ink); }

  @media (max-width: 599px) {
    .head .right { display: none; }
    .t-label { margin-top: var(--s-3); font-size: var(--t-lg); }
    .tile { padding: var(--s-3) var(--s-3) var(--s-4); }
    .disc-area { padding: 0; }
  }

  :global(:root[data-motion="reduced"]) .orbit { animation: none; }
  @media (forced-colors: active) {
    .disc { border: 2px solid ButtonText; }
  }
</style>
