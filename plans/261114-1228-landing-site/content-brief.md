# Landing Site Content Brief

Content source of truth for the show-off landing site (`tiennm99.github.io/cv`).
Collected 2026-11-14 from public sources only: `miti99.yml`, GitHub `tiennm99`
(user) and `tiennm99dev` (org), the blog `miti99.com`, and the link-in-bio repo
`tiennm99/iammiti99`. The PDF CV for HR is a separate output and keeps its own
tone.

**Hard rule: never show the phone number.** `miti99.yml` contains one; the
site's data layer must drop `cv.phone` before rendering (whitelist fields, do
not blacklist).

## 1. Identity and positioning

| Field | Value | Source |
| --- | --- | --- |
| Name | Tien Nguyen Minh | yml, GitHub |
| Handle | miti99 (`@miti99`) | link-in-bio, LinkedIn |
| Headline | Senior Java Software Engineer, Real-Time Backends | yml |
| Location | Ho Chi Minh City, Vietnam | yml |
| Employer | ZingPlay Game Studios, VNG Corp. | yml, GitHub company |
| GitHub bio | "A developer wants to be magician" | GitHub profile |
| Link-in-bio tagline | "Engineer building things on the web." / "engineer, builder, writer" | iammiti99 `hugo.yml` |

One-line positioning (pick one in design review):

- A. "Game-server engineer by day, builder of a hundred side projects by night."
- B. "I build real-time backends for millions of players, and everything else for fun."
- C. "A developer who wants to be a magician." (the GitHub bio, used as the hero hook)

Hero idea: the magician bio is the strongest hook for a wow site; pair it with
the serious headline as the subtitle.

## 2. Story and timeline

| When | Event |
| --- | --- |
| 2017-09 | Starts B.E. Computer Science and Engineering, HCMC University of Technology |
| 2018-05 | GitHub account `tiennm99` created |
| 2020-04 | First blog posts on miti99.com (30 posts in 2020) |
| 2020-07 | Joins ZingPlay Game Studios (VNG) as entry-level game programmer |
| 2023-06 | Graduates, GPA 8.14/10; thesis Survival2D, a multiplayer battle-royale server |
| 2020-2026 | Grows to Senior Software Engineer; primary Java backend contributor on Chaos Age 2 |
| 2025 | Blog restarts at pace (89 posts in 2025, 72 so far in 2026, mostly a daily-ish Newsletter series) |
| 2025-11 | Store Scraper Bot (Java, then Node.js on Vercel) |
| 2026-08 | Creates the `tiennm99dev` org for public work in progress |
| 2026 | Gomoku, Rubik, noitu, rplace, AI dev tools ranking; internal Claude Code plugin marketplace at work |

Narrative arc for scroll-telling: student → game-server engineer → senior who
debugs production at scale → prolific builder across Go, JS, Rust, three.js and
AI tooling.

## 3. Experience

**ZingPlay Game Studios, VNG Corp.**: Senior Software Engineer, 2020-07 to
present, HCMC. Java backends for live multiplayer games.

