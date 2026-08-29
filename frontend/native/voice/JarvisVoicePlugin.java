package app.jarvis.voice;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.media.AudioAttributes;
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

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

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
    private boolean holdOpen = false;
    private final Runnable restartListen = this::beginListening;
    private int speakGen = 0;
    private String lastPartial = "";
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

    @Override
    public void load() {
        self = this;
        main.post(() -> {
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    tts.setLanguage(Locale.GERMANY);
                    tts.setSpeechRate(0.94f);
                    tts.setPitch(0.90f);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        int usage = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                                ? AudioAttributes.USAGE_ASSISTANT
                                : AudioAttributes.USAGE_MEDIA;
                        tts.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(usage)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .build());
                    }
                    pickGermanVoice();
                }
            });
        });
    }

    @Override
    protected void handleOnDestroy() {
        self = null;
        main.post(() -> {
            holdOpen = false;
            main.removeCallbacks(restartListen);
            JarvisListenAudio.release(getContext());
            dropRecognizer();
            if (tts != null) {
                tts.shutdown();
                tts = null;
            }
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
        main.post(() -> {
            if (listenCall != null) {
                holdOpen = false;
                finishListen("", false, "schon am Zuhören", null);
            }
            JarvisWakeService.pauseListen();
            listenCall = call;
            lastPartial = "";
            holdOpen = true;
            JarvisListenAudio.hold(getContext());
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                finishListen("", false, "Spracherkennung fehlt auf diesem Gerät.", null);
                return;
            }
            beginListening();
        });
    }

    private void ensureRecognizer() {
        if (recognizer != null) return;
        recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onError(int error) {
                if (listenCall == null || !holdOpen) return;
                String keep = lastPartial == null ? "" : lastPartial.trim();
                if (!keep.isEmpty() && (error == SpeechRecognizer.ERROR_NO_MATCH
                        || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)) {
                    finishListen(keep, true, "", null);
                    return;
                }
                if (isSoftListenError(error)) {
                    if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                            || error == SpeechRecognizer.ERROR_CLIENT) {
                        dropRecognizer();
                    }
                    scheduleRestart(error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ? 280 : 90);
                    return;
                }
                finishListen("", false, "Zuhören unterbrochen.", null);
            }
            @Override
            public void onResults(Bundle results) {
                if (listenCall == null) return;
                ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                String text = list != null && !list.isEmpty() ? list.get(0) : "";
                if (text == null) text = "";
                text = text.trim();
                if (text.isEmpty() && lastPartial != null) text = lastPartial.trim();
                if (text.isEmpty() && holdOpen) {
                    scheduleRestart(90);
                    return;
                }
                finishListen(text, true, "", list);
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

    private boolean isSoftListenError(int error) {
        return error == SpeechRecognizer.ERROR_NO_MATCH
                || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                || error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                || error == SpeechRecognizer.ERROR_CLIENT
                || error == SpeechRecognizer.ERROR_NETWORK
                || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT
                || error == SpeechRecognizer.ERROR_AUDIO;
    }

    private void scheduleRestart(int delayMs) {
        if (!holdOpen || listenCall == null) return;
        main.removeCallbacks(restartListen);
        main.postDelayed(restartListen, Math.max(60, delayMs));
    }

    private void beginListening() {
        if (!holdOpen || listenCall == null) return;
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            finishListen("", false, "Spracherkennung fehlt auf diesem Gerät.", null);
            return;
        }
        ensureRecognizer();
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE");
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "de-DE");
        intent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1600L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 900L);
        try {
            recognizer.startListening(intent);
        } catch (Exception e) {
            dropRecognizer();
            scheduleRestart(220);
        }
    }

    private void dropRecognizer() {
        main.removeCallbacks(restartListen);
        if (recognizer == null) return;
        try {
            recognizer.cancel();
        } catch (Exception ignored) {
        }
        try {
            recognizer.destroy();
        } catch (Exception ignored) {
        }
        recognizer = null;
    }

    private void finishListen(String text, boolean ok, String message, ArrayList<String> alts) {
        holdOpen = false;
        main.removeCallbacks(restartListen);
        JarvisListenAudio.release(getContext());
        PluginCall c = listenCall;
        listenCall = null;
        if (c == null) {
            main.postDelayed(() -> JarvisWakeService.resumeListen(getContext()), 400);
            return;
        }
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
        main.postDelayed(() -> JarvisWakeService.resumeListen(getContext()), 400);
    }

    @PluginMethod
    public void stopListen(PluginCall call) {
        main.post(() -> {
            holdOpen = false;
            main.removeCallbacks(restartListen);
            dropRecognizer();
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
                @Override public void onDone(String utteranceId) { finishSpeak(true); }
                @Override public void onError(String utteranceId) { finishSpeak(false); }
            });
            tts.setSpeechRate(0.94f);
            tts.setPitch(0.90f);
            applyVoiceGender(gender);
            Bundle params = new Bundle();
            int queued = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "jarvis-voice");
            if (queued == TextToSpeech.ERROR) {
                finishSpeak(false);
                return;
            }
            main.postDelayed(() -> {
                if (speakGen != gen) return;
                finishSpeak(true);
            }, 20_000);
        });
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
            finishSpeak(true);
        });
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
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
                b.addHeader("x-goog-api-key", apiKey);
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
}
