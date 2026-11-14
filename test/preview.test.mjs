import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

/** @returns {Promise<number>} A free local port (the default 4173 may be taken). */
async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

test('preview entrypoint supports filesystem paths and remains safe to import', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cv-preview-#%-'));
  const script = join(directory, 'scripts', 'preview.mjs');
  const html = '<!doctype html><title>Preview fixture</title>';
  try {
    await mkdir(join(directory, 'scripts'));
    await mkdir(join(directory, 'dist', 'assets'), { recursive: true });
    await copyFile(new URL('../scripts/preview.mjs', import.meta.url), script);
    await writeFile(join(directory, 'dist', 'index.html'), html);
    await writeFile(join(directory, 'dist', 'assets', 'app.js'), 'export {};');
    await writeFile(join(directory, 'secret.txt'), 'outside dist');

    await t.test('import exits without starting the server', async () => {
      const { stdout, stderr } = await promisify(execFile)(process.execPath,
        ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)}); console.log('Imported');`],
        { cwd: directory, timeout: 5000 });
      assert.equal(stdout.trim(), 'Imported');
      assert.equal(stderr, '');
    });

    for (const entrypoint of [script, join('scripts', 'preview.mjs')]) {
      await t.test(`serves files when invoked with ${entrypoint === script ? 'an absolute' : 'a relative'} path`, async () => {
        const port = await freePort();
        const origin = `http://127.0.0.1:${port}`;
        const child = spawn(process.execPath, [entrypoint], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port) } });
        const exited = once(child, 'exit');
        let output = '';
        let startupTimer;
        try {
          await new Promise((resolve, reject) => {
            startupTimer = setTimeout(() => reject(new Error(`Preview did not start: ${output}`)), 5000);
            child.on('error', reject);
            child.stdout.on('data', chunk => {
              output += chunk;
              if (output.includes(`CV preview: ${origin}/cv/`)) resolve();
            });
            child.stderr.on('data', chunk => { output += chunk; });
            exited.then(([code, signal]) => reject(new Error(`Preview exited before startup (${code}, ${signal}): ${output}`)), reject);
          });
          clearTimeout(startupTimer);
          const get = path => fetch(`${origin}${path}`, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
          for (const path of ['/cv/', '/']) {
            const response = await get(path);
            assert.equal(response.status, 200);
            assert.equal(await response.text(), html);
          }
          const asset = await get('/cv/assets/app.js');
          assert.equal(asset.status, 200);
          assert.match(asset.headers.get('content-type'), /javascript/);
          assert.equal((await get('/cv')).status, 301);
          for (const path of ['/cv/../secret.txt', '/cv/%2e%2e/secret.txt', '/missing.js']) assert.equal((await get(path)).status, 404);
          child.kill('SIGTERM');
          const [code, signal] = await Promise.race([
            exited,
            new Promise((_, reject) => {
              startupTimer = setTimeout(() => reject(new Error('Preview did not stop after SIGTERM')), 5000);
            }),
          ]);
          if (process.platform !== 'win32') {
            assert.equal(code, 0);
            assert.equal(signal, null);
          }
        } finally {
          clearTimeout(startupTimer);
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
          await exited;
        }
      });
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
