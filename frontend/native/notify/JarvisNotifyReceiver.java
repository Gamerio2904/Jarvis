package app.jarvis.notify;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class JarvisNotifyReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        int id = intent.getIntExtra("id", 0);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        boolean alarm = intent.getBooleanExtra("alarm", true);
        String recur = intent.getStringExtra("recur");
        String tone = intent.getStringExtra("tone");
        JarvisNotifyPlugin.show(
                context,
                id,
                title,
                body,
                alarm,
                recur == null ? "" : recur,
                tone == null ? "" : tone);
    }
}
