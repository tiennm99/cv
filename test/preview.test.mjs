import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';

test('preview entrypoint supports filesystem paths and remains safe to import', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'cv-preview-#%-'));
  const script = join(directory, 'scripts', 'preview.mjs');
  const html = '<!doctype html><title>Preview fixture</title>';
  try {
    await mkdir(join(directory, 'scripts'));
    await mkdir(join(directory, 'dist'));
    await copyFile(new URL('../scripts/preview.mjs', import.meta.url), script);
    await writeFile(join(directory, 'dist', 'index.html'), html);

    await t.test('import exits without starting the server', async () => {
      const { stdout, stderr } = await promisify(execFile)(process.execPath,
        ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)}); console.log('Imported');`],
        { cwd: directory, timeout: 5000 });
      assert.equal(stdout.trim(), 'Imported');
      assert.equal(stderr, '');
    });

    for (const entrypoint of [script, join('scripts', 'preview.mjs')]) {
      await t.test(`serves files when invoked with ${entrypoint === script ? 'an absolute' : 'a relative'} path`, async () => {
        const child = spawn(process.execPath, [entrypoint], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] });
        const exited = once(child, 'exit');
        let output = '';
        let startupTimer;
        try {
          await new Promise((resolve, reject) => {
            startupTimer = setTimeout(() => reject(new Error(`Preview did not start: ${output}`)), 5000);
            child.on('error', reject);
            child.stdout.on('data', chunk => {
              output += chunk;
              if (output.includes('CV preview: http://127.0.0.1:4173')) resolve();
            });
            child.stderr.on('data', chunk => { output += chunk; });
            exited.then(([code, signal]) => reject(new Error(`Preview exited before startup (${code}, ${signal}): ${output}`)), reject);
          });
          clearTimeout(startupTimer);
          const response = await fetch('http://127.0.0.1:4173', { signal: AbortSignal.timeout(5000) });
          assert.equal(response.status, 200);
          assert.equal(await response.text(), html);
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
