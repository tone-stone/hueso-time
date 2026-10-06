import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = 8081;
const apiPort = 8787;
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  process.exitCode = code;
  const timer = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }, 5000);
  timer.unref();
}

function launch(command, args, cwd, env, interactive = false) {
  const child = spawn(command, args, { cwd, env, stdio: [interactive ? 'inherit' : 'ignore', 'inherit', 'inherit'] });
  children.push(child);
  child.on('error', (err) => { console.error(err.message); stop(1); });
  child.on('exit', (code, signal) => { if (!stopping) stop(signal ? 1 : (code ?? 1)); });
  return child;
}

async function requireFreePort(value) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(value, '0.0.0.0', () => server.close(resolve));
  });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

try {
  const tsx = join(root, 'backend', 'node_modules', 'tsx', 'dist', 'cli.mjs');
  if (!existsSync(tsx)) throw new Error('Instala el backend primero: npm --prefix backend install');
  await requireFreePort(port);
  await requireFreePort(apiPort);

  const interfaces = networkInterfaces();
  const candidates = [...(interfaces.en0 || []), ...Object.values(interfaces).flatMap(list => list || [])];
  const address = candidates.find(item => item.family === 'IPv4' && !item.internal)?.address || '127.0.0.1';
  const base = `http://${address}:${port}`;
  const env = { ...process.env, HUESO_API_PORT: String(apiPort), EXPO_PUBLIC_API_URL: base };

  launch(process.execPath, [tsx, 'watch', 'src/index.ts'], join(root, 'backend'), {
    ...env, PORT: String(apiPort), HUESO_API_HOST: '127.0.0.1',
  });
  const deadline = Date.now() + 30_000;
  let healthy = false;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${apiPort}/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) { healthy = true; break; }
    } catch { /* Wait for tsx to start the API. */ }
    await delay(250);
  }
  if (!stopping && !healthy) throw new Error('La API no pudo iniciar. Revisa el error anterior.');
  if (!stopping) {
    console.log(`\nHueso Time: ${base} — Expo y API en el puerto ${port}.`);
    console.log(`API health: ${base}/health\nCtrl+C detiene ambos servicios.\n`);
    const args = process.argv.slice(2);
    launch(process.execPath, [join(root, 'node_modules', 'expo', 'bin', 'cli'), 'start',
      ...(args.includes('--go') ? ['--go'] : ['--dev-client', '--scheme', 'huesotime']),
      '--lan', '--clear', '--port', String(port), ...args], root, env, true);
  }
} catch (err) {
  console.error(`No se pudo iniciar Hueso Time: ${err.message}`);
  stop(1);
}
