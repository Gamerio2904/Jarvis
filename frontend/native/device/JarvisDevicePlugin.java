package app.jarvis.device;

import android.telephony.SmsManager;
import android.Manifest;
import android.app.Activity;
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
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;

@CapacitorPlugin(
        name = "JarvisDevice",
        permissions = {
                @Permission(alias = "camera", strings = {Manifest.permission.CAMERA}),
                @Permission(alias = "phone", strings = {Manifest.permission.CALL_PHONE}),
                @Permission(alias = "sms", strings = {Manifest.permission.SEND_SMS}),
                @Permission(alias = "activity", strings = {Manifest.permission.ACTIVITY_RECOGNITION})
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
    public void sensors(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= 29
                && getPermissionState("activity") != PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("activity", call, "onActivityPerm");
            return;
        }
        readSensors(call);
    }

    @PermissionCallback
    private void onActivityPerm(PluginCall call) {
        readSensors(call);
    }

    private void readSensors(PluginCall call) {
        JSObject r = new JSObject();
        Context ctx = getContext();
        SensorManager sm = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            r.put("ok", false);
            r.put("message", "Keine Sensoren lesbar.");
            call.resolve(r);
            return;
        }
        final float[] pressure = {Float.NaN};
        final float[] heading = {Float.NaN};
        final float[] steps = {Float.NaN};
        SensorEventListener l = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                if (event.sensor.getType() == Sensor.TYPE_PRESSURE && event.values.length > 0) {
                    pressure[0] = event.values[0];
                }
                if (event.sensor.getType() == Sensor.TYPE_ORIENTATION && event.values.length > 0) {
                    heading[0] = event.values[0];
                }
                if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER && event.values.length > 0) {
                    steps[0] = event.values[0];
                }
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        Sensor p = sm.getDefaultSensor(Sensor.TYPE_PRESSURE);
        Sensor o = sm.getDefaultSensor(Sensor.TYPE_ORIENTATION);
        Sensor st = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (p != null) sm.registerListener(l, p, SensorManager.SENSOR_DELAY_NORMAL);
        if (o != null) sm.registerListener(l, o, SensorManager.SENSOR_DELAY_NORMAL);
        if (st != null) sm.registerListener(l, st, SensorManager.SENSOR_DELAY_NORMAL);
        new Handler(Looper.getMainLooper())
                .postDelayed(
                        () -> {
                            sm.unregisterListener(l);
                            r.put("ok", true);
                            if (!Float.isNaN(pressure[0])) r.put("pressureHpa", pressure[0]);
                            if (!Float.isNaN(heading[0])) {
                                float h = heading[0];
                                if (h < 0) h += 360f;
                                r.put("heading", h);
                            }
                            if (!Float.isNaN(steps[0])) r.put("steps", Math.round(steps[0]));
                            if (Float.isNaN(pressure[0]) && Float.isNaN(heading[0]) && Float.isNaN(steps[0])) {
                                r.put("ok", false);
                                r.put("message", "Sensor ohne Wert. Keine Diagnose.");
                            }
                            call.resolve(r);
                        },
                        700);
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
