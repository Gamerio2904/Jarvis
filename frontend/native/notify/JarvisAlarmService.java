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
import android.media.RingtoneManager;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

import app.jarvis.voice.JarvisWakeService;

public class JarvisAlarmService extends Service {
    public static final String ACTION_START = "app.jarvis.notify.ALARM_START";
    public static final String ACTION_STOP = "app.jarvis.notify.ALARM_STOP";
    static final int NOTE_ID = 72;
    private static final String CHANNEL = "jarvis_alarms_v4";
    private static final String TIMER_CHANNEL = "jarvis_timer_speak_v1";

    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private PowerManager.WakeLock cpuLock;
    private MediaSession session;

    public static void start(Context ctx, String title, String body, String tone) {
        start(ctx, title, body, tone, "", "");
    }

    public static void start(Context ctx, String title, String body, String tone, String mode, String say) {
        Intent i = new Intent(ctx, JarvisAlarmService.class);
        i.setAction(ACTION_START);
        i.putExtra("title", title);
        i.putExtra("body", body);
        i.putExtra("tone", tone == null ? "" : tone);
        i.putExtra("mode", mode == null ? "" : mode);
        i.putExtra("say", say == null ? "" : say);
        try {
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
            else ctx.startService(i);
        } catch (Exception ignored) {
            try {
                ctx.startService(i);
            } catch (Exception ignored2) {
            }
        }
    }

