package app.jarvis.voice;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.Locale;

public class JarvisWakeService extends Service {
    public static final String ACTION_START = "app.jarvis.voice.WAKE_START";
    public static final String ACTION_STOP = "app.jarvis.voice.WAKE_STOP";
    public static final String PREFS = "jarvis_wake";
    private static final String CHANNEL = "jarvis_wake";
    private static volatile boolean running = false;
    private static volatile boolean paused = false;
    private static JarvisWakeService inst;
    private SpeechRecognizer rec;
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean armed = false;
    private PowerManager.WakeLock cpuLock;

    public static boolean isRunning() {
        return running;
    }

    public static boolean wantEnabled(Context ctx) {
        return ctx.getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("on", false);
    }

    public static void setWantEnabled(Context ctx, boolean on) {
        ctx.getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("on", on).apply();
    }

    public static void pauseListen() {
        paused = true;
        JarvisWakeService s = inst;
        if (s == null) return;
        s.armed = false;
        s.main.post(s::stopRec);
    }

    public static void resumeListen(Context ctx) {
        paused = false;
        JarvisWakeService s = inst;
        if (s == null || !running) return;
        s.armed = true;
        s.main.post(s::listen);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            setWantEnabled(this, false);
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        paused = false;
        inst = this;
        setWantEnabled(this, true);
        startFg();
        holdCpu();
        armed = true;
        main.removeCallbacksAndMessages(null);
        main.post(this::listen);
        return START_STICKY;
    }

    private void startFg() {
        Notification n = note();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(71, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(71, n);
        }
    }

    private void holdCpu() {
        if (cpuLock != null && cpuLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm == null) return;
        cpuLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "jarvis:wake");
        cpuLock.setReferenceCounted(false);
        cpuLock.acquire();
    }

    private Notification note() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                nm.createNotificationChannel(new NotificationChannel(
                        CHANNEL, "Wake-Word", NotificationManager.IMPORTANCE_LOW));
            }
        }
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open != null) {
            open.setAction(Intent.ACTION_VIEW);
            open.setData(Uri.parse("jarvis://voice"));
            open.putExtra("jarvis_mode", "voice");
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(this, 71, open, flags);

        Intent stopI = new Intent(this, JarvisWakeService.class);
        stopI.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 72, stopI, flags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentTitle("Jarvis hört auf den Namen")
                .setContentText("Bildschirm aus und andere Apps: nur „Jarvis“. Beenden in der Meldung.")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(0, "Beenden", stopPi);
        if (pi != null) b.setContentIntent(pi);
        return b.build();
    }

    private void listen() {
        if (!armed || paused) return;
        if (!SpeechRecognizer.isRecognitionAvailable(this)) return;
        stopRec();
        rec = makeRecognizer();
        rec.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onError(int error) {
                if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                        || error == SpeechRecognizer.ERROR_CLIENT) {
                    restart(900);
                    return;
                }
                restart(error == SpeechRecognizer.ERROR_NO_MATCH ? 250 : 500);
            }
            @Override public void onResults(Bundle results) { hit(results); restart(350); }
            @Override public void onPartialResults(Bundle results) { hit(results); }
            @Override public void onEvent(int eventType, Bundle params) {}
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "de-DE");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        i.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 900L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 700L);
        try {
            rec.startListening(i);
        } catch (Exception e) {
            restart(800);
        }
    }

    private SpeechRecognizer makeRecognizer() {
        if (Build.VERSION.SDK_INT >= 31) {
            try {
                SpeechRecognizer onDev = SpeechRecognizer.createOnDeviceSpeechRecognizer(this);
                if (onDev != null) return onDev;
            } catch (Exception ignored) {
            }
        }
        return SpeechRecognizer.createSpeechRecognizer(this);
    }

    private void hit(Bundle results) {
        if (results == null || paused) return;
        ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (list == null) return;
        for (String s : list) {
            if (s == null) continue;
            String n = s.toLowerCase(Locale.GERMAN).replace(" ", "");
            if (n.contains("jarvis") || n.contains("service")) {
                openVoice();
                return;
            }
        }
    }

    private void openVoice() {
        armed = false;
        stopRec();
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("jarvis://voice"));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            i.putExtra("jarvis_mode", "voice");
            startActivity(i);
        } catch (Exception ignored) {
        }
        main.postDelayed(() -> {
            if (running && !paused) {
                armed = true;
                listen();
            }
        }, 2800);
    }

    private void restart(int delayMs) {
        if (!armed || paused) return;
        main.postDelayed(this::listen, delayMs);
    }

    private void stopRec() {
        if (rec == null) return;
        try {
            rec.cancel();
            rec.destroy();
        } catch (Exception ignored) {
        }
        rec = null;
    }

    @Override
    public void onDestroy() {
        armed = false;
        running = false;
        paused = false;
        if (inst == this) inst = null;
        main.removeCallbacksAndMessages(null);
        stopRec();
        if (cpuLock != null && cpuLock.isHeld()) {
            try {
                cpuLock.release();
            } catch (Exception ignored) {
            }
        }
        cpuLock = null;
        super.onDestroy();
    }

    public static void start(Context ctx) {
        setWantEnabled(ctx, true);
        Intent i = new Intent(ctx, JarvisWakeService.class);
        i.setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    public static void stop(Context ctx) {
        setWantEnabled(ctx, false);
        Intent i = new Intent(ctx, JarvisWakeService.class);
        i.setAction(ACTION_STOP);
        ctx.startService(i);
        ctx.stopService(new Intent(ctx, JarvisWakeService.class));
    }
}
