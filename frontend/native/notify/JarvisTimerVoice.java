package app.jarvis.notify;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.Locale;

/** Timer-Ablauf: Jarvis spricht auf dem Alarm-Kanal, kein Klingeln. */
public final class JarvisTimerVoice {
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static TextToSpeech tts;
    private static String pending;
    private static AudioManager audio;
    private static AudioFocusRequest focusReq;
    private static boolean ready;

    private JarvisTimerVoice() {}

    public static void speak(Context ctx, String text) {
        if (ctx == null) return;
        String line = text == null ? "" : text.trim();
        if (line.isEmpty()) line = "Die Zeit ist um.";
        pending = line;
        Context app = ctx.getApplicationContext();
        MAIN.post(() -> startOnMain(app, line));
    }

    public static void stop() {
        pending = null;
        MAIN.post(() -> {
            try {
                if (tts != null) tts.stop();
            } catch (Exception ignored) {
            }
            dropFocus();
        });
    }

    private static void startOnMain(Context app, String line) {
        bumpAlarmVolume(app);
        takeFocus(app);
        if (tts == null) {
            ready = false;
            tts = new TextToSpeech(app, status -> {
                if (status != TextToSpeech.SUCCESS) {
                    tts = null;
                    ready = false;
                    return;
                }
                try {
                    int lang = tts.setLanguage(Locale.GERMANY);
                    if (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts.setLanguage(Locale.GERMAN);
                    }
                } catch (Exception ignored) {
                }
                if (Build.VERSION.SDK_INT >= 21) {
                    try {
                        tts.setAudioAttributes(alarmSpeech());
                    } catch (Exception ignored) {
                    }
                }
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String utteranceId) {}
                    @Override public void onDone(String utteranceId) {
                        MAIN.postDelayed(JarvisTimerVoice::dropFocus, 400);
                    }
                    @Override public void onError(String utteranceId) {
                        MAIN.postDelayed(JarvisTimerVoice::dropFocus, 400);
                    }
                });
                ready = true;
                flush(pending);
            });
            return;
        }
        if (ready) flush(line);
        else pending = line;
    }

    private static void flush(String line) {
        if (tts == null || line == null || line.isEmpty()) return;
        try {
            tts.stop();
        } catch (Exception ignored) {
        }
        try {
            if (Build.VERSION.SDK_INT >= 21) {
                Bundle b = new Bundle();
                b.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_ALARM);
                tts.speak(line, TextToSpeech.QUEUE_FLUSH, b, "jarvis-timer");
            } else {
                tts.speak(line, TextToSpeech.QUEUE_FLUSH, null);
            }
        } catch (Exception ignored) {
        }
    }

    private static AudioAttributes alarmSpeech() {
        AudioAttributes.Builder b = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH);
        if (Build.VERSION.SDK_INT >= 21) {
            b.setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED);
        }
        return b.build();
    }

    private static void bumpAlarmVolume(Context ctx) {
        try {
            audio = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (audio == null) return;
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            if (max <= 0) return;
            int want = Math.max(1, max / 2);
            if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < want) {
                audio.setStreamVolume(AudioManager.STREAM_ALARM, want, 0);
            }
        } catch (Exception ignored) {
        }
    }

    private static void takeFocus(Context ctx) {
        try {
            if (audio == null) audio = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (audio == null) return;
            if (Build.VERSION.SDK_INT >= 26) {
                focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(alarmSpeech())
                        .build();
                audio.requestAudioFocus(focusReq);
            } else {
                audio.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
            }
        } catch (Exception ignored) {
        }
    }

    private static void dropFocus() {
        try {
            if (audio != null) {
                if (Build.VERSION.SDK_INT >= 26 && focusReq != null) {
                    audio.abandonAudioFocusRequest(focusReq);
                } else {
                    audio.abandonAudioFocus(null);
                }
            }
        } catch (Exception ignored) {
        }
        focusReq = null;
    }
}
