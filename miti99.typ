// Import the rendercv function and all the refactored components
#import "@preview/rendercv:0.3.0": *

// Apply the rendercv template with custom configuration
#show: rendercv.with(
  name: "Tien Nguyen Minh",
  title: "Tien Nguyen Minh - CV",
  footer: context { [#emph[Tien Nguyen Minh -- #str(here().page())\/#str(counter(page).final().first())]] },
  top-note: [ #emph[Last updated in Nov 2026] ],
  locale-catalog-language: "en",
  text-direction: ltr,
  page-size: "us-letter",
  page-top-margin: 0.45in,
  page-bottom-margin: 0.45in,
  page-left-margin: 0.55in,
  page-right-margin: 0.55in,
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
  typography-line-spacing: 0.5em,
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
  header-photo-width: 3cm,
  header-space-below-name: 0.3cm,
  header-space-below-headline: 0.3cm,
  header-space-below-connections: 0.3cm,
  header-connections-hyperlink: true,
  header-connections-show-icons: false,
  header-connections-display-urls-instead-of-usernames: true,
  header-connections-separator: "|",
  header-connections-space-between-connections: 0.5cm,
  section-titles-type: "with_full_line",
  section-titles-line-thickness: 0.5pt,
  section-titles-space-above: 0.3cm,
  section-titles-space-below: 0.2cm,
  sections-allow-page-break: true,
  sections-space-between-text-based-entries: 0.2em,
  sections-space-between-regular-entries: 0.7em,
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
    month: 11,
    day: 8,
  ),
)


= Tien Nguyen Minh

  #headline([Senior Java Software Engineer | Real-Time Backends])

#connections(
  [Ho Chi Minh City, Vietnam],
  [#link("mailto:tiennm99@outlook.com", icon: false, if-underline: false, if-color: false)[tiennm99\@outlook.com]],
  [#link("tel:+84-869-156-149", icon: false, if-underline: false, if-color: false)[0869 156 149]],
  [#link("https://miti99.com/", icon: false, if-underline: false, if-color: false)[miti99.com]],
  [#link("https://linkedin.com/in/miti99", icon: false, if-underline: false, if-color: false)[linkedin.com\/in\/miti99]],
  [#link("https://github.com/tiennm99", icon: false, if-underline: false, if-color: false)[github.com\/tiennm99]],
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
    #summary[Progressed from an entry-level game programmer to Senior Software Engineer, building and maintaining Java backends for multiplayer games since 2020. Work with client developers, QA, release teams, and product stakeholders to deliver and support live games.]

    - Developed gameplay, battle synchronization, matchmaking, payments, and admin tools for #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2] as a primary Java backend contributor, using Java 21, Netty, Vert.x, Couchbase, Redis, and Kafka.

    - Diagnosed and fixed production concurrency issues; maintained gameplay events, payment integrations, configuration, and metrics for #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel], #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show], and #link("https://play.google.com/store/apps/details?id=vn.kvtm.js")[Sky Garden].

    - Investigated high CPU usage and memory pressure using JVM thread dumps, heap analysis, and GC logs; built load-testing tools to reproduce game-server workloads.

    - Built reusable packet handlers and gameplay modules; added JUnit 5 and Mockito tests for gameplay and payments, Docker-based local dependencies, and Gradle\/GitLab CI delivery pipelines.

    - Created an internal Claude Code plugin and skill marketplace with Java server scaffolding guidance to standardize packet-handler generation and AI-assisted development.

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/store-scraper-bot")[Store Scraper Bot]]

  ],
  [
    Nov 2025 – present

  ],
  main-column-second-row: [
    #summary[Telegram bot that tracks app updates on the Apple App Store and Google Play.]

    - Built the #link("https://github.com/tiennm99/store-scraper-bot/tree/e794000df38c35d3e1a9aa0545d4573a2298a8a9")[original Java 21 implementation] with MongoDB, command-based handlers, reusable repositories, Gradle, Docker Compose, and JUnit scraper tests. Ported it to Node.js on Vercel with Upstash Redis, Vercel Cron, and GitHub Actions.

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99dev/gomoku")[Gomoku]]

  ],
  [
    2026

  ],
  main-column-second-row: [
    #summary[Multiplayer Gomoku game with a Go WebSocket server, Protocol Buffers messages, and a Phaser client.]

    - Implemented server-side move validation, win detection, player and spectator modes, and a minimax AI with alpha-beta pruning. Added game, lobby, and codec tests, Docker Compose, and GitHub Actions for vet, tests, and builds.

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/miti99bot")[miti99bot]]

  ],
  [
    May 2026 – present

  ],
  main-column-second-row: [
    #summary[Modular Go Telegram bot framework deployed to AWS Lambda with AWS SAM.]

    - Built pluggable Firestore and DynamoDB storage providers and rate-limited AI integrations. Added 53 Go test files covering modules, storage, and rate limiting, plus GitHub Actions CI and OIDC-authenticated AWS deployments.

  ],
)

== Skills

#strong[Languages:] Java, Go, JavaScript\/TypeScript, Shell

#strong[Frameworks & Libraries:] Netty, Vert.x, Spring Boot, WebSocket, Cocos2d-x, Godot

#strong[Data & Messaging:] Couchbase, Redis, MySQL, Kafka, ClickHouse

#strong[Infrastructure & DevOps:] Docker, Linux, GitLab CI, GitHub Actions, AWS Lambda\/SAM, Cloudflare Workers, Vercel

#strong[Testing & Engineering:] JUnit 5, Mockito, unit testing, code review, production debugging, CI\/CD, OOP, design patterns, event-driven architecture, AI-assisted development

== Education

#education-entry(
  [
    #strong[Ho Chi Minh City University of Technology], B.E. in Computer Science and Engineering -- HCMC, Vietnam

  ],
  [
    Sept 2017 – June 2023

  ],
  main-column-second-row: [
    - GPA: 8.0\/10; Academic Excellence Scholarship; Five Good Student Award.

    - Thesis: Survival2D, a multiplayer battle royale server built with Java, Netty\/WebSocket, FlatBuffers, behavior-tree AI, and server-side anti-cheat.

  ],
)
