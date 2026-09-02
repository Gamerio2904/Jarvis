package app.jarvis.notify;

import android.app.Notification;
import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
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
    static final String ALARM_CHANNEL = "jarvis_alarms_v4";
    static final String TIMER_CHANNEL = "jarvis_timer_speak_v1";
    static final String PREFS = "jarvis_notify";
    static final String KEY_ITEMS = "items";
    static final String KEY_TONE = "alarm_tone";
    static final String KEY_TONE_NAME = "alarm_tone_name";

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
        boolean alarm = Boolean.TRUE.equals(call.getBoolean("alarm", false));
        String recur = call.getString("recur", "");
        String tone = call.getString("tone", "");
        String mode = call.getString("mode", "");
        String say = call.getString("say", "");
        if (mode == null) mode = "";
        if (say == null) say = "";
        if ("speak".equals(mode)) {
            tone = "";
        } else if (tone == null || tone.isEmpty()) {
            tone = prefs(getContext()).getString(KEY_TONE, "");
        } else {
            prefs(getContext()).edit().putString(KEY_TONE, tone).apply();
        }
        if (id == null || atMs == null) {
            call.reject("id und atMs nötig");
            return;
        }
        ensureChannel(getContext());
        persist(getContext(), id, title, body, atMs, alarm, recur, tone, mode, say);
        boolean ok = arm(getContext(), id, title, body, atMs, alarm, recur, tone, mode, say);
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

    @PluginMethod
    public void pickTone(PluginCall call) {
        Intent i = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Wecker-Ton");
        String cur = prefs(getContext()).getString(KEY_TONE, "");
        if (cur != null && !cur.isEmpty()) {
            i.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(cur));
        }
        startActivityForResult(call, i, "onTonePicked");
    }

    @ActivityCallback
    private void onTonePicked(PluginCall call, ActivityResult result) {
        JSObject r = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            r.put("ok", false);
            r.put("message", "Kein Ton gewählt.");
            call.resolve(r);
            return;
        }
        Uri uri = result.getData().getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
        if (uri == null) {
            r.put("ok", false);
            r.put("message", "Kein Ton gewählt.");
            call.resolve(r);
            return;
        }
        try {
            getContext().getContentResolver().takePersistableUriPermission(
                    uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) {
        }
        String name = RingtoneManager.getRingtone(getContext(), uri) != null
                ? RingtoneManager.getRingtone(getContext(), uri).getTitle(getContext())
                : "Eigener Ton";
        prefs(getContext()).edit().putString(KEY_TONE, uri.toString()).putString(KEY_TONE_NAME, name).apply();
        r.put("ok", true);
        r.put("uri", uri.toString());
        r.put("name", name);
        call.resolve(r);
    }

    @PluginMethod
    public void listTones(PluginCall call) {
        JSArray arr = new JSArray();
        try {
            RingtoneManager rm = new RingtoneManager(getContext());
            rm.setType(RingtoneManager.TYPE_ALARM);
            Cursor c = rm.getCursor();
            int n = 0;
            while (c != null && c.moveToNext() && n < 40) {
                Uri u = rm.getRingtoneUri(c.getPosition());
                if (u == null) continue;
                JSObject row = new JSObject();
                row.put("uri", u.toString());
                row.put("name", c.getString(RingtoneManager.TITLE_COLUMN_INDEX));
                arr.put(row);
                n += 1;
            }
        } catch (Exception ignored) {
        }
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("tones", arr);
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
        for (String old : new String[]{"jarvis_alarms", "jarvis_alarms_v2", "jarvis_alarms_v3"}) {
            try {
                nm.deleteNotificationChannel(old);
            } catch (Exception ignored) {
            }
        }
        NotificationChannel alarm = new NotificationChannel(
                ALARM_CHANNEL,
                "Wecker",
                NotificationManager.IMPORTANCE_HIGH
        );
        alarm.setDescription("Timer und Wecker mit Ton, auch bei Bildschirm aus");
        alarm.setBypassDnd(true);
        alarm.enableVibration(true);
        alarm.enableLights(true);
        Uri ring = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (ring != null) alarm.setSound(ring, JarvisAlarmPlayer.alarmAttrs());
        nm.createNotificationChannel(alarm);
        NotificationChannel timer = new NotificationChannel(
                TIMER_CHANNEL,
                "Timer",
                NotificationManager.IMPORTANCE_HIGH
        );
        timer.setDescription("Jarvis sagt die Zeit an, ohne Klingeln");
        timer.setBypassDnd(true);
        timer.enableVibration(false);
        timer.enableLights(true);
        timer.setSound(null, null);
        nm.createNotificationChannel(timer);
    }

    static boolean arm(Context ctx, int id, String title, String body, long atMs, boolean alarm, String recur, String tone, String mode, String say) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;
        PendingIntent pi = pending(ctx, id, title, body, alarm, recur, tone, mode, say);
        if (!alarm) {
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
        try {
            Intent show = new Intent(ctx, JarvisAlarmActivity.class);
            show.putExtra("title", title);
            show.putExtra("body", body);
            show.putExtra("tone", tone == null ? "" : tone);
            show.putExtra("mode", mode == null ? "" : mode);
            show.putExtra("say", say == null ? "" : say);
            show.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent showPi = PendingIntent.getActivity(ctx, 80_000 + id, show, flags);
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(atMs, showPi), pi);
            return true;
        } catch (Exception e) {
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
            } catch (Exception ignored) {
                try {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
                    return true;
                } catch (Exception ignored2) {
                    return false;
                }
            }
        }
    }

    static void cancelAlarm(Context ctx, int id) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(pending(ctx, id, "", "", true, "", "", "", ""));
    }

    static PendingIntent pending(Context ctx, int id, String title, String body, boolean alarm, String recur, String tone, String mode, String say) {
        Intent i = new Intent(ctx, JarvisNotifyReceiver.class);
        i.setAction("app.jarvis.notify.FIRE");
        i.putExtra("id", id);
        i.putExtra("title", title);
        i.putExtra("body", body);
        i.putExtra("alarm", alarm);
        i.putExtra("recur", recur == null ? "" : recur);
        i.putExtra("tone", tone == null ? "" : tone);
        i.putExtra("mode", mode == null ? "" : mode);
        i.putExtra("say", say == null ? "" : say);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(ctx, id, i, flags);
    }

    static void persist(Context ctx, int id, String title, String body, long atMs, boolean alarm, String recur, String tone, String mode, String say) {
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
            row.put("tone", tone == null ? "" : tone);
            row.put("mode", mode == null ? "" : mode);
            row.put("say", say == null ? "" : say);
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
            if ("Weltlage".equals(title)) alarm = false;
            String recur = o.optString("recur", "");
            String tone = o.optString("tone", "");
            String mode = o.optString("mode", "");
            String say = o.optString("say", "");
            if (at <= now) {
                show(ctx, id, title, body, alarm, recur, tone, mode, say);
            } else {
                arm(ctx, id, title, body, at, alarm, recur, tone, mode, say);
            }
        }
    }

    static void show(Context ctx, int id, String title, String body) {
        show(ctx, id, title, body, true, "", "", "", "");
    }

    static void show(Context ctx, int id, String title, String body, boolean alarm, String recur) {
        show(ctx, id, title, body, alarm, recur, "", "", "");
    }

    static void show(Context ctx, int id, String title, String body, boolean alarm, String recur, String tone) {
        show(ctx, id, title, body, alarm, recur, tone, "", "");
    }

    static boolean isTimerSpeak(String mode, String title) {
        if (mode != null && "speak".equals(mode.trim())) return true;
        return title != null && "Timer".equalsIgnoreCase(title.trim());
    }

    static void showQuiet(Context ctx, int id, String title, String body) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent tap = null;
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            tap = PendingIntent.getActivity(ctx, id, launch, flags);
        }
        Notification n = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title == null || title.isEmpty() ? "Jarvis" : title)
                .setContentText(body == null ? "" : body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body == null ? "" : body))
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(tap)
                .build();
        nm.notify(id, n);
    }

    static void show(Context ctx, int id, String title, String body, boolean alarm, String recur, String tone, String mode, String say) {
        ensureChannel(ctx);
        if (!alarm) {
            showQuiet(ctx, id, title, body);
            if ("daily".equals(recur) || "weekly".equals(recur)) {
                long step = "weekly".equals(recur) ? 7L * 86_400_000L : 86_400_000L;
                long next = System.currentTimeMillis() + step;
                persist(ctx, id, title, body, next, false, recur, "", "", "");
                arm(ctx, id, title, body, next, false, recur, "", "", "");
            } else {
                removeStored(ctx, id);
            }
            return;
        }
        if (isTimerSpeak(mode, title)) {
            mode = "speak";
            tone = "";
        }
        if ("speak".equals(mode) && (say == null || say.isEmpty())) {
            say = timerSpokenLine(body);
        }
        boolean speak = "speak".equals(mode);
        String play = speak ? "" : (tone != null && !tone.isEmpty() ? tone : prefs(ctx).getString(KEY_TONE, ""));
        JarvisAlarmService.start(ctx, title, body, play, mode, say);
        if (!speak) JarvisAlarmPlayer.start(ctx, play);
        Intent full = new Intent(ctx, JarvisAlarmActivity.class);
        full.putExtra("title", title);
        full.putExtra("body", body);
        full.putExtra("tone", play);
        full.putExtra("mode", mode == null ? "" : mode);
        full.putExtra("say", say == null ? "" : say);
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        try {
            ctx.startActivity(full);
        } catch (Exception ignored) {
        }
        if ("daily".equals(recur) || "weekly".equals(recur)) {
            long step = "weekly".equals(recur) ? 7L * 86_400_000L : 86_400_000L;
            long next = System.currentTimeMillis() + step;
            persist(ctx, id, title, body, next, true, recur, play, mode, say);
            arm(ctx, id, title, body, next, true, recur, play, mode, say);
        } else {
            removeStored(ctx, id);
        }
    }

    static String timerSpokenLine(String body) {
        String t = body == null ? "" : body.trim();
        if (t.isEmpty() || t.equalsIgnoreCase("Timer") || t.equalsIgnoreCase("Test") || t.equalsIgnoreCase("Probe")) {
            return "Die Zeit ist um.";
        }
        String low = t.toLowerCase();
        if (low.equals("nudeln") || low.equals("kartoffeln") || low.equals("bohnen") || low.equals("linsen")
                || low.equals("eier") || low.equals("pommes") || low.equals("spätzle") || low.equals("spaghetti")) {
            return "Die " + t + " sind fertig.";
        }
        return t + " ist soweit.";
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
