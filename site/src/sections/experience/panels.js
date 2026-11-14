/**
 * Copy for the experience track. Facts come from the ZingPlay entry in miti99.yml
 * (through the whitelisted profile) and the content brief; nothing here is a new claim.
 */
import { profile, formatYm } from '../../lib/profile.js';
import { games, anchors } from '../../lib/content.js';

const job = profile.experience.find(entry => entry.company.startsWith('ZingPlay')) ?? profile.experience[0];
const [chaosLine, liveLine, forensicsLine, qualityLine, aiLine] = job.highlights.map(item => item.text);

/** Employment facts shown on the first panel. */
export const zingplay = {
  company: job.company,
  position: job.position,
  start: job.start,
  from: formatYm(job.start),
  to: formatYm(job.end),
  location: job.location,
  summary: job.summary,
};

/**
 * @param {string} name Game name.
 * @returns {string | null} Its Google Play link.
 */
const store = name => games.find(game => game.name === name)?.store ?? null;

/** Chaos Age 2: systems owned and the stack, from the first yml highlight. */
export const chaos = {
  store: store('Chaos Age 2'),
  role: 'Primary Java backend contributor',
  systems: ['Gameplay', 'Battle synchronization', 'Matchmaking', 'Payments', 'Admin tools'],
  stack: [
    { k: 'Runtime', v: 'Java 21' },
    { k: 'Network', v: 'Netty · Vert.x' },
    { k: 'Data', v: 'Couchbase · Redis' },
    { k: 'Events', v: 'Kafka' },
  ],
  line: chaosLine,
};

/** Burkozel, Show, Sky Garden plus the production forensics work. */
export const live = {
  games: games.filter(game => game.name !== 'Chaos Age 2'),
  lead: 'Diagnosed and fixed production concurrency issues.',
  duties: ['Gameplay events', 'Payment integrations', 'Configuration', 'Metrics'],
  forensics: ['JVM thread dumps', 'Heap analysis', 'GC logs', 'Load-testing tools'],
  line: liveLine,
  forensicsLine,
};

/** Delivery path from code to CI, from the fourth yml highlight. */
export const quality = {
  stations: [
    { tool: 'Packet handlers', note: 'Reusable handlers and gameplay modules' },
    { tool: 'JUnit 5 + Mockito', note: 'Tests for gameplay and payments' },
    { tool: 'Docker', note: 'Local dependencies' },
    { tool: 'Gradle', note: 'Builds' },
    { tool: 'GitLab CI', note: 'Delivery pipelines' },
  ],
  line: qualityLine,
};

/** The internal Claude Code marketplace, from the fifth yml highlight. */
export const ai = {
  facts: ['Plugins and skills', 'Java server scaffolding guidance', 'Standard packet-handler generation'],
  line: aiLine,
};

/** Panel ids, short names (rail) and kind labels, in track order. */
export const PANELS = [
  { id: anchors.zingplay, short: 'ZingPlay', kind: 'Employer' },
  { id: anchors.chaosAge, short: 'Chaos Age 2', kind: 'Java backend' },
  { id: anchors.liveGames, short: 'Live games', kind: 'Live ops' },
  { id: anchors.quality, short: 'Quality', kind: 'Engineering' },
  { id: anchors.ai, short: 'AI tooling', kind: 'Internal tooling' },
];
