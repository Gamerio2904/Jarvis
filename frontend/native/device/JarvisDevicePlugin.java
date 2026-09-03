package app.jarvis.device;

import android.telephony.SmsManager;
import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.media.AudioManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

@CapacitorPlugin(
        name = "JarvisDevice",
        permissions = {
                @Permission(alias = "camera", strings = {Manifest.permission.CAMERA}),
                @Permission(alias = "phone", strings = {Manifest.permission.CALL_PHONE}),
                @Permission(alias = "sms", strings = {Manifest.permission.SEND_SMS}),
                @Permission(alias = "bluetooth", strings = {Manifest.permission.BLUETOOTH_CONNECT})
        }
)
public class JarvisDevicePlugin extends Plugin {

    @PluginMethod
    public void battery(PluginCall call) {
        JSObject r = new JSObject();
        try {
            Context ctx = getContext();
            BatteryManager bm = (BatteryManager) ctx.getSystemService(Context.BATTERY_SERVICE);
            int pct = bm != null ? bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) : -1;
            Intent batt = ctx.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            int status = batt != null ? batt.getIntExtra(BatteryManager.EXTRA_STATUS, -1) : -1;
            boolean charging =
                    status == BatteryManager.BATTERY_STATUS_CHARGING
                            || status == BatteryManager.BATTERY_STATUS_FULL;
            r.put("ok", pct >= 0);
            r.put("percent", pct);
            r.put("charging", charging);
            if (pct < 0) r.put("message", "Akku-Stand nicht lesbar.");
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Akku-Stand nicht lesbar.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void network(PluginCall call) {
        JSObject r = new JSObject();
        try {
            ConnectivityManager cm =
                    (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            Network net = cm != null ? cm.getActiveNetwork() : null;
            NetworkCapabilities caps = net != null && cm != null ? cm.getNetworkCapabilities(net) : null;
            boolean wifi = caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
            boolean cell = caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR);
            boolean online =
                    caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
            r.put("ok", true);
            r.put("online", online);
            r.put("wifi", wifi);
            r.put("cellular", cell);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("online", false);
            r.put("wifi", false);
            r.put("cellular", false);
            r.put("message", "Verbindung nicht lesbar.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void torch(PluginCall call) {
        Boolean on = call.getBoolean("on", true);
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("camera", call, "onCamPerm");
            return;
        }
        applyTorch(call, Boolean.TRUE.equals(on));
    }

    @PermissionCallback
    private void onCamPerm(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Kamera-Recht fehlt. Sagen Sie „aktivieren“ in den App-Einstellungen, oder Taschenlampe hier erlauben.");
            call.resolve(r);
            return;
        }
        applyTorch(call, Boolean.TRUE.equals(call.getBoolean("on", true)));
    }

    private void applyTorch(PluginCall call, boolean on) {
        JSObject r = new JSObject();
        try {
            CameraManager cm = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
            if (cm == null) {
                r.put("ok", false);
                r.put("message", "Kein Blitz am Gerät.");
                call.resolve(r);
                return;
            }
            String id = torchId(cm);
            if (id == null) {
                r.put("ok", false);
                r.put("message", "Kein Blitz am Gerät.");
                call.resolve(r);
                return;
            }
            cm.setTorchMode(id, on);
            r.put("ok", true);
            r.put("on", on);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Taschenlampe nicht geschaltet.");
        }
        call.resolve(r);
    }

    private String torchId(CameraManager cm) throws Exception {
        for (String id : cm.getCameraIdList()) {
            CameraCharacteristics c = cm.getCameraCharacteristics(id);
            Boolean flash = c.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
            if (Boolean.TRUE.equals(flash)) return id;
        }
        return null;
    }

    @PluginMethod
    public void openPage(PluginCall call) {
        String page = call.getString("page", "app");
        JSObject r = new JSObject();
        try {
            Intent i;
            if ("wifi".equals(page)) {
                i = new Intent(Settings.ACTION_WIFI_SETTINGS);
            } else if ("bluetooth".equals(page)) {
                i = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
            } else if ("dnd".equals(page)) {
                i = new Intent("android.settings.ZEN_MODE_SETTINGS");
                if (i.resolveActivity(getContext().getPackageManager()) == null) {
                    i = new Intent(Settings.ACTION_SOUND_SETTINGS);
                }
            } else if ("location".equals(page)) {
                i = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            } else if ("sound".equals(page)) {
                i = new Intent(Settings.ACTION_SOUND_SETTINGS);
            } else if ("display".equals(page)) {
                i = new Intent(Settings.ACTION_DISPLAY_SETTINGS);
            } else if ("battery".equals(page)) {
                i = new Intent(Intent.ACTION_POWER_USAGE_SUMMARY);
                if (i.resolveActivity(getContext().getPackageManager()) == null) {
                    i = new Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS);
                }
            } else {
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            }
            startExt(i);
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Einstellungen nicht geöffnet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void listBluetooth(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31 && getPermissionState("bluetooth") != PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("bluetooth", call, "onBtPerm");
            return;
        }
        emitBonded(call);
    }

    @PermissionCallback
    private void onBtPerm(PluginCall call) {
        emitBonded(call);
    }

    private void emitBonded(PluginCall call) {
        JSObject r = new JSObject();
        try {
            BluetoothManager bm = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter ad = bm != null ? bm.getAdapter() : BluetoothAdapter.getDefaultAdapter();
            if (ad == null) {
                r.put("ok", false);
                r.put("message", "Kein Bluetooth am Gerät.");
                call.resolve(r);
                return;
            }
            JSArray names = new JSArray();
            java.util.Set<BluetoothDevice> bonded = ad.getBondedDevices();
            if (bonded != null) {
                for (BluetoothDevice d : bonded) {
                    String n = d.getName();
                    if (n != null && !n.isEmpty()) names.put(n);
                }
            }
            r.put("ok", true);
            r.put("on", ad.isEnabled());
            r.put("devices", names);
        } catch (SecurityException e) {
            r.put("ok", false);
            r.put("needPerm", true);
            r.put("message", "Bluetooth-Recht fehlt. In den App-Einstellungen erlauben.");
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Bluetooth-Geräte nicht lesbar.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void volume(PluginCall call) {
        String dir = call.getString("dir", "up");
        JSObject r = new JSObject();
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am == null) {
                r.put("ok", false);
                r.put("message", "Lautstärke nicht erreichbar.");
                call.resolve(r);
                return;
            }
            int adj = "down".equals(dir) ? AudioManager.ADJUST_LOWER : AudioManager.ADJUST_RAISE;
            am.adjustStreamVolume(AudioManager.STREAM_MUSIC, adj, AudioManager.FLAG_SHOW_UI);
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Lautstärke nicht geändert.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String pkg = call.getString("pkg", "");
        String uri = call.getString("uri", "");
        JSObject r = new JSObject();
        try {
            android.content.pm.PackageManager pm = getContext().getPackageManager();
            Intent i = null;
            if (pkg != null && !pkg.isEmpty()) {
                i = pm.getLaunchIntentForPackage(pkg);
            }
            if (i == null && uri != null && !uri.isEmpty()) {
                i = new Intent(Intent.ACTION_VIEW, Uri.parse(uri));
            }
            if (i == null) {
                r.put("ok", false);
                r.put("message", "App nicht installiert.");
                call.resolve(r);
                return;
            }
            startExt(i);
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "App nicht geöffnet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void dial(PluginCall call) {
        String number = digits(call.getString("number", ""));
        JSObject r = new JSObject();
        if (number.length() < 3) {
            r.put("ok", false);
            r.put("message", "Keine Nummer.");
            call.resolve(r);
            return;
        }
        try {
            Intent i = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number));
            startExt(i);
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Wählhilfe nicht geöffnet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void sms(PluginCall call) {
        String number = digits(call.getString("number", ""));
        String body = call.getString("body", "");
        JSObject r = new JSObject();
        if (number.length() < 3) {
            r.put("ok", false);
            r.put("message", "Keine Nummer.");
            call.resolve(r);
            return;
        }
        try {
            Intent i = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + number));
            if (body != null && !body.isEmpty()) i.putExtra("sms_body", body);
            startExt(i);
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "SMS-App nicht geöffnet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void callNow(PluginCall call) {
        if (getPermissionState("phone") != PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("phone", call, "onPhonePerm");
            return;
        }
        placeCall(call);
    }

    @PermissionCallback
    private void onPhonePerm(PluginCall call) {
        if (getPermissionState("phone") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("needPerm", true);
            r.put("message", "Anruf-Recht fehlt. Unter Einstellungen erlauben, dann nochmal.");
            call.resolve(r);
            return;
        }
        placeCall(call);
    }

    private void placeCall(PluginCall call) {
        String number = digits(call.getString("number", ""));
        JSObject r = new JSObject();
        if (number.length() < 3) {
            r.put("ok", false);
            r.put("message", "Keine Nummer.");
            call.resolve(r);
            return;
        }
        try {
            Intent i = new Intent(Intent.ACTION_CALL, Uri.parse("tel:" + number));
            startExt(i);
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Anruf nicht gestartet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void sendSms(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("sms", call, "onSmsPerm");
            return;
        }
        deliverSms(call);
    }

    @PermissionCallback
    private void onSmsPerm(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("needPerm", true);
            r.put("message", "SMS-Recht fehlt. Unter Einstellungen erlauben, dann nochmal.");
            call.resolve(r);
            return;
        }
        deliverSms(call);
    }

    private void deliverSms(PluginCall call) {
        String number = digits(call.getString("number", ""));
        String body = call.getString("body", "");
        JSObject r = new JSObject();
        if (number.length() < 3) {
            r.put("ok", false);
            r.put("message", "Keine Nummer.");
            call.resolve(r);
            return;
        }
        if (body == null || body.trim().isEmpty()) {
            r.put("ok", false);
            r.put("message", "Kein Text.");
            call.resolve(r);
            return;
        }
        try {
            SmsManager sm;
            if (android.os.Build.VERSION.SDK_INT >= 31) {
                sm = getContext().getSystemService(SmsManager.class);
            } else {
                sm = SmsManager.getDefault();
            }
            if (sm == null) {
                r.put("ok", false);
                r.put("message", "SMS nicht gesendet.");
                call.resolve(r);
                return;
            }
            String text = body.trim();
            ArrayList<String> parts = sm.divideMessage(text);
            if (parts != null && parts.size() > 1) {
                sm.sendMultipartTextMessage(number, null, parts, null, null);
            } else {
                sm.sendTextMessage(number, null, text, null, null);
            }
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "SMS nicht gesendet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void saveDownload(PluginCall call) {
        String rawName = call.getString("name", "");
        String text = call.getString("text", "");
        JSObject r = new JSObject();
        String name = safeFileName(rawName);
        if (name.isEmpty() || text == null) {
            r.put("ok", false);
            r.put("message", "Kein Dateiname.");
            call.resolve(r);
            return;
        }
        try {
            byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                android.content.ContentResolver cr = getContext().getContentResolver();
                Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new Exception("insert");
                OutputStream os = cr.openOutputStream(uri);
                if (os == null) throw new Exception("stream");
                try {
                    os.write(bytes);
                } finally {
                    os.close();
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                cr.update(uri, values, null, null);
            } else {
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (dir != null && !dir.exists()) dir.mkdirs();
                if (dir == null || !dir.isDirectory()) throw new Exception("downloads");
                File out = new File(dir, name);
                FileOutputStream fos = new FileOutputStream(out);
                try {
                    fos.write(bytes);
                } finally {
                    fos.close();
                }
            }
            r.put("ok", true);
            r.put("path", "Downloads/" + name);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Datei nicht in Downloads geschrieben.");
        }
        call.resolve(r);
    }

    private String safeFileName(String raw) {
        if (raw == null) return "";
        String t = raw.trim().replace('\\', '/');
        int slash = t.lastIndexOf('/');
        if (slash >= 0) t = t.substring(slash + 1);
        t = t.replaceAll("[^A-Za-z0-9._-]", "_");
        if (t.isEmpty()) return "jarvis-haus.json";
        if (!t.toLowerCase().endsWith(".json")) t = t + ".json";
        return t;
    }

    private void startExt(Intent i) {
        Activity a = getActivity();
        if (a != null) {
            a.startActivity(i);
        } else {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
    }

    private String digits(String raw) {
        if (raw == null) return "";
        String t = raw.trim().replaceAll("[^\\d+]", "");
        if (t.startsWith("00")) t = "+" + t.substring(2);
        return t;
    }
}
