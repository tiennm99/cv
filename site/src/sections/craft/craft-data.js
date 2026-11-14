/**
 * Section 04 data: terminal scripts and the simplified flow diagram.
 *
 * Script lines describe the generic method behind tools named in miti99.yml
 * (ZingPlay highlights and the Survival2D thesis). They name tools and steps
 * only, never numbers or findings: the logs illustrate a method, not a real
 * incident. `source` quotes the CV verbatim (ellipses mark cuts; `*…*` marks
 * the tool the command is about).
 */

/**
 * @typedef {'cmt' | 'step' | 'ok'} LineKind
 * @typedef {{ kind: LineKind, text: string }} ScriptLine
 * @typedef {'load' | 'client' | 'netty' | 'handler' | 'gameplay' | 'couchbase' | 'redis' | 'kafka' | 'jvm'} NodeId
 * @typedef {object} Command
 * @property {string} name Command typed at the prompt.
 * @property {string} title Short human title, used by the chips and the caption.
 * @property {string} source The CV wording this command illustrates.
 * @property {NodeId[]} nodes Diagram nodes highlighted while it is active.
 * @property {NodeId[]} [dim] Nodes faded out (not part of this story).
 * @property {'threads' | 'heap' | 'gc'} [sig] Signature drawn inside the JVM box.
 * @property {Partial<Record<NodeId, string>>} [tags] Sticker labels on nodes.
 * @property {ScriptLine[]} lines Scripted output; `*word*` marks a tool name.
 */

/** The ZingPlay forensics sentence, quoted for the three JVM tools. */
const FORENSICS = 'Investigated high CPU usage and memory pressure using JVM thread dumps, heap analysis, and GC logs…';

/** @type {Command[]} */
export const COMMANDS = [
  {
    name: 'threads',
    title: 'Thread dumps',
    source: FORENSICS.replace('JVM thread dumps', '*JVM thread dumps*'),
    nodes: ['jvm', 'netty', 'handler', 'gameplay'],
    tags: { jvm: 'thread dumps' },
    sig: 'threads',
    lines: [
      { kind: 'cmt', text: 'symptom: high CPU usage' },
      { kind: 'step', text: 'take *JVM thread dumps*, a few in a row' },
      { kind: 'step', text: 'group the threads by state and by stack' },
      { kind: 'step', text: 'frames that stay busy across dumps mark the hot path' },
      { kind: 'step', text: 'follow the stack back to the code that owns it' },
      { kind: 'ok', text: 'fix, then dump again to confirm it went quiet' },
    ],
  },
  {
    name: 'heap',
    title: 'Heap analysis',
    source: FORENSICS.replace('heap analysis', '*heap analysis*'),
    nodes: ['jvm'],
    tags: { jvm: 'heap dump' },
    sig: 'heap',
    lines: [
      { kind: 'cmt', text: 'symptom: memory pressure' },
      { kind: 'step', text: 'capture a *heap dump* from the JVM' },
      { kind: 'step', text: 'run *heap analysis*: dominators, retained size' },
      { kind: 'step', text: 'look for objects that outlive their purpose' },
      { kind: 'ok', text: 'release the reference, compare the next heap' },
    ],
  },
  {
    name: 'gc',
    title: 'GC logs',
    source: FORENSICS.replace('GC logs', '*GC logs*'),
    nodes: ['jvm'],
    tags: { jvm: 'GC logs' },
    sig: 'gc',
    lines: [
      { kind: 'cmt', text: 'read the collector’s own diary' },
      { kind: 'step', text: 'turn on and collect the *GC logs*' },
      { kind: 'step', text: 'line the pauses up against the symptom window' },
      { kind: 'step', text: 'tell allocation churn apart from a real leak' },
      { kind: 'ok', text: 'change one thing, read the logs again' },
    ],
  },
  {
    name: 'loadtest',
    title: 'Load testing',
    source: '…built *load-testing tools* to reproduce game-server workloads.',
    nodes: ['load', 'client', 'netty'],
    tags: { load: 'reproduce' },
    lines: [
      { kind: 'cmt', text: 'reproduce the workload, then measure' },
      { kind: 'step', text: 'build *load-testing tools* for the game server' },
      { kind: 'step', text: 'script client sessions that reproduce game-server workloads' },
      { kind: 'step', text: 'drive the server, watch threads and heap' },
      { kind: 'ok', text: 'the same workload, ready to run again' },
    ],
  },
  {
    name: 'tests',
    title: 'JUnit 5 + Mockito',
    source: '…added *JUnit 5* and *Mockito* tests for gameplay and payments, Docker-based local dependencies, and Gradle/GitLab CI delivery pipelines.',
    nodes: ['handler', 'gameplay'],
    tags: { gameplay: 'JUnit 5 · Mockito' },
    lines: [
      { kind: 'cmt', text: 'keep the fixes fixed' },
      { kind: 'step', text: '*JUnit 5* and *Mockito* tests for gameplay and payments' },
      { kind: 'step', text: '*Docker*-based local dependencies' },
      { kind: 'ok', text: 'delivery pipelines in *Gradle* and *GitLab CI*' },
    ],
  },
  {
    name: 'thesis',
    title: 'Survival2D thesis',
    source: 'Thesis: *Survival2D*, a multiplayer battle royale server built with Java, Netty/WebSocket, FlatBuffers, behavior-tree AI, and server-side anti-cheat.',
    nodes: ['client', 'netty', 'handler', 'gameplay'],
    dim: ['couchbase', 'redis', 'kafka', 'load'],
    tags: { netty: 'FlatBuffers', handler: 'anti-cheat', gameplay: 'behavior tree' },
    lines: [
      { kind: 'cmt', text: 'Survival2D, the university thesis' },
      { kind: 'step', text: 'a multiplayer battle-royale server in *Java*' },
      { kind: 'step', text: '*Netty* and *WebSocket* transport, *FlatBuffers* messages' },
      { kind: 'step', text: 'server-side *anti-cheat*' },
      { kind: 'step', text: 'in-game agents driven by *behavior-tree AI*' },
      { kind: 'ok', text: 'the graduation thesis at HCMUT' },
    ],
  },
];

