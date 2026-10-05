package app.jarvis.notify;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import app.jarvis.voice.JarvisWakeService;

/**
 * Klingeln unabhängig vom Vordergrunddienst. Stirbt der Dienst (Android 15
 * mediaPlayback ohne Session), bleibt der Ton solange der Prozess lebt —
 * vor allem auf dem Wecker-Bildschirm.
 */
public final class JarvisAlarmPlayer {
    private static final Handler MAIN = new Handler(Looper.getMainLooper());
    private static MediaPlayer player;
    private static Ringtone ringtone;
    private static ToneGenerator tones;
    private static Vibrator vibrator;
    private static AudioManager audio;
    private static AudioFocusRequest focusReq;
    private static Context app;
    private static boolean wanted;

    private static final Runnable BEEP = new Runnable() {
        @Override
        public void run() {
            if (!wanted || tones == null) return;
            try {
                tones.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 700);
            } catch (Exception ignored) {
            }
            MAIN.postDelayed(this, 1100);
        }
    };

    private static final Runnable WATCHDOG = () -> recover();

    private JarvisAlarmPlayer() {}

    public static synchronized void start(Context ctx, String tone) {
        if (ctx == null) return;
        app = ctx.getApplicationContext();
        wanted = true;
        releaseQuiet();
        MAIN.removeCallbacks(WATCHDOG);
        MAIN.removeCallbacks(BEEP);
        ensureAlarmVolume(app);
        requestFocus(app);
        Uri custom = parseTone(app, tone);
        boolean ok = playUri(app, custom)
                || playRaw(app)
                || playUri(app, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
                || playUri(app, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
                || playUri(app, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                || playRingtone(app);
        if (!ok) startBeepLoop();
        vibrate(app);
        MAIN.postDelayed(WATCHDOG, 600);
    }

    private static synchronized void recover() {
        if (!wanted) return;
        if (isPlaying()) return;
        if (app == null) return;
        if (!playRaw(app)) startBeepLoop();
        vibrate(app);
    }

    public static synchronized void stop() {
        wanted = false;
        MAIN.removeCallbacks(WATCHDOG);
        MAIN.removeCallbacks(BEEP);
        releaseQuiet();
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
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {
            }
            vibrator = null;
        }
        if (app != null) JarvisWakeService.resumeListen(app);
    }

    public static synchronized boolean isPlaying() {
        try {
            if (player != null && player.isPlaying()) return true;
        } catch (Exception ignored) {
        }
        try {
            if (ringtone != null && ringtone.isPlaying()) return true;
        } catch (Exception ignored) {
        }
        return tones != null;
    }

    static AudioAttributes alarmAttrs() {
        AudioAttributes.Builder b = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION);
        if (Build.VERSION.SDK_INT >= 21) {
            b.setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED);
        }
        return b.build();
    }

    private static Uri parseTone(Context ctx, String tone) {
        if (tone != null && !tone.isEmpty()) return Uri.parse(tone);
        String saved = ctx.getSharedPreferences("jarvis_notify", Context.MODE_PRIVATE)
                .getString("alarm_tone", "");
        if (saved != null && !saved.isEmpty()) return Uri.parse(saved);
        return null;
    }

    private static void ensureAlarmVolume(Context ctx) {
        try {
            audio = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (audio == null) return;
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            if (max <= 0) return;
            int want = Math.max(1, (max * 3) / 4);
            if (audio.getStreamVolume(AudioManager.STREAM_ALARM) < want) {
                audio.setStreamVolume(AudioManager.STREAM_ALARM, want, 0);
            }
        } catch (Exception ignored) {
        }
    }

    private static void requestFocus(Context ctx) {
        try {
            if (audio == null) audio = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (audio == null) return;
            if (Build.VERSION.SDK_INT >= 26) {
                focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(alarmAttrs())
                        .build();
                audio.requestAudioFocus(focusReq);
            } else {
                audio.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
            }
        } catch (Exception ignored) {
        }
    }

    private static boolean playUri(Context ctx, Uri uri) {
        if (uri == null) return false;
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(alarmAttrs());
            mp.setWakeMode(ctx, PowerManager.PARTIAL_WAKE_LOCK);
            mp.setDataSource(ctx, uri);
            mp.setLooping(true);
            mp.setVolume(1f, 1f);
            mp.setOnErrorListener((p, w, extra) -> {
                releasePlayer();
                MAIN.post(WATCHDOG);
                return true;
            });
            mp.prepare();
            mp.start();
            if (mp.isPlaying()) {
                player = mp;
                return true;
            }
        } catch (Exception ignored) {
        }
        try {
            mp.release();
        } catch (Exception ignored) {
        }
        return false;
    }

    private static boolean playRaw(Context ctx) {
        int resId = ctx.getResources().getIdentifier("jarvis_alarm", "raw", ctx.getPackageName());
        if (resId == 0) return false;
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(alarmAttrs());
            mp.setWakeMode(ctx, PowerManager.PARTIAL_WAKE_LOCK);
            android.content.res.AssetFileDescriptor afd = ctx.getResources().openRawResourceFd(resId);
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setLooping(true);
            mp.setVolume(1f, 1f);
            mp.prepare();
            mp.start();
            if (mp.isPlaying()) {
                player = mp;
                return true;
            }
        } catch (Exception ignored) {
        }
        try {
            mp.release();
        } catch (Exception ignored) {
        }
        return false;
    }

    private static boolean playRingtone(Context ctx) {
        try {
            ringtone = RingtoneManager.getRingtone(
                    ctx, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
            if (ringtone == null) return false;
            if (Build.VERSION.SDK_INT >= 21) ringtone.setAudioAttributes(alarmAttrs());
            if (Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
            ringtone.play();
            return ringtone.isPlaying();
        } catch (Exception ignored) {
            ringtone = null;
            return false;
        }
    }

    private static void startBeepLoop() {
        try {
            tones = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            MAIN.post(BEEP);
        } catch (Exception ignored) {
            try {
                tones = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);
                MAIN.post(BEEP);
            } catch (Exception ignored2) {
                tones = null;
            }
        }
    }

    private static void vibrate(Context ctx) {
        try {
            vibrator = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator == null || !vibrator.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 400}, 0));
            } else {
                vibrator.vibrate(new long[]{0, 500, 400}, 0);
            }
        } catch (Exception ignored) {
        }
    }

    private static void releaseQuiet() {
        MAIN.removeCallbacks(BEEP);
        releasePlayer();
        if (ringtone != null) {
            try {
                ringtone.stop();
            } catch (Exception ignored) {
            }
            ringtone = null;
        }
        if (tones != null) {
            try {
                tones.release();
            } catch (Exception ignored) {
            }
            tones = null;
        }
    }

    private static void releasePlayer() {
        if (player != null) {
            try {
                player.stop();
            } catch (Exception ignored) {
            }
            try {
                player.release();
            } catch (Exception ignored) {
            }
            player = null;
        }
    }
}
