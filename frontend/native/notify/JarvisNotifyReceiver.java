package app.jarvis.notify;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;

public class JarvisNotifyReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        final PendingResult async = goAsync();
        int id = intent.getIntExtra("id", 0);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        boolean alarm = intent.getBooleanExtra("alarm", true);
        String recur = intent.getStringExtra("recur");
        String tone = intent.getStringExtra("tone");
        try {
            JarvisNotifyPlugin.show(
                    context,
                    id,
                    title,
                    body,
                    alarm,
                    recur == null ? "" : recur,
                    tone == null ? "" : tone);
        } finally {
            new Handler(Looper.getMainLooper()).postDelayed(async::finish, 2500);
        }
    }
}
