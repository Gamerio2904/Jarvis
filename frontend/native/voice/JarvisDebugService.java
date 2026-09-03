package app.jarvis.voice;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

/**
 * Holds the debug run while Home is pressed. Not the wake-word service.
 * Process kill still ends the run (START_NOT_STICKY).
 */
public class JarvisDebugService extends Service {
    public static final String ACTION_START = "app.jarvis.voice.DEBUG_START";
    public static final String ACTION_STOP = "app.jarvis.voice.DEBUG_STOP";
    public static final String ACTION_END = "app.jarvis.voice.DEBUG_END";
    public static final int NOTE_ID = 73;
    private static final String CHANNEL = "jarvis_debug";
    private static volatile boolean running = false;
    private PowerManager.WakeLock cpuLock;

    public static boolean isRunning() {
        return running;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            JarvisVoicePlugin.emitDebugStop();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_END.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        startFg();
        holdCpu();
        return START_NOT_STICKY;
    }

    private void startFg() {
        Notification n = note();
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTE_ID, n, 0);
        } else {
            startForeground(NOTE_ID, n);
        }
    }

    private void holdCpu() {
        if (cpuLock != null && cpuLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null) return;
        cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jarvis:debug");
        cpuLock.setReferenceCounted(false);
        cpuLock.acquire();
    }

    private Notification note() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                nm.createNotificationChannel(new NotificationChannel(
                        CHANNEL, "Debug-Lauf", NotificationManager.IMPORTANCE_LOW));
            }
        }
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open != null) {
            open.setAction(Intent.ACTION_VIEW);
            open.setData(Uri.parse("jarvis://voice"));
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(this, NOTE_ID, open, flags);

        Intent stopI = new Intent(this, JarvisDebugService.class);
        stopI.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 74, stopI, flags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_info_details)
                .setContentTitle("Jarvis testet…")
                .setContentText("Debug-Lauf. Home lässt ihn weiterlaufen. App schließen oder Stop beendet ihn.")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(0, "Stop", stopPi);
        if (pi != null) b.setContentIntent(pi);
        return b.build();
    }

    @Override
    public void onDestroy() {
        running = false;
        if (cpuLock != null && cpuLock.isHeld()) {
            try {
                cpuLock.release();
            } catch (Exception ignored) {
            }
        }
        cpuLock = null;
        super.onDestroy();
    }

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, JarvisDebugService.class);
        i.setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    public static void stop(Context ctx) {
        Intent i = new Intent(ctx, JarvisDebugService.class);
        i.setAction(ACTION_END);
        ctx.startService(i);
    }
}
