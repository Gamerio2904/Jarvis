package app.jarvis.fenster;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

/**
 * Hält die Kopplung, wenn die Fläche zu ist. Die Meldung der Anfrage
 * kommt extra. Diese Zeile bleibt leise, solange niemand koppelt.
 */
public class JarvisFensterService extends Service {

    private static final int NOTE_ID = 1879200;
    private static final String CHANNEL = "jarvis_fenster";

    public static void start(Context ctx) {
        if (ctx == null) return;
        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        Intent intent = new Intent(ctx, JarvisFensterService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(intent);
            else ctx.startService(intent);
        } catch (Exception ignored) {
            try {
                ctx.startService(intent);
            } catch (Exception nested) {
                /* Der Prozess hört nur, solange die Fläche vorn ist. */
            }
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
        JarvisFensterPlugin.hold(this);
        return START_STICKY;
    }

    private static Notification ongoing(Context ctx) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(CHANNEL, "Kopplung", NotificationManager.IMPORTANCE_MIN);
                channel.setDescription("Ultron hört im WLAN auf eine Kopplung.");
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
                .setContentTitle("Ultron")
                .setContentText("Hört im WLAN auf eine Kopplung.")
                .setOngoing(true)
                .setSilent(true)
                .setContentIntent(tap)
                .build();
    }
}
