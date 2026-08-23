package app.jarvis.device;

import android.telephony.SmsManager;
import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.Settings;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(
        name = "JarvisDevice",
        permissions = {
                @Permission(alias = "camera", strings = {Manifest.permission.CAMERA}),
                @Permission(alias = "phone", strings = {Manifest.permission.CALL_PHONE}),
                @Permission(alias = "sms", strings = {Manifest.permission.SEND_SMS}),
                @Permission(
                        alias = "activity",
                        strings = {Manifest.permission.ACTIVITY_RECOGNITION})
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
    public void sensors(PluginCall call) {
        String kind = call.getString("kind", "all");
        if ("steps".equals(kind) && Build.VERSION.SDK_INT >= 29) {
            if (getPermissionState("activity") != PermissionState.GRANTED) {
                call.setKeepAlive(true);
                requestPermissionForAlias("activity", call, "onActivityPerm");
                return;
            }
        }
        readSensors(call, kind);
    }

    @PermissionCallback
    private void onActivityPerm(PluginCall call) {
        if (getPermissionState("activity") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("needPerm", true);
            r.put("message", "Schritt-Recht fehlt. Unter Einstellungen erlauben, dann nochmal. Ich schätze nicht.");
            call.resolve(r);
            return;
        }
        readSensors(call, call.getString("kind", "steps"));
    }

    private void readSensors(PluginCall call, String kind) {
        JSObject r = new JSObject();
        SensorManager sm = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            r.put("ok", false);
            r.put("message", "Keine Sensoren.");
            call.resolve(r);
            return;
        }
        try {
            if ("steps".equals(kind)) {
                float steps = readOnce(sm, Sensor.TYPE_STEP_COUNTER);
                if (Float.isNaN(steps)) {
                    r.put("ok", true);
                    r.put("message", "Kein Schrittzähler in diesem Gerät.");
                    call.resolve(r);
                    return;
                }
                SharedPreferences p = getContext().getSharedPreferences("jarvis_sensors", Context.MODE_PRIVATE);
                String day = todayKey();
                String storedDay = p.getString("step_day", "");
                float base = p.getFloat("step_base", steps);
                if (!day.equals(storedDay)) {
                    base = steps;
                    p.edit().putString("step_day", day).putFloat("step_base", base).apply();
                }
                int today = Math.max(0, Math.round(steps - base));
                r.put("ok", true);
                r.put("steps", today);
                r.put("stepsSince", "seit Mitternacht, wenn der Zähler durchlief");
                call.resolve(r);
                return;
            }
            if ("pressure".equals(kind)) {
                float hpa = readOnce(sm, Sensor.TYPE_PRESSURE);
                r.put("ok", true);
                if (Float.isNaN(hpa)) r.put("message", "Kein Barometer in diesem Gerät.");
                else r.put("hpa", (double) hpa);
                call.resolve(r);
                return;
            }
            float[] ori = readOrientation(sm);
            r.put("ok", true);
            if (ori == null) {
                r.put("message", "Kompass nicht lesbar.");
            } else {
                float heading = ori[0];
                if (heading < 0) heading += 360f;
                r.put("heading", (double) heading);
                r.put("cardinal", cardinal(heading));
            }
            call.resolve(r);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Sensor nicht lesbar.");
            call.resolve(r);
        }
    }

    private float readOnce(SensorManager sm, int type) throws InterruptedException {
        Sensor sensor = sm.getDefaultSensor(type);
        if (sensor == null) return Float.NaN;
        final float[] hold = {Float.NaN};
        final CountDownLatch latch = new CountDownLatch(1);
        SensorEventListener lis =
                new SensorEventListener() {
                    @Override
                    public void onSensorChanged(SensorEvent event) {
                        if (event.values != null && event.values.length > 0) {
                            hold[0] = event.values[0];
                            latch.countDown();
                        }
                    }

                    @Override
                    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
                };
        sm.registerListener(lis, sensor, SensorManager.SENSOR_DELAY_NORMAL);
        latch.await(700, TimeUnit.MILLISECONDS);
        sm.unregisterListener(lis);
        return hold[0];
    }

    private float[] readOrientation(SensorManager sm) throws InterruptedException {
        Sensor rot = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rot == null) rot = sm.getDefaultSensor(Sensor.TYPE_ORIENTATION);
        if (rot == null) return null;
        final float[] hold = {Float.NaN};
        final CountDownLatch latch = new CountDownLatch(1);
        final boolean vector = rot.getType() == Sensor.TYPE_ROTATION_VECTOR;
        SensorEventListener lis =
                new SensorEventListener() {
                    @Override
                    public void onSensorChanged(SensorEvent event) {
                        if (event.values == null || event.values.length < 1) return;
                        if (vector) {
                            float[] R = new float[9];
                            float[] ori = new float[3];
                            SensorManager.getRotationMatrixFromVector(R, event.values);
                            SensorManager.getOrientation(R, ori);
                            hold[0] = (float) Math.toDegrees(ori[0]);
                        } else {
                            hold[0] = event.values[0];
                        }
                        latch.countDown();
                    }

                    @Override
                    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
                };
        sm.registerListener(lis, rot, SensorManager.SENSOR_DELAY_UI);
        latch.await(700, TimeUnit.MILLISECONDS);
        sm.unregisterListener(lis);
        if (Float.isNaN(hold[0])) return null;
        return hold;
    }

    private String todayKey() {
        java.util.Calendar c = java.util.Calendar.getInstance();
        return c.get(java.util.Calendar.YEAR)
                + "-"
                + (c.get(java.util.Calendar.MONTH) + 1)
                + "-"
                + c.get(java.util.Calendar.DAY_OF_MONTH);
    }

    private String cardinal(float deg) {
        String[] names = {"N", "NO", "O", "SO", "S", "SW", "W", "NW"};
        int i = Math.round(deg / 45f) % 8;
        if (i < 0) i += 8;
        return names[i];
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
    public void openUrl(PluginCall call) {
        String url = call.getString("url", "");
        JSObject r = new JSObject();
        if (url == null || url.trim().isEmpty()) {
            r.put("ok", false);
            r.put("message", "Keine Adresse.");
            call.resolve(r);
            return;
        }
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url.trim()));
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
