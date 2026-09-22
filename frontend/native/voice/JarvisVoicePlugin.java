package app.jarvis.voice;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import android.speech.tts.Voice;

import android.util.Base64;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

@CapacitorPlugin(
        name = "JarvisVoice",
        permissions = {
                @Permission(alias = "mic", strings = {Manifest.permission.RECORD_AUDIO})
        }
)
public class JarvisVoicePlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private PluginCall listenCall;
    private PluginCall speakCall;
    private PluginCall playCall;
    private int listenGen = 0;
    private int speakGen = 0;
    private int playGen = 0;
    private MediaPlayer mp3Player;
    private String lastPartial = "";
    private String listenHold = "";
    private int listenExtend = 0;
    private int listenBusy = 0;
    private long lastRmsAt = 0;
    private boolean skipOnDevice = false;
    private volatile boolean bargeWatch = false;
    /**
     * Spricht die App gerade selbst? Deckt beide Spuren ab — die System-Stimme
     * und das neuronale MP3 im WebView. `tts.isSpeaking()` allein sah nur die
     * erste, deshalb hielt der Wächter die eigene Antwort für eine
     * Unterbrechung und schnitt sie nach dem ersten Satz ab.
     */
    private volatile boolean appTalking = false;
    /** Nachhall im Raum, nachdem der Lautsprecher verstummt ist. */
    private volatile long bargeIgnoreUntil = 0;
    private volatile int bargeMuteSeq = 0;
    private Intent listenIntent;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newCachedThreadPool();
    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .build();
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private static JarvisVoicePlugin self;
    private static volatile boolean pendingWake = false;
    private static volatile String pendingUtterance = "";
    private static volatile boolean voiceSession = false;

    @Override
    public void load() {
        self = this;
        main.post(() -> {
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    tts.setLanguage(Locale.GERMANY);
                    tts.setSpeechRate(1.03f);
                    tts.setPitch(0.94f);
                    pickGermanVoice();
                }
            });
        });
    }

    @Override
    protected void handleOnDestroy() {
        self = null;
        main.post(() -> {
            if (recognizer != null) {
                recognizer.destroy();
                recognizer = null;
            }
            if (tts != null) {
                tts.shutdown();
                tts = null;
            }
            bargeWatch = false;
            stopMp3Player();
        });
    }

    private void pickGermanVoice() {
        if (tts == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return;
        try {
            Set<Voice> voices = tts.getVoices();
            if (voices == null) return;
            Voice best = null;
            int score = -100;
            for (Voice v : voices) {
                if (v == null || v.getLocale() == null) continue;
                if (!"de".equalsIgnoreCase(v.getLocale().getLanguage())) continue;
                String name = v.getName() == null ? "" : v.getName().toLowerCase(Locale.ROOT);
                int s = 0;
                if (name.contains("pico") || name.contains("svox")) s -= 12;
                if (name.contains("google")) s += 5;
                if (name.contains("neural") || name.contains("wavenet") || name.contains("network")) s += 4;
                if (name.contains("de-de-x-deb") || name.contains("male") || name.contains("männlich")) s += 6;
                if (name.contains("de-de-x-dea") || name.contains("female") || name.contains("frau")) s -= 5;
                if (v.getQuality() >= Voice.QUALITY_HIGH) s += 2;
                if (v.isNetworkConnectionRequired()) s += 1;
                if (s > score) {
                    score = s;
                    best = v;
                }
            }
            if (best != null) tts.setVoice(best);
        } catch (Exception ignored) {
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("mic") == PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        requestPermissionForAlias("mic", call, "onMicPerm");
    }

    @PermissionCallback
    private void onMicPerm(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", getPermissionState("mic") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            requestPermissionForAlias("mic", call, "onMicThenListen");
            return;
        }
        startListen(call);
    }

    @PermissionCallback
    private void onMicThenListen(PluginCall call) {
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("text", "");
            r.put("message", "Mikrofon verweigert.");
            call.resolve(r);
            return;
        }
        startListen(call);
    }

    private void startListen(PluginCall call) {
        call.setKeepAlive(true);
        final int gen = ++listenGen;
        main.post(() -> {
            if (listenCall != null) {
                finishListen("", false, "schon am Zuhören", null);
                /**
                 * Der alte Ruf wurde beantwortet, die Erkennung lief aber
                 * weiter: der neue Anlauf lief in ERROR_RECOGNIZER_BUSY und der
                 * Sprachmodus meldete „Zuhören unterbrochen".
                 */
                if (recognizer != null) {
                    try { recognizer.cancel(); } catch (Exception ignored) {}
                }
            }
            JarvisWakeService.pauseListen();
            listenCall = call;
            lastPartial = "";
            listenHold = "";
            listenExtend = 0;
            listenBusy = 0;
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                finishListen("", false, "Spracherkennung fehlt auf diesem Gerät.", null);
                return;
            }
            ensureRecognizer();
            Intent intent = listenIntent();
            listenIntent = intent;
            int delay = 80;
            try {
                main.postDelayed(() -> {
                    if (listenGen != gen || listenCall != call) return;
                    try {
                        if (recognizer != null) recognizer.startListening(intent);
                    } catch (Exception e) {
                        finishListen("", false, "Zuhören fehlgeschlagen.", null);
                    }
                }, delay);
            } catch (Exception e) {
                finishListen("", false, "Zuhören fehlgeschlagen.", null);
                return;
            }
            main.postDelayed(() -> {
                if (listenGen != gen) return;
                if (listenCall == call) {
                    try {
                        if (recognizer != null) recognizer.cancel();
                    } catch (Exception ignored) {}
                    finishListen(joinHold(lastPartial), true, "", null);
                }
            }, 15_000);
        });
    }

    private Intent listenIntent() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE");
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "de-DE");
        intent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 8);
        /**
         * 200–280 ms haben mittendrin abgeschnitten. Die JS-Seite wartet
         * 600–1100 ms auf ein Satzende — das Gerät muss mindestens so lange
         * offen bleiben, sonst kommt nur die erste Silbe.
         */
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 750L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 520L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 480L);
        intent.putExtra("android.speech.extra.DICTATION_MODE", true);
        return intent;
    }

    private SpeechRecognizer makeRecognizer() {
        if (!skipOnDevice && Build.VERSION.SDK_INT >= 33) {
            try {
                if (SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext())) {
                    return SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
                }
            } catch (Exception ignored) {
                skipOnDevice = true;
            }
        }
        if (!skipOnDevice && Build.VERSION.SDK_INT >= 31 && Build.VERSION.SDK_INT < 33) {
            try {
                return SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
            } catch (Exception ignored) {
                skipOnDevice = true;
            }
        }
        return SpeechRecognizer.createSpeechRecognizer(getContext());
    }

    private void ensureRecognizer() {
        if (recognizer != null) return;
        recognizer = makeRecognizer();
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {
                long now = System.currentTimeMillis();
                if (now - lastRmsAt < 50) return;
                lastRmsAt = now;
                float n = Math.max(0f, Math.min(1f, (rmsdB + 2f) / 12f));
                JSObject ev = new JSObject();
                ev.put("rms", n);
                notifyListeners("rms", ev);
            }
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override
            public void onResults(Bundle results) {
                ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                String text = list != null && !list.isEmpty() ? list.get(0) : "";
                String joined = joinHold(text);
                if (shouldExtend(joined, true)) {
                    listenHold = joined;
                    listenExtend += 1;
                    lastPartial = joined;
                    restartListen();
                    return;
                }
                listenHold = "";
                listenExtend = 0;
                finishListen(joined, true, "", list);
            }
            @Override
            public void onError(int error) {
                if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                        || error == SpeechRecognizer.ERROR_CLIENT) {
                    skipOnDevice = true;
                    try {
                        if (recognizer != null) {
                            recognizer.destroy();
                            recognizer = null;
                        }
                    } catch (Exception ignored) {}
                    if (listenBusy < 2 && listenCall != null) {
                        listenBusy += 1;
                        main.postDelayed(() -> {
                            if (listenCall == null) return;
                            try {
                                ensureRecognizer();
                                if (recognizer != null && listenIntent != null) {
                                    recognizer.startListening(listenIntent);
                                }
                            } catch (Exception e) {
                                finishListen(joinHold(lastPartial), false, "Zuhören unterbrochen.", null);
                            }
                        }, 180);
                        return;
                    }
                }
                if (error == SpeechRecognizer.ERROR_NO_MATCH
                        || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                    String keep = joinHold(lastPartial);
                    if (shouldExtend(keep, false)) {
                        listenHold = keep;
                        listenExtend += 1;
                        restartListen();
                        return;
                    }
                    finishListen(keep, true, keep.isEmpty() ? "" : "", null);
                    return;
                }
                finishListen(joinHold(lastPartial), false, "Zuhören unterbrochen.", null);
            }
            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> list = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (list == null || list.isEmpty()) return;
                lastPartial = list.get(0) == null ? "" : list.get(0);
                JSObject ev = new JSObject();
                ev.put("text", lastPartial);
                notifyListeners("partial", ev);
            }
            @Override public void onEvent(int eventType, Bundle params) {}
        });
    }

    private String joinHold(String next) {
        String a = listenHold == null ? "" : listenHold.trim();
        String b = next == null ? "" : next.trim();
        if (a.isEmpty()) return b;
        if (b.isEmpty() || b.startsWith(a)) return b.isEmpty() ? a : b;
        return a + " " + b;
    }

    /**
     * Gleicher Maßstab wie `turn-detect.ts`. Länge ist kein Beleg —
     * „Zeig Satelliten" darf nicht auf eine zweite Session warten.
     */
    private boolean looksComplete(String text, boolean isFinal) {
        if (text == null) return false;
        String t = text.trim().replaceAll("\\s+", " ");
        if (t.isEmpty()) return false;
        String low = t.toLowerCase(Locale.GERMAN);
        if (low.matches("(?s).*\\b(und|oder|aber|weil|dass|daß|also|dann|wenn|ob|mit|von|zu|für|nach|als|wie|der|die|das|ein|eine|einen|einem|ich|wir|man|noch|um|bis|seit|ohne|gegen|durch|vor|über|unter|neben|beim|zur|zum|vom|im|am|dem|des|einer|eines|mein|meine|meinen|meiner|sehr|ganz|mal|auch|nur|schon|damit|obwohl|während|bevor|nachdem|falls|sodass|weder|entweder)\\s*$")) {
            return false;
        }
        if (t.matches(".*[.!?…]$") && t.length() >= 4) return true;
        if (low.matches("^(?:stopp|stop|halt|weiter|pause|abbrechen|lauter|leiser|zurück|hilfe)[.!?]*$")) {
            return true;
        }
        if (low.matches("^(?:(?:das|der|die|den|mein|meine)\\s+)?(?:licht|lampe|lampen|fernseher|tv|ventilator|steckdose|steckdosen|taschenlampe|kugel|weltkugel|körper|koerper|erde|lage|hirn|auge|musik|radio|spotify|netflix|carplay|fahrmodus|overlay)\\s+(?:an|aus|ein|einschalten|ausschalten|anmachen|ausmachen|hoch|runter|lauter|leiser|stopp|stop)[.!?]*$")) {
            return true;
        }
        return isFinal;
    }

    private boolean shouldExtend(String text, boolean isFinal) {
        if (listenExtend >= 2) return false;
        if (text == null || text.trim().isEmpty()) return false;
        return !looksComplete(text, isFinal);
    }

    private void restartListen() {
        final Intent intent = listenIntent;
        final PluginCall call = listenCall;
        final int gen = listenGen;
        if (intent == null || call == null) return;
        main.postDelayed(() -> {
            if (listenGen != gen || listenCall != call) return;
            try {
                if (recognizer == null) ensureRecognizer();
                if (recognizer == null) {
                    finishListen(joinHold(lastPartial), true, "", null);
                    return;
                }
                recognizer.startListening(intent);
            } catch (Exception e) {
                finishListen(joinHold(lastPartial), true, "", null);
            }
        }, 80);
    }

    private void finishListen(String text, boolean ok, String message, ArrayList<String> alts) {
        listenHold = "";
        listenExtend = 0;
        PluginCall c = listenCall;
        listenCall = null;
        if (c == null) return;
        JSObject r = new JSObject();
        r.put("ok", ok);
        r.put("text", text == null ? "" : text);
        if (alts != null && !alts.isEmpty()) {
            com.getcapacitor.JSArray arr = new com.getcapacitor.JSArray();
            for (String a : alts) {
                if (a != null && !a.isEmpty()) arr.put(a);
            }
            r.put("alts", arr);
        }
        if (message != null && !message.isEmpty()) r.put("message", message);
        c.resolve(r);
        if (!voiceSession) {
            main.postDelayed(() -> JarvisWakeService.resumeListen(getContext()), 400);
        }
    }

    @PluginMethod
    public void beginVoiceSession(PluginCall call) {
        voiceSession = true;
        JarvisWakeService.pauseListen();
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void endVoiceSession(PluginCall call) {
        voiceSession = false;
        JarvisWakeService.resumeListen(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void stopListen(PluginCall call) {
        main.post(() -> {
            if (recognizer != null) {
                try { recognizer.cancel(); } catch (Exception ignored) {}
            }
            finishListen("", true, "", null);
        });
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) {
            JSObject r = new JSObject();
            r.put("ok", true);
            call.resolve(r);
            return;
        }
        call.setKeepAlive(true);
        /**
         * Der vorige Aufruf wurde vorher einfach überschrieben. Er hatte
         * setKeepAlive(true), sein Versprechen in JS wurde damit nie eingelöst
         * — der DriveMode wartet in .finally() darauf, um navBusy zurückzusetzen,
         * und blieb für den Rest der Fahrt auf „beschäftigt". Ab dem ersten
         * überlappenden Hinweis kam keine Ansage mehr.
         */
        PluginCall prev = speakCall;
        speakCall = null;
        if (prev != null && prev != call) {
            JSObject over = new JSObject();
            over.put("ok", false);
            over.put("message", "überholt");
            prev.resolve(over);
        }
        speakCall = call;
        final int gen = ++speakGen;
        final String gender = call.getString("gender", "");
        trySpeak(call, text, gender == null ? "" : gender, gen, 0);
    }

    private void trySpeak(PluginCall call, String text, String gender, int gen, int attempt) {
        main.post(() -> {
            if (speakGen != gen || speakCall != call) return;
            if (tts == null || !ttsReady) {
                if (attempt < 15) {
                    main.postDelayed(() -> trySpeak(call, text, gender, gen, attempt + 1), 100);
                    return;
                }
                JSObject r = new JSObject();
                r.put("ok", false);
                r.put("message", "Stimme noch nicht bereit.");
                PluginCall c = speakCall;
                speakCall = null;
                if (c != null) c.resolve(r);
                return;
            }
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) {}
                @Override public void onDone(String utteranceId) {
                    main.post(() -> waitUntilTtsQuiet(call, gen));
                }
                @Override public void onError(String utteranceId) { finishSpeak(false); }
            });
            applyVoiceGender(gender);
            Bundle params = new Bundle();
            String utterId = "jarvis-voice-" + gen;
            int queued = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utterId);
            if (queued == TextToSpeech.ERROR) {
                finishSpeak(false);
                return;
            }
            /**
             * Die Notbremse meldete „fertig", obwohl noch gesprochen wurde:
             * eine Antwort über 20 Sekunden schnitt sich damit selbst ab, weil
             * die Warteschlange den nächsten Satz mit QUEUE_FLUSH nachschob.
             * Sie sagt jetzt die Wahrheit und greift nur für ihren eigenen Ruf.
             */
            main.postDelayed(() -> {
                if (speakGen != gen || speakCall != call) return;
                finishSpeak(false);
            }, 20_000);
        });
    }

    private void waitUntilTtsQuiet(PluginCall call, int gen) {
        if (speakGen != gen || speakCall != call) return;
        if (tts != null && tts.isSpeaking()) {
            main.postDelayed(() -> waitUntilTtsQuiet(call, gen), 120);
            return;
        }
        finishSpeak(true);
    }

    private void finishSpeak(boolean ok) {
        PluginCall c = speakCall;
        speakCall = null;
        if (c == null) return;
        JSObject r = new JSObject();
        r.put("ok", ok);
        c.resolve(r);
    }

    private void applyVoiceGender(String gender) {
        if (tts == null || gender == null || gender.isEmpty()) return;
        try {
            Set<Voice> voices = tts.getVoices();
            if (voices == null || voices.isEmpty()) return;
            boolean wantFemale = "female".equalsIgnoreCase(gender);
            Voice pick = null;
            for (Voice v : voices) {
                if (v == null || v.getLocale() == null) continue;
                if (!"de".equalsIgnoreCase(v.getLocale().getLanguage())) continue;
                String n = v.getName() == null ? "" : v.getName().toLowerCase(Locale.US);
                boolean female = n.contains("female") || n.contains("-f") || n.contains("frau");
                boolean male = (n.contains("male") && !n.contains("female")) || n.contains("-m") || n.contains("mann");
                if (wantFemale && female) { pick = v; break; }
                if (!wantFemale && male) { pick = v; break; }
            }
            if (pick != null) tts.setVoice(pick);
        } catch (Exception ignored) {
            /* Gerät hat oft nur eine de-DE-Stimme — ehrlich Native. */
        }
    }

    @PluginMethod
    public void stopSpeak(PluginCall call) {
        main.post(() -> {
            if (tts != null) tts.stop();
            stopMp3Player();
            finishSpeak(true);
            finishPlay(true);
        });
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void playMp3(PluginCall call) {
        String b64 = call.getString("audio", "");
        if (b64 == null || b64.isEmpty()) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "leer");
            call.resolve(r);
            return;
        }
        call.setKeepAlive(true);
        PluginCall prev = playCall;
        playCall = null;
        if (prev != null && prev != call) {
            JSObject over = new JSObject();
            over.put("ok", false);
            over.put("message", "überholt");
            prev.resolve(over);
        }
        playCall = call;
        final int gen = ++playGen;
        final String encoded = b64;
        io.execute(() -> {
            try {
                byte[] data = Base64.decode(encoded, Base64.DEFAULT);
                File f = new File(getContext().getCacheDir(), "jarvis-speak-" + gen + ".mp3");
                FileOutputStream fos = new FileOutputStream(f);
                fos.write(data);
                fos.close();
                main.post(() -> startMp3(call, f, gen));
            } catch (Exception e) {
                main.post(() -> finishPlay(false));
            }
        });
    }

    private void startMp3(PluginCall call, File f, int gen) {
        if (playGen != gen || playCall != call) {
            f.delete();
            return;
        }
        stopMp3Player();
        if (tts != null) {
            try { tts.stop(); } catch (Exception ignored) {}
        }
        try {
            MediaPlayer mp = new MediaPlayer();
            mp3Player = mp;
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
            mp.setDataSource(f.getAbsolutePath());
            mp.setOnCompletionListener(p -> {
                f.delete();
                finishPlay(true);
            });
            mp.setOnErrorListener((p, what, extra) -> {
                f.delete();
                finishPlay(false);
                return true;
            });
            mp.prepare();
            mp.start();
            appTalking = true;
        } catch (Exception e) {
            f.delete();
            finishPlay(false);
        }
    }

    private void stopMp3Player() {
        MediaPlayer mp = mp3Player;
        mp3Player = null;
        if (mp == null) return;
        try { mp.stop(); } catch (Exception ignored) {}
        try { mp.release(); } catch (Exception ignored) {}
    }

    private void finishPlay(boolean ok) {
        PluginCall c = playCall;
        playCall = null;
        stopMp3Player();
        if (c == null) return;
        JSObject r = new JSObject();
        r.put("ok", ok);
        c.resolve(r);
    }

    @PluginMethod
    public void startBargeWatch(PluginCall call) {
        bargeWatch = true;
        io.execute(this::runBargeWatch);
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    /** Die JS-Seite meldet, wenn sie Audio abspielt — egal über welche Spur. */
    @PluginMethod
    public void bargeMute(PluginCall call) {
        Integer seqObj = call.getInt("seq");
        int seq = seqObj == null ? 0 : seqObj.intValue();
        if (seq > 0 && seq < bargeMuteSeq) {
            JSObject skip = new JSObject();
            skip.put("ok", true);
            call.resolve(skip);
            return;
        }
        if (seq > 0) bargeMuteSeq = seq;
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        appTalking = on;
        bargeIgnoreUntil = on ? 0 : System.currentTimeMillis() + 900;
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void stopBargeWatch(PluginCall call) {
        bargeWatch = false;
        /**
         * JS hält `appTalking` über Satzgrenzen. Hier zurückzusetzen öffnete
         * das Mikrofon in der Pause nach dem ersten Satz — Echo schnitt den Rest.
         */
        bargeIgnoreUntil = System.currentTimeMillis() + 900;
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    private void runBargeWatch() {
        int min = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        if (min <= 0) min = 16000;
        AudioRecord rec = null;
        try {
            rec = new AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    16000,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    Math.max(min, 3200));
            if (rec.getState() != AudioRecord.STATE_INITIALIZED) {
                rec.release();
                rec = new AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        16000,
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        Math.max(min, 3200));
            }
            if (rec.getState() != AudioRecord.STATE_INITIALIZED) {
                rec.release();
                return;
            }
            rec.startRecording();
            short[] buf = new short[512];
            int hot = 0;
            long started = System.currentTimeMillis();
            while (bargeWatch) {
                int n = rec.read(buf, 0, buf.length);
                if (n <= 0) continue;
                long now = System.currentTimeMillis();
                if (now - started < 2000) continue;
                if (appTalking || now < bargeIgnoreUntil || (tts != null && tts.isSpeaking())) {
                    hot = 0;
                    continue;
                }
                double sum = 0;
                for (int i = 0; i < n; i += 1) {
                    double v = buf[i] / 32768.0;
                    sum += v * v;
                }
                double rms = Math.sqrt(sum / n);
                if (rms >= 0.12) hot += 1;
                else hot = Math.max(0, hot - 2);
                if (hot >= 8) {
                    bargeWatch = false;
                    main.post(() -> {
                        JSObject ev = new JSObject();
                        ev.put("hit", true);
                        notifyListeners("barge", ev);
                    });
                    break;
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (rec != null) {
                try {
                    rec.stop();
                } catch (Exception ignored) {
                }
                try {
                    rec.release();
                } catch (Exception ignored) {
                }
            }
        }
    }

    @PluginMethod
    public void streamSse(PluginCall call) {
        String url = call.getString("url", "");
        String body = call.getString("body", "{}");
        String apiKey = call.getString("apiKey", "");
        if (url == null || url.isEmpty()) {
            call.reject("url nötig");
            return;
        }
        call.setKeepAlive(true);
        Integer timeout = call.getInt("timeoutMs");
        int readMs = timeout == null ? 8_000 : Math.max(3_000, Math.min(20_000, timeout));
        io.execute(() -> {
            OkHttpClient client = http.newBuilder()
                    .connectTimeout(4, TimeUnit.SECONDS)
                    .readTimeout(readMs, TimeUnit.MILLISECONDS)
                    .callTimeout(readMs + 2_000L, TimeUnit.MILLISECONDS)
                    .build();
            Request.Builder b = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(body == null ? "{}" : body, JSON))
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "text/event-stream");
            if (apiKey != null && !apiKey.isEmpty()) {
                String auth = call.getString("auth", "google");
                if ("bearer".equalsIgnoreCase(auth)) {
                    b.addHeader("Authorization", "Bearer " + apiKey);
                } else {
                    b.addHeader("x-goog-api-key", apiKey);
                }
            }
            Call httpCall = client.newCall(b.build());
            try (Response res = httpCall.execute()) {
                int code = res.code();
                if (res.body() == null) {
                    JSObject r = new JSObject();
                    r.put("ok", false);
                    r.put("status", code);
                    r.put("message", "Leere Antwort");
                    call.resolve(r);
                    return;
                }
                BufferedReader reader = new BufferedReader(new InputStreamReader(res.body().byteStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data:")) continue;
                    String data = line.substring(5).trim();
                    if (data.isEmpty() || "[DONE]".equals(data)) continue;
                    JSObject ev = new JSObject();
                    ev.put("data", data);
                    notifyListeners("sse", ev);
                }
                JSObject r = new JSObject();
                r.put("ok", code >= 200 && code < 300);
                r.put("status", code);
                call.resolve(r);
            } catch (Exception e) {
                JSObject r = new JSObject();
                r.put("ok", false);
                r.put("message", e.getMessage() == null ? "Stream fehlgeschlagen" : e.getMessage());
                call.resolve(r);
            }
        });
    }

    public static void emitWake() {
        emitWake("");
    }

    public static void emitWake(String utterance) {
        pendingWake = true;
        pendingUtterance = utterance == null ? "" : utterance.trim();
        JarvisVoicePlugin p = self;
        if (p == null) return;
        JSObject ev = new JSObject();
        ev.put("hit", true);
        if (!pendingUtterance.isEmpty()) ev.put("utterance", pendingUtterance);
        p.notifyListeners("wake", ev);
    }

    public static void emitDebugStop() {
        JarvisVoicePlugin p = self;
        if (p == null) return;
        JSObject ev = new JSObject();
        ev.put("hit", true);
        p.notifyListeners("debugStop", ev);
    }

    @PluginMethod
    public void startDebugFg(PluginCall call) {
        JarvisDebugService.start(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void stopDebugFg(PluginCall call) {
        JarvisDebugService.stop(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void debugFgStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("running", JarvisDebugService.isRunning());
        call.resolve(r);
    }

    @PluginMethod
    public void consumeLaunch(PluginCall call) {
        Activity a = getActivity();
        boolean voice = pendingWake;
        pendingWake = false;
        String utterance = pendingUtterance;
        pendingUtterance = "";
        if (a != null) {
            Intent i = a.getIntent();
            if (i != null) {
                Uri data = i.getData();
                String extra = i.getStringExtra("jarvis_mode");
                String fromIntent = i.getStringExtra("jarvis_utterance");
                voice = voice
                        || (data != null && "voice".equals(data.getHost()))
                        || "voice".equals(extra)
                        || (data != null && String.valueOf(data).contains("voice"));
                if (fromIntent != null && !fromIntent.trim().isEmpty()) {
                    utterance = fromIntent.trim();
                }
                if (voice) {
                    i.setData(null);
                    i.removeExtra("jarvis_mode");
                    i.removeExtra("jarvis_utterance");
                    a.setIntent(i);
                }
            }
        }
        JSObject r = new JSObject();
        r.put("voice", voice);
        r.put("utterance", utterance == null ? "" : utterance);
        call.resolve(r);
    }

    @PluginMethod
    public void pinShortcut(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Shortcut erst ab Android 8.");
            call.resolve(r);
            return;
        }
        ShortcutManager sm = getContext().getSystemService(ShortcutManager.class);
        if (sm == null || !sm.isRequestPinShortcutSupported()) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Homescreen nimmt keinen Shortcut an.");
            call.resolve(r);
            return;
        }
        Intent intent = new Intent(getContext(), getActivity().getClass());
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("jarvis://voice"));
        intent.putExtra("jarvis_mode", "voice");
        ShortcutInfo info = new ShortcutInfo.Builder(getContext(), "jarvis_voice")
                .setShortLabel("Jarvis hören")
                .setLongLabel("Jarvis hören")
                .setIcon(Icon.createWithResource(getContext(), getContext().getApplicationInfo().icon))
                .setIntent(intent)
                .build();
        boolean ok = sm.requestPinShortcut(info, null);
        JSObject r = new JSObject();
        r.put("ok", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void startWake(PluginCall call) {
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            requestPermissionForAlias("mic", call, "onWakeMic");
            return;
        }
        JarvisWakeService.start(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void requestBatteryUnrestricted(PluginCall call) {
        try {
            Activity a = getActivity();
            if (a == null) {
                JSObject r = new JSObject();
                r.put("ok", false);
                r.put("message", "Keine Activity.");
                call.resolve(r);
                return;
            }
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            i.setData(Uri.parse("package:" + getContext().getPackageName()));
            a.startActivity(i);
            JSObject r = new JSObject();
            r.put("ok", true);
            call.resolve(r);
        } catch (Exception e) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Akku-Ausnahme nicht geöffnet.");
            call.resolve(r);
        }
    }

    @PluginMethod
    public void setKeepScreenOn(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        main.post(() -> {
            Activity a = getActivity();
            if (a != null && getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setKeepScreenOn(on);
            }
        });
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PermissionCallback
    private void onWakeMic(PluginCall call) {
        JSObject r = new JSObject();
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            r.put("ok", false);
            r.put("message", "Mikrofon für Wake-Word erlauben.");
            call.resolve(r);
            return;
        }
        JarvisWakeService.start(getContext());
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void stopWake(PluginCall call) {
        JarvisWakeService.stop(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void wakeStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("running", JarvisWakeService.isRunning());
        r.put("wanted", JarvisWakeService.wantEnabled(getContext()));
        call.resolve(r);
    }

    private static final String EDGE_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private static final String EDGE_GEC_VER = "1-143.0.3650.75";
    private static final String EDGE_UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0";

    @PluginMethod
    public void synthEdge(PluginCall call) {
        String text = call.getString("text", "");
        String voice = call.getString("voice", "de-DE-ConradNeural");
        Integer timeout = call.getInt("timeoutMs");
        int ms = timeout == null ? 4000 : Math.max(400, Math.min(12_000, timeout));
        if (text == null || text.trim().isEmpty()) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "leer");
            call.resolve(r);
            return;
        }
        final String spoken = text.trim();
        final String voiceName = voice == null || voice.isEmpty() ? "de-DE-ConradNeural" : voice;
        call.setKeepAlive(true);
        io.execute(() -> {
            JSObject r = new JSObject();
            try {
                byte[] mp3 = edgeMp3(spoken, voiceName, ms);
                if (mp3 == null || mp3.length == 0) {
                    r.put("ok", false);
                    r.put("message", "kein audio");
                } else {
                    r.put("ok", true);
                    r.put("audio", Base64.encodeToString(mp3, Base64.NO_WRAP));
                }
            } catch (Exception e) {
                r.put("ok", false);
                r.put("message", e.getMessage() == null ? "edge" : e.getMessage());
            }
            call.resolve(r);
        });
    }

    private byte[] edgeMp3(String text, String voice, int timeoutMs) throws Exception {
        String gec = edgeGec();
        String conn = uuidHex();
        String muid = uuidHex();
        String url = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1"
                + "?TrustedClientToken=" + EDGE_TOKEN
                + "&Sec-MS-GEC=" + gec
                + "&Sec-MS-GEC-Version=" + EDGE_GEC_VER
                + "&ConnectionId=" + conn;
        CountDownLatch done = new CountDownLatch(1);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OkHttpClient client = http.newBuilder()
                .connectTimeout(4, TimeUnit.SECONDS)
                .readTimeout(timeoutMs, TimeUnit.MILLISECONDS)
                .build();
        Request req = new Request.Builder()
                .url(url)
                .header("Pragma", "no-cache")
                .header("Cache-Control", "no-cache")
                .header("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
                .header("User-Agent", EDGE_UA)
                .header("Cookie", "muid=" + muid + ";")
                .build();
        WebSocket ws = client.newWebSocket(req, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                String ts = edgeDate();
                webSocket.send("X-Timestamp:" + ts
                        + "\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n"
                        + "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":"
                        + "{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},"
                        + "\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}\r\n");
                String ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
                        + "<voice name='" + voice + "'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>"
                        + edgeSsmlEscape(text) + "</prosody></voice></speak>";
                webSocket.send("X-RequestId:" + uuidHex()
                        + "\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:" + ts
                        + "Z\r\nPath:ssml\r\n\r\n" + ssml);
            }

            @Override
            public void onMessage(WebSocket webSocket, String textMsg) {
                if (textMsg != null && textMsg.contains("Path:turn.end")) {
                    webSocket.close(1000, "ok");
                    done.countDown();
                }
            }

            @Override
            public void onMessage(WebSocket webSocket, ByteString bytes) {
                byte[] data = bytes.toByteArray();
                if (data.length < 2) return;
                int headerLen = ((data[0] & 0xff) << 8) | (data[1] & 0xff);
                if (headerLen < 0 || headerLen + 2 > data.length) return;
                String header = new String(data, 2, headerLen, StandardCharsets.UTF_8);
                if (!header.contains("Path:audio")) return;
                int start = headerLen + 2;
                if (start >= data.length) return;
                synchronized (out) {
                    out.write(data, start, data.length - start);
                }
            }

            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                done.countDown();
            }

            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                done.countDown();
            }
        });
        boolean finished = done.await(timeoutMs, TimeUnit.MILLISECONDS);
        ws.cancel();
        if (!finished) return null;
        if (out.size() == 0) return null;
        return out.toByteArray();
    }

    private static String edgeGec() throws Exception {
        double ticks = System.currentTimeMillis() / 1000.0 + 11_644_473_600.0;
        ticks -= ticks % 300.0;
        ticks *= 10_000_000.0;
        String payload = String.format(Locale.US, "%.0f", ticks) + EDGE_TOKEN;
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(payload.getBytes(StandardCharsets.US_ASCII));
        StringBuilder sb = new StringBuilder(hash.length * 2);
        for (byte b : hash) sb.append(String.format(Locale.US, "%02X", b));
        return sb.toString();
    }

    private static String edgeDate() {
        SimpleDateFormat fmt = new SimpleDateFormat("EEE MMM dd yyyy HH:mm:ss", Locale.US);
        fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
        return fmt.format(new Date()) + " GMT+0000 (Coordinated Universal Time)";
    }

    private static String uuidHex() {
        return UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.US);
    }

    private static String edgeSsmlEscape(String text) {
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
