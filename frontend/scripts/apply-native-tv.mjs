import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

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
copyFileSync(join(srcDir, 'AdbShell.java'), join(pluginDest, 'AdbShell.java'))

const homeSrc = join(root, 'native', 'home')
const homeDest = join(android, 'app/src/main/java/app/jarvis/home')
mkdirSync(homeDest, { recursive: true })
copyFileSync(join(homeSrc, 'JarvisHomePlugin.java'), join(homeDest, 'JarvisHomePlugin.java'))
copyFileSync(join(homeSrc, 'JarvisPlug.java'), join(homeDest, 'JarvisPlug.java'))

const notifySrc = join(root, 'native', 'notify')
const notifyDest = join(android, 'app/src/main/java/app/jarvis/notify')
mkdirSync(notifyDest, { recursive: true })
for (const name of [
  'JarvisNotifyPlugin.java',
  'JarvisNotifyReceiver.java',
  'JarvisNotifyBoot.java',
  'JarvisAlarmActivity.java',
  'JarvisAlarmService.java',
  'JarvisAlarmPlayer.java',
  'JarvisTimerVoice.java',
  'JarvisGlanceWidget.java',
]) {
  copyFileSync(join(notifySrc, name), join(notifyDest, name))
}
mkdirSync(join(android, 'app/src/main/res/layout'), { recursive: true })
mkdirSync(join(android, 'app/src/main/res/xml'), { recursive: true })
copyFileSync(join(notifySrc, 'jarvis_widget.xml'), join(android, 'app/src/main/res/layout/jarvis_widget.xml'))
copyFileSync(join(notifySrc, 'jarvis_widget_info.xml'), join(android, 'app/src/main/res/xml/jarvis_widget_info.xml'))
mkdirSync(join(android, 'app/src/main/res/drawable'), { recursive: true })
copyFileSync(join(notifySrc, 'jarvis_widget_bg.xml'), join(android, 'app/src/main/res/drawable/jarvis_widget_bg.xml'))
copyFileSync(join(notifySrc, 'jarvis_widget_mic.xml'), join(android, 'app/src/main/res/drawable/jarvis_widget_mic.xml'))
const rawDest = join(android, 'app/src/main/res/raw')
mkdirSync(rawDest, { recursive: true })
const alarmWav = join(notifySrc, 'jarvis_alarm.wav')
if (existsSync(alarmWav)) {
  copyFileSync(alarmWav, join(rawDest, 'jarvis_alarm.wav'))
}

const geoSrc = join(root, 'native', 'geo')
const geoDest = join(android, 'app/src/main/java/app/jarvis/geo')
mkdirSync(geoDest, { recursive: true })
copyFileSync(join(geoSrc, 'JarvisGeoPlugin.java'), join(geoDest, 'JarvisGeoPlugin.java'))

const deviceSrc = join(root, 'native', 'device')
const deviceDest = join(android, 'app/src/main/java/app/jarvis/device')
mkdirSync(deviceDest, { recursive: true })
copyFileSync(join(deviceSrc, 'JarvisDevicePlugin.java'), join(deviceDest, 'JarvisDevicePlugin.java'))

