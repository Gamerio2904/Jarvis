package app.jarvis.notify;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

import app.jarvis.voice.JarvisWakeService;
import local.jarvis.app.MainActivity;
import local.jarvis.app.R;

public class JarvisGlanceWidget extends AppWidgetProvider {
    static final String PREFS = "jarvis_glance";
    static final String ACTION_TOGGLE_VOICE = "app.jarvis.notify.TOGGLE_VOICE";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        paint(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_TOGGLE_VOICE.equals(intent.getAction())) {
            boolean on = JarvisWakeService.wantEnabled(context);
            if (on) JarvisWakeService.stop(context);
            else JarvisWakeService.start(context);
            paint(context);
        }
    }

    public static void paint(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String next = p.getString("next", "Nichts geplant");
        String weather = p.getString("weather", "Wetter im Chat fragen");
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        ComponentName name = new ComponentName(ctx, JarvisGlanceWidget.class);
        int[] ids = mgr.getAppWidgetIds(name);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent voicePi = PendingIntent.getActivity(ctx, 42, voiceIntent(ctx), flags);
        Intent toggle = new Intent(ctx, JarvisGlanceWidget.class);
        toggle.setAction(ACTION_TOGGLE_VOICE);
        PendingIntent togglePi = PendingIntent.getBroadcast(ctx, 44, toggle, flags);
        boolean wakeOn = JarvisWakeService.wantEnabled(ctx);
        for (int id : ids) {
            RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.jarvis_widget);
            views.setTextViewText(R.id.jarvis_widget_next, next);
            views.setTextViewText(R.id.jarvis_widget_weather, weather);
            views.setTextViewText(R.id.jarvis_widget_voice, wakeOn ? "🎙" : "🔇");
            views.setContentDescription(R.id.jarvis_widget_voice, wakeOn ? "Wake-Word aus" : "Wake-Word an");
            views.setOnClickPendingIntent(R.id.jarvis_widget_root, voicePi);
            views.setOnClickPendingIntent(R.id.jarvis_widget_voice, togglePi);
            mgr.updateAppWidget(id, views);
        }
    }

    /** Körper und Mikro: derselbe Deep-Link wie Shortcut und Wake-Word — zuhören und antworten. */
    static Intent voiceIntent(Context ctx) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setAction(Intent.ACTION_VIEW);
        i.setData(Uri.parse("jarvis://voice"));
        i.putExtra("jarvis_mode", "voice");
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return i;
    }
}
