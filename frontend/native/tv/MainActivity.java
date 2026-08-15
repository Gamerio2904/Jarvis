package local.jarvis.app;

import android.content.Intent;
import android.os.Bundle;

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
            getBridge().getWebView().setKeepScreenOn(true);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }
}