const voiceSrc = join(root, 'native', 'voice')
const voiceDest = join(android, 'app/src/main/java/app/jarvis/voice')
mkdirSync(voiceDest, { recursive: true })
copyFileSync(join(voiceSrc, 'JarvisVoicePlugin.java'), join(voiceDest, 'JarvisVoicePlugin.java'))
copyFileSync(join(voiceSrc, 'JarvisWakeService.java'), join(voiceDest, 'JarvisWakeService.java'))
copyFileSync(join(voiceSrc, 'JarvisListenAudio.java'), join(voiceDest, 'JarvisListenAudio.java'))
mkdirSync(join(android, 'app/src/main/res/xml'), { recursive: true })
copyFileSync(join(voiceSrc, 'shortcuts.xml'), join(android, 'app/src/main/res/xml/shortcuts.xml'))
copyFileSync(join(voiceSrc, 'jarvis_strings.xml'), join(android, 'app/src/main/res/values/jarvis_strings.xml'))

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
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.RECORD_AUDIO',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
  'android.permission.CAMERA',
  'android.permission.FLASHLIGHT',
  'android.permission.CALL_PHONE',
  'android.permission.SEND_SMS',
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
if (!manifest.includes('app.jarvis.notify.JarvisNotifyReceiver')) {
  manifest = manifest.replace(
    '</application>',
    `        <receiver
            android:name="app.jarvis.notify.JarvisNotifyReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="app.jarvis.notify.FIRE" />
            </intent-filter>
        </receiver>
        <receiver
            android:name="app.jarvis.notify.JarvisNotifyBoot"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
</application>`,
  )
}
if (!manifest.includes('app.jarvis.notify.JarvisAlarmActivity')) {
  manifest = manifest.replace(
    '</application>',
    `        <activity
            android:name="app.jarvis.notify.JarvisAlarmActivity"
            android:excludeFromRecents="true"
            android:exported="false"
            android:launchMode="singleInstance"
            android:showWhenLocked="true"
            android:taskAffinity=""
            android:theme="@android:style/Theme.DeviceDefault.NoActionBar"
            android:turnScreenOn="true" />
        <service
            android:name="app.jarvis.notify.JarvisAlarmService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback|specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Wecker-Klingeln" />
        </service>
        <receiver
            android:name="app.jarvis.notify.JarvisGlanceWidget"
            android:exported="true"
            android:label="Jarvis">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
                <action android:name="app.jarvis.notify.TOGGLE_VOICE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/jarvis_widget_info" />
        </receiver>
        <service
            android:name="app.jarvis.voice.JarvisWakeService"
            android:exported="false"
            android:foregroundServiceType="microphone" />
</application>`,
  )
}
if (!manifest.includes('app.jarvis.notify.JarvisAlarmService')) {
  manifest = manifest.replace(
    '</application>',
    `        <service
            android:name="app.jarvis.notify.JarvisAlarmService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback|specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Wecker-Klingeln" />
        </service>
</application>`,
  )
}
if (
  manifest.includes('app.jarvis.notify.JarvisAlarmService') &&
  !manifest.includes('android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE')
) {
  manifest = manifest.replace(
    /<service\s+android:name="app\.jarvis\.notify\.JarvisAlarmService"\s+android:exported="false"\s+android:foregroundServiceType="mediaPlayback"\s*\/>/,
    `<service
            android:name="app.jarvis.notify.JarvisAlarmService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback|specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Wecker-Klingeln" />
        </service>`,
  )
}
if (!manifest.includes('android.app.shortcuts')) {
  manifest = manifest.replace(
    '</activity>',
    `        <meta-data
            android:name="android.app.shortcuts"
            android:resource="@xml/shortcuts" />
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="jarvis" android:host="voice" />
        </intent-filter>
    </activity>`,
  )
}
if (!manifest.includes('android.hardware.camera.flash')) {
  manifest = manifest.replace(
    '</manifest>',
    `    <uses-feature android:name="android.hardware.camera.flash" android:required="false" />\n</manifest>`,
  )
}
if (!manifest.includes('<queries>')) {
  manifest = manifest.replace(
    '</manifest>',
    `    <queries>
        <intent>
            <action android:name="android.intent.action.DIAL" />
        </intent>
        <intent>
            <action android:name="android.intent.action.CALL" />
            <data android:scheme="tel" />
        </intent>
        <intent>
            <action android:name="android.intent.action.SENDTO" />
            <data android:scheme="smsto" />
        </intent>
    </queries>
</manifest>`,
  )
}
writeFileSync(manifestPath, manifest)

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const versionName = String(pkg.version || '1.0.0')
const parts = versionName.split('.').map((p) => Number.parseInt(String(p).replace(/\D/g, ''), 10) || 0)
const versionCode = Math.max((parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0), 10000)

const gradlePath = join(android, 'app/build.gradle')
let gradle = readFileSync(gradlePath, 'utf8')
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`)
if (!gradle.includes('archivesBaseName')) {
  gradle = gradle.replace(
    /android\s*\{\s*\n\s*namespace/,
    'android {\n    namespace',
  )
  gradle = gradle.replace(
    'namespace = "local.jarvis.app"',
    'namespace = "local.jarvis.app"\n    archivesBaseName = "Jarvis"',
  )
}
if (!gradle.includes("okhttp")) {
  gradle = gradle.replace(
    /dependencies\s*\{/,
    "dependencies {\n    implementation 'com.squareup.okhttp3:okhttp:4.12.0'",
  )
}
if (!gradle.includes('dadb')) {
  gradle = gradle.replace(
    /dependencies\s*\{/,
    "dependencies {\n    implementation 'dev.mobile:dadb:1.2.9'",
  )
}
if (!gradle.includes('META-INF/LICENSE.md')) {
  gradle = gradle.replace(
    /buildTypes\s*\{/,
    `packagingOptions {
        resources {
            excludes += ['META-INF/LICENSE.md', 'META-INF/LICENSE-notice.md']
        }
    }
    buildTypes {`,
  )
}
writeFileSync(gradlePath, gradle)

const brand = spawnSync('python3', [join(root, 'scripts/apply-brand.py')], { stdio: 'inherit' })
if (brand.status !== 0) {
  console.error('[apply-native-tv] apply-brand fehlgeschlagen')
  process.exit(brand.status || 1)
}

console.log(`[apply-native-tv] Plugin, Manifest, versionCode ${versionCode}, OkHttp, Brand.`)
