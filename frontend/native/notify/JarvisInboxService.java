package app.jarvis.notify;

import android.app.Notification;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Liest sichtbare WhatsApp- und Mail-Meldungen. Antwort nur über RemoteInput
 * der Meldung — kein Tipp in die App, kein stilles Senden.
 */
public class JarvisInboxService extends NotificationListenerService {
    private static final int CAP = 24;
    private static final Map<String, JSONObject> LAST = new LinkedHashMap<String, JSONObject>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, JSONObject> eldest) {
            return size() > CAP;
        }
    };

    static boolean enabled(Context ctx) {
        String flat = Settings.Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
        if (flat == null || flat.isEmpty()) return false;
        String me = new ComponentName(ctx, JarvisInboxService.class).flattenToString();
        String shortMe = ctx.getPackageName() + "/" + JarvisInboxService.class.getName();
        for (String part : flat.split(":")) {
            if (me.equalsIgnoreCase(part) || shortMe.equalsIgnoreCase(part)) return true;
        }
        return false;
    }

    static JSONArray snapshot(String wantPkg) {
        JSONArray out = new JSONArray();
        List<JSONObject> copy;
        synchronized (LAST) {
            copy = new ArrayList<>(LAST.values());
        }
        String filter = wantPkg == null ? "" : wantPkg.trim();
        for (int i = copy.size() - 1; i >= 0; i -= 1) {
            JSONObject row = copy.get(i);
            if (!filter.isEmpty() && !filter.equals(row.optString("pkg"))) continue;
            out.put(row);
        }
        return out;
    }

    static boolean reply(Context ctx, String key, String text) {
        if (key == null || key.isEmpty() || text == null || text.trim().isEmpty()) return false;
        StatusBarNotification[] active;
        try {
            JarvisInboxService self = INSTANCE;
            if (self == null) return false;
            active = self.getActiveNotifications();
        } catch (Exception e) {
            return false;
        }
        if (active == null) return false;
        for (StatusBarNotification sbn : active) {
            if (sbn == null || !key.equals(sbn.getKey())) continue;
            return sendReply(ctx, sbn, text.trim());
        }
        return false;
    }

    private static volatile JarvisInboxService INSTANCE;

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        INSTANCE = this;
        try {
            StatusBarNotification[] now = getActiveNotifications();
            if (now != null) {
                for (StatusBarNotification sbn : now) remember(sbn);
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onListenerDisconnected() {
        INSTANCE = null;
        super.onListenerDisconnected();
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        remember(sbn);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null) return;
        synchronized (LAST) {
            LAST.remove(sbn.getKey());
        }
    }

    private void remember(StatusBarNotification sbn) {
        if (sbn == null || !isInboxPkg(sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null) return;
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        String title = extra(n, Notification.EXTRA_TITLE);
        String text = extra(n, Notification.EXTRA_TEXT);
        if (title.isEmpty() && text.isEmpty()) return;
        JSONObject row = new JSONObject();
        try {
            row.put("key", sbn.getKey());
            row.put("pkg", sbn.getPackageName());
            row.put("title", title);
            row.put("text", text);
            row.put("canReply", hasReply(n));
            row.put("at", sbn.getPostTime());
        } catch (Exception e) {
            return;
        }
        synchronized (LAST) {
            LAST.remove(sbn.getKey());
            LAST.put(sbn.getKey(), row);
        }
    }

    static boolean isInboxPkg(String pkg) {
        if (pkg == null) return false;
        String p = pkg.toLowerCase(Locale.ROOT);
        return p.equals("com.whatsapp")
                || p.equals("com.whatsapp.w4b")
                || p.equals("com.google.android.gm")
                || p.equals("com.google.android.gm.lite")
                || p.equals("com.microsoft.office.outlook")
                || p.contains("mail");
    }

    static boolean isWhatsApp(String pkg) {
        return pkg != null && pkg.toLowerCase(Locale.ROOT).contains("whatsapp");
    }

    static boolean isMail(String pkg) {
        return isInboxPkg(pkg) && !isWhatsApp(pkg);
    }

    private static String extra(Notification n, String key) {
        Bundle extras = n.extras;
        if (extras == null) return "";
        CharSequence c = extras.getCharSequence(key);
        return c == null ? "" : c.toString().trim();
    }

    private static boolean hasReply(Notification n) {
        Notification.Action[] actions = n.actions;
        if (actions == null) return false;
        for (Notification.Action a : actions) {
            if (a != null && a.getRemoteInputs() != null && a.getRemoteInputs().length > 0) return true;
        }
        return false;
    }

    private static boolean sendReply(Context ctx, StatusBarNotification sbn, String text) {
        Notification n = sbn.getNotification();
        if (n == null || n.actions == null) return false;
        for (Notification.Action a : n.actions) {
            if (a == null || a.getRemoteInputs() == null || a.getRemoteInputs().length == 0) continue;
            if (a.actionIntent == null) return false;
            android.app.RemoteInput[] inputs = a.getRemoteInputs();
            Intent fill = new Intent();
            Bundle bag = new Bundle();
            for (android.app.RemoteInput in : inputs) {
                bag.putCharSequence(in.getResultKey(), text);
            }
            android.app.RemoteInput.addResultsToIntent(inputs, fill, bag);
            try {
                a.actionIntent.send(ctx, 0, fill);
                return true;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    static void forget(String key) {
        if (key == null) return;
        synchronized (LAST) {
            LAST.remove(key);
        }
    }

    static Iterator<JSONObject> rows() {
        synchronized (LAST) {
            return new ArrayList<>(LAST.values()).iterator();
        }
    }
}