/** Built-ins that are not part of the tour. */
export const BUILTINS = ['help', 'clear', 'whoami'];

/** All names the prompt completes, tour commands first. */
export const NAMES = [...COMMANDS.map(command => command.name), ...BUILTINS];

/**
 * @param {string} name Command name.
 * @returns {Command | undefined} The tour command with that name.
 */
export const commandByName = name => COMMANDS.find(command => command.name === name);

/**
 * First command name that extends `prefix` (case-insensitive), or '' when none or the prefix is empty.
 * @param {string} prefix What the visitor typed so far.
 * @returns {string} The completion, e.g. "threads" for "th".
 */
export function complete(prefix) {
  const value = prefix.trim().toLowerCase();
  if (!value) return '';
  return NAMES.find(name => name.startsWith(value) && name !== value) ?? '';
}

/**
 * Splits a script line into plain and tool segments (`*tool*`).
 * @param {string} text Line text with `*tool*` markers.
 * @returns {{ text: string, tool: boolean }[]} Segments in reading order.
 */
export function segments(text) {
  return text.split(/(\*[^*]+\*)/).filter(Boolean).map(part => (
    part.startsWith('*') && part.endsWith('*') ? { text: part.slice(1, -1), tool: true } : { text: part, tool: false }
  ));
}

/**
 * @typedef {{ id: NodeId, x: number, y: number, w: number, h: number, label: string, sub?: string, ghost?: boolean }} FlowNode
 * @typedef {{ id: string, from: NodeId, to: NodeId, d: string, label?: { text: string, x: number, y: number }, ghost?: boolean }} FlowEdge
 * @typedef {{ x: number, y: number, w: number, h: number }} Box
 * @typedef {{ w: number, h: number, jvm: Box & { lx: number, ly: number }, sig: Box, nodes: FlowNode[], edges: FlowEdge[] }} FlowLayout
 */

/**
 * Cubic path between two points, bending along the main axis.
 * @param {[number, number]} a Start.
 * @param {[number, number]} b End.
 * @param {'h' | 'v'} axis Axis the curve leaves and enters along.
 * @returns {string} SVG path data.
 */
function curve([ax, ay], [bx, by], axis) {
  if (axis === 'h') {
    const mx = (ax + bx) / 2;
    return `M${ax} ${ay}C${mx} ${ay} ${mx} ${by} ${bx} ${by}`;
  }
  const my = (ay + by) / 2;
  return `M${ax} ${ay}C${ax} ${my} ${bx} ${my} ${bx} ${by}`;
}

const NODE_H = 64;

