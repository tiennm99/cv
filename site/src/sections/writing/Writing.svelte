<script>
  /**
   * 08 Writing, "The miti99 Desk": a newspaper front page fed live by the blog RSS.
   * A masthead whose nameplate stretches from condensed to wide as it scrolls in,
   * a 3-column editorial grid with a 2-column lead, column rules that draw in on
   * entry, and headlines that scramble on hover or headline focus. Newsletters lead
   * with their first story title, so each card and Inside entry says what it holds.
   * Skeleton while loading; on failure the grid hides behind a plain link to the blog.
   */
  import { onMount } from 'svelte';
  import { loadPosts } from '../../lib/live/rss.js';
  import { blog } from '../../lib/content.js';
  import { reduced } from '../../lib/ui.svelte.js';
  import { localDate, localTime } from '../../lib/time.js';
  import { gsap, ScrollTrigger, sectionMotion, refreshScroll } from '../../lib/motion/runtime.js';
  import { ago, ledeParser, newsletterNo, postLang, splitLede } from './desk.js';

  /** Brief section 8 topic tags, shown as the paper's beats. */
  const BEATS = ['AI agents', 'Claude Code', 'homelab', 'Java', 'Go', 'system design'];
  const LETTERS = 'abcdeghiklmnopqrstuvxyăâđêôơư';
  const DIGITS = '0123456789';
  /** Real space text between headline words, so the headline wraps there. */
  const SPACE = ' ';
  /** Splits after each hyphen, so "code-server" can still wrap there and each overlay stays on one line. */
  const HYPHEN_BREAK = /(?<=-)/;
  /** Spaced em dash between a newsletter's lede title and its body. */
  const DASH = ' — ';

  /** @type {{ status: 'loading' | 'fresh' | 'stale' | 'offline', asOf: number | null, posts: import('../../lib/live/rss.js').Post[] }} */
  let feed = $state({ status: 'loading', asOf: null, posts: [] });
  /** @type {HTMLElement | undefined} */
  let grid = $state();

  const ready = $derived(feed.status === 'fresh' || feed.status === 'stale');
  /**
   * @param {import('../../lib/live/rss.js').Post} post Feed post.
   * @param {number} index Position in the feed.
   * @returns {import('../../lib/live/rss.js').Post & { index: number, issue: number | null, lede: string, ledeLang: 'vi' | 'en', body: string, lang: 'vi' | 'en', headline: string }} Story view model.
   */
  const shape = (post, index) => {
    const issue = newsletterNo(post.title);
    const { lede, body } = splitLede(post.summary);
    return {
      ...post,
      index,
      issue,
      lede,
      ledeLang: postLang({ title: lede }),
      body,
      lang: postLang(post),
      headline: issue === null ? post.title : String(issue),
    };
  };
  const stories = $derived(feed.posts.slice(0, 6).map(shape));
  /** Posts 7-10 for the lead's "Inside" index. */
  const inside = $derived(feed.posts.slice(6, 10).map((post, i) => shape(post, i + 6)));
  /** "14 Nov 2026 13:55 GMT+7": when the feed copy on screen was fetched. */
  const stamp = $derived(feed.asOf ? `${localDate(feed.asOf)} ${localTime(feed.asOf)} GMT+7` : '');
  const issueDate = $derived(feed.posts[0]?.date ? localDate(Date.parse(feed.posts[0].date)) : null);

  onMount(() => {
    let alive = true;
    loadPosts({ limit: 30, parser: ledeParser() })
      .then(result => {
        if (alive) feed = result.posts.length ? result : { ...result, status: 'offline' };
      })
      .catch(error => {
        console.info('Blog feed unavailable:', error instanceof Error ? error.message : error);
        if (alive) feed = { status: 'offline', asOf: null, posts: [] };
      });
    return () => { alive = false; };
  });

  /**
   * Widest nameplate axis for the current breakpoint (CSS `--np-end`: 138, or 88 on phones).
   * @param {Element} node Element inside the section.
   * @returns {number} wdth value.
   */
  const plateEnd = node => Number.parseFloat(getComputedStyle(node).getPropertyValue('--np-end')) || 138;

  /**
   * Sizes the nameplate so that, at its widest axes, it spans the measure exactly.
   * Measures only on resize and font load, never per frame.
   * @param {HTMLElement} node The h2 nameplate.
   * @returns {{ destroy: () => void }} Action handle.
   */
  function fitPlate(node) {
    const text = /** @type {HTMLElement} */ (node.firstElementChild);
    let last = 0;
    const fit = (force = false) => {
      const width = node.clientWidth;
      if (!width || (width === last && !force)) return;
      last = width;
      // The global reduced-motion rule gives every element a 0.01ms transition, which would
      // keep the computed size at its old value during this synchronous read.
      text.style.setProperty('transition', 'none', 'important');
      text.style.fontVariationSettings = `"wght" 860, "wdth" ${plateEnd(node)}`;
      text.style.fontSize = '100px';
      const natural = text.getBoundingClientRect().width;
      text.style.fontVariationSettings = '';
      text.style.fontSize = '';
      text.getBoundingClientRect();
      text.style.removeProperty('transition');
      if (natural) node.style.setProperty('--np-size', `${Math.min((width / natural) * 98, 340).toFixed(2)}px`);
    };
    const observer = new ResizeObserver(() => fit());
    observer.observe(node);
    const loaded = document.fonts?.load('860 100px "Anybody Variable"') ?? Promise.resolve();
    const refit = () => { fit(true); refreshScroll(); };
    loaded.then(() => document.fonts.ready).then(refit).catch(() => {});
    // A font subset can finish after fonts.ready; refit whenever a load batch completes.
    document.fonts?.addEventListener('loadingdone', refit);
    return {
      destroy() {
        observer.disconnect();
        document.fonts?.removeEventListener('loadingdone', refit);
      },
    };
  }

  /**
   * Masthead motion: rules draw out from the centre and the nameplate stretches
   * from condensed to wide (wdth 50 → 138, wght 240 → 860) scrubbed by scroll.
   * @param {import('../../lib/motion/runtime.js').MotionContext} ctx Motion context.
   */
  function masthead({ node, reduced: isReduced }) {
    if (isReduced) return;
    const plate = node.querySelector('.plate');
    gsap.fromTo(plate, { '--np-wdth': 50, '--np-wght': 240 }, {
      '--np-wdth': () => plateEnd(node),
      '--np-wght': 860,
      ease: 'none',
      scrollTrigger: { trigger: plate, start: 'top 98%', end: 'top 40%', scrub: 0.6, invalidateOnRefresh: true },
    });
    gsap.from(node.querySelectorAll('.m-rule'), {
      scaleX: 0,
      duration: 1.2,
      ease: 'power3.inOut',
      stagger: 0.12,
      scrollTrigger: { trigger: node, start: 'top 85%', once: true },
    });
  }

  /**
   * Ends a scramble: empties the overlays and shows the real words again.
   * @param {Iterable<Element>} words `.w` word spans.
   */
  function release(words) {
    for (const word of words) {
      word.classList.remove('on');
      const ghost = word.querySelector('.wg');
      if (ghost) ghost.textContent = '';
    }
  }

  /**
   * Scrambles a story headline back to itself (hover, headline focus, entry). The random
   * letters run in an absolutely positioned overlay on each word while the real word stays
   * in the flow, transparent, so the headline never re-wraps and nothing below it moves.
   * No layout is read at all.
   * @param {Element | null} el Headline span holding `.w` words (real `.wt` text, `.wg` overlay).
   * @param {number} [duration] Seconds.
   * @returns {gsap.core.Tween | null} Tween, or null when skipped.
   */
  function scramble(el, duration = 0.8) {
    if (!(el instanceof HTMLElement) || reduced()) return null;
    const words = /** @type {HTMLElement[]} */ ([...el.querySelectorAll('.w')]);
    const ghosts = words.map(word => word.querySelector('.wg'));
    if (!words.length || ghosts.some(ghost => !ghost) || gsap.isTweening(ghosts[0])) return null;
    words.forEach((word, i) => {
      /** @type {Element} */ (ghosts[i]).textContent = word.dataset.text ?? '';
      word.classList.add('on');
    });
    const chars = el.dataset.chars ?? LETTERS;
    return gsap.to(ghosts, {
      duration,
      ease: 'none',
      scrambleText: i => ({ text: words[i].dataset.text ?? '', chars, speed: 0.6, revealDelay: 0.15 }),
      onComplete: () => release(words),
      onInterrupt: () => release(words),
    });
  }

  /**
   * Pointer entry on a story, or focus on its own headline link (never on the Inside list).
   * @param {Event} event Pointer or focus event.
   * @returns {gsap.core.Tween | null} Scramble tween.
   */
  const onStory = event => scramble(/** @type {HTMLElement} */ (event.currentTarget).querySelector('[data-scramble]'));

  // Grid motion: rebuilt when the stories or the motion preference change.
  $effect(() => {
    const isReduced = reduced();
    if (!grid || !ready || !stories.length) return;
    const root = grid;
    /** @type {(() => void) | null} */
    let finish = null;
    const ctx = gsap.context(() => {
      if (isReduced) return;
      const tl = gsap.timeline({ paused: true });
      tl.from(root.querySelectorAll('.rh'), { scaleX: 0, duration: 1.1, ease: 'power3.inOut', stagger: 0.07 }, 0)
        .from(root.querySelectorAll('.rv'), { scaleY: 0, duration: 1.2, ease: 'power3.inOut', stagger: 0.1 }, 0.1)
        .from(root.querySelectorAll('.story-in'), { opacity: 0, y: 22, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, 0.25);
      root.querySelectorAll('[data-scramble]').forEach((el, i) => {
        tl.add(() => { scramble(el, 1); }, 0.35 + i * 0.09);
      });
      ScrollTrigger.create({ trigger: root, start: 'top 82%', once: true, onEnter: () => tl.play() });
      // Opacity only (never visibility), so the links stay in the tab order; focus finishes the reveal.
      finish = () => tl.progress(1);
      root.addEventListener('focusin', finish);
    }, root);
    return () => {
      if (finish) root.removeEventListener('focusin', finish);
      const words = root.querySelectorAll('[data-scramble] .w');
      gsap.killTweensOf(root.querySelectorAll('[data-scramble] .wg'));
      release(words);
      ctx.revert();
    };
  });

  /**
   * @param {number} n Index from 0.
   * @returns {string} One-based, two digits ("02").
   */
  const pad = n => String(n + 1).padStart(2, '0');
</script>

<section class="desk section" aria-labelledby="writing-title" use:sectionMotion={masthead}>
  <div class="inner">
    <header class="masthead">
      <span class="m-rule thick" aria-hidden="true"></span>
      <div class="strap">
        <span class="label strap-a">(08) Writing</span>
        <span class="label strap-b">{issueDate ? `Issue of ${issueDate}` : 'The latest issue'}</span>
        <span class="label strap-c">{blog.languages}, since {blog.since}</span>
      </div>
      <span class="m-rule" aria-hidden="true"></span>

      <h2 id="writing-title" class="plate" use:fitPlate><span class="plate-text">The miti99 Desk</span></h2>

      <span class="m-rule" aria-hidden="true"></span>
      <div class="under">
        <p class="deck">
          <span class="label">Est. {blog.since}</span>
          <span class="deck-line">Engineer, builder, writer</span>
        </p>
        <p class="ear ear-l">
          <span class="label">Archive</span>
          <span class="ear-big">{blog.postCountText}</span>
          <span class="ear-small">A daily-ish Newsletter series, plus long reads</span>
        </p>
        <p class="ear ear-r">
          <span class="label">Beats</span>
          <span class="ear-small">{#each BEATS as beat, i (beat)}<span class="beat">{beat}{i < BEATS.length - 1 ? ' · ' : ''}</span><wbr />{/each}</span>
        </p>
      </div>
      <span class="m-rule double" aria-hidden="true"></span>
    </header>

    {#if feed.status === 'offline'}
      <div class="fail" role="status">
        <p class="fail-text">The latest posts could not load right now.</p>
        <a class="btn" href={blog.url} data-cursor="link">Read the blog on miti99.com <span aria-hidden="true">→</span></a>
      </div>
    {:else if feed.status === 'loading'}
      <div class="grid" aria-busy="true">
        <p class="sr-only" role="status">Loading the latest posts</p>
        {#each Array.from({ length: 6 }, (_, i) => i) as i (i)}
          <div class="story skel" class:lead={i === 0} data-i={i} aria-hidden="true">
            <span class="rh"></span><span class="rv"></span>
            <span class="bar kick"></span>
            <span class="bar head"></span>
            <span class="bar head short"></span>
            {#if i === 0}<span class="bar head"></span>{/if}
            <span class="bar line"></span>
            <span class="bar line"></span>
            <span class="bar line short"></span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid" bind:this={grid}>
        {#each stories as story (story.url)}
          <article
            class="story"
            class:lead={story.index === 0}
            class:nl={story.issue !== null}
            data-i={story.index}
            lang={story.lang}
            onpointerenter={onStory}
          >
            <span class="rh" aria-hidden="true"></span>
            <span class="rv" aria-hidden="true"></span>
            <div class="story-in">
              <p class="kicker label" lang="en">
                {#if story.index === 0}<span class="dot" aria-hidden="true"></span>Latest{:else}No. {pad(story.index)}{/if}
                <span aria-hidden="true">·</span>
                {#if story.issue !== null}Newsletter{:else if story.lang === 'vi'}<span lang="vi">Tiếng Việt</span>{:else}English{/if}
              </p>
              <h3 class="headline">
                <a class="story-link" href={story.url} data-cursor="link" onfocus={onStory}>
                  <span class="sr-only">{story.title}</span>
                  {#if story.issue !== null}<span class="no" aria-hidden="true">Nº</span>{/if}
                  <span aria-hidden="true" data-scramble data-chars={story.issue === null ? LETTERS : DIGITS}>
                    {#each story.headline.split(' ') as word, w (w)}{#if w}{SPACE}{/if}{#each word.split(HYPHEN_BREAK) as part, k (k)}<span class="w" data-text={part}><span class="wt">{part}</span><span class="wg"></span></span>{/each}{/each}
                  </span>
                </a>
              </h3>
              {#if story.lede || story.body}
                <p class="summary" class:has-inside={story.index === 0 && inside.length}>
                  {#if story.lede}<strong class="lede" lang={story.ledeLang}>{story.lede}</strong>{#if story.body}<span aria-hidden="true">{DASH}</span>{/if}{/if}{story.body}
                </p>
              {/if}
              {#if story.index === 0 && inside.length}
                <aside class="inside" aria-label="More from the desk">
                  <p class="label inside-label" lang="en">Inside</p>
                  <ol>
                    {#each inside as more (more.url)}
                      <li lang={more.lede ? more.ledeLang : more.lang}>
                        <a href={more.url} data-cursor="link">
                          <span class="inside-no label" lang="en">{pad(more.index)}</span>
                          <span class="inside-body">
                            {#if more.issue !== null}<span class="inside-issue label" lang="en">Newsletter Nº {more.issue}</span>{/if}
                            <span class="inside-title">{more.issue !== null && more.lede ? more.lede : more.title}</span>
                          </span>
                        </a>
                      </li>
                    {/each}
                  </ol>
                </aside>
              {/if}
              <p class="dateline label" lang="en">
                {#if story.date}
                  <time datetime={story.date}>{localDate(Date.parse(story.date))}</time>
                  {#if story.index === 0}<span aria-hidden="true">·</span> {ago(story.date)}{/if}
                {/if}
                <span class="go" aria-hidden="true">Read <span class="go-arrow">→</span></span>
              </p>
            </div>
          </article>
        {/each}
      </div>
    {/if}

    <footer class="desk-foot">
      {#if feed.status !== 'offline'}
        <a class="all" href={blog.url} data-cursor="link">
          <span class="all-text">Every post on miti99.com</span>
          <span class="all-arrow" aria-hidden="true">→</span>
        </a>
      {/if}
      <p class="label source" aria-live="polite">
        {#if feed.status === 'fresh' && feed.asOf}
          Live from miti99.com/index.xml · as of {stamp}
        {:else if feed.status === 'stale' && feed.asOf}
          Cached copy · as of {stamp}
        {:else if feed.status === 'loading'}
          Fetching miti99.com/index.xml…
        {:else}
          Feed offline · miti99.com
        {/if}
      </p>
    </footer>
  </div>
</section>

<style>
  .desk {
    --gap: clamp(24px, 3.2vw, 56px);
    --np-size: 12vw;
    --np-end: 88;
    --np-wdth: var(--np-end);
    --np-wght: 860;
  }
  @media (min-width: 768px) {
    .desk { --np-end: 138; }
  }
  .inner {
    max-width: var(--max);
    margin-inline: auto;
  }

  /* ---------- masthead ---------- */
  .m-rule {
    display: block;
    height: 1px;
    background: var(--ink);
    transform-origin: 50% 50%;
  }
  .m-rule.thick { height: 4px; }
  .m-rule.double {
    height: 5px;
    background: none;
    border-block: 1px solid var(--ink);
  }
  .strap {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--s-1) var(--s-4);
    padding-block: var(--s-3);
  }
  .strap .label { color: var(--ink); }
  .strap-b { order: 3; flex-basis: 100%; }
  @media (min-width: 768px) {
    .strap { display: grid; grid-template-columns: 1fr auto 1fr; }
    .strap-b { order: 0; text-align: center; }
    .strap-c { text-align: right; }
  }

  .plate {
    margin: 0;
    padding-block: var(--s-4) var(--s-3);
    font-family: var(--font-display-stack);
    font-size: var(--np-size);
    font-weight: 860;
    line-height: 0.8;
    letter-spacing: -0.012em;
    text-align: center;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: clip;
    overflow-clip-margin: 0.1em;
  }
  .plate-text {
    display: inline-block;
    font-variation-settings: "wght" var(--np-wght), "wdth" var(--np-wdth);
  }

  .under {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s-4);
    padding-block: var(--s-4);
  }
  .under p { margin: 0; }
  .deck {
    grid-column: 1 / -1;
    display: grid;
    justify-items: center;
    gap: var(--s-1);
    text-align: center;
  }
  .deck-line {
    font-family: var(--font-display-stack);
    font-variation-settings: "wght" 520, "wdth" 112;
    font-size: var(--t-xl);
    line-height: 1;
    letter-spacing: -0.01em;
  }
  .ear {
    display: grid;
    width: min(100%, 19rem);
    align-content: start;
    gap: var(--s-2);
    padding: var(--s-3);
    border: 1px solid var(--ink);
  }
  .ear-big {
    font-family: var(--font-display-stack);
    font-variation-settings: "wght" 780, "wdth" 72;
    font-size: var(--t-lg);
    line-height: 1;
    text-transform: uppercase;
  }
  .ear-small { font-size: var(--t-sm); line-height: 1.4; }
  @media (max-width: 767px) {
    .under { grid-template-columns: minmax(0, 1fr); }
    .ear { width: 100%; }
  }
  .beat { white-space: nowrap; }
  @media (min-width: 768px) {
    .under {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
      align-items: center;
    }
    .deck { grid-column: 2; grid-row: 1; }
    .ear-l { grid-column: 1; grid-row: 1; justify-self: start; }
    .ear-r { grid-column: 3; grid-row: 1; justify-self: end; }
    .ear { align-self: stretch; }
  }

  /* ---------- editorial grid ---------- */
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    column-gap: var(--gap);
    margin-top: var(--s-2);
  }
  .story {
    position: relative;
    padding-block: var(--s-5) var(--s-6);
    min-width: 0;
  }
  .rh, .rv {
    position: absolute;
    pointer-events: none;
  }
  .rh {
    inset: 0 0 auto;
    height: 1px;
    background: var(--ink);
    transform-origin: 0 50%;
  }
  .rv {
    display: none;
    top: var(--s-5);
    bottom: var(--s-5);
    left: calc(var(--gap) / -2);
    width: 1px;
    background: var(--ink);
    opacity: 0.35;
    transform-origin: 50% 0;
  }
  .story[data-i="0"] .rh { display: none; }

  @media (min-width: 768px) {
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lead { grid-column: 1 / -1; }
    .story[data-i="2"] .rv,
    .story[data-i="4"] .rv { display: block; }
    .story[data-i="5"]:last-child { grid-column: 1 / -1; }
  }
  @media (min-width: 1024px) {
    .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .lead { grid-column: 1 / span 2; grid-row: 1 / span 2; padding-right: var(--s-2); }
    .story[data-i="5"]:last-child { grid-column: auto; }
    .story[data-i="1"] { grid-column: 3; grid-row: 1; }
    .story[data-i="2"] { grid-column: 3; grid-row: 2; }
    .story[data-i="1"] .rh { display: none; }
    .story[data-i="2"] .rv,
    .story[data-i="4"] .rv { display: none; }
    .story[data-i="1"] .rv,
    .story[data-i="2"] .rv,
    .story[data-i="4"] .rv,
    .story[data-i="5"] .rv { display: block; }
    .story[data-i="1"] .rv { top: var(--s-4); }
  }

  .story-in {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    height: 100%;
  }
  .kicker {
    display: flex;
    align-items: center;
    gap: var(--s-2);
    margin: 0;
    color: var(--ink);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent);
  }
  .headline {
    margin: 0;
    font-family: var(--font-display-stack);
    font-weight: 720;
    font-variation-settings: "wght" 720, "wdth" 84;
    font-size: clamp(1.4rem, 1rem + 0.9vw, 1.9rem);
    line-height: 1.04;
    letter-spacing: -0.01em;
    text-wrap: balance;
    overflow-wrap: break-word;
  }
  .lead .headline {
    font-variation-settings: "wght" 800, "wdth" 74;
    font-size: clamp(2.2rem, 1rem + 3.6vw, 4.9rem);
    line-height: 1.02;
    hyphens: manual;
  }
  @media (min-width: 1024px) {
    .lead .headline { max-width: 20ch; }
  }
  .nl .headline {
    font-variation-settings: "wght" 840, "wdth" 60;
    font-size: clamp(3.2rem, 2rem + 3vw, 5.4rem);
    line-height: 0.86;
    font-variant-numeric: tabular-nums;
  }
  .no {
    display: inline-block;
    margin-right: 0.08em;
    font-size: 0.42em;
    vertical-align: 0.95em;
    font-variation-settings: "wght" 700, "wdth" 90;
    color: var(--accent);
  }
  .story-link {
    text-decoration: underline;
    text-decoration-color: transparent;
    text-decoration-thickness: 0.07em;
    text-underline-offset: 0.12em;
    transition: text-decoration-color var(--d-med) var(--ease-out);
  }
  /* Scramble overlay: random letters sit over the transparent real word, out of the flow. */
  .w { position: relative; }
  .wg {
    position: absolute;
    inset: 0 auto auto 0;
    white-space: nowrap;
    pointer-events: none;
  }
  .w:global(.on) .wt { color: transparent; }
  .story-link::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .story-link:focus-visible { outline: none; }
  .story-link:focus-visible::after {
    outline: 2px solid var(--accent-text);
    outline-offset: 4px;
  }
  .story:hover .story-link,
  .story-link:focus-visible { text-decoration-color: var(--accent); }

  /* Above the card's link overlay, so the text stays selectable. */
  .summary {
    position: relative;
    z-index: 2;
    margin: 0;
    font-size: var(--t-sm);
    line-height: 1.55;
    color: var(--ink-2);
    hyphens: auto;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    overflow: hidden;
  }
  .lead .summary {
    max-width: 38em;
    font-size: var(--t-lg);
    line-height: 1.5;
    color: var(--ink);
    display: block;
    overflow: visible;
  }
  .lede { font-weight: 650; color: var(--ink); }
  .lead .summary::first-letter {
    float: left;
    margin: 0.06em 0.06em 0 -0.02em;
    font-family: var(--font-display-stack);
    font-variation-settings: "wght" 860, "wdth" 66;
    font-size: 3.55em;
    line-height: 0.82;
    color: var(--accent);
    text-transform: uppercase;
  }

  .inside {
    position: relative;
    z-index: 2;
    padding-top: var(--s-3);
    border-top: 1px solid var(--ink);
  }
  .inside-label { margin: 0 0 var(--s-2); color: var(--ink); }
  .inside ol { margin: 0; padding: 0; list-style: none; }
  .inside li + li { border-top: 1px solid var(--line); }
  .inside a {
    display: grid;
    grid-template-columns: 2.2em minmax(0, 1fr);
    gap: var(--s-2);
    align-items: baseline;
    min-height: 44px;
    padding-block: var(--s-2);
    text-decoration: none;
  }
  .inside-no { color: var(--ink-2); }
  .inside-body { display: grid; gap: 2px; }
  .inside-issue { color: var(--ink-2); }
  .inside-title {
    font-size: var(--t-sm);
    font-weight: 600;
    line-height: 1.35;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 0.15em;
    transition: text-decoration-color var(--d-med) var(--ease-out);
  }
  .inside a:hover .inside-title,
  .inside a:focus-visible .inside-title { text-decoration-color: var(--accent); }
  @media (min-width: 1024px) {
    .lead .story-in {
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
      grid-template-rows: auto auto 1fr auto;
      column-gap: var(--s-6);
    }
    .lead .kicker, .lead .headline, .lead .dateline { grid-column: 1 / -1; }
    .lead .summary { grid-column: 1; align-self: start; }
    .lead .summary:not(.has-inside) { grid-column: 1 / -1; }
    .lead .inside { grid-column: 2; grid-row: 3; align-self: start; }
  }

  .dateline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s-2);
    margin: auto 0 0;
    padding-top: var(--s-2);
  }
  .go {
    margin-left: auto;
    padding-right: 6px;
    color: var(--ink);
  }
  .go-arrow {
    display: inline-block;
    transition: transform var(--d-med) var(--ease-out);
  }
  .story:hover .go-arrow,
  .story:has(.story-link:focus-visible) .go-arrow { transform: translateX(6px); }

  /* ---------- skeleton: newsprint dots that breathe ---------- */
  .skel { display: flex; flex-direction: column; gap: var(--s-3); }
  .bar {
    display: block;
    height: 0.9rem;
    background-image: radial-gradient(circle, var(--ink-2) 1.1px, transparent 1.5px);
    background-size: 6px 6px;
    opacity: 0.45;
    animation: breathe 1.6s var(--ease-io) infinite alternate;
  }
  .bar.kick { width: 30%; height: 0.75rem; }
  .bar.head { height: 1.8rem; width: 92%; }
  .lead .bar.head { height: clamp(2.2rem, 1rem + 3vw, 4rem); }
  .bar.short { width: 55%; }
  .bar.line { width: 100%; }
  @keyframes breathe { to { opacity: 0.15; } }

  /* ---------- failure ---------- */
  .fail {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-4);
    padding-block: var(--s-6);
  }
  .fail-text {
    margin: 0;
    font-size: var(--t-lg);
  }

  /* ---------- footer ---------- */
  .desk-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--s-4);
    margin-top: var(--s-2);
    padding-top: var(--s-5);
    border-top: 1px solid var(--ink);
  }
  .all {
    display: inline-flex;
    align-items: baseline;
    gap: var(--s-3);
    min-height: 44px;
    text-decoration: none;
    font-family: var(--font-display-stack);
    font-variation-settings: "wght" 760, "wdth" 92;
    font-size: var(--t-xl);
    line-height: 1.05;
  }
  .all-arrow {
    color: var(--accent);
    transition: transform var(--d-med) var(--ease-snap);
  }
  .all:hover .all-arrow,
  .all:focus-visible .all-arrow { transform: translateX(10px); }
  .all:hover .all-text { text-decoration: underline; text-decoration-thickness: 0.06em; text-underline-offset: 0.14em; }
  .source { margin: 0; }
</style>
