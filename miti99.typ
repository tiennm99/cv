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
  [Ho Chi Minh City, Vietnam],
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
    #strong[Ho Chi Minh City University of Technology], B.E. in Computer Science in Computer Science and Engineering -- Ho Chi Minh City, Vietnam

  ],
  [
    Sept 2017 – June 2023

  ],
  main-column-second-row: [
    - GPA: 8.0\/10 — Academic Excellence Scholarship; Five Good Student Award (university-wide recognition for academic performance, personal conduct, and community involvement)

    - Thesis: Survival2D — Built a 2D multiplayer Battle Royale game server in Java (Netty\/WebSocket) with authoritative server architecture, QuadTree-based collision detection, FlatBuffers serialization (76\% packet reduction vs JSON), behavior tree AI bots with A#sym.ast.basic pathfinding, and server-side anti-cheat via visibility culling

  ],
)

== Experience

#regular-entry(
  [
    #strong[Senior Software Engineer], ZingPlay Game Studios, VNG Corporation -- Ho Chi Minh City, Vietnam

  ],
  [
    July 2020 – present

  ],
  main-column-second-row: [
    #summary[Joined VNG as a Game Programming Fresher and progressed through Associate Software Engineer and Software Engineer to Senior Software Engineer. Focused on scalable game server architecture and backend systems in Java (Netty, Vert.x), with consistent cross-functional contributions to client-side logic in Cocos2d-x and Godot. Passionate about architecture design and delivering reliable services to large user bases.]

    - #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2]: Sole server developer on a 4-person team (1 server, 2–3 client); architected the backend from scratch for a global strategy game, supporting more than 300 concurrent users; also assisted the client team with networking and game logic integration

    - #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show] & #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel]: Full-stack contributor on a 2-person team (1 server, 1 client) for two real-time card games targeting the Myanmar and Russian-speaking markets; delivered both server-side game logic and significant client-side feature work

    - #link("https://play.google.com/store/apps/details?id=zps.games.bida3d.vn")[Bida3D]: Implemented matchmaking system on the server and cue direction logic on the client for a global 8-ball pool game on a 10-person team; applied mathematics, physics, and geometry to deliver accurate ball trajectory simulation

    - #link("https://play.google.com/store/apps/details?id=vn.kvtm.js")[Sky Garden]: Maintained server stability for a live farm game with up to \~5,000 concurrent users on a 4-person team (2 server, 2 client); proactively detected and resolved production issues, developed new event features, and supported customer care workflows

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://github.com/survival2d/server")[Survival 2D Server]]

  ],
  [
    Sept 2021 – present

  ],
  main-column-second-row: [
    #summary[University thesis — a 2D multiplayer Battle Royale game server in Java (Netty) over WebSocket. Designed an authoritative server with client-side prediction, QuadTree spatial indexing for efficient collision detection, and procedural map generation. Applied FlatBuffers serialization to reduce packet sizes by 76\% compared to JSON. Implemented AI bots using behavior trees with A#sym.ast.basic pathfinding, and server-side anti-cheat through visibility culling to prevent ESP exploits.]

  ],
)

  #regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/vngeoguessr")[VN GeoGuessr]]

  ],
  [
  ],
  main-column-second-row: [
    #summary[A location-guessing game for Vietnam built with Leaflet.js, Mapillary, and OpenStreetMap, featuring street-level panoramic imagery and interactive map-based scoring.]

  ],
)

  #regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/store-scraper-bot")[Store Scraper Bot]]

  ],
  [
  ],
  main-column-second-row: [
    #summary[A Telegram bot that automates scraping and reporting of app metadata from mobile stores, useful for monitoring app listings and tracking store presence.]

  ],
)

#regular-entry(
  [
    #strong[#link("https://tiennm99.github.io/")[Static websites with Hugo]]

  ],
  [
    Jan 2020 – present

  ],
  main-column-second-row: [
    #summary[Personal blog and static site portfolio on GitHub Pages using the Hugo framework. Also built a site for Ngăm, a community charity project.]

  ],
)

  #regular-entry(
  [
    #strong[#link("https://github.com/tiennm99")[Pet Projects & Open Source]]

  ],
  [
  ],
  main-column-second-row: [
    #summary[Maintain a variety of personal projects spanning game servers, bots, web tools, and more. Occasionally contribute fixes and improvements to open-source projects when encountering issues while using various tools and services. Full portfolio available on GitHub.]

  ],
)

== Skills

#strong[Languages:] Java, Go, JavaScript, Shell

#strong[Frameworks & Libraries:] Netty, Vert.x, Spring Boot, Cocos2d-x, Godot

#strong[Databases:] Couchbase, Redis, MySQL, ClickHouse

#strong[Infrastructure & DevOps:] Docker, CI\/CD (GitHub Actions\/GitLab CI), Git, Linux, Oracle Cloud Infrastructure (OCI)

#strong[Architecture:] Game server architecture, real-time multiplayer systems, event-driven design

#strong[Languages (Spoken):] Vietnamese (Native), English (TOEIC 600+)