/** Wide layout: load tool above, request path in the JVM, storage underneath. */
/** @type {FlowLayout} */
export const WIDE = (() => {
  const h = NODE_H;
  /** @type {FlowNode[]} */
  const nodes = [
    { id: 'load', x: 0, y: 24, w: 180, h, label: 'Load tool', sub: 'reproduces workloads', ghost: true },
    { id: 'client', x: 0, y: 176, w: 140, h, label: 'Client', sub: 'game app' },
    { id: 'netty', x: 200, y: 176, w: 160, h, label: 'Netty', sub: 'WebSocket' },
    { id: 'handler', x: 410, y: 176, w: 160, h, label: 'Handler', sub: 'packets' },
    { id: 'gameplay', x: 620, y: 176, w: 160, h, label: 'Gameplay', sub: 'modules' },
    { id: 'couchbase', x: 330, y: 352, w: 140, h, label: 'Couchbase' },
    { id: 'redis', x: 490, y: 352, w: 130, h, label: 'Redis' },
    { id: 'kafka', x: 650, y: 352, w: 130, h, label: 'Kafka' },
  ];
  return {
    w: 790,
    h: 424,
    jvm: { x: 178, y: 118, w: 612, h: 174, lx: 192, ly: 276 },
    sig: { x: 344, y: 254, w: 250, h: 28 },
    nodes,
    edges: [
      { id: 'load-netty', from: 'load', to: 'netty', d: curve([180, 56], [280, 176], 'h'), ghost: true },
      { id: 'client-netty', from: 'client', to: 'netty', d: curve([140, 208], [200, 208], 'h') },
      { id: 'netty-handler', from: 'netty', to: 'handler', d: curve([360, 208], [410, 208], 'h') },
      { id: 'handler-gameplay', from: 'handler', to: 'gameplay', d: curve([570, 208], [620, 208], 'h') },
      { id: 'gameplay-couchbase', from: 'gameplay', to: 'couchbase', d: curve([680, 240], [400, 352], 'v') },
      { id: 'gameplay-redis', from: 'gameplay', to: 'redis', d: curve([700, 240], [555, 352], 'v') },
      { id: 'gameplay-kafka', from: 'gameplay', to: 'kafka', d: curve([720, 240], [715, 352], 'v'), label: { text: 'events', x: 728, y: 318 } },
    ],
  };
})();

/** Tall layout for narrow columns: top to bottom. */
/** @type {FlowLayout} */
export const TALL = (() => {
  const h = NODE_H;
  /** @type {FlowNode[]} */
  const nodes = [
    { id: 'client', x: 16, y: 28, w: 168, h, label: 'Client', sub: 'game app' },
    { id: 'load', x: 216, y: 28, w: 168, h, label: 'Load tool', sub: 'reproduces load', ghost: true },
    { id: 'netty', x: 116, y: 184, w: 168, h, label: 'Netty', sub: 'WebSocket' },
    { id: 'handler', x: 116, y: 288, w: 168, h, label: 'Handler', sub: 'packets' },
    { id: 'gameplay', x: 116, y: 392, w: 168, h, label: 'Gameplay', sub: 'modules' },
    { id: 'couchbase', x: 0, y: 556, w: 128, h, label: 'Couchbase' },
    { id: 'redis', x: 136, y: 556, w: 128, h, label: 'Redis' },
    { id: 'kafka', x: 272, y: 556, w: 128, h, label: 'Kafka' },
  ];
  return {
    w: 400,
    h: 628,
    jvm: { x: 6, y: 128, w: 388, h: 356, lx: 20, ly: 474 },
    sig: { x: 296, y: 300, w: 86, h: 48 },
    nodes,
    edges: [
      { id: 'client-netty', from: 'client', to: 'netty', d: curve([100, 92], [180, 184], 'v') },
      { id: 'load-netty', from: 'load', to: 'netty', d: curve([300, 92], [220, 184], 'v'), ghost: true },
      { id: 'netty-handler', from: 'netty', to: 'handler', d: curve([200, 248], [200, 288], 'v') },
      { id: 'handler-gameplay', from: 'handler', to: 'gameplay', d: curve([200, 352], [200, 392], 'v') },
      { id: 'gameplay-couchbase', from: 'gameplay', to: 'couchbase', d: curve([170, 456], [64, 556], 'v') },
      { id: 'gameplay-redis', from: 'gameplay', to: 'redis', d: curve([200, 456], [200, 556], 'v') },
      { id: 'gameplay-kafka', from: 'gameplay', to: 'kafka', d: curve([230, 456], [336, 556], 'v'), label: { text: 'events', x: 300, y: 516 } },
    ],
  };
})();
