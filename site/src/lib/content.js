/**
 * Curated site copy. Every fact here comes from miti99.yml or
 * plans/261114-1228-landing-site/content-brief.md; live numbers (stars, dates)
 * never live here, they come from lib/live/github.js.
 */

/** Hero hook and positioning lines (brief section 1). */
export const positioning = {
  bioFallback: 'A developer wants to be magician',
  handle: 'miti99',
  employer: 'ZingPlay Game Studios, VNG Corp.',
  gamesSince: '2020-07',
  lines: [
    'Game-server engineer by day, builder of a hundred side projects by night.',
    'I build real-time backends for live multiplayer games, and everything else for fun.',
  ],
};

/**
 * @typedef {{ repo: string, title: string, blurb: string, stack: string[], tags: string[], href: string | null }} Featured
 */

/** Ten featured repos (brief section 4), in curated order. Tags drive the filter chips. */
/** @type {Featured[]} */
export const featured = [
  { repo: 'tiennm99/awesome-ai-dev-tools', title: 'Awesome AI Dev Tools', blurb: 'Daily-refreshed ranking of AI developer tools with star-history charts.', stack: ['Go', 'GitHub Actions', 'Cloudflare Pages'], tags: ['Go', 'Edge'], href: 'https://awesome-ai-dev-tools.pages.dev' },
  { repo: 'tiennm99dev/gomoku', title: 'Gomoku', blurb: 'Multiplayer Gomoku with a Go WebSocket server, Protocol Buffers messages and a minimax AI with alpha-beta pruning.', stack: ['Go', 'WebSocket', 'Protobuf', 'Phaser 3'], tags: ['Go', 'Real-time'], href: null },
  { repo: 'tiennm99/noitu', title: 'Nối từ', blurb: 'Vietnamese word-chain game: play a bot or 2-4 players online.', stack: ['Go', 'SvelteKit', 'Protobuf', 'WebSocket', 'SQLite'], tags: ['Go', 'Real-time', 'Svelte'], href: 'https://noitu.miti99.dev' },
  { repo: 'tiennm99/rplace', title: 'rplace', blurb: 'Collaborative real-time canvas on the edge.', stack: ['Svelte 5', 'Hono', 'Cloudflare Workers', 'Durable Objects'], tags: ['Real-time', 'Svelte', 'Edge'], href: 'https://rplace.tiennm99.workers.dev' },
  { repo: 'tiennm99dev/rubik', title: 'Rubik', blurb: 'A Rubik’s cube in the browser.', stack: ['three.js', 'Svelte 5', 'Vite'], tags: ['three.js', 'Svelte'], href: 'https://tiennm99dev.github.io/rubik' },
  { repo: 'tiennm99dev/tilt-maze', title: 'Tilt Maze', blurb: 'Device-tilt 3D maze with physics.', stack: ['three.js', 'Rapier'], tags: ['three.js'], href: 'https://tiennm99dev.github.io/tilt-maze' },
  { repo: 'tiennm99/tiennm99bot', title: 'tiennm99bot', blurb: 'Plug-and-play Telegram bot framework: games, cron jobs, paper trading.', stack: ['Go', 'Coolify', 'MongoDB Atlas'], tags: ['Go', 'Bots'], href: 'https://t.me/tiennm99bot' },
  { repo: 'tiennm99/store-scraper-bot', title: 'Store Scraper Bot', blurb: 'Telegram bot that tracks app updates on the App Store and Google Play. Built in Java 21, then ported to Node.js on Vercel.', stack: ['Node.js', 'Vercel', 'Upstash Redis'], tags: ['Bots'], href: 'https://store-scraper-bot.vercel.app' },
  { repo: 'tiennm99/vngeoguessr', title: 'VN GeoGuessr', blurb: 'GeoGuessr for Vietnam.', stack: ['Next.js', 'Mapillary', 'Turf.js'], tags: [], href: 'https://vngeoguessr.vercel.app' },
  { repo: 'tiennm99/ghglance', title: 'ghglance', blurb: 'GitHub profile cards rendered as SVG, also as a GitHub Action.', stack: ['Go', 'SVG', 'GitHub Action'], tags: ['Go'], href: 'https://ghglance.miti99.dev' },
];

/** Filter chips for the projects index, in display order. */
export const projectFilters = ['All', 'Go', 'Real-time', 'three.js', 'Svelte', 'Edge', 'Bots'];

/**
 * Anchor id for a featured project row.
 * @param {string} repo "owner/name".
 * @returns {string} DOM id.
 */
export const projectAnchor = repo => `project-${repo.split('/')[1]}`;

/** Live games kept running at ZingPlay (yml experience highlights). */
export const games = [
  { name: 'Chaos Age 2', store: 'https://play.google.com/store/apps/details?id=vn.zps.tl2' },
  { name: 'Burkozel', store: 'https://play.google.com/store/apps/details?id=zps.games.burkozel' },
  { name: 'Show', store: 'https://play.google.com/store/apps/details?id=zps.games.show' },
  { name: 'Sky Garden', store: 'https://play.google.com/store/apps/details?id=vn.kvtm.js' },
];

