import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const profile = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8')).build.preview.env;
const env = { ...process.env, ...profile, EXPO_PUBLIC_SKIP_AUTH: '0', EXPO_PUBLIC_USE_API: '0', HUESO_LOCAL_APK: '1' };
if (process.platform === 'win32') {
  env.JAVA_HOME ||= join(env.ProgramFiles || 'C:/Program Files', 'Android', 'Android Studio', 'jbr');
  env.ANDROID_HOME ||= env.ANDROID_SDK_ROOT || join(env.LOCALAPPDATA, 'Android', 'Sdk');
  env.JAVA_TOOL_OPTIONS = [env.JAVA_TOOL_OPTIONS, '--enable-native-access=ALL-UNNAMED'].filter(Boolean).join(' ');
}
function run(command, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit',
      windowsVerbatimArguments: command === 'cmd.exe' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} failed: ${code}`)));
  });
}
try {
  if (!process.argv.includes('--resume')) {
    await run(process.execPath, [join(root, 'node_modules', 'expo', 'bin', 'cli'), 'prebuild', '--platform', 'android', '--no-install']);
  }
  const args = ['assembleRelease', '--max-workers=2', '--console=plain',
    process.platform === 'win32'
      ? '-Dorg.gradle.jvmargs="-Xmx3072m -XX:MaxMetaspaceSize=1536m"'
      : '-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1536m',
    '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64'];
  await run(process.platform === 'win32' ? 'cmd.exe' : './gradlew',
    process.platform === 'win32' ? ['/d', '/c', '.\\gradlew.bat', ...args] : args, join(root, 'android'));
  const built = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  if (!existsSync(built)) throw new Error('Gradle did not produce an APK');
  const artifacts = join(root, 'artifacts');
  mkdirSync(artifacts, { recursive: true });
  const apk = join(artifacts, 'Hueso-Time-1.0.0-tablet.apk');
  copyFileSync(built, apk);
  const digest = createHash('sha256').update(readFileSync(apk)).digest('hex');
  writeFileSync(apk + '.sha256', `${digest}  Hueso-Time-1.0.0-tablet.apk\n`);
  console.log(`APK listo: ${apk}\nSHA-256: ${digest}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
