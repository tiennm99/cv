// Import the rendercv function and all the refactored components
#import "@preview/rendercv:0.3.0": *

// Apply the rendercv template with custom configuration
#show: rendercv.with(
  name: "Tien Nguyen Minh",
  title: "Tien Nguyen Minh - CV",
  footer: context { [#emph[Tien Nguyen Minh -- #str(here().page())\/#str(counter(page).final().first())]] },
  top-note: [ #emph[Last updated in Mar 2026] ],
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
    month: 3,
    day: 31,
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

  #headline([Senior Software Engineer])

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
    #summary[Progressed from Game Programming Fresher to Senior Software Engineer. Focused on scalable game server architecture in Java (Netty, Vert.x), with cross-functional contributions to client-side logic in Cocos2d-x and Godot.]

    - #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2]: Sole server developer; architected backend from scratch for a global strategy game, 300+ CCU; assisted client team with networking and game logic

    - #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show] & #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel]: Full-stack contributor on two real-time card games for Myanmar and Russian-speaking markets; delivered server-side logic and client features

    - #link("https://play.google.com/store/apps/details?id=zps.games.bida3d.vn")[Bida3D]: Implemented matchmaking (server) and cue direction logic (client) for a global 8-ball pool game; applied physics and geometry for accurate ball trajectory simulation

    - #link("https://play.google.com/store/apps/details?id=vn.kvtm.js")[Sky Garden]: Maintained server stability for a live farm game (\~5,000 CCU); resolved production issues and developed new event features

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/vngeoguessr")[VN GeoGuessr]]

  ],
  [
    Aug 2025

  ],
  main-column-second-row: [
    #summary[Location-guessing game for Vietnam using Leaflet.js, Mapillary, and OpenStreetMap with street-level panoramic imagery and map-based scoring.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/store-scraper-bot")[Store Scraper Bot]]

  ],
  [
    Nov 2025 – Dec 2025

  ],
  main-column-second-row: [
    #summary[Telegram bot that automates scraping and reporting of app metadata from mobile app stores.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://github.com/tiennm99")[Pet Projects & Open Source]]

  ],
  [
    2018 – present

  ],
  main-column-second-row: [
    #summary[Various personal projects spanning game servers, bots, and web tools. Occasionally contribute to open-source projects. Full portfolio on GitHub.]

  ],
)

== Skills

#strong[Languages:] Java, Go, JavaScript, Shell

#strong[Frameworks & Libraries:] Netty, Vert.x, Spring Boot, Cocos2d-x, Godot

#strong[Databases:] Couchbase, Redis, MySQL, ClickHouse

#strong[Infrastructure & DevOps:] Docker, CI\/CD (GitHub Actions\/GitLab CI), Git, Linux, OCI

#strong[Architecture:] Game server architecture, real-time multiplayer systems, event-driven design

#strong[Languages (Spoken):] Vietnamese (Native), English (TOEIC 600+)
