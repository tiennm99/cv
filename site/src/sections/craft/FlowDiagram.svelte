<script>
  /**
   * Simplified game-server flow (client → Netty → handler → gameplay → stores,
   * events → Kafka). Packet pulses are dashes on `pathLength=100` paths whose
   * offset follows the `--flow` custom property (scrubbed by scroll in Craft.svelte),
   * so a scroll frame writes one variable and reads no layout. The active command
   * lights its nodes and runs a time-based pulse on its edges while in view; the
   * three JVM tools also draw their own signature inside the JVM box (stacked
   * thread dumps, a sawtooth heap gauge, GC pause ticks). The load tool is always
   * drawn, faint and dashed until `loadtest` lights it, so no row sits empty.
   */
  import { WIDE, TALL } from './craft-data.js';

  /** @type {{ command: import('./craft-data.js').Command | null, live?: boolean }} */
  let { command, live = false } = $props();

  let width = $state(0);
  const layout = $derived(width && width < 600 ? TALL : WIDE);
  const on = $derived(new Set(command?.nodes ?? []));
  const dim = $derived(new Set(command?.dim ?? []));
  const tags = $derived(command?.tags ?? {});
  const sig = $derived(command?.sig ?? '');

  const sw = $derived(layout.sig.w);
  const sh = $derived(layout.sig.h);

  /** Heap gauge: allocation climbs, a collection drops it, four times over (unit box). */
  const SAW = [[0, 1], [0.22, 0.2], [0.24, 0.85], [0.46, 0.1], [0.48, 0.8], [0.7, 0.15], [0.72, 0.9], [0.95, 0.2], [0.97, 0.82], [1, 0.6]];

  /**
   * @param {number[][]} unit Points in a unit box.
   * @returns {string} Polyline path data in the signature box.
   */
  const pts = unit => `M${unit.map(([x, y]) => `${(x * sw).toFixed(1)} ${(y * sh).toFixed(1)}`).join('L')}`;
  /** GC pause ticks: uneven spacing, uneven length (unit box). */
  const TICKS = [0.04, 0.13, 0.19, 0.33, 0.41, 0.47, 0.62, 0.7, 0.83, 0.9, 0.96];

  /**
   * @param {import('./craft-data.js').FlowEdge} edge Edge.
   * @returns {boolean} True when both ends are lit, or the edge leaves a lit JVM.
   */
  const edgeOn = edge => (on.has(edge.from) && on.has(edge.to)) || (on.has('jvm') && edge.from !== 'load' && edge.from !== 'client');

  /**
   * @param {string} text Sticker text.
   * @returns {number} Approximate sticker width in viewBox units (mono 12px).
   */
  const tagWidth = text => text.length * 7.4 + 16;
</script>

