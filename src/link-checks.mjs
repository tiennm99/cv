// URL serialization normalizes scheme, host, and default port while retaining
// path case, query order, and the payload of mailto: and tel: links.
export function normalizedLinks(links) {
  return new Set(Array.from(links, link => new URL(link).href));
}

export function pdfUrlLinks(table) {
  return normalizedLinks(Array.from(table.matchAll(/^\s*\d+\s+\S+\s+(\S+)[\t ]*$/gm), row => row[1]));
}
