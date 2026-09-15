package app.jarvis.notify;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class JarvisNotifyBoot extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String a = intent.getAction();
        boolean boot = Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(a);
        /**
         * Beim Ersetzen des Pakets streicht Android jeden Eintrag im
         * AlarmManager, den die App gesetzt hat. Gehorcht wurde vorher nur dem
         * Systemstart — also war nach jedem Update jeder Wecker und jede
         * Erinnerung still weg, während die Liste in den Einstellungen sie
         * weiter anzeigte. Ein Zeitzonenwechsel hat dieselbe Lücke.
         */
        boolean rearm = Intent.ACTION_MY_PACKAGE_REPLACED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a);
        if (!boot && !rearm) return;
        JarvisNotifyPlugin.restoreAll(context);
        /**
         * Das Wake-Wort darf hier nicht anlaufen. Ein Mikrofon-Dienst aus dem
         * Hintergrund ist unter Android 14 gesperrt und unter Android 15 beim
         * Systemstart ausdrücklich verboten — die Ausnahme aus onReceive nahm
         * die ganze App mit ("Jarvis wurde beendet"). Es wird beim nächsten
         * Öffnen der App wieder scharf gemacht.
         */
    }
}