/**
 * Stable anchor ids that sections must render so cross-links and the palette work.
 * Experience panels, the craft terminal and the thesis card.
 */
export const anchors = {
  zingplay: 'xp-zingplay',
  chaosAge: 'xp-chaos-age-2',
  liveGames: 'xp-live-games',
  quality: 'xp-quality',
  ai: 'xp-ai',
  craft: 'craft-terminal',
  thesis: 'tl-thesis',
};

/**
 * @typedef {{ date: string, title: string, body: string, kind: 'study' | 'work' | 'writing' | 'build' | 'github', anchor?: string }} TimelineEntry
 */

/** Timeline entries (brief section 2 and yml education). */
/** @type {TimelineEntry[]} */
export const timeline = [
  { date: '2017-09', title: 'Starts at HCMUT', body: 'B.E. Computer Science and Engineering, Ho Chi Minh City University of Technology.', kind: 'study' },
  { date: '2018-05', title: 'GitHub account', body: 'Creates tiennm99 on GitHub.', kind: 'github' },
  { date: '2020-04', title: 'First blog posts', body: 'Starts writing on miti99.com.', kind: 'writing' },
  { date: '2020-07', title: 'Joins ZingPlay', body: 'Joins ZingPlay Game Studios (VNG) as an entry-level game programmer.', kind: 'work' },
  { date: '2023-06', title: 'Graduates', body: 'GPA 8.14/10, Academic Excellence Scholarship, Five Good Student Award. Thesis: Survival2D, a multiplayer battle-royale server built with Java, Netty/WebSocket, FlatBuffers, behavior-tree AI and server-side anti-cheat.', kind: 'study', anchor: 'tl-thesis' },
  { date: '2025', title: 'Blog restarts, Store Scraper Bot', body: 'The blog picks up pace again; Store Scraper Bot ships in Java, later ported to Node.js on Vercel.', kind: 'build' },
  { date: '2026-08', title: 'tiennm99dev', body: 'Creates the tiennm99dev org for public work in progress.', kind: 'github' },
  { date: '2026', title: 'Builder year', body: 'Gomoku, Rubik, Nối từ, rplace, an AI dev tools ranking, and an internal Claude Code plugin marketplace at work.', kind: 'build' },
];

/**
 * Skill → anchor ids where that skill shows up (experience panels, project rows, thesis).
 * Built only from yml and brief text.
 * @type {Record<string, string[]>}
 */
export const crossLinks = {
  Java: [anchors.chaosAge, anchors.thesis, projectAnchor('tiennm99/store-scraper-bot')],
  Go: ['tiennm99dev/gomoku', 'tiennm99/noitu', 'tiennm99/tiennm99bot', 'tiennm99/awesome-ai-dev-tools', 'tiennm99/ghglance'].map(projectAnchor),
  'JavaScript/TypeScript': ['tiennm99/store-scraper-bot', 'tiennm99/rplace', 'tiennm99/vngeoguessr'].map(projectAnchor),
  Netty: [anchors.chaosAge, anchors.thesis],
  'Vert.x': [anchors.chaosAge],
  WebSocket: [anchors.thesis, projectAnchor('tiennm99dev/gomoku'), projectAnchor('tiennm99/noitu')],
  Couchbase: [anchors.chaosAge],
  Redis: [anchors.chaosAge, projectAnchor('tiennm99/store-scraper-bot')],
  Kafka: [anchors.chaosAge],
  Docker: [anchors.quality],
  'GitLab CI': [anchors.quality],
  'GitHub Actions': [projectAnchor('tiennm99/awesome-ai-dev-tools'), projectAnchor('tiennm99/ghglance')],
  'Cloudflare Workers': [projectAnchor('tiennm99/rplace')],
  Vercel: [projectAnchor('tiennm99/store-scraper-bot'), projectAnchor('tiennm99/vngeoguessr')],
  'JUnit 5': [anchors.quality],
  Mockito: [anchors.quality],
  'production debugging': [anchors.liveGames, anchors.craft],
  'AI-assisted development': [anchors.ai, projectAnchor('tiennm99/awesome-ai-dev-tools')],
};

/** Blog facts (brief section 8). */
export const blog = {
  url: 'https://miti99.com/',
  feed: 'https://miti99.com/index.xml',
  languages: 'Vietnamese and English',
  since: 2020,
  postCountText: 'nearly 200 posts',
};

/** Public links (brief section 7). Email comes from the profile, not here. */
export const links = {
  github: 'https://github.com/tiennm99',
  githubOrg: 'https://github.com/tiennm99dev',
  linkedin: 'https://www.linkedin.com/in/miti99',
  blog: 'https://miti99.com/',
  linkInBio: 'https://tiennm99.github.io/iammiti99/',
  cvPdf: './miti99.pdf',
  cvDownloadName: 'Tien-Nguyen-Minh-CV.pdf',
};