<div class="flow" bind:clientWidth={width} class:live>
  <svg viewBox="0 0 {layout.w} {layout.h}" role="img" aria-labelledby="craft-flow-title craft-flow-desc">
    <title id="craft-flow-title">Simplified game-server flow</title>
    <defs>
      <pattern id="craft-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" style="fill: var(--paper)" />
        <path d="M0 0V6" style="stroke: var(--line); stroke-width: 2" />
      </pattern>
    </defs>
    <desc id="craft-flow-desc">A client connects through Netty over WebSocket to a packet handler, then to gameplay modules, which read and write Couchbase and Redis and publish events to Kafka.{command ? ` Highlighted for ${command.title}: ${command.nodes.join(', ')}.` : ''}</desc>

    <g class="jvm" class:on={on.has('jvm')}>
      <rect x={layout.jvm.x} y={layout.jvm.y} width={layout.jvm.w} height={layout.jvm.h} />
      <text x={layout.jvm.lx} y={layout.jvm.ly}>JVM · game server</text>
      {#if sig}
        {#key sig}
          <g class="sig sig-{sig}" transform="translate({layout.sig.x} {layout.sig.y})" aria-hidden="true">
            {#if sig === 'threads'}
              {#each [0, 1, 2] as k (k)}
                {@const cw = (sw - 2 * 8) / 3}
                <g class="dump" style="--k:{k}" transform="translate({k * (cw + 8)} 0)">
                  <rect width={cw} height={sh} />
                  {#each [0.3, 0.55, 0.8] as row, r (r)}
                    <path d="M5 {sh * row}H{cw * (0.35 + ((k + r) % 3) * 0.2)}" />
                  {/each}
                </g>
              {/each}
            {:else if sig === 'heap'}
              <path class="cap" d="M0 1H{sw}" />
              <path class="saw" d={pts(SAW)} pathLength="100" />
            {:else}
              <path class="axis" d="M0 {sh / 2}H{sw}" />
              {#each TICKS as t, k (k)}
                <path class="tick" style="--k:{k}" d="M{t * sw} {sh / 2 - (k % 3 + 1) * sh / 7}V{sh / 2 + (k % 3 + 1) * sh / 7}" />
              {/each}
            {/if}
          </g>
        {/key}
      {/if}
    </g>

    {#each layout.edges as edge, i (edge.id)}
      <g class="edge" class:on={edgeOn(edge)} class:ghost={edge.ghost} class:dim={dim.has(edge.to) || dim.has(edge.from)} style="--i:{i}">
        <path class="base" d={edge.d} pathLength="100" />
        <path class="pulse" d={edge.d} pathLength="100" />
        <path class="run" d={edge.d} pathLength="100" />
        {#if edge.label}<text class="edge-label" x={edge.label.x} y={edge.label.y}>{edge.label.text}</text>{/if}
      </g>
    {/each}

    {#each layout.nodes as node (node.id)}
      <g
        class="node"
        class:on={on.has(node.id)}
        class:dim={dim.has(node.id)}
        class:ghost={node.ghost}
        transform="translate({node.x} {node.y})"
      >
        <rect width={node.w} height={node.h} />
        <text class="name" x="14" y={node.sub ? 30 : 40}>{node.label}</text>
        {#if node.sub}<text class="sub" x="14" y="50">{node.sub}</text>{/if}
        {#if tags[node.id]}
          {@const tw = tagWidth(tags[node.id] ?? '')}
          <g class="tag" transform="translate({node.w - tw} -26)">
            <rect width={tw} height="22" /><text x={tw / 2} y="15.5">{tags[node.id]}</text>
          </g>
        {/if}
      </g>
    {/each}
    {#if tags.jvm}
      {@const tw = tagWidth(tags.jvm)}
      <g class="tag" transform="translate({layout.jvm.x + layout.jvm.w - tw - 12} {layout.jvm.y - 11})">
        <rect width={tw} height="22" /><text x={tw / 2} y="15.5">{tags.jvm}</text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .flow {
    --flow: 0;
    width: 100%;
    margin-inline: auto;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: calc(100svh - var(--bar-h) - 220px);
    overflow: visible;
  }
  @media (max-width: 767px) {
    svg { max-height: none; }
  }

  /* JVM boundary */
  .jvm > rect {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 1;
    stroke-dasharray: 2 5;
    transition: stroke var(--d-med), fill var(--d-med);
  }
  .jvm > text {
    font: 500 12px var(--font-mono-stack);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    fill: var(--ink-2);
  }
  .jvm.on > rect { stroke: var(--accent); stroke-width: 2; stroke-dasharray: none; fill: color-mix(in oklch, var(--accent) 7%, transparent); }
  .jvm.on > text { fill: var(--ink); }

  /* Edges: hairline base, scroll-scrubbed packets, and a time-based run on lit edges. */
  .edge { transition: opacity var(--d-med) var(--ease-out); }
  .edge.dim path { opacity: 0.3; }
  .edge path { fill: none; stroke-linecap: round; }
  .base { stroke: var(--ink-2); stroke-width: 1.25; opacity: 0.55; }
  .ghost .base { stroke-dasharray: 1.2 1.8; }
  .pulse {
    stroke: var(--accent);
    stroke-width: 3.5;
    stroke-dasharray: 2.2 22.8;
    stroke-dashoffset: calc(var(--flow) * -300 - var(--i) * 6);
  }
  .run {
    stroke: var(--ink);
    stroke-width: 2.25;
    stroke-dasharray: 18 82;
    opacity: 0;
    transition: opacity var(--d-med);
  }
  .edge.on .base { stroke: var(--ink); opacity: 1; stroke-width: 1.75; }
  .edge.on .run { opacity: 1; }
  .live .edge.on .run { animation: run 1.4s linear infinite; }
  @keyframes run {
    from { stroke-dashoffset: 100; }
    to { stroke-dashoffset: 0; }
  }
  .edge-label {
    font: 500 12px var(--font-mono-stack);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    fill: var(--ink-2);
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 5px;
  }

  /* Nodes */
  .node { transition: opacity var(--d-med) var(--ease-out); }
  .node > rect {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 1.25;
    transition: fill var(--d-med) var(--ease-out), stroke var(--d-med);
  }
  .node.ghost > rect { stroke: var(--ink-2); stroke-dasharray: 4 4; }
  .node.ghost .name { fill: var(--ink-2); }
  /* Not part of this story: hatched and dashed, text kept legible. */
  .node.dim > rect {
    stroke: var(--ink-2);
    stroke-dasharray: 3 4;
    fill: url(#craft-hatch);
  }
  .node.dim .name, .node.dim .sub { fill: var(--ink-2); }
  .name {
    font: 800 20px var(--font-display-stack);
    font-variation-settings: "wght" 800, "wdth" 72;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    fill: var(--ink);
    transition: fill var(--d-med), font-variation-settings var(--d-slow) var(--ease-out);
  }
  .sub {
    font: 500 13px var(--font-mono-stack);
    fill: var(--ink-2);
    transition: fill var(--d-med);
  }
  .node.on > rect { fill: var(--accent); stroke: var(--accent); }
  .node.on .name { fill: var(--accent-ink); font-variation-settings: "wght" 860, "wdth" 96; }
  .node.on > rect { stroke-dasharray: none; }
  .node.on .sub { fill: var(--accent-ink); }

  /* Stickers */
  .tag rect { fill: var(--ink); }
  .tag text {
    font: 600 12px var(--font-mono-stack);
    letter-spacing: 0.04em;
    text-anchor: middle;
    fill: var(--paper);
  }
  .tag { animation: stick var(--d-med) var(--ease-snap) both; }
  @keyframes stick {
    from { opacity: 0; }
  }

  /* JVM signatures, drawn in the layout's signature box. */
  .sig path, .sig rect { fill: none; stroke: var(--ink); stroke-width: 1.5; }
  .dump rect { fill: var(--paper); }
  .dump path { stroke: var(--ink-2); }
  .dump { animation: drop var(--d-med) var(--ease-out) calc(var(--k) * 180ms) both; }
  @keyframes drop { from { opacity: 0; } }
  .sig-heap .cap { stroke: var(--accent-text); stroke-dasharray: 2 3; }
  .saw { stroke: var(--accent-text); stroke-width: 2; stroke-dasharray: 100; animation: draw 1.6s var(--ease-out) both; }
  @keyframes draw { from { stroke-dashoffset: 100; } }
  .axis { stroke: var(--ink-2); }
  .tick { stroke: var(--accent-text); stroke-width: 2.5; animation: blip 0.5s var(--ease-out) calc(var(--k) * 90ms) both; }
  @keyframes blip { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .dump, .saw, .tick, .tag { animation: none; }
  }

  @media (forced-colors: active) {
    .pulse, .run { display: none; }
    .node.on > rect { stroke-width: 4; }
  }
</style>
