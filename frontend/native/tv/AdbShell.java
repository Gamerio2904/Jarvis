package app.jarvis.tv;

import android.content.Context;

import java.io.File;

import dadb.AdbKeyPair;
import dadb.AdbShellResponse;
import dadb.Dadb;

final class AdbShell {
    private AdbShell() {}

    static String keyevent(Context ctx, String host, int port, int code) throws Exception {
        return shell(ctx, host, port, "input keyevent " + code);
    }

    static String shell(Context ctx, String host, int port, String cmd) throws Exception {
        File dir = new File(ctx.getFilesDir(), "adb");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new Exception("ADB-Schlüsselordner fehlt.");
        }
        File priv = new File(dir, "adbkey");
        File pub = new File(dir, "adbkey.pub");
        AdbKeyPair keys = AdbKeyPair.readOrGenerate(priv, pub);
        Dadb dadb = Dadb.create(host, port <= 0 ? 5555 : port, keys);
        try {
            AdbShellResponse res = dadb.shell(cmd);
            int code = res.getExitCode();
            String err = res.getErrorOutput();
            if (code != 0) {
                throw new Exception(
                    err != null && !err.trim().isEmpty() ? err.trim() : "ADB-Befehl fehlgeschlagen (" + code + ").");
            }
            String out = res.getOutput();
            return out == null ? "" : out;
        } finally {
            try {
                dadb.close();
            } catch (Exception ignored) {
            }
        }
    }
}
