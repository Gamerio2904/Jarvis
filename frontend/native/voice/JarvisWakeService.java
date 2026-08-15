package app.jarvis.voice;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.Locale;

public class JarvisWakeService extends Service {
    public static final String ACTION_START = "app.jarvis.voice.WAKE_START";
    public static final String ACTION_STOP = "app.jarvis.voice.WAKE_STOP";
    private static final String CHANNEL = "jarvis_wake";
    private static volatile boolean running = false;
    private SpeechRecognizer rec;
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean armed = false;

    public static boolean isRunning() {
        return running;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        startForeground(71, note());
        armed = true;
        main.post(this::listen);
        return START_STICKY;
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
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(this, 71, open, flags);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentTitle("Jarvis hört auf den Namen")
                .setContentText("Bildschirm darf aus sein. Gerät komplett aus: nein.")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW);
        if (pi != null) b.setContentIntent(pi);
        return b.build();
    }

    private void listen() {
        if (!armed) return;
        if (!SpeechRecognizer.isRecognitionAvailable(this)) return;
        stopRec();
        rec = SpeechRecognizer.createSpeechRecognizer(this);
        rec.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onError(int error) { restart(); }
            @Override public void onResults(Bundle results) { hit(results); restart(); }
            @Override public void onPartialResults(Bundle results) { hit(results); }
            @Override public void onEvent(int eventType, Bundle params) {}
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        try {
            rec.startListening(i);
        } catch (Exception e) {
            restart();
        }
    }

    private void hit(Bundle results) {
        if (results == null) return;
        ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (list == null) return;
        for (String s : list) {
            if (s != null && s.toLowerCase(Locale.GERMAN).contains("jarvis")) {
                openVoice();
                return;
            }
        }
    }

    private void openVoice() {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("jarvis://voice"));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception ignored) {
        }
        main.postDelayed(this::listen, 2500);
    }

    private void restart() {
        if (!armed) return;
        main.postDelayed(this::listen, 400);
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
        main.removeCallbacksAndMessages(null);
        stopRec();
        super.onDestroy();
    }

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, JarvisWakeService.class);
        i.setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    public static void stop(Context ctx) {
        Intent i = new Intent(ctx, JarvisWakeService.class);
        i.setAction(ACTION_STOP);
        ctx.startService(i);
        ctx.stopService(new Intent(ctx, JarvisWakeService.class));
    }
}
