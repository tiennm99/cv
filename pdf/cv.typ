// One-page Letter CV. Data arrives as JSON in sys.inputs.cv (see src/build-pdf.mjs);
// this file only lays it out.
#let cv = json(bytes(sys.inputs.cv))

// Blue on white, matching the web CV (src/build-html.mjs).
#let ink = rgb("#1a1f2b")
#let muted = rgb("#4a5263")
#let accent = rgb("#1d4ed8")
#let rule = rgb("#bfd0fb")

#set document(title: cv.name + " – " + cv.headline, author: cv.name, date: none)
#set page(paper: "us-letter", margin: (x: 0.48in, y: 0.42in))
#set text(font: "Be Vietnam Pro", size: 9.8pt, fill: ink, lang: "en", fallback: false)
#set par(leading: 0.48em, spacing: 0.5em, linebreaks: "optimized")
#set list(indent: 0.6em, body-indent: 0.5em, spacing: 0.6em, marker: text(fill: accent, size: 0.8em)[•])
#show link: set text(fill: accent)

// Line-breaking rules. Phrases are kept together with boxes, not no-break characters,
// so the text copied out of the PDF is unchanged.
#let keep(body) = {
  // Compounds joined by a hyphen or slash: behavior-tree, Netty/WebSocket, CI/CD, 8.14/10.
  show regex("[\p{L}\p{N}.]+([-/][\p{L}\p{N}.]+)+"): box
  // Runs of capitalised words and numbers: Java 21, Sky Garden, Vercel Cron, GitHub Actions.
  show regex("\p{Lu}[\p{L}\p{N}]*(( \p{Lu}[\p{L}\p{N}]*)+( \d+)?| \d+)\b"): box
  body
}
// Splits off the last `n` words so they can be boxed: no one- or two-word last line.
#let tail(str, n: 3) = {
  let words = str.split(" ")
  if words.len() <= n { return ("", str) }
  (words.slice(0, -n).join(" ") + " ", words.slice(-n).join(" "))
}

// Styled inline text from an array of {text, url?, strong?, em?, code?} segments.
#let rich(segs, glue-tail: true) = segs.enumerate().map(((i, s)) => {
  let style(body) = {
    if s.at("code", default: false) { body = raw(body) } else { body = keep(body) }
    if s.at("strong", default: false) { body = strong(body) }
    if s.at("em", default: false) { body = emph(body) }
    body
  }
  if "url" in s {
    // Short link text never splits across lines.
    link(s.url, if s.text.split(" ").len() <= 3 { box(style(s.text)) } else { style(s.text) })
  } else if glue-tail and i == segs.len() - 1 {
    let (head, last) = tail(s.text)
    style(head) + box(style(last))
  } else { style(s.text) }
}).join()

// A skills line: each comma-separated skill stays whole and the last line holds at least two.
#let skills(segs) = {
  if segs.any(s => s.len() > 1) { return rich(segs) }
  let items = segs.map(s => s.text).join().split(", ")
  let n = calc.min(2, items.len())
  (..items.slice(0, items.len() - n).map(box), box(items.slice(-n).join(", "))).join(", ")
}

#show heading.where(level: 1): set text(size: 26pt, weight: "bold", fill: accent, tracking: -0.02em)
#show heading.where(level: 2): it => block(
  width: 100%, above: 16pt, below: 7pt, stroke: (bottom: 0.6pt + rule), inset: (bottom: 2.5pt),
  text(size: 10.5pt, weight: "bold", fill: accent, tracking: 0.04em, upper(it.body)),
)
#show heading.where(level: 3): set text(size: 10.5pt, weight: "bold")
#show heading.where(level: 3): set block(above: 0pt, below: 0pt)

= #cv.name
#v(1pt)
#text(size: 11.5pt)[#cv.headline]
#v(2pt)
#text(size: 8.6pt, fill: muted, cv.contacts.enumerate().map(((i, c)) => box((if i > 0 { [·] + h(0.4em) }) + (if "url" in c { link(c.url, c.text) } else { c.text }))).join(h(0.4em, weak: true)))
#v(1pt)
#line(length: 100%, stroke: 1.2pt + accent)

#for section in cv.sections [
  == #section.title
  #if section.kind == "skills" {
    for item in section.items [
      // Wrapped skills lines hang under the label's text, not the margin.
      #block(above: 0pt, below: 5pt, par(hanging-indent: 1.2em)[*#item.label:* #skills(item.details)])
    ]
  } else {
    for (index, item) in section.items.enumerate() {
      block(above: if index == 0 { 0pt } else { 12pt }, below: 0pt, breakable: false, {
        let side(body) = text(size: 8.4pt, fill: muted, number-type: "lining", body)
        let has-role = item.role.len() > 0
        grid(
          columns: (1fr, auto), column-gutter: 8pt,
          heading(level: 3, rich(item.title)),
          side(if has-role { item.location } else { item.dates }),
        )
        if has-role {
          block(above: 4pt, below: 0pt, grid(
            columns: (1fr, auto), column-gutter: 8pt,
            emph(rich(item.role)),
            side(item.dates),
          ))
        }
        if item.summary.len() > 0 { block(above: 5pt, below: 0pt, rich(item.summary)) }
        block(above: 5pt, below: 0pt, list(..item.highlights.map(rich)))
      })
    }
  }
]
