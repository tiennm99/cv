// Import the rendercv function and all the refactored components
#import "@preview/rendercv:0.3.0": *

// Apply the rendercv template with custom configuration
#show: rendercv.with(
  name: "Tien Nguyen Minh",
  title: "Tien Nguyen Minh - CV",
  footer: context { [#emph[Tien Nguyen Minh -- #str(here().page())\/#str(counter(page).final().first())]] },
  top-note: [ #emph[Last updated in June 2026] ],
  locale-catalog-language: "en",
  text-direction: ltr,
  page-size: "us-letter",
  page-top-margin: 0.7in,
  page-bottom-margin: 0.7in,
  page-left-margin: 0.7in,
  page-right-margin: 0.7in,
  page-show-footer: false,
  page-show-top-note: true,
  colors-body: rgb(0, 0, 0),
  colors-name: rgb(0, 0, 0),
  colors-headline: rgb(0, 0, 0),
  colors-connections: rgb(0, 0, 0),
  colors-section-titles: rgb(0, 0, 0),
  colors-links: rgb(0, 0, 0),
  colors-footer: rgb(128, 128, 128),
  colors-top-note: rgb(128, 128, 128),
  typography-line-spacing: 0.6em,
  typography-alignment: "justified",
  typography-date-and-location-column-alignment: right,
  typography-font-family-body: "XCharter",
  typography-font-family-name: "XCharter",
  typography-font-family-headline: "XCharter",
  typography-font-family-connections: "XCharter",
  typography-font-family-section-titles: "XCharter",
  typography-font-size-body: 10pt,
  typography-font-size-name: 25pt,
  typography-font-size-headline: 10pt,
  typography-font-size-connections: 10pt,
  typography-font-size-section-titles: 1.2em,
  typography-small-caps-name: false,
  typography-small-caps-headline: false,
  typography-small-caps-connections: false,
  typography-small-caps-section-titles: false,
  typography-bold-name: false,
  typography-bold-headline: false,
  typography-bold-connections: false,
  typography-bold-section-titles: true,
  links-underline: true,
  links-show-external-link-icon: false,
  header-alignment: center,
  header-photo-width: 3.5cm,
  header-space-below-name: 0.7cm,
  header-space-below-headline: 0.7cm,
  header-space-below-connections: 0.7cm,
  header-connections-hyperlink: true,
  header-connections-show-icons: false,
  header-connections-display-urls-instead-of-usernames: true,
  header-connections-separator: "|",
  header-connections-space-between-connections: 0.5cm,
  section-titles-type: "with_full_line",
  section-titles-line-thickness: 0.5pt,
  section-titles-space-above: 0.5cm,
  section-titles-space-below: 0.3cm,
  sections-allow-page-break: true,
  sections-space-between-text-based-entries: 0.15cm,
  sections-space-between-regular-entries: 0.42cm,
  entries-date-and-location-width: 4.15cm,
  entries-side-space: 0cm,
  entries-space-between-columns: 0.1cm,
  entries-allow-page-break: false,
  entries-short-second-row: false,
  entries-degree-width: 1cm,
  entries-summary-space-left: 0cm,
  entries-summary-space-above: 0.08cm,
  entries-highlights-bullet:  text(13pt, [•], baseline: -0.6pt) ,
  entries-highlights-nested-bullet:  text(13pt, [•], baseline: -0.6pt) ,
  entries-highlights-space-left: 0cm,
  entries-highlights-space-above: 0.08cm,
  entries-highlights-space-between-items: 0.08cm,
  entries-highlights-space-between-bullet-and-text: 0.3em,
  date: datetime(
    year: 2026,
    month: 6,
    day: 11,
  ),
)


#grid(
  columns: (auto, 1fr),
  column-gutter: 0cm,
  align: horizon + left,
  [#pad(left: 0.4cm, right: 0.4cm, image("avatar.jpg", width: 3.5cm))
],
  [
= Tien Nguyen Minh

  #headline([Senior Java Software Engineer])

#connections(
  [HCMC, Vietnam],
  [#link("mailto:tiennm99@outlook.com", icon: false, if-underline: false, if-color: false)[tiennm99\@outlook.com]],
  [#link("tel:+84-869-156-149", icon: false, if-underline: false, if-color: false)[0869 156 149]],
  [#link("https://miti99.com/", icon: false, if-underline: false, if-color: false)[miti99.com]],
  [#link("https://linkedin.com/in/miti99", icon: false, if-underline: false, if-color: false)[linkedin.com\/in\/miti99]],
  [#link("https://github.com/tiennm99", icon: false, if-underline: false, if-color: false)[github.com\/tiennm99]],
  [#link("https://t.me/tiennm5", icon: false, if-underline: false, if-color: false)[t.me\/tiennm5]],
)
  ]
)


== Education

#education-entry(
  [
    #strong[Ho Chi Minh City University of Technology], B.E. in Computer Science and Engineering -- HCMC, Vietnam

  ],
  [
    Sept 2017 – June 2023

  ],
  main-column-second-row: [
    - GPA: 8.0\/10 — Academic Excellence Scholarship; Five Good Student Award

    - Thesis: Survival2D — 2D multiplayer Battle Royale game server in Java (Netty\/WebSocket); authoritative architecture, FlatBuffers serialization (76\% packet reduction vs JSON), behavior tree AI bots, and server-side anti-cheat

  ],
)

== Experience

#regular-entry(
  [
    #strong[Senior Software Engineer], ZingPlay Game Studios, VNG Corp. -- HCMC, Vietnam

  ],
  [
    July 2020 – present

  ],
  main-column-second-row: [
    #summary[Progressed from Game Programming Fresher to Senior Software Engineer. Focuses on Java game backends, live operations, delivery automation, and collaboration with client, QA, release, and product stakeholders.]

    - #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2]: Primary Java server contributor across gameplay, battle sync, matchmaking, payment\/webpay, admin tooling, tests, and delivery automation

    - Built and maintained Java 21 backend modules with Netty\/Vert.x, Couchbase, Redis, Kafka, Gradle, JUnit 5, Mockito, Docker-based local dependencies, and GitLab CI pipelines; used tests around gameplay, payment, and release-critical flows

    - #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel] and #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show]: Implemented and maintained backend gameplay events, payment\/config updates, tests, metrics, concurrency fixes, live diagnostics, and release support

    - #link("https://play.google.com/store/apps/details?id=vn.kvtm.js")[Sky Garden] \/ KVTM: Maintained Java server features, web payment fixes, Redis\/runtime diagnostics, GM tooling, CI\/deploy support, and Godot migration support

    - Built internal Claude Code plugin\/skill marketplace and Java game-server scaffolding guidance to standardize packet-handler generation, framework usage, and AI-assisted delivery workflows

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/store-scraper-bot")[Store Scraper Bot] \/ #link("https://github.com/tiennm99/store-scraper-bot-java")[Java original]]

  ],
  [
    Nov 2025 – present

  ],
  main-column-second-row: [
    #summary[Telegram bot for tracking Apple App Store and Google Play metadata changes; originally built in Java, then ported to JavaScript.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/gomoku")[Gomoku]]

  ],
  [
    2026

  ],
  main-column-second-row: [
    #summary[Multiplayer Gomoku game with Go WebSocket backend, protobuf messaging, Docker support, PVP\/PVE\/spectator modes, and Phaser client.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/rplace")[Rplace]]

  ],
  [
    2026

  ],
  main-column-second-row: [
    #summary[Collaborative pixel-art canvas using Svelte, Hono, Cloudflare Workers, and Durable Object SQLite.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/db-keepalive")[DB Keepalive]]

  ],
  [
    2026

  ],
  main-column-second-row: [
    #summary[Pluggable Go daemon for keeping free-tier database clusters active across Redis, Valkey, PostgreSQL, MySQL, MongoDB, and Couchbase.]

  ],
)

== Skills

#strong[Languages:] Java, Go, JavaScript\/TypeScript, Shell

#strong[Frameworks & Libraries:] Netty, Vert.x, Spring Boot, JUnit 5, Mockito, Cocos2d-x, Godot

#strong[Databases:] Couchbase, Redis, MySQL, Kafka, ClickHouse

#strong[Infrastructure & DevOps:] Docker, GitLab CI, GitHub Actions, Linux, AWS Lambda\/SAM, Cloudflare Workers

#strong[Architecture:] Object-oriented design, game server architecture, real-time multiplayer systems, event-driven design, clean reusable code

#strong[Delivery Practices:] Unit testing, code review, production debugging, CI\/CD, AI-assisted development workflows

#strong[Languages (Spoken):] Vietnamese (Native), English (TOEIC 600+)
