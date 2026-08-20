package app.jarvis.device;

import android.telephony.SmsManager;
import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.BatteryManager;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import android.view.Surface;
import android.provider.Settings;

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
                @Permission(alias = "activity", strings = {Manifest.permission.ACTIVITY_RECOGNITION})
        }
)
public class JarvisDevicePlugin extends Plugin {

    private SensorManager compassSm;
    private SensorEventListener compassListener;
    private static volatile boolean debugHold = false;
    private PowerManager.WakeLock debugLock;

    public static boolean debugHold() {
        return debugHold;
    }

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
    public void steps(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= 29
                && getPermissionState("activity") != PermissionState.GRANTED) {
            call.setKeepAlive(true);
            requestPermissionForAlias("activity", call, "onActivityPerm");
            return;
        }
        readSteps(call);
    }

    @PermissionCallback
    private void onActivityPerm(PluginCall call) {
        if (getPermissionState("activity") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Schrittzähler nicht lesbar. Recht fehlt oder kein Sensor. Keine Diagnose.");
            call.resolve(r);
            return;
        }
        readSteps(call);
    }

    private void readSteps(PluginCall call) {
        readSensorOnce(
                Sensor.TYPE_STEP_COUNTER,
                2500,
                values -> {
                    JSObject r = new JSObject();
                    if (values == null || values.length < 1) {
                        r.put("ok", false);
                        r.put("message", "Schrittzähler nicht lesbar. Recht fehlt oder kein Sensor. Keine Diagnose.");
                    } else {
                        r.put("ok", true);
                        r.put("count", Math.round(values[0]));
                        r.put("sinceBoot", true);
                    }
                    call.resolve(r);
                });
    }

    @PluginMethod
    public void pressure(PluginCall call) {
        readSensorOnce(
                Sensor.TYPE_PRESSURE,
                2500,
                values -> {
                    JSObject r = new JSObject();
                    if (values == null || values.length < 1) {
                        r.put("ok", false);
                        r.put("message", "Luftdruck nicht lesbar. Kein Barometer oder kein Zugriff.");
                    } else {
                        r.put("ok", true);
                        r.put("hpa", Math.round(values[0] * 10) / 10.0);
                    }
                    call.resolve(r);
                });
    }

    @PluginMethod
    public void compass(PluginCall call) {
        readSensorOnce(
                Sensor.TYPE_ROTATION_VECTOR,
                2500,
                values -> {
                    JSObject r = new JSObject();
                    if (values == null || values.length < 3) {
                        r.put("ok", false);
                        r.put("message", "Kompass nicht lesbar. Kein Magnetometer oder Störung.");
                        call.resolve(r);
                        return;
                    }
                    float[] rot = new float[9];
                    float[] orient = new float[3];
                    SensorManager.getRotationMatrixFromVector(rot, values);
                    SensorManager.getOrientation(rot, orient);
                    float deg = (float) Math.toDegrees(orient[0]);
                    if (deg < 0) deg += 360f;
                    String[] names = {"N", "NO", "O", "SO", "S", "SW", "W", "NW"};
                    int i = Math.round(deg / 45f) % 8;
                    r.put("ok", true);
                    r.put("heading", deg);
                    r.put("label", names[i]);
                    call.resolve(r);
                });
    }

    @PluginMethod
    public void startCompass(PluginCall call) {
        SensorManager sm = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Kompass nicht lesbar. Kein Magnetometer oder Störung.");
            call.resolve(r);
            return;
        }
        Sensor sensor = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (sensor == null) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Kompass nicht lesbar. Kein Magnetometer oder Störung.");
            call.resolve(r);
            return;
        }
        stopCompassListener();
        compassSm = sm;
        compassListener =
                new SensorEventListener() {
                    @Override
                    public void onSensorChanged(SensorEvent event) {
                        if (event.values == null || event.values.length < 3) return;
                        JSObject r = headingFromVector(event.values);
                        notifyListeners("compassHeading", r);
                    }

                    @Override
                    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
                };
        sm.registerListener(compassListener, sensor, SensorManager.SENSOR_DELAY_GAME);
        JSObject ok = new JSObject();
        ok.put("ok", true);
        call.resolve(ok);
    }

    @PluginMethod
    public void stopCompass(PluginCall call) {
        stopCompassListener();
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    private void stopCompassListener() {
        if (compassSm != null && compassListener != null) {
            compassSm.unregisterListener(compassListener);
        }
        compassListener = null;
        compassSm = null;
    }

    private JSObject headingFromVector(float[] values) {
        float[] rot = new float[9];
        float[] remapped = new float[9];
        float[] orient = new float[3];
        SensorManager.getRotationMatrixFromVector(rot, values);
        int axisX = SensorManager.AXIS_X;
        int axisY = SensorManager.AXIS_Z;
        try {
            Activity act = getActivity();
            if (act != null) {
                int rotation = act.getWindowManager().getDefaultDisplay().getRotation();
                if (rotation == Surface.ROTATION_90) {
                    axisX = SensorManager.AXIS_Y;
                    axisY = SensorManager.AXIS_MINUS_X;
                } else if (rotation == Surface.ROTATION_270) {
                    axisX = SensorManager.AXIS_MINUS_Y;
                    axisY = SensorManager.AXIS_X;
                } else if (rotation == Surface.ROTATION_180) {
                    axisX = SensorManager.AXIS_MINUS_X;
                    axisY = SensorManager.AXIS_MINUS_Z;
                }
            }
        } catch (Exception ignored) {
        }
        SensorManager.remapCoordinateSystem(rot, axisX, axisY, remapped);
        SensorManager.getOrientation(remapped, orient);
        float deg = (float) Math.toDegrees(orient[0]);
        if (deg < 0) deg += 360f;
        String[] names = {"N", "NO", "O", "SO", "S", "SW", "W", "NW"};
        int i = Math.round(deg / 45f) % 8;
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("heading", deg);
        r.put("label", names[i]);
        return r;
    }

    private interface SensorDone {
        void on(float[] values);
    }

    private void readSensorOnce(int type, int timeoutMs, SensorDone done) {
        SensorManager sm = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            done.on(null);
            return;
        }
        Sensor sensor = sm.getDefaultSensor(type);
        if (sensor == null) {
            done.on(null);
            return;
        }
        Handler h = new Handler(Looper.getMainLooper());
        final SensorEventListener[] holder = new SensorEventListener[1];
        final boolean[] finished = {false};
        Runnable timeout =
                () -> {
                    if (finished[0]) return;
                    finished[0] = true;
                    if (holder[0] != null) sm.unregisterListener(holder[0]);
                    done.on(null);
                };
        holder[0] =
                new SensorEventListener() {
                    @Override
                    public void onSensorChanged(SensorEvent event) {
                        if (finished[0]) return;
                        finished[0] = true;
                        h.removeCallbacks(timeout);
                        sm.unregisterListener(this);
                        done.on(event.values == null ? null : event.values.clone());
                    }

                    @Override
                    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
                };
        sm.registerListener(holder[0], sensor, SensorManager.SENSOR_DELAY_FASTEST);
        h.postDelayed(timeout, timeoutMs);
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
    public void saveDownload(PluginCall call) {
        JSObject r = new JSObject();
        String name = call.getString("name", "");
        String text = call.getString("text", "");
        if (name == null) name = "";
        if (text == null) text = "";
        name = name.replaceAll("[/\\\\]", "-").trim();
        if (name.isEmpty() || text.isEmpty()) {
            r.put("ok", false);
            r.put("message", "Keine Datei.");
            call.resolve(r);
            return;
        }
        try {
            Context ctx = getContext();
            byte[] bytes = text.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            if (android.os.Build.VERSION.SDK_INT >= 29) {
                android.content.ContentValues values = new android.content.ContentValues();
                values.put(android.provider.MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(android.provider.MediaStore.Downloads.MIME_TYPE, "application/json");
                values.put(android.provider.MediaStore.Downloads.IS_PENDING, 1);
                android.net.Uri uri =
                        ctx.getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new Exception("insert");
                java.io.OutputStream out = ctx.getContentResolver().openOutputStream(uri);
                if (out == null) throw new Exception("stream");
                out.write(bytes);
                out.close();
                values.clear();
                values.put(android.provider.MediaStore.Downloads.IS_PENDING, 0);
                ctx.getContentResolver().update(uri, values, null, null);
            } else {
                java.io.File dir =
                        android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
                if (dir != null && !dir.exists()) dir.mkdirs();
                java.io.File file = new java.io.File(dir, name);
                java.io.FileOutputStream out = new java.io.FileOutputStream(file);
                out.write(bytes);
                out.close();
            }
            r.put("ok", true);
            r.put("message", "Gespeichert unter Downloads/" + name);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Download nicht geschrieben.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void setDebugHold(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        debugHold = on;
        try {
            if (on) {
                if (debugLock == null) {
                    PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                    if (pm != null) {
                        debugLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jarvis:debug");
                        debugLock.setReferenceCounted(false);
                    }
                }
                if (debugLock != null && !debugLock.isHeld()) debugLock.acquire();
            } else if (debugLock != null && debugLock.isHeld()) {
                debugLock.release();
            }
        } catch (Exception ignored) {
        }
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("on", debugHold);
        call.resolve(r);
    }

    @PluginMethod
    public void takePhoto(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "onCamThenPhoto");
            return;
        }
        launchPhoto(call);
    }

    @PermissionCallback
    private void onCamThenPhoto(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Kamera erlauben — sonst kein Foto.");
            call.resolve(r);
            return;
        }
        launchPhoto(call);
    }

    private File photoFile;

    private void launchPhoto(PluginCall call) {
        call.setKeepAlive(true);
        Activity a = getActivity();
        if (a == null) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Keine Activity für die Kamera.");
            call.resolve(r);
            return;
        }
        try {
            File dir = new File(getContext().getCacheDir(), "jarvis-eye");
            if (!dir.exists()) dir.mkdirs();
            photoFile = new File(dir, "shot.jpg");
            if (!photoFile.exists()) photoFile.createNewFile();
            android.net.Uri uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    photoFile);
            Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            i.putExtra(MediaStore.EXTRA_OUTPUT, uri);
            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivityForResult(call, i, "onPhotoDone");
        } catch (Exception e) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Kamera nicht geöffnet.");
            call.resolve(r);
        }
    }

    @ActivityCallback
    private void onPhotoDone(PluginCall call, ActivityResult result) {
        JSObject r = new JSObject();
        try {
            if (photoFile == null || !photoFile.exists() || photoFile.length() < 32) {
                r.put("ok", false);
                r.put("message", "Kein Foto. Nochmal mit Kamera oder Galerie.");
                call.resolve(r);
                return;
            }
            Bitmap bmp = BitmapFactory.decodeFile(photoFile.getAbsolutePath());
            if (bmp == null) {
                FileInputStream in = new FileInputStream(photoFile);
                ByteArrayOutputStream rawOut = new ByteArrayOutputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = in.read(buf)) > 0) rawOut.write(buf, 0, n);
                in.close();
                r.put("ok", true);
                r.put("dataUrl", "data:image/jpeg;base64," + Base64.encodeToString(rawOut.toByteArray(), Base64.NO_WRAP));
                call.resolve(r);
                return;
            }
            int max = 1600;
            int w = bmp.getWidth();
            int h = bmp.getHeight();
            if (Math.max(w, h) > max) {
                float scale = max / (float) Math.max(w, h);
                bmp = Bitmap.createScaledBitmap(bmp, Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)), true);
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.JPEG, 84, bos);
            r.put("ok", true);
            r.put("dataUrl", "data:image/jpeg;base64," + Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP));
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Foto nicht lesbar.");
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
