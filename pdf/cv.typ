// One-page Letter CV. Data arrives as JSON in sys.inputs.cv (see src/build-pdf.mjs);
// this file only lays it out.
#let cv = json(bytes(sys.inputs.cv))

#let ink = rgb("#171b1d")
#let muted = rgb("#3c4245")
#let accent = rgb("#154c48")
#let rule = rgb("#a4aaa9")

#set document(title: cv.name + " – " + cv.headline, author: cv.name, date: none)
#set page(paper: "us-letter", margin: (x: 0.48in, y: 0.42in))
#set text(font: "Be Vietnam Pro", size: 9.8pt, fill: ink, lang: "en", fallback: false)
#set par(leading: 0.48em, spacing: 0.5em)
#set list(indent: 0.6em, body-indent: 0.5em, spacing: 0.5em, marker: text(fill: muted, size: 0.8em)[•])
#show link: set text(fill: accent)

// Styled inline text from an array of {text, url?, strong?, em?, code?} segments.
#let rich(segs) = segs.map(s => {
  let body = s.text
  if s.at("code", default: false) { body = raw(body) }
  if s.at("strong", default: false) { body = strong(body) }
  if s.at("em", default: false) { body = emph(body) }
  if "url" in s { link(s.url, body) } else { body }
}).join()

#show heading.where(level: 1): set text(size: 26pt, weight: "bold", tracking: -0.02em)
#show heading.where(level: 2): it => block(
  width: 100%, above: 12pt, below: 6pt, stroke: (bottom: 0.6pt + rule), inset: (bottom: 2.5pt),
  text(size: 10.5pt, weight: "bold", fill: accent, tracking: 0.04em, upper(it.body)),
)
#show heading.where(level: 3): set text(size: 10.5pt, weight: "bold")
#show heading.where(level: 3): set block(above: 0pt, below: 0pt)
#show heading.where(level: 3): it => { show link: set text(fill: ink); it }

= #cv.name
#v(1pt)
#text(size: 11.5pt)[#cv.headline]
#v(2pt)
#text(size: 8.8pt, fill: muted, cv.contacts.map(c => box(if "url" in c { link(c.url, c.text) } else { c.text })).join(h(0.45em) + [·] + h(0.45em)))

#for section in cv.sections [
  == #section.title
  #if section.kind == "skills" {
    for item in section.items [
      #block(above: 0pt, below: 4pt)[*#item.label:* #rich(item.details)]
    ]
  } else {
    for (index, item) in section.items.enumerate() {
      block(above: if index == 0 { 0pt } else { 9pt }, below: 0pt, breakable: false, {
        grid(
          columns: (1fr, auto), column-gutter: 8pt,
          heading(level: 3, rich(item.title)),
          text(size: 8.4pt, fill: muted, number-type: "lining", item.dates),
        )
        let meta = (if item.subtitle.len() > 0 { (rich(item.subtitle),) } else { () }) + (if item.location != "" { (item.location,) } else { () })
        if meta.len() > 0 { block(above: 2.5pt, below: 0pt, text(fill: muted, meta.join([ · ]))) }
        if item.summary.len() > 0 { block(above: 4pt, below: 0pt, rich(item.summary)) }
        block(above: 4pt, below: 0pt, list(..item.highlights.map(rich)))
      })
    }
  }
]
