package app.jarvis.notify;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class JarvisAlarmActivity extends Activity {
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
        String mode = getIntent() != null ? getIntent().getStringExtra("mode") : null;
        String say = getIntent() != null ? getIntent().getStringExtra("say") : null;
        if (title == null || title.isEmpty()) title = "Jarvis";
        if (body == null) body = "";
        boolean speak = JarvisNotifyPlugin.isTimerSpeak(mode, title);
        if (speak) {
            mode = "speak";
            tone = "";
        }
        if (speak && (say == null || say.isEmpty())) {
            say = JarvisNotifyPlugin.timerSpokenLine(body);
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        int pad = (int) (28 * getResources().getDisplayMetrics().density);
        root.setPadding(pad, pad, pad, pad);
        root.setBackgroundColor(0xFF121212);

        TextView h = new TextView(this);
        String heading = speak
                ? (body != null && !body.isEmpty() && !"Timer".equalsIgnoreCase(body) ? body : "Jarvis")
                : title;
        h.setText(heading);
        h.setTextColor(0xFFE8F5E9);
        h.setTextSize(28);
        h.setGravity(Gravity.CENTER);
        root.addView(h);

        TextView p = new TextView(this);
        p.setText(speak && say != null && !say.isEmpty() ? say : body);
        p.setTextColor(0xFFB0B0B0);
        p.setTextSize(18);
        p.setGravity(Gravity.CENTER);
        p.setPadding(0, pad / 2, 0, pad);
        root.addView(p);

        Button stop = new Button(this);
        stop.setText("Aus");
        stop.setOnClickListener((View v) -> halt());
        root.addView(stop);
        setContentView(root);
        JarvisAlarmService.start(this, title, body, speak ? "" : tone, mode, say);
        if (!speak) JarvisAlarmPlayer.start(this, tone);
    }

    private void halt() {
        JarvisTimerVoice.stop();
        JarvisAlarmPlayer.stop();
        JarvisAlarmService.stop(this);
        finish();
    }

    @Override
    public void onBackPressed() {
        halt();
    }

    @Override
    protected void onDestroy() {
        if (isFinishing()) JarvisAlarmPlayer.stop();
        super.onDestroy();
    }
}
