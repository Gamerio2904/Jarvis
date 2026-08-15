package app.jarvis.notify;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
        name = "JarvisNotify",
        permissions = {
                @Permission(
                        alias = "notify",
                        strings = {Manifest.permission.POST_NOTIFICATIONS}
                )
        }
)
public class JarvisNotifyPlugin extends Plugin {
    static final String CHANNEL_ID = "jarvis_reminders";
    static final String ALARM_CHANNEL = "jarvis_alarms";
    static final String PREFS = "jarvis_notify";
    static final String KEY_ITEMS = "items";

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        if (getPermissionState("notify") == PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        requestPermissionForAlias("notify", call, "onNotifyPerm");
    }

    @PermissionCallback
    private void onNotifyPerm(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", getPermissionState("notify") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        Integer id = call.getInt("id");
        String title = call.getString("title", "Jarvis");
        String body = call.getString("body", "");
        Long atMs = call.getLong("atMs");
        boolean alarm = Boolean.TRUE.equals(call.getBoolean("alarm", true));
        String recur = call.getString("recur", "");
        if (id == null || atMs == null) {
            call.reject("id und atMs nötig");
            return;
        }
        ensureChannel(getContext());
        persist(getContext(), id, title, body, atMs, alarm, recur);
        boolean ok = arm(getContext(), id, title, body, atMs, alarm, recur);
        JSObject r = new JSObject();
        r.put("ok", ok);
        if (!ok) r.put("message", "Wecker nicht gesetzt.");
        call.resolve(r);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("id nötig");
            return;
        }
        cancelAlarm(getContext(), id);
        removeStored(getContext(), id);
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void publishGlance(PluginCall call) {
        String next = call.getString("next", "Nichts geplant");
        String weather = call.getString("weather", "Wetter im Chat fragen");
        getContext().getSharedPreferences(JarvisGlanceWidget.PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString("next", next)
                .putString("weather", weather)
                .apply();
        JarvisGlanceWidget.paint(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "Erinnerungen",
                NotificationManager.IMPORTANCE_HIGH
        );
        ch.setDescription("Jarvis-Erinnerungen zur vereinbarten Zeit");
        nm.createNotificationChannel(ch);
        NotificationChannel alarm = new NotificationChannel(
                ALARM_CHANNEL,
                "Wecker",
                NotificationManager.IMPORTANCE_HIGH
        );
        alarm.setDescription("Timer und Erinnerungen mit Ton, auch bei Bildschirm aus");
        alarm.setBypassDnd(true);
        alarm.enableVibration(true);
        alarm.setSound(
                android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI,
                new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
        );
        nm.createNotificationChannel(alarm);
    }

    static boolean arm(Context ctx, int id, String title, String body, long atMs, boolean alarm, String recur) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;
        PendingIntent pi = pending(ctx, id, title, body, alarm, recur);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (am.canScheduleExactAlarms()) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
                }
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
            }
            return true;
        } catch (Exception e) {
            try {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
    }

    static void cancelAlarm(Context ctx, int id) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(pending(ctx, id, "", "", true, ""));
    }

    static PendingIntent pending(Context ctx, int id, String title, String body, boolean alarm, String recur) {
        Intent i = new Intent(ctx, JarvisNotifyReceiver.class);
        i.setAction("app.jarvis.notify.FIRE");
        i.putExtra("id", id);
        i.putExtra("title", title);
        i.putExtra("body", body);
        i.putExtra("alarm", alarm);
        i.putExtra("recur", recur == null ? "" : recur);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(ctx, id, i, flags);
    }

    static void persist(Context ctx, int id, String title, String body, long atMs, boolean alarm, String recur) {
        try {
            JSONArray arr = load(ctx);
            JSONArray next = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o != null && o.optInt("id") != id) next.put(o);
            }
            JSONObject row = new JSONObject();
            row.put("id", id);
            row.put("title", title);
            row.put("body", body);
            row.put("atMs", atMs);
            row.put("alarm", alarm);
            row.put("recur", recur == null ? "" : recur);
            next.put(row);
            prefs(ctx).edit().putString(KEY_ITEMS, next.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    static void removeStored(Context ctx, int id) {
        try {
            JSONArray arr = load(ctx);
            JSONArray next = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o != null && o.optInt("id") != id) next.put(o);
            }
            prefs(ctx).edit().putString(KEY_ITEMS, next.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    static void restoreAll(Context ctx) {
        ensureChannel(ctx);
        JSONArray arr = load(ctx);
        long now = System.currentTimeMillis();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            int id = o.optInt("id");
            String title = o.optString("title", "Jarvis");
            String body = o.optString("body", "");
            long at = o.optLong("atMs");
            boolean alarm = o.optBoolean("alarm", true);
            String recur = o.optString("recur", "");
            if (at <= now) {
                show(ctx, id, title, body, alarm, recur);
            } else {
                arm(ctx, id, title, body, at, alarm, recur);
            }
        }
    }

    static void show(Context ctx, int id, String title, String body) {
        show(ctx, id, title, body, true, "");
    }

    static void show(Context ctx, int id, String title, String body, boolean alarm, String recur) {
        ensureChannel(ctx);
        if (Build.VERSION.SDK_INT >= 33
                && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent content = open == null
                ? null
                : PendingIntent.getActivity(ctx, id + 10_000, open, flags);
        Intent full = new Intent(ctx, JarvisAlarmActivity.class);
        full.putExtra("title", title);
        full.putExtra("body", body);
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent fullPi = PendingIntent.getActivity(ctx, id + 20_000, full, flags);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, alarm ? ALARM_CHANNEL : CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title == null || title.isEmpty() ? "Jarvis" : title)
                .setContentText(body)
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setFullScreenIntent(fullPi, true);
        if (content != null) b.setContentIntent(content);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(id, b.build());
        try {
            ctx.startActivity(full);
        } catch (Exception ignored) {
        }
        if ("daily".equals(recur) || "weekly".equals(recur)) {
            long step = "weekly".equals(recur) ? 7L * 86_400_000L : 86_400_000L;
            long next = System.currentTimeMillis() + step;
            persist(ctx, id, title, body, next, true, recur);
            arm(ctx, id, title, body, next, true, recur);
        } else {
            removeStored(ctx, id);
        }
    }

    private static JSONArray load(Context ctx) {
        try {
            String raw = prefs(ctx).getString(KEY_ITEMS, "[]");
            return new JSONArray(raw);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
