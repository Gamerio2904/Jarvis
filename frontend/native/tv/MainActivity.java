package local.jarvis.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import app.jarvis.geo.JarvisGeoPlugin;
import app.jarvis.notify.JarvisNotifyPlugin;
import app.jarvis.tv.JarvisTvPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(JarvisTvPlugin.class);
        registerPlugin(JarvisNotifyPlugin.class);
        registerPlugin(JarvisGeoPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
