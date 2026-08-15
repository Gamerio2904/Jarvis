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
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService io = Executors.newCachedThreadPool();
    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .build();
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    @Override
    public void load() {
        main.post(() -> {
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    tts.setLanguage(Locale.GERMANY);
                    tts.setSpeechRate(0.94f);
                    tts.setPitch(0.96f);
                    pickGermanVoice();
                }
            });
        });
    }

    @Override
    protected void handleOnDestroy() {
        main.post(() -> {
            if (recognizer != null) {
                recognizer.destroy();
                recognizer = null;
            }
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
                if (name.contains("pico")) s -= 8;
                if (name.contains("google")) s += 4;
                if (name.contains("neural") || name.contains("wavenet") || name.contains("network")) s += 3;
                if (v.getQuality() >= Voice.QUALITY_HIGH) s += 2;
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
                finishListen("", false, "schon am Zuhören");
            }
            listenCall = call;
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                finishListen("", false, "Spracherkennung fehlt auf diesem Gerät.");
                return;
            }
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(new RecognitionListener() {
                    @Override public void onReadyForSpeech(Bundle params) {}
                    @Override public void onBeginningOfSpeech() {}
                    @Override public void onRmsChanged(float rmsdB) {}
                    @Override public void onBufferReceived(byte[] buffer) {}
                    @Override public void onEndOfSpeech() {}
                    @Override public void onError(int error) {
                        if (error == SpeechRecognizer.ERROR_NO_MATCH
                                || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                            finishListen("", true, "");
                            return;
                        }
                        finishListen("", false, "Zuhören unterbrochen.");
                    }
                    @Override
                    public void onResults(Bundle results) {
                        ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        String text = list != null && !list.isEmpty() ? list.get(0) : "";
                        finishListen(text, true, "");
                    }
                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        ArrayList<String> list = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (list == null || list.isEmpty()) return;
                        JSObject ev = new JSObject();
                        ev.put("text", list.get(0));
                        notifyListeners("partial", ev);
                    }
                    @Override public void onEvent(int eventType, Bundle params) {}
                });
            }
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE");
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 380L);
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 380L);
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 350L);
            try {
                recognizer.startListening(intent);
            } catch (Exception e) {
                finishListen("", false, "Zuhören fehlgeschlagen.");
            }
        });
    }

    private void finishListen(String text, boolean ok, String message) {
        PluginCall c = listenCall;
        listenCall = null;
        if (c == null) return;
        JSObject r = new JSObject();
        r.put("ok", ok);
        r.put("text", text == null ? "" : text);
        if (message != null && !message.isEmpty()) r.put("message", message);
        c.resolve(r);
    }

    @PluginMethod
    public void stopListen(PluginCall call) {
        main.post(() -> {
            if (recognizer != null) {
                try { recognizer.cancel(); } catch (Exception ignored) {}
            }
            finishListen("", true, "");
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
        main.post(() -> {
            if (tts == null || !ttsReady) {
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
            Bundle params = new Bundle();
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "jarvis-voice");
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
        io.execute(() -> {
            Request.Builder b = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(body == null ? "{}" : body, JSON))
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Accept", "text/event-stream");
            if (apiKey != null && !apiKey.isEmpty()) {
                b.addHeader("x-goog-api-key", apiKey);
            }
            try (Response res = http.newCall(b.build()).execute()) {
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

    @PluginMethod
    public void consumeLaunch(PluginCall call) {
        Activity a = getActivity();
        boolean voice = false;
        if (a != null) {
            Intent i = a.getIntent();
            if (i != null) {
                Uri data = i.getData();
                String extra = i.getStringExtra("jarvis_mode");
                voice = (data != null && "voice".equals(data.getHost()))
                        || "voice".equals(extra)
                        || (data != null && String.valueOf(data).contains("voice"));
                if (voice) {
                    i.setData(null);
                    i.removeExtra("jarvis_mode");
                    a.setIntent(i);
                }
            }
        }
        JSObject r = new JSObject();
        r.put("voice", voice);
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
}
