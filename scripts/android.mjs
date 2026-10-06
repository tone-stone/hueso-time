import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const env = { ...process.env };
if (process.platform === 'win32') {
  const jbr = join(env.ProgramFiles || 'C:/Program Files', 'Android', 'Android Studio', 'jbr');
  const sdk = join(env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (!env.JAVA_HOME && existsSync(join(jbr, 'bin', 'java.exe'))) env.JAVA_HOME = jbr;
  if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT && existsSync(sdk)) env.ANDROID_HOME = sdk;
}

const java = env.JAVA_HOME
  ? join(env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';
const version = spawnSync(java, ['-version'], { env, encoding: 'utf8' });
const major = Number(/version "(\d+)/.exec(version.stderr || version.stdout || '')?.[1]);
// Android native build tools require explicit native access on newer JDKs.
if (major >= 24 && !env.JAVA_TOOL_OPTIONS?.includes('--enable-native-access')) {
  env.JAVA_TOOL_OPTIONS = [env.JAVA_TOOL_OPTIONS, '--enable-native-access=ALL-UNNAMED'].filter(Boolean).join(' ');
}

const child = spawn(process.execPath, [join(root, 'node_modules', 'expo', 'bin', 'cli'),
  'run:android', ...process.argv.slice(2)], { cwd: root, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = signal ? 1 : (code ?? 1); });
