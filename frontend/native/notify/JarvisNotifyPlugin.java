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
        if (id == null || atMs == null) {
            call.reject("id und atMs nötig");
            return;
        }
        ensureChannel(getContext());
        persist(getContext(), id, title, body, atMs);
        boolean ok = arm(getContext(), id, title, body, atMs);
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
    }

    static boolean arm(Context ctx, int id, String title, String body, long atMs) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;
        PendingIntent pi = pending(ctx, id, title, body);
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
        am.cancel(pending(ctx, id, "", ""));
    }

    static PendingIntent pending(Context ctx, int id, String title, String body) {
        Intent i = new Intent(ctx, JarvisNotifyReceiver.class);
        i.setAction("app.jarvis.notify.FIRE");
        i.putExtra("id", id);
        i.putExtra("title", title);
        i.putExtra("body", body);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(ctx, id, i, flags);
    }

    static void persist(Context ctx, int id, String title, String body, long atMs) {
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
            if (at <= now) {
                show(ctx, id, title, body);
                removeStored(ctx, id);
            } else {
                arm(ctx, id, title, body, at);
            }
        }
    }

    static void show(Context ctx, int id, String title, String body) {
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
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(title == null || title.isEmpty() ? "Jarvis" : title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH);
        if (content != null) b.setContentIntent(content);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(id, b.build());
        removeStored(ctx, id);
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
