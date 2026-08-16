package local.jarvis.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

import app.jarvis.geo.JarvisGeoPlugin;
import app.jarvis.notify.JarvisNotifyPlugin;
import app.jarvis.tv.JarvisTvPlugin;
import app.jarvis.voice.JarvisVoicePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(JarvisTvPlugin.class);
        registerPlugin(JarvisNotifyPlugin.class);
        registerPlugin(JarvisGeoPlugin.class);
        registerPlugin(JarvisVoicePlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(android.graphics.Color.parseColor("#121212"));
        }
        applyVoiceLaunch(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        applyVoiceLaunch(intent);
    }

    private void applyVoiceLaunch(Intent intent) {
        boolean voice = false;
        if (intent != null) {
            android.net.Uri data = intent.getData();
            String extra = intent.getStringExtra("jarvis_mode");
            voice = "voice".equals(extra)
                    || (data != null && "voice".equals(data.getHost()));
        }
        if (!voice) return;
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
    }
}
