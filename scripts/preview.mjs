// Serves dist/ as GitHub Pages does for the project site: at /cv/ (and at / for
// convenience). Only files inside dist/ are reachable.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/** Sub-path of the GitHub Pages project site. */
export const BASE = '/cv/';

/**
 * @param {string} [dist] Directory to serve (defaults to ../dist next to this script).
 * @returns {import('node:http').Server} Server, not yet listening.
 */
export function createPreviewServer(dist = fileURLToPath(new URL('../dist/', import.meta.url))) {
  const rootDir = resolve(dist);
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(405).end('Method not allowed');
      return;
    }
    let path;
    try {
      path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }
    if (path === BASE.slice(0, -1)) {
      response.writeHead(301, { Location: BASE }).end();
      return;
    }
    if (path.startsWith(BASE)) path = path.slice(BASE.length - 1);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(rootDir, `.${path}`);
    if (!file.startsWith(rootDir + sep)) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Content-Length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404).end(path === '/index.html' ? 'Run npm run build first.' : 'Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT) || 4173;
  const server = createPreviewServer();
  server.on('error', error => { console.error(`Preview failed: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`CV preview: http://127.0.0.1:${port}${BASE}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
