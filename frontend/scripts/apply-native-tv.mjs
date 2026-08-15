import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const android = join(root, 'android')
const srcDir = join(root, 'native', 'tv')

if (!existsSync(join(android, 'app'))) {
  console.error('[apply-native-tv] android/ fehlt — zuerst: npx cap add android')
  process.exit(1)
}

const pluginDest = join(android, 'app/src/main/java/app/jarvis/tv')
mkdirSync(pluginDest, { recursive: true })
copyFileSync(join(srcDir, 'JarvisTvPlugin.java'), join(pluginDest, 'JarvisTvPlugin.java'))

const mainCandidates = [
  join(android, 'app/src/main/java/local/jarvis/app/MainActivity.java'),
  join(android, 'app/src/main/java/app/jarvis/MainActivity.java'),
]
const mainSrc = join(srcDir, 'MainActivity.java')
let wroteMain = false
for (const dest of mainCandidates) {
  if (existsSync(dest) || dest.includes('local/jarvis/app')) {
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(mainSrc, dest)
    wroteMain = true
    break
  }
}
if (!wroteMain) {
  const dest = mainCandidates[0]
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(mainSrc, dest)
}

const manifestPath = join(android, 'app/src/main/AndroidManifest.xml')
let manifest = readFileSync(manifestPath, 'utf8')
const perms = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.ACCESS_WIFI_STATE',
  'android.permission.CHANGE_WIFI_MULTICAST_STATE',
  'android.permission.CHANGE_WIFI_STATE',
]
for (const perm of perms) {
  if (!manifest.includes(perm)) {
    manifest = manifest.replace(
      '</manifest>',
      `    <uses-permission android:name="${perm}" />\n</manifest>`,
    )
  }
}
if (!manifest.includes('android:usesCleartextTraffic')) {
  manifest = manifest.replace(
    '<application',
    '<application\n        android:usesCleartextTraffic="true"',
  )
}
writeFileSync(manifestPath, manifest)

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string }
const versionName = String(pkg.version || '0.16.0')
const versionCode = Number(versionName.replace(/\D/g, '')) || 160

const gradlePath = join(android, 'app/build.gradle')
let gradle = readFileSync(gradlePath, 'utf8')
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`)
if (!gradle.includes('okhttp')) {
  gradle = gradle.replace(
    /dependencies\s*\{/,
    "dependencies {\n    implementation 'com.squareup.okhttp3:okhttp:4.12.0'",
  )
}
writeFileSync(gradlePath, gradle)

console.log(`[apply-native-tv] Plugin, Manifest, versionCode ${versionCode}, OkHttp.`)
