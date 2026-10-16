package app.jarvis.fenster;

import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;

/**
 * Die Kopplung läuft, solange die Fläche vorn ist. Keine dauerhafte
 * WLAN-Meldung. Eine schon gezeigte Zeile wird entfernt.
 */
public class JarvisFensterService extends Service {

    private static final int NOTE_ID = 1879200;

    public static void start(Context ctx) {
        dismiss(ctx);
    }

    public static void dismiss(Context ctx) {
        if (ctx == null) return;
        try {
            ctx.stopService(new Intent(ctx, JarvisFensterService.class));
        } catch (Exception ignored) {
            /* Der Dienst war nicht gestartet. */
        }
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTE_ID);
        } catch (Exception ignored) {
            /* Keine Meldung mehr offen. */
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        dismiss(this);
        stopSelf();
        return START_NOT_STICKY;
    }
}
