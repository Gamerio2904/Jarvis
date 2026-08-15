package app.jarvis.notify;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class JarvisNotifyBoot extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String a = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(a)) {
            JarvisNotifyPlugin.restoreAll(context);
        }
    }
}
