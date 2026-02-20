// Import the rendercv function and all the refactored components
#import "@preview/rendercv:0.1.0": *

// Apply the rendercv template with custom configuration
#show: rendercv.with(
  name: "Tien Nguyen Minh",
  footer: context { [#emph[Tien Nguyen Minh -- #str(here().page())\/#str(counter(page).final().first())]] },
  top-note: [ #emph[Last updated in Feb 2026] ],
  locale-catalog-language: "en",
  page-size: "us-letter",
  page-top-margin: 0.7in,
  page-bottom-margin: 0.7in,
  page-left-margin: 0.7in,
  page-right-margin: 0.7in,
  page-show-footer: true,
  page-show-top-note: true,
  colors-body: rgb(0, 0, 0),
  colors-name: rgb(0, 79, 144),
  colors-headline: rgb(0, 79, 144),
  colors-connections: rgb(0, 79, 144),
  colors-section-titles: rgb(0, 79, 144),
  colors-links: rgb(0, 79, 144),
  colors-footer: rgb(128, 128, 128),
  colors-top-note: rgb(128, 128, 128),
  typography-line-spacing: 0.6em,
  typography-alignment: "justified",
  typography-date-and-location-column-alignment: right,
  typography-font-family-body: "Raleway",
  typography-font-family-name: "Raleway",
  typography-font-family-headline: "Raleway",
  typography-font-family-connections: "Raleway",
  typography-font-family-section-titles: "Raleway",
  typography-font-size-body: 10pt,
  typography-font-size-name: 30pt,
  typography-font-size-headline: 10pt,
  typography-font-size-connections: 10pt,
  typography-font-size-section-titles: 1.4em,
  typography-small-caps-name: false,
  typography-small-caps-headline: false,
  typography-small-caps-connections: false,
  typography-small-caps-section-titles: false,
  typography-bold-name: false,
  typography-bold-headline: false,
  typography-bold-connections: false,
  typography-bold-section-titles: false,
  links-underline: false,
  links-show-external-link-icon: false,
  header-alignment: left,
  header-photo-width: 3.5cm,
  header-space-below-name: 0.7cm,
  header-space-below-headline: 0.7cm,
  header-space-below-connections: 0.7cm,
  header-connections-hyperlink: true,
  header-connections-show-icons: true,
  header-connections-display-urls-instead-of-usernames: false,
  header-connections-separator: "",
  header-connections-space-between-connections: 0.5cm,
  section-titles-type: "with_full_line",
  section-titles-line-thickness: 0.5pt,
  section-titles-space-above: 0.5cm,
  section-titles-space-below: 0.3cm,
  sections-allow-page-break: true,
  sections-space-between-text-based-entries: 0.3em,
  sections-space-between-regular-entries: 1.2em,
  entries-date-and-location-width: 4.15cm,
  entries-side-space: 0.2cm,
  entries-space-between-columns: 0.1cm,
  entries-allow-page-break: false,
  entries-short-second-row: false,
  entries-summary-space-left: 0cm,
  entries-summary-space-above: 0.12cm,
  entries-highlights-bullet:  "•" ,
  entries-highlights-nested-bullet:  "•" ,
  entries-highlights-space-left: 0cm,
  entries-highlights-space-above: 0.12cm,
  entries-highlights-space-between-items: 0.12cm,
  entries-highlights-space-between-bullet-and-text: 0.5em,
  date: datetime(
    year: 2026,
    month: 2,
    day: 20,
  ),
)


= Tien Nguyen Minh

  #headline([Senior Software Engineer])

#connections(
  [#connection-with-icon("location-dot")[HCMC, VN]],
  [#link("mailto:tiennm99@outlook.com", icon: false, if-underline: false, if-color: false)[#connection-with-icon("envelope")[tiennm99\@outlook.com]]],
  [#link("https://miti99.com/", icon: false, if-underline: false, if-color: false)[#connection-with-icon("link")[miti99.com]]],
  [#link("https://linkedin.com/in/miti99", icon: false, if-underline: false, if-color: false)[#connection-with-icon("linkedin")[miti99]]],
  [#link("https://github.com/tiennm99", icon: false, if-underline: false, if-color: false)[#connection-with-icon("github")[tiennm99]]],
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
    #summary[Started my journey at VNG Tech Fresher Program and progressed to Senior Software Engineer at ZingPlay Game Studios (ZPS). Over the years, I have honed my expertise in game server architecture and backend development using Java, while also contributing to client-side logic with Cocos and Godot when needed.]

    - #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show]

      - A card game for Myanmar market

    - #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel]

      - A card game for the Russian audience

    - #link("https://play.google.com/store/apps/details?id=zps.games.bida3d.vn")[Bida3D]

      - Global 8-ball pool game

    - #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2]

      - Global strategy game

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://tiennm99.github.io/")[Static websites with Hugo]]

  ],
  [
    Jan 2020 – present

  ],
  main-column-second-row: [
    #summary[My blog on GitHub Pages using Hugo. Website for Ngăm - a charity project founded by my brother's friends.]

  ],
)

== Skills

#strong[Programming:] Java (Netty, Vert.x, Spring Boot), JavaScript

#strong[Databases:] Couchbase, Redis, MySQL

#strong[Tools & DevOps:] Git, Docker, CI\/CD

== Interests

#strong[Professional:] Game server architecture, distributed systems, Java performance tuning

#strong[Personal:] Reading novels & manga, playing Genshin Impact & TFT
