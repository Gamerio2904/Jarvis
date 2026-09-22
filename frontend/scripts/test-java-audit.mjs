/**
 * Sprint 272: die 11 Java-Änderungen aus dem Audit §2b, soweit der Quelltext
 * sie belegen kann. Gerät-PO bleibt die Checkliste in docs/TEST-18.1.0.md.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const native = join(dirname(fileURLToPath(import.meta.url)), '..', 'native')

function read(rel) {
  return readFileSync(join(native, rel), 'utf8')
}

const alarm = read('notify/JarvisAlarmService.java')
assert.match(alarm, /START_NOT_STICKY/, 'Geisteralarm: kein START_STICKY-Neustart ohne Intent')
assert.match(alarm, /if \(intent == null\)/, 'leerer Intent bricht ab')

const boot = read('notify/JarvisNotifyBoot.java')
assert.match(boot, /ACTION_MY_PACKAGE_REPLACED/, 'Wecker nach Update wieder scharf')
assert.match(boot, /TIMEZONE_CHANGED/)

const notify = read('notify/JarvisNotifyPlugin.java')
assert.match(notify, /restoreAll/, 'Restore bei App-Start')

const wake = read('voice/JarvisWakeService.java')
assert.match(wake, /START_NOT_STICKY/, 'Wake-Dienst stürzt den Prozess nicht')

const voice = read('voice/JarvisVoicePlugin.java')
assert.match(voice, /bargeMute/, 'beide Sprachspuren melden Sprechen')
assert.match(voice, /getInt\("seq"\)/, 'veraltetes Mute-Aus darf den nächsten Satz nicht öffnen')
assert.match(voice, /playMp3/, 'neuronales MP3 über MediaPlayer, nicht WebView-Audio')
assert.match(voice, /waitUntilTtsQuiet/, 'System-TTS wartet bis isSpeaking false')
{
  const stopWatch = voice.slice(voice.indexOf('public void stopBargeWatch'), voice.indexOf('private void runBargeWatch'))
  assert.doesNotMatch(stopWatch, /appTalking = false/, 'stopBargeWatch lässt JS-Mute über Satzgrenzen')
}
assert.match(voice, /handleOnDestroy/)

const geo = read('geo/JarvisGeoPlugin.java')
assert.match(geo, /handleOnDestroy/, 'GPS endet mit der Activity')

const device = read('device/JarvisDevicePlugin.java')
assert.match(device, /setTorchMode/)
assert.doesNotMatch(device, /Manifest\.permission\.CAMERA/, 'Taschenlampe ohne Kamera-Recht')
assert.match(device, /SMS_SENT/, 'sentIntent für SMS')
assert.match(device, /getResultCode\(\)/, 'Funk-Ergebnis, nicht nur Übergabe an das System')
assert.match(device, /parts\.size\(\) - 1/, 'Multipart: sentIntent nur am letzten Teil')
assert.match(device, /scanContacts/, 'Telefonbuch-Scan')
assert.match(device, /READ_CONTACTS/, 'Kontakte-Recht')
assert.match(device, /Email\.CONTENT_URI/, 'Mail aus dem Telefonbuch')
assert.match(device, /cleanEmail|indexOf\('<'\)/, 'Mail in Klammern')
assert.match(device, /Phone-Scan bleibt/, 'Mail-Fehler kippt den Nummern-Scan nicht')
assert.match(device, /imapList/, 'IMAP-Lesen')
assert.match(device, /mailto/, 'E-Mail-Entwurf')

const inbox = read('notify/JarvisInboxService.java')
assert.match(inbox, /NotificationListenerService/, 'Meldungen, kein Accessibility')
assert.match(inbox, /RemoteInput/, 'WhatsApp-Antwort über die Meldung')
assert.doesNotMatch(inbox, /AccessibilityService/, 'kein stilles WhatsApp')

const widget = read('notify/JarvisGlanceWidget.java')
assert.match(widget, /PendingIntent\.getBroadcast\(ctx, 44, toggle/, 'Widget-Toggle an die eigene Klasse')
assert.match(widget, /startActivity\(homeIntent/, 'Wake anschalten öffnet die App')

assert.match(alarm, /this::stopSelf/, 'Timer-Meldung beendet den Dienst')

const player = read('notify/JarvisAlarmPlayer.java')
assert.match(player, /MAX_RING_MS = 10 \* 60_000L/, 'verpasster Wecker endet nach zehn Minuten')

const applyNative = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'apply-native-tv.mjs'), 'utf8')
assert.match(applyNative, /<queries>/, 'openApp sieht installierte Apps')
assert.match(applyNative, /LAUNCHER/)
assert.match(applyNative, /windowSoftInputMode="adjustNothing"/, 'Tastatur überdeckt die Leiste')
assert.match(applyNative, /READ_CONTACTS/)
assert.match(applyNative, /JarvisInboxService/)
assert.match(applyNative, /JarvisMail\.java/)
assert.match(applyNative, /mailto/)

const mainActivity = read('tv/MainActivity.java')
assert.match(mainActivity, /SOFT_INPUT_ADJUST_NOTHING/, 'WebView schrumpft nicht mit der IME')

const tv = read('tv/JarvisTvPlugin.java')
assert.match(tv, /public void test\(/, 'Fernseher testen ruft eine echte Methode')

console.log('test:java-audit ok — Quelltext der 11 Java-Änderungen plus SMS-sentIntent')
