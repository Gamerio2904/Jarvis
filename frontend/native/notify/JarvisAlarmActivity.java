package app.jarvis.notify;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.Ringtone;
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
    private Ringtone ringtone;
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
        try {
            Uri uri = null;
            if (tone != null && !tone.isEmpty()) uri = Uri.parse(tone);
            if (uri == null) {
                String saved = getSharedPreferences("jarvis_notify", MODE_PRIVATE).getString("alarm_tone", "");
                if (saved != null && !saved.isEmpty()) uri = Uri.parse(saved);
            }
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            ringtone = RingtoneManager.getRingtone(this, uri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
                ringtone.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
                ringtone.play();
            }
        } catch (Exception ignored) {
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

    @Override
    protected void onDestroy() {
        if (ringtone != null) {
            try {
                ringtone.stop();
            } catch (Exception ignored) {
            }
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
