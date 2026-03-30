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
  entries-degree-width: 1cm,
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
    month: 3,
    day: 30,
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
  [#connection-with-icon("location-dot")[HCMC, VN]],
  [#link("mailto:tiennm99@outlook.com", icon: false, if-underline: false, if-color: false)[#connection-with-icon("envelope")[tiennm99\@outlook.com]]],
  [#link("tel:+84-869-156-149", icon: false, if-underline: false, if-color: false)[#connection-with-icon("phone")[0869 156 149]]],
  [#link("https://miti99.com/", icon: false, if-underline: false, if-color: false)[#connection-with-icon("link")[miti99.com]]],
  [#link("https://linkedin.com/in/miti99", icon: false, if-underline: false, if-color: false)[#connection-with-icon("linkedin")[miti99]]],
  [#link("https://github.com/tiennm99", icon: false, if-underline: false, if-color: false)[#connection-with-icon("github")[tiennm99]]],
  [#link("https://t.me/tiennm5", icon: false, if-underline: false, if-color: false)[#connection-with-icon("telegram")[tiennm5]]],
  [#link("https://www.facebook.com/tiennm99/", icon: false, if-underline: false, if-color: false)[#connection-with-icon("facebook")[Facebook]]],
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

    - #link("https://play.google.com/store/apps/details?id=zps.games.show")[Show]: A card game for Myanmar market

    - #link("https://play.google.com/store/apps/details?id=zps.games.burkozel")[Burkozel]: A card game for the Russian audience

    - #link("https://play.google.com/store/apps/details?id=zps.games.bida3d.vn")[Bida3D]: Global 8-ball pool game

    - #link("https://play.google.com/store/apps/details?id=vn.zps.tl2")[Chaos Age 2]: Global strategy game

    - #link("https://play.google.com/store/apps/details?id=vn.kvtm.js")[Sky Garden]: Farm game. Maintain, fixed some legacy core bugs, develop new event features, customer care.

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

#regular-entry(
  [
    #strong[#link("https://github.com/survival2d/server")[Survival 2D Server]]

  ],
  [
    Sept 2021 – present

  ],
  main-column-second-row: [
    #summary[Server-side of my thesis project — a 2D survival battle royale game server written in Java.]

  ],
)

  #regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/vngeoguessr")[VN GeoGuessr]]

  ],
  [
  ],
  main-column-second-row: [
    #summary[A GeoGuessr clone for Vietnam locations, built with Leaflet.js, Mapillary, and OpenStreetMap.]

  ],
)

  #regular-entry(
  [
    #strong[#link("https://github.com/tiennm99/store-scraper-bot")[Store Scraper Bot]]

  ],
  [
  ],
  main-column-second-row: [
    #summary[Telegram bot that scrapes app information from stores.]

  ],
)

  #regular-entry(
  [
    #strong[#link("https://github.com/tiennm99?tab=repositories")[More fun projects on GitHub]]

  ],
  [
  ],
  main-column-second-row: [
    #summary[Check out my GitHub profile for more fun side projects including clones, bots, and experiments.]

  ],
)

== Skills

#strong[Programming:] Java (Netty, Vert.x, Spring Boot), JavaScript, Go

#strong[Databases:] Couchbase, Redis, MySQL

#strong[Tools & DevOps:] Git, Docker, CI\/CD
