import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { loadCv } from '../src/load-cv.mjs';
import { toPublicProfile } from './src/lib/profile-shape.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const cvPath = fileURLToPath(new URL('../miti99.yml', import.meta.url));
const pdfPath = fileURLToPath(new URL('../miti99.pdf', import.meta.url));
const VIRTUAL_ID = 'virtual:profile';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * Exposes the whitelisted public profile from miti99.yml as `virtual:profile`.
 * The phone number is never copied, so it cannot reach the bundle.
 * @returns {import('vite').Plugin} Vite plugin.
 */
function profilePlugin() {
  return {
    name: 'miti99-profile',
    resolveId: id => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    async load(id) {
      if (id !== RESOLVED_ID) return undefined;
      this.addWatchFile(cvPath);
      const profile = toPublicProfile(await loadCv(cvPath));
      return `export default ${JSON.stringify(profile)};`;
    },
  };
}

/**
 * Serves the committed root miti99.pdf at ./miti99.pdf in the dev server, so the
 * download links work before a full build (the build copies it into dist/).
 * @returns {import('vite').Plugin} Vite plugin.
 */
function devPdfPlugin() {
  return {
    name: 'miti99-dev-pdf',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/miti99.pdf', async (request, response, next) => {
        try {
          const body = await readFile(pdfPath);
          response.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': body.length });
          response.end(request.method === 'HEAD' ? undefined : body);
        } catch {
          next();
        }
      });
    },
  };
}

/**
 * Preloads the display face's latin subset in the built page, so the hero name (the
 * LCP element) does not reflow when Anybody arrives after first paint.
 * @returns {import('vite').Plugin} Vite plugin.
 */
function fontPreloadPlugin() {
  return {
    name: 'miti99-font-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const asset = Object.keys(ctx.bundle ?? {}).find(name => /anybody-latin-standard-normal-[^/]*\.woff2$/.test(name));
        if (!asset) return html;
        return [{ tag: 'link', attrs: { rel: 'preload', href: `./${asset}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' }];
      },
    },
  };
}

export default defineConfig({
  root: here,
  base: './',
  plugins: [profilePlugin(), devPdfPlugin(), fontPreloadPlugin(), svelte(), tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    // The only large chunk is three.js's WebGLRenderer, loaded lazily after first paint.
    chunkSizeWarningLimit: 600,
  },
  server: { port: 5199, strictPort: true, host: '127.0.0.1' },
  test: {
    root: here,
    include: ['test/**/*.test.js', 'src/**/*.test.js'],
    environment: 'node',
  },
});
