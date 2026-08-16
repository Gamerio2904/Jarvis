package app.jarvis.notify;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class JarvisAlarmActivity extends Activity {
    private MediaPlayer player;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (km != null && Build.VERSION.SDK_INT >= 26) {
            km.requestDismissKeyguard(this, null);
        }

        String title = getIntent() != null ? getIntent().getStringExtra("title") : null;
        String body = getIntent() != null ? getIntent().getStringExtra("body") : null;
        String tone = getIntent() != null ? getIntent().getStringExtra("tone") : null;
        if (title == null || title.isEmpty()) title = "Jarvis";
        if (body == null) body = "";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        int pad = (int) (28 * getResources().getDisplayMetrics().density);
        root.setPadding(pad, pad, pad, pad);
        root.setBackgroundColor(0xFF121212);

        TextView h = new TextView(this);
        h.setText(title);
        h.setTextColor(0xFFE8F5E9);
        h.setTextSize(28);
        h.setGravity(Gravity.CENTER);
        root.addView(h);

        TextView p = new TextView(this);
        p.setText(body);
        p.setTextColor(0xFFB0B0B0);
        p.setTextSize(18);
        p.setGravity(Gravity.CENTER);
        p.setPadding(0, pad / 2, 0, pad);
        root.addView(p);

        Button stop = new Button(this);
        stop.setText("Aus");
        stop.setOnClickListener((View v) -> finish());
        root.addView(stop);
        setContentView(root);
        startSound(tone);
    }

    private void startSound(String tone) {
        ensureAlarmVolume();
        Uri custom = null;
        if (tone != null && !tone.isEmpty()) custom = Uri.parse(tone);
        if (custom == null) {
            String saved = getSharedPreferences("jarvis_notify", MODE_PRIVATE).getString("alarm_tone", "");
            if (saved != null && !saved.isEmpty()) custom = Uri.parse(saved);
        }
        boolean ok = playUri(custom)
                || playUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
                || playUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
                || playUri(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                || playRaw();
        if (!ok) {
            try {
                android.media.Ringtone ring = RingtoneManager.getRingtone(
                        this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
                if (ring != null) {
                    if (Build.VERSION.SDK_INT >= 28) ring.setLooping(true);
                    ring.play();
                }
            } catch (Exception ignored) {
            }
        }
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 400, 400}, 0));
            } else {
                vibrator.vibrate(new long[]{0, 400, 400}, 0);
            }
        }
    }

    private void ensureAlarmVolume() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return;
            int max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            if (max <= 0) return;
            if (am.getStreamVolume(AudioManager.STREAM_ALARM) == 0) {
                am.setStreamVolume(AudioManager.STREAM_ALARM, Math.max(1, (max * 3) / 4), 0);
            }
        } catch (Exception ignored) {
        }
    }

    private AudioAttributes alarmAttrs() {
        AudioAttributes.Builder b = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION);
        if (Build.VERSION.SDK_INT >= 21) {
            b.setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED);
        }
        return b.build();
    }

    private boolean playUri(Uri uri) {
        if (uri == null) return false;
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(alarmAttrs());
            mp.setDataSource(this, uri);
            mp.setLooping(true);
            mp.setVolume(1f, 1f);
            mp.prepare();
            mp.start();
            if (mp.isPlaying()) {
                player = mp;
                return true;
            }
        } catch (Exception ignored) {
        }
        try {
            mp.release();
        } catch (Exception ignored) {
        }
        return false;
    }

    private boolean playRaw() {
        int resId = getResources().getIdentifier("jarvis_alarm", "raw", getPackageName());
        if (resId == 0) return false;
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(alarmAttrs());
            android.content.res.AssetFileDescriptor afd = getResources().openRawResourceFd(resId);
            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mp.setLooping(true);
            mp.setVolume(1f, 1f);
            mp.prepare();
            mp.start();
            if (mp.isPlaying()) {
                player = mp;
                return true;
            }
        } catch (Exception ignored) {
        }
        try {
            mp.release();
        } catch (Exception ignored) {
        }
        return false;
    }

    @Override
    protected void onDestroy() {
        if (player != null) {
            try {
                player.stop();
            } catch (Exception ignored) {
            }
            try {
                player.release();
            } catch (Exception ignored) {
            }
            player = null;
        }
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {
            }
        }
        super.onDestroy();
    }
}
