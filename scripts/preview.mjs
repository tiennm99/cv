import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    const file = { '/': 'index.html', '/index.html': 'index.html', '/miti99.pdf': 'miti99.pdf' }[path];
    if (!file || !['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      const body = await readFile(new URL(`../dist/${file}`, import.meta.url));
      response.writeHead(200, { 'Content-Type': file.endsWith('.pdf') ? 'application/pdf' : 'text/html; charset=utf-8', 'Content-Length': body.length });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404).end('Run npm run build first.');
    }
  });
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const server = createPreviewServer();
  server.on('error', error => { console.error(`Preview failed: ${error.message}`); process.exitCode = 1; });
  server.listen(4173, '127.0.0.1', () => console.log('CV preview: http://127.0.0.1:4173'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
