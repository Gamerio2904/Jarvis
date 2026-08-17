package app.jarvis.notify;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
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
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import androidx.core.app.NotificationCompat;

import app.jarvis.voice.JarvisWakeService;

public class JarvisAlarmService extends Service {
    public static final String ACTION_START = "app.jarvis.notify.ALARM_START";
    public static final String ACTION_STOP = "app.jarvis.notify.ALARM_STOP";
    static final int NOTE_ID = 72;
    private static final String CHANNEL = "jarvis_alarms_v3";

    private MediaPlayer player;
    private Ringtone ringtone;
    private ToneGenerator tones;
    private Vibrator vibrator;
    private PowerManager.WakeLock cpuLock;
    private AudioManager audio;
    private AudioFocusRequest focusReq;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Runnable beep = new Runnable() {
        @Override
        public void run() {
            if (tones == null) return;
            try {
                tones.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 700);
            } catch (Exception ignored) {
            }
            main.postDelayed(this, 1200);
        }
    };

    public static void start(Context ctx, String title, String body, String tone) {
        Intent i = new Intent(ctx, JarvisAlarmService.class);
        i.setAction(ACTION_START);
        i.putExtra("title", title);
        i.putExtra("body", body);
        i.putExtra("tone", tone == null ? "" : tone);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    public static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, JarvisAlarmService.class));
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        String title = intent != null ? intent.getStringExtra("title") : null;
        String body = intent != null ? intent.getStringExtra("body") : null;
        String tone = intent != null ? intent.getStringExtra("tone") : null;
        if (title == null || title.isEmpty()) title = "Jarvis";
        if (body == null) body = "";
        try {
            startFg(title, body);
        } catch (Exception ignored) {
        }
        holdCpu();
        JarvisWakeService.pauseListen();
        startSound(tone);
        return START_STICKY;
    }

    private void startFg(String title, String body) {
        ensureChannel();
        Intent open = new Intent(this, JarvisAlarmActivity.class);
        open.putExtra("title", title);
        open.putExtra("body", body);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent fullPi = PendingIntent.getActivity(this, 72_001, open, flags);
        Intent halt = new Intent(this, JarvisAlarmService.class);
        halt.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 72_002, halt, flags);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setSilent(true)
                .setFullScreenIntent(fullPi, true)
                .setContentIntent(fullPi)
                .addAction(0, "Aus", stopPi)
                .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTE_ID, n);
        }
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        try {
            nm.deleteNotificationChannel("jarvis_alarms");
        } catch (Exception ignored) {
        }
        try {
            nm.deleteNotificationChannel("jarvis_alarms_v2");
        } catch (Exception ignored) {
        }
        if (nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel alarm = new NotificationChannel(
                CHANNEL,
                "Wecker",
                NotificationManager.IMPORTANCE_HIGH
        );
        alarm.setDescription("Timer und Wecker mit Ton, auch bei Bildschirm aus");
        alarm.setBypassDnd(true);
        alarm.enableVibration(true);
        alarm.setSound(null, null);
        nm.createNotificationChannel(alarm);
    }

    private void holdCpu() {
        if (cpuLock != null && cpuLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null) return;
        cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jarvis:alarm");
        cpuLock.setReferenceCounted(false);
        cpuLock.acquire(30 * 60 * 1000L);
    }

    private void startSound(String tone) {
        releasePlayer();
        if (ringtone != null) {
            try {
                ringtone.stop();
            } catch (Exception ignored) {
            }
            ringtone = null;
        }
        main.removeCallbacks(beep);
        if (tones != null) {
            try {
                tones.release();
            } catch (Exception ignored) {
            }
            tones = null;
        }
        ensureAlarmVolume();
        requestFocus();
        Uri custom = null;
        if (tone != null && !tone.isEmpty()) custom = Uri.parse(tone);
        if (custom == null) {
            String saved = getSharedPreferences("jarvis_notify", MODE_PRIVATE).getString("alarm_tone", "");
            if (saved != null && !saved.isEmpty()) custom = Uri.parse(saved);
        }
        boolean ok = playUri(custom) || playRaw()
                || playUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
                || playRingtone();
        if (!ok) startBeepLoop();
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 400}, 0));
            } else {
                vibrator.vibrate(new long[]{0, 500, 400}, 0);
            }
        }
    }

    private void ensureAlarmVolume() {
        try {
            audio = (AudioManager) getSystemService(AUDIO_SERVICE);
            if (audio == null) return;
            int max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            if (max <= 0) return;
            int cur = audio.getStreamVolume(AudioManager.STREAM_ALARM);
            if (cur < Math.max(1, max / 2)) {
                audio.setStreamVolume(AudioManager.STREAM_ALARM, Math.max(1, (max * 3) / 4), 0);
            }
        } catch (Exception ignored) {
        }
    }

    private void requestFocus() {
        try {
            if (audio == null) audio = (AudioManager) getSystemService(AUDIO_SERVICE);
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

    private static AudioAttributes alarmAttrs() {
        return new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
    }

    private boolean playUri(Uri uri) {
        if (uri == null) return false;
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(alarmAttrs());
            mp.setDataSource(this, uri);
            mp.setLooping(true);
            mp.setVolume(1f, 1f);
            mp.setOnErrorListener((p, w, extra) -> {
                releasePlayer();
                if (!playRaw()) startBeepLoop();
                return true;
            });
            mp.prepare();
            mp.start();
            player = mp;
            return true;
        } catch (Exception ignored) {
        }
        try {
            mp.release();
        } catch (Exception ignored) {
        }
        return false;
    }

    private boolean playRaw() {
        int resId = getResources().getIdentifier("jarvis_alarm", "raw", getPackageName());
        if (resId == 0) return false;
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(alarmAttrs());
            android.content.res.AssetFileDescriptor afd = getResources().openRawResourceFd(resId);
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setLooping(true);
            mp.setVolume(1f, 1f);
            mp.prepare();
            mp.start();
            player = mp;
            return true;
        } catch (Exception ignored) {
        }
        try {
            mp.release();
        } catch (Exception ignored) {
        }
        return false;
    }

    private boolean playRingtone() {
        try {
            ringtone = RingtoneManager.getRingtone(
                    this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
            if (ringtone == null) return false;
            if (Build.VERSION.SDK_INT >= 21) ringtone.setAudioAttributes(alarmAttrs());
            if (Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
            ringtone.play();
            return true;
        } catch (Exception ignored) {
            ringtone = null;
            return false;
        }
    }

    private void startBeepLoop() {
        try {
            tones = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            main.post(beep);
        } catch (Exception ignored) {
        }
    }

    private void releasePlayer() {
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

    @Override
    public void onDestroy() {
        main.removeCallbacks(beep);
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
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {
            }
        }
        try {
            if (audio != null) {
                if (Build.VERSION.SDK_INT >= 26 && focusReq != null) audio.abandonAudioFocusRequest(focusReq);
                else audio.abandonAudioFocus(null);
            }
        } catch (Exception ignored) {
        }
        if (cpuLock != null && cpuLock.isHeld()) {
            try {
                cpuLock.release();
            } catch (Exception ignored) {
            }
        }
        JarvisWakeService.resumeListen(this);
        super.onDestroy();
    }
}
