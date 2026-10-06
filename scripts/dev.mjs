import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
  // Local Metro bundles do not inherit the APK's EAS build environment.
  if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
  const googleEnv = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8'))
    .build['development-device'].env;
  const googleKeys = [
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  ];
  const googleClients = Object.fromEntries(googleKeys.map(key => [key, process.env[key] || googleEnv[key]]));
  const tsx = join(root, 'backend', 'node_modules', 'tsx', 'dist', 'cli.mjs');
  if (!existsSync(tsx)) throw new Error('Instala el backend primero: npm --prefix backend install');
  await requireFreePort(port);
  await requireFreePort(apiPort);

  const interfaces = networkInterfaces();
  const candidates = [...(interfaces.en0 || []), ...Object.values(interfaces).flatMap(list => list || [])];
  const address = candidates.find(item => item.family === 'IPv4' && !item.internal)?.address || '127.0.0.1';
  const base = `http://${address}:${port}`;
  const configuredApi = process.env.EXPO_PUBLIC_API_URL?.trim();
  // localhost in a phone's JS bundle points to the phone, not this computer.
  const apiUrl = !configuredApi || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i.test(configuredApi)
    ? base : configuredApi;
  const args = process.argv.slice(2);
  const expoGo = args.includes('--go');
  const env = { ...process.env, ...googleClients, HUESO_API_PORT: String(apiPort),
    EXPO_PUBLIC_API_URL: apiUrl,
    // Expo Go lacks the Google native module. Keep its test data local.
    ...(expoGo ? { EXPO_PUBLIC_SKIP_AUTH: '1', EXPO_PUBLIC_USE_API: '0' } : {}),
  };
  if (expoGo) console.log('Expo Go: modo invitado local para probar canciones y setlists. El login Google requiere el APK nativo.');

  launch(process.execPath, [tsx, 'watch', 'src/index.ts'], join(root, 'backend'), {
    ...env, PORT: String(apiPort), HUESO_API_HOST: '127.0.0.1',
    ...(existsSync(join(root, 'backend', '.env')) || process.env.GOOGLE_CLIENT_IDS
      ? {} : { GOOGLE_CLIENT_IDS: googleClients.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID }),
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
    launch(process.execPath, [join(root, 'node_modules', 'expo', 'bin', 'cli'), 'start',
      ...(expoGo ? [] : ['--dev-client', '--scheme', 'huesotime']),
      '--lan', '--clear', '--port', String(port), ...args], root, env, true);
  }
} catch (err) {
  console.error(`No se pudo iniciar Hueso Time: ${err.message}`);
  stop(1);
}
