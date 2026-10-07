package app.jarvis.haus;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

/** Hält den Prozess am Leben, solange das Tablet der Hausstand-Server ist. */
public class JarvisHausService extends Service {

    private static final int NOTE_ID = 1879300;
    private static final String CHANNEL = "jarvis_haus_server";
    private PowerManager.WakeLock wake;
    private WifiManager.WifiLock wifi;

    public static void start(Context ctx) {
        if (ctx == null) return;
        Intent intent = new Intent(ctx, JarvisHausService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(intent);
            else ctx.startService(intent);
        } catch (Exception ignored) {
            /* Server läuft dann nur, solange die App vorn ist. */
        }
    }

    public static void stop(Context ctx) {
        if (ctx == null) return;
        try {
            ctx.stopService(new Intent(ctx, JarvisHausService.class));
        } catch (Exception ignored) {
            /* schon aus */
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification note = ongoing(this);
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NOTE_ID, note, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTE_ID, note);
            }
        } catch (Exception ignored) {
            stopSelf();
            return START_NOT_STICKY;
        }
        hold();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        release();
        super.onDestroy();
    }

    private void hold() {
        try {
            if (wake == null) {
                PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                if (pm != null) {
                    wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jarvis:haus");
                    wake.setReferenceCounted(false);
                }
            }
            if (wake != null && !wake.isHeld()) wake.acquire();
            if (wifi == null) {
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(WIFI_SERVICE);
                if (wm != null) {
                    wifi = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "jarvis:haus");
                    wifi.setReferenceCounted(false);
                }
            }
            if (wifi != null && !wifi.isHeld()) wifi.acquire();
        } catch (Exception ignored) {
            /* ohne Sperre bleibt der Server nur kürzer wach */
        }
    }

    private void release() {
        try {
            if (wake != null && wake.isHeld()) wake.release();
            if (wifi != null && wifi.isHeld()) wifi.release();
        } catch (Exception ignored) {
            /* */
        }
    }

    private static Notification ongoing(Context ctx) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(CHANNEL, "Hausstand-Server", NotificationManager.IMPORTANCE_MIN);
                channel.setDescription("Das Tablet hält den Hausstand für das Handy bereit.");
                channel.setSound(null, null);
                nm.createNotificationChannel(channel);
            }
        }
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent tap = null;
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
            tap = PendingIntent.getActivity(ctx, NOTE_ID, launch, flags);
        }
        return new NotificationCompat.Builder(ctx, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Ultron Tablet")
                .setContentText("Hausstand-Server aktiv.")
                .setOngoing(true)
                .setContentIntent(tap)
                .build();
    }
}
