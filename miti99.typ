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
  [#link("https://www.facebook.com/tiennm99/", icon: false, if-underline: false, if-color: false)[fb.com\/tiennm99]],
)
  ]
)


== Education

#education-entry(
  [
    #strong[Ho Chi Minh City University of Technology], B.E. in Computer Science in Computer Science and Engineering -- HCMC, Vietnam

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
    #summary[Progressed from Game Programming Fresher to Senior Software Engineer. Builds and maintains Java game backends and production tooling with cross-functional work across server, client, QA, and release workflows.]

    - #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2]: Sole server developer for a global strategy game; built Java 21 backend modules with Netty\/Vert.x, Couchbase, Redis, Kafka, Gradle, and GitLab CI\/CD

    - Improved delivery quality with JUnit 5\/Mockito tests, load-test clients, Docker-based local dependencies, and multi-environment build\/deploy pipelines

    - Built internal AI-assisted Claude Code skills\/plugin marketplace for ZingPlay game-server development, including typed packet-handler scaffolding and framework guidance

    - #link("https://play.google.com/store/apps/details?id=vn.kvtm.js")[Sky Garden]: Maintained production Java server features for a live farm game; handled event logic, web payment fixes, Redis\/runtime diagnostics, and release support

    - #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show], #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel], and #link("https://play.google.com/store/apps/details?id=zps.games.bida3d.vn")[Bida3D]: Delivered server-side gameplay, matchmaking, and client logic across real-time card and pool games

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/mitisrv")[MiTiSrv]]

  ],
  [
    2018 – 2025

  ],
  main-column-second-row: [
    #summary[Lightweight Java game server framework using Netty; personal framework for experimenting with reusable multiplayer server architecture.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/test-sharding")[Test Sharding]]

  ],
  [
    2025

  ],
  main-column-second-row: [
    #summary[Java server experiment for sharding with Couchbase replication, Redis replication, and Kafka.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/store-scraper-bot")[Store Scraper Bot] \/ #link("https://github.com/tiennm99/store-scraper-bot-java")[Java original]]

  ],
  [
    Nov 2025 – present

  ],
  main-column-second-row: [
    #summary[Telegram bot for tracking Apple App Store and Google Play metadata updates; original Java version later ported to JavaScript.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/miti99bot")[Miti99bot]]

  ],
  [
    2026

  ],
  main-column-second-row: [
    #summary[Go Telegram bot framework deployed serverlessly on AWS Lambda\/SAM with Firestore and Gemini integration.]

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
