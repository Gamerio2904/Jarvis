package app.jarvis.notify;

import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.Locale;

/** Timer-Ablauf: Jarvis spricht, kein Klingeln. */
public final class JarvisTimerVoice {
    private static TextToSpeech tts;
    private static String pending;

    private JarvisTimerVoice() {}

    public static void speak(Context ctx, String text) {
        String line = text == null ? "" : text.trim();
        if (line.isEmpty()) line = "Timer abgelaufen, Sie.";
        pending = line;
        Context app = ctx.getApplicationContext();
        if (tts == null) {
            tts = new TextToSpeech(app, status -> {
                if (status != TextToSpeech.SUCCESS) return;
                try {
                    tts.setLanguage(Locale.GERMAN);
                } catch (Exception ignored) {
                }
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) {}
                    @Override public void onDone(String utteranceId) {
                        releaseSoon();
                    }
                    @Override public void onError(String utteranceId) {
                        releaseSoon();
                    }
                });
                flush(pending);
            });
            return;
        }
        flush(line);
    }

    private static void flush(String line) {
        if (tts == null || line == null || line.isEmpty()) return;
        try {
            tts.stop();
        } catch (Exception ignored) {
        }
        if (Build.VERSION.SDK_INT >= 21) {
            tts.speak(line, TextToSpeech.QUEUE_FLUSH, null, "jarvis-timer");
        } else {
            tts.speak(line, TextToSpeech.QUEUE_FLUSH, null);
        }
    }

    private static void releaseSoon() {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (tts == null) return;
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {
            }
            tts = null;
        }, 400);
    }
}