- Chaos Age 2 ([Play Store](https://play.google.com/store/apps/details?id=vn.zps.tl2)):
  gameplay, battle synchronization, matchmaking, payments, admin tools. Java 21,
  Netty, Vert.x, Couchbase, Redis, Kafka.
- Burkozel, Show, Sky Garden: production concurrency fixes, gameplay events,
  payment integrations, configuration, metrics (Play Store links in yml).
- Performance forensics: JVM thread dumps, heap analysis, GC logs; load-testing
  tools that reproduce game-server workloads.
- Engineering quality: reusable packet handlers, JUnit 5 + Mockito, Docker local
  deps, Gradle + GitLab CI.
- AI-assisted development: internal Claude Code plugin and skill marketplace
  with Java server scaffolding guidance.

Visual idea: show the four game icons as a "games I keep alive" strip, linking
to their store pages.

## 4. Featured projects (pick 6-10)

Stars are fetched live (section 9); numbers here are a snapshot for layout only.

| # | Repo | Live link | Stack | Why feature it |
| --- | --- | --- | --- | --- |
| 1 | `tiennm99/awesome-ai-dev-tools` (4★) | awesome-ai-dev-tools.pages.dev | Go, GitHub Actions, Cloudflare Pages | Top-starred; daily-refreshed ranking with star-history charts; shows data + automation |
| 2 | `tiennm99dev/gomoku` (1★) | none | Go WebSocket, Protobuf, Phaser 3 | In the CV; real-time multiplayer + minimax AI, mirrors day job |
| 3 | `tiennm99/noitu` | noitu.miti99.dev | Go, SvelteKit, Protobuf/WebSocket, SQLite | Vietnamese word-chain game, bot or 2-4 players online; playable demo |
| 4 | `tiennm99/rplace` | rplace.tiennm99.workers.dev | Svelte 5, Hono, Workers, Durable Objects | Collaborative real-time canvas on the edge; very visual |
| 5 | `tiennm99dev/rubik` | tiennm99dev.github.io/rubik | three.js, Svelte 5, Vite | Same stack as the landing site; can be embedded as a 3D easter egg |
| 6 | `tiennm99dev/tilt-maze` | tiennm99dev.github.io/tilt-maze | three.js, Rapier physics | Device-tilt 3D demo; great on mobile |
| 7 | `tiennm99/tiennm99bot` | t.me/tiennm99bot | Go, Coolify, MongoDB Atlas | Plug-and-play Telegram bot framework; pinned; games, cron, paper trading |
| 8 | `tiennm99/store-scraper-bot` | store-scraper-bot.vercel.app | Node.js, Vercel, Upstash Redis | In the CV; Java → Node port story |
| 9 | `tiennm99/vngeoguessr` | vngeoguessr.vercel.app | Next.js, Mapillary, Turf.js | Pinned; GeoGuessr for Vietnam, instantly understandable |
| 10 | `tiennm99/ghglance` (1★) | ghglance.miti99.dev | Go, SVG, GitHub Action | Pinned; GitHub profile cards, fits the live-GitHub theme |

Bench (swap in if a card is weak): `traefik-cloudflare-dns` (Go, homelab DNS
daemon), `usage-monitor` (Rust/Tauri Claude Code + Codex usage widget),
`thptqg` (1.7M exam results queried client-side with sql.js), `genshin-repository`
(4★, daily Go fetcher), `sokoban` (Svelte 5, 155 levels), `time-mocker` (Rust
Win32 API hooking).

Keep out: personal/gift sites (valentine-2025, tn1, ocrot, xr2s25fe), templates,
forks, experiments marked failed, and `export-telegram-group-members` (OSINT
connotation on a hiring page).

## 5. Skills

From yml, grouped for a skill-constellation or orbit visual:

- **Languages:** Java (strongest), Go, JavaScript/TypeScript, Shell; also Rust,
  C++ in public repos.
- **Frameworks:** Netty, Vert.x, Spring Boot, WebSocket, Cocos2d-x, Godot;
  Svelte 5, three.js, Phaser 3, Hono (from repos).
- **Data and messaging:** Couchbase, Redis, MySQL, Kafka, ClickHouse.
- **Infra and DevOps:** Docker, Linux, GitLab CI, GitHub Actions, AWS
  Lambda/SAM, Cloudflare Workers, Vercel; self-hosted Coolify homelab (blog).
- **Engineering:** JUnit 5, Mockito, production debugging, CI/CD,
  event-driven architecture, AI-assisted development (Claude Code).

Live complement: a language bar computed from GitHub (section 9), public
snapshot: Go 18, JavaScript 17, HTML 6, C++ 5, Rust 2 (tiennm99, non-fork).

## 6. Education

Ho Chi Minh City University of Technology: B.E. Computer Science and
Engineering, 2017-09 to 2023-06. GPA 8.14/10, Academic Excellence Scholarship,
Five Good Student Award. Thesis: Survival2D, multiplayer battle-royale server
(Java, Netty/WebSocket, FlatBuffers, behavior-tree AI, server-side anti-cheat).

## 7. Links

| Label | URL |
| --- | --- |
| Blog | https://miti99.com |
| GitHub | https://github.com/tiennm99 |
| GitHub (WIP org) | https://github.com/tiennm99dev |
| LinkedIn | https://www.linkedin.com/in/miti99 |
| Link-in-bio | https://tiennm99.github.io/iammiti99/ |
| Email | see open question 1 |
| PDF CV | the HR CV, linked as "Download CV" |

No phone, no Telegram personal handle (`t.me/tiennm99bot` is a bot, fine to
show in its project card).

## 8. Blog highlights

- 198 posts total (2020: 30, 2021-2024: 7, 2025: 89, 2026: 72). Site `lang=vi`;
  repo describes it as VN/EN. Present it as "writes in Vietnamese and English".
- Recent long-form: "Góc làm việc cuối 2026: DeskMini ở nhà, code-server trên
  cloud" (2026-11-04), "Khi AI crawler đi dạo khắp Gitea tự host của mình"
  (2026-10-29).
- Ongoing series: Newsletter #1..#139 (latest 2026-10-07).
- Topic tags: ai-agents, claude-code, ai-coding, llms, homelab, self-hosted,
  coolify, cloudflare, gitea, linux, java, go, redis, postgresql,
  distributed-systems, system-design, performance, reliability,
  software-architecture, algorithms, developer-experience, soft-skills.
- Live option: the RSS feed `https://miti99.com/index.xml` sends
  `access-control-allow-origin: *` (checked 2026-11-14), so the site can fetch
  and parse it in the browser (DOMParser) for "latest posts"; on failure hide
  the list and keep a plain link to the blog.

## 9. Live data (client-side GitHub REST)

Verified 2026-11-14: `api.github.com` returns `access-control-allow-origin: *`,
exposes `X-RateLimit-*`, `ETag` and `Link`, and sends
`cache-control: public, max-age=60`. Unauthenticated limit: 60 requests per hour
per visitor IP. Never ship a token.

| Purpose | Endpoint | Fields used |
| --- | --- | --- |
| Avatar, name, bio, followers, public repo count | `GET https://api.github.com/users/tiennm99` | `avatar_url`, `name`, `bio`, `followers`, `public_repos`, `created_at` |
| tiennm99 repos (108 public, 2 pages) | `GET https://api.github.com/users/tiennm99/repos?type=owner&per_page=100&page=N` (follow `Link: rel="next"`) | `name`, `fork`, `archived`, `stargazers_count`, `language`, `description`, `topics`, `homepage`, `html_url`, `pushed_at` |
| tiennm99dev repos (55 public, 1 page) | `GET https://api.github.com/orgs/tiennm99dev/repos?type=public&per_page=100` | same as above |
| Avatar image | `avatar_url` + `&s=256` (from `avatars.githubusercontent.com`, not rate-limited) | n/a |

Derived client-side, no extra calls:

- **Total stars:** sum `stargazers_count` over both repo lists where
  `fork == false` (snapshot: 20 + 1 = 21). Decide whether archived repos count.
- **Top repos:** sort non-fork repos by stars, then `pushed_at`.
- **Languages:** count primary `language` per non-fork repo. Do not call
  `/repos/{owner}/{repo}/languages` per repo (160+ calls, blows the limit).
- **Featured cards:** look up the section 4 repos by name in the fetched lists
  to fill live stars and descriptions; the curated list of names lives in the
  repo, the numbers do not.
- **Pinned repos:** only GraphQL exposes them, and GraphQL needs a token, so the
  site cannot read pins client-side; the curated featured list replaces them.

Budget: 4 requests per cold visit (1 user + 2 + 1 repo pages). Keep it there:

- Cache the merged result in `localStorage` with a timestamp; reuse it for
  10-30 minutes before refetching. Wrap storage access in try/catch.
- Send `If-None-Match` with the stored ETag on refetch; a 304 is cheap and the
  browser HTTP cache already honours `max-age=60`.
- Read `X-RateLimit-Remaining`; below 4, skip fetching and use cache.
- Fire requests in parallel with an `AbortController` timeout (about 5 s).

Graceful degradation, in order:

1. Fresh API data.
2. Stale `localStorage` data, labelled "as of <time>".
3. Static fallback baked at build time from `miti99.yml` only (name, avatar
   from `https://github.com/tiennm99.png`, featured repo names without star
   counts). Hide numeric counters instead of showing 0.
4. On 403/429 show nothing alarming; log to console only.

Rate-limit note: 60/h is per visitor IP, so shared NATs (offices, mobile
carriers) can exhaust it; the cache above is what keeps the site working there.

## 10. Do not show

- Phone number (in yml; strip in the data layer).
- Private repos, work repo names, internal tools beyond the CV wording.
- Home network, servers, hostnames from the workspace.
- Personal gift sites and anything about other private individuals.

## Open questions

1. Which email is public: `tiennm99@outlook.com` (yml) or
   the Gmail address on the link-in-bio page? They differ.
2. `miti99.yml` links `github.com/tiennm99/miti99bot` and calls it AWS
   Lambda/SAM with Firestore/DynamoDB; the repo is now `tiennm99/tiennm99bot`
   on Coolify + MongoDB Atlas. Update the yml wording before reuse?
3. Count archived repos in total stars?
4. Pinned `tiennm99/cv` description still says "Typst with RenderCV"; refresh it
   when the new site ships.
