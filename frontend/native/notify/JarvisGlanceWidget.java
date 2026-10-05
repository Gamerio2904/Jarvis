package app.jarvis.notify;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import local.jarvis.app.R;

public class JarvisGlanceWidget extends AppWidgetProvider {
    static final String PREFS = "jarvis_glance";

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        paint(context);
    }

    public static void paint(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String next = p.getString("next", "Nichts geplant");
        String weather = p.getString("weather", "Wetter im Chat fragen");
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        ComponentName name = new ComponentName(ctx, JarvisGlanceWidget.class);
        int[] ids = mgr.getAppWidgetIds(name);
        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(ctx, 42, open, flags);
        for (int id : ids) {
            RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.jarvis_widget);
            views.setTextViewText(R.id.jarvis_widget_next, next);
            views.setTextViewText(R.id.jarvis_widget_weather, weather);
            if (pi != null) views.setOnClickPendingIntent(R.id.jarvis_widget_root, pi);
            mgr.updateAppWidget(id, views);
        }
    }
}
