package local.jarvis.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import app.jarvis.device.JarvisDevicePlugin;
import app.jarvis.geo.JarvisGeoPlugin;
import app.jarvis.home.JarvisHomePlugin;
import app.jarvis.notify.JarvisNotifyPlugin;
import app.jarvis.tv.JarvisTvPlugin;
import app.jarvis.voice.JarvisDebugService;
import app.jarvis.voice.JarvisVoicePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(JarvisTvPlugin.class);
        registerPlugin(JarvisNotifyPlugin.class);
        registerPlugin(JarvisGeoPlugin.class);
        registerPlugin(JarvisVoicePlugin.class);
        registerPlugin(JarvisHomePlugin.class);
        registerPlugin(JarvisDevicePlugin.class);
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

    @Override
    public void onPause() {
        super.onPause();
        keepWebViewIfDebug();
    }

    @Override
    public void onStop() {
        super.onStop();
        keepWebViewIfDebug();
    }

    /** FGS alone does not keep JS. Resume timers while the debug run is open. */
    private void keepWebViewIfDebug() {
        if (!JarvisDebugService.isRunning()) return;
        if (getBridge() == null) return;
        WebView w = getBridge().getWebView();
        if (w == null) return;
        w.resumeTimers();
        w.onResume();
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
        JarvisVoicePlugin.emitWake();
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
