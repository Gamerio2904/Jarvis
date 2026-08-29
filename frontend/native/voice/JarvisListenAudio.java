package app.jarvis.voice;

import android.content.Context;
import android.media.AudioManager;
import android.os.Build;

/**
 * Recognition start/stop clicks live on SYSTEM / NOTIFICATION / RING.
 * Hold for the whole listen session so internal restarts stay silent.
 */
final class JarvisListenAudio {
    private static int holds;
    private static boolean muted;
    private static int vNotif;
    private static int vSystem;
    private static int vRing;
    private static int vDtmf;

    private JarvisListenAudio() {}

    static synchronized void hold(Context ctx) {
        holds += 1;
        if (holds == 1) mute(ctx);
    }

    static synchronized void release(Context ctx) {
        if (holds > 0) holds -= 1;
        if (holds == 0) unmute(ctx);
    }

    private static void mute(Context ctx) {
        AudioManager am = audio(ctx);
        if (am == null || muted) return;
        try {
            vNotif = am.getStreamVolume(AudioManager.STREAM_NOTIFICATION);
            vSystem = am.getStreamVolume(AudioManager.STREAM_SYSTEM);
            vRing = am.getStreamVolume(AudioManager.STREAM_RING);
            vDtmf = am.getStreamVolume(AudioManager.STREAM_DTMF);
            muted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, AudioManager.ADJUST_MUTE, 0);
                am.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_MUTE, 0);
                am.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_MUTE, 0);
                am.adjustStreamVolume(AudioManager.STREAM_DTMF, AudioManager.ADJUST_MUTE, 0);
            }
            am.setStreamVolume(AudioManager.STREAM_NOTIFICATION, 0, 0);
            am.setStreamVolume(AudioManager.STREAM_SYSTEM, 0, 0);
            am.setStreamVolume(AudioManager.STREAM_RING, 0, 0);
            am.setStreamVolume(AudioManager.STREAM_DTMF, 0, 0);
        } catch (Exception ignored) {
        }
    }

    private static void unmute(Context ctx) {
        if (!muted) return;
        AudioManager am = audio(ctx);
        muted = false;
        if (am == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, AudioManager.ADJUST_UNMUTE, 0);
                am.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_UNMUTE, 0);
                am.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_UNMUTE, 0);
                am.adjustStreamVolume(AudioManager.STREAM_DTMF, AudioManager.ADJUST_UNMUTE, 0);
            }
            am.setStreamVolume(AudioManager.STREAM_NOTIFICATION, vNotif, 0);
            am.setStreamVolume(AudioManager.STREAM_SYSTEM, vSystem, 0);
            am.setStreamVolume(AudioManager.STREAM_RING, vRing, 0);
            am.setStreamVolume(AudioManager.STREAM_DTMF, vDtmf, 0);
        } catch (Exception ignored) {
        }
    }

    private static AudioManager audio(Context ctx) {
        if (ctx == null) return null;
        return (AudioManager) ctx.getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
    }
}