    public static void stop(Context ctx) {
        Intent i = new Intent(ctx, JarvisAlarmService.class);
        i.setAction(ACTION_STOP);
        try {
            ctx.startService(i);
        } catch (Exception ignored) {
        }
        try {
            ctx.stopService(new Intent(ctx, JarvisAlarmService.class));
        } catch (Exception ignored) {
        }
        JarvisAlarmPlayer.stop();
        JarvisTimerVoice.stop();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        /**
         * Ohne Intent ist nichts zu tun. Der Dienst lief vorher als
         * START_STICKY, wurde nach einem Speicherengpass mit null neu gestartet
         * und klingelte dann Stunden später mit den Standardwerten los — ein
         * Wecker, den nie jemand gestellt hatte. Die Quelle der Wahrheit ist
         * der AlarmManager, hier gibt es keinen Zustand zu retten.
         */
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_STOP.equals(intent.getAction())) {
            JarvisAlarmPlayer.stop();
            JarvisTimerVoice.stop();
            stopSelf();
            return START_NOT_STICKY;
        }
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String tone = intent.getStringExtra("tone");
        String mode = intent.getStringExtra("mode");
        String say = intent.getStringExtra("say");
        if (title == null || title.isEmpty()) title = "Jarvis";
        if (body == null) body = "";
        boolean speak = JarvisNotifyPlugin.isTimerSpeak(mode, title);
        if (speak) {
            mode = "speak";
            tone = "";
            if (say == null || say.isEmpty()) say = JarvisNotifyPlugin.timerSpokenLine(body);
        }
        startFg(title, body, tone, mode, say, speak);
        holdCpu();
        holdSession();
        JarvisWakeService.pauseListen();
        if (speak) {
            /**
             * Nach dem gesprochenen Satz blieb der Dienst stehen: Meldung nicht
             * wegwischbar, Wake-Lock bis zum 30-Minuten-Timeout. Jetzt beendet
             * er sich selbst — mit Rückfallfrist, falls die Sprachausgabe nie
             * „fertig" meldet.
             */
            JarvisTimerVoice.speak(this, say, this::stopSelf);
            MAIN.postDelayed(this::stopSelf, 20_000L);
        } else {
            JarvisAlarmPlayer.start(this, tone);
        }
        return START_NOT_STICKY;
    }

    private void startFg(String title, String body, String tone, String mode, String say, boolean speak) {
        ensureChannel();
        Intent open = new Intent(this, JarvisAlarmActivity.class);
        open.putExtra("title", title);
        open.putExtra("body", body);
        open.putExtra("tone", speak ? "" : (tone == null ? "" : tone));
        open.putExtra("mode", speak ? "speak" : (mode == null ? "" : mode));
        open.putExtra("say", say == null ? "" : say);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent fullPi = PendingIntent.getActivity(this, 72_001, open, flags);
        Intent halt = new Intent(this, JarvisAlarmService.class);
        halt.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 72_002, halt, flags);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, speak ? TIMER_CHANNEL : CHANNEL)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(speak && body != null && !body.isEmpty() && !"Timer".equalsIgnoreCase(body) ? body : title)
                .setContentText(speak && say != null && !say.isEmpty() ? say : body)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                // Ein gesprochener Timer ist nach dem Satz vorbei — die Meldung
                // muss sich wegwischen lassen, statt in der Leiste zu kleben.
                .setOngoing(!speak)
                .setAutoCancel(speak)
                .setSilent(true)
                .setFullScreenIntent(fullPi, true)
                .setContentIntent(fullPi)
                .addAction(0, "Aus", stopPi);
        if (speak) b.setTimeoutAfter(60_000L);
        Notification n = b.build();
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(
                        NOTE_ID,
                        n,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                                | ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTE_ID, n);
            }
        } catch (Exception first) {
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTE_ID, n);
                }
            } catch (Exception ignored) {
                try {
                    startForeground(NOTE_ID, n);
                } catch (Exception ignored2) {
                    /**
                     * Ein mit startForegroundService gestarteter Dienst, der es
                     * nie in den Vordergrund schafft, wird nach etwa fünf
                     * Sekunden mit einer RemoteServiceException erschlagen — das
                     * reißt die App mit. Lieber gleich geordnet aufhören.
                     */
                    JarvisAlarmPlayer.stop();
                    JarvisTimerVoice.stop();
                    stopSelf();
                }
            }
        }
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        for (String old : new String[]{"jarvis_alarms", "jarvis_alarms_v2", "jarvis_alarms_v3"}) {
            try {
                nm.deleteNotificationChannel(old);
            } catch (Exception ignored) {
            }
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
        alarm.enableLights(true);
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        AudioAttributes attrs = JarvisAlarmPlayer.alarmAttrs();
        if (sound != null) alarm.setSound(sound, attrs);
        nm.createNotificationChannel(alarm);
        NotificationChannel timer = new NotificationChannel(
                TIMER_CHANNEL,
                "Timer",
                NotificationManager.IMPORTANCE_HIGH
        );
        timer.setDescription("Jarvis sagt die Zeit an, ohne Klingeln");
        timer.setBypassDnd(true);
        timer.enableVibration(false);
        timer.enableLights(true);
        timer.setSound(null, null);
        nm.createNotificationChannel(timer);
    }

    private void holdCpu() {
        if (cpuLock != null && cpuLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null) return;
        cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jarvis:alarm");
        cpuLock.setReferenceCounted(false);
        cpuLock.acquire(30 * 60 * 1000L);
    }

    private void holdSession() {
        if (session != null) return;
        try {
            session = new MediaSession(this, "jarvis-alarm");
            session.setActive(true);
            session.setPlaybackState(new PlaybackState.Builder()
                    .setState(PlaybackState.STATE_PLAYING, 0, 1f)
                    .build());
        } catch (Exception ignored) {
            session = null;
        }
    }

    @Override
    public void onDestroy() {
        MAIN.removeCallbacksAndMessages(null);
        if (session != null) {
            try {
                session.setActive(false);
                session.release();
            } catch (Exception ignored) {
            }
            session = null;
        }
        if (cpuLock != null && cpuLock.isHeld()) {
            try {
                cpuLock.release();
            } catch (Exception ignored) {
            }
        }
        cpuLock = null;
        if (!JarvisAlarmPlayer.isPlaying()) {
            JarvisWakeService.resumeListen(this);
        }
        super.onDestroy();
    }
}
