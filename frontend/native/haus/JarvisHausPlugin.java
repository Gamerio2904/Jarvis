package app.jarvis.haus;

import android.Manifest;
import android.content.Context;
import android.net.wifi.WifiManager;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.concurrent.atomic.AtomicReference;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Hausstand im WLAN. Der QR trägt nur Adresse und Kennung, nie die Datei. */
@CapacitorPlugin(
        name = "JarvisHaus",
        permissions = {@Permission(alias = "camera", strings = {Manifest.permission.CAMERA})})
public class JarvisHausPlugin extends Plugin {
    private static final int MAX_BODY = 8_000_000;
    private final AtomicReference<String> token = new AtomicReference<>("");
    private final AtomicReference<String> hosted = new AtomicReference<>("");
    private ServerSocket server;
    private Thread loop;
    private volatile boolean alive;
    private volatile int generation;

    @PluginMethod
    public void offer(PluginCall call) {
        String json = call.getString("json", "");
        if (json == null || json.length() < 2) {
            refuse(call, "Hausstand ist leer.");
            return;
        }
        if (json.length() > MAX_BODY) {
            refuse(call, "Hausstand ist zu groß für den Übertrag.");
            return;
        }
        String ip = lanIp();
        if (ip == null) {
            refuse(call, "Kein WLAN. Beide Geräte ins selbe Netz, dann den Satz nochmal.");
            return;
        }
        stopServer();
        String next = token();
        token.set(next);
        hosted.set(json);
        try {
            ServerSocket sock = new ServerSocket(0);
            sock.setReuseAddress(true);
            server = sock;
            alive = true;
            loop = new Thread(this::acceptLoop, "jarvis-haus");
            loop.start();
            final int gen = ++generation;
            new Thread(() -> {
                try {
                    Thread.sleep(10 * 60 * 1000L);
                } catch (InterruptedException ignored) {
                    return;
                }
                if (generation == gen) stopServer();
            }, "jarvis-haus-stop").start();
            String url = "http://" + ip + ":" + sock.getLocalPort() + "/hausstand?t=" + next;
            JSObject r = new JSObject();
            r.put("ok", true);
            r.put("url", url);
            r.put("code", "jarvis-haus:v1|" + url);
            call.resolve(r);
        } catch (Exception e) {
            stopServer();
            refuse(call, "Das WLAN-Tor geht nicht auf.");
        }
    }

    @PluginMethod
    public void pull(PluginCall call) {
        String url = call.getString("url", "");
        exchange(call, url, "GET", null);
    }

    @PluginMethod
    public void push(PluginCall call) {
        String url = call.getString("url", "");
        String json = call.getString("json", "");
        if (json == null || json.length() < 2) {
            refuse(call, "Hausstand ist leer.");
            return;
        }
        exchange(call, url, "POST", json);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopServer();
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void ensureCamera(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", true);
            call.resolve(r);
            return;
        }
        requestPermissionForAlias("camera", call, "onCamera");
    }

    @PermissionCallback
    private void onCamera(PluginCall call) {
        JSObject r = new JSObject();
        boolean ok = getPermissionState("camera") == PermissionState.GRANTED;
        r.put("ok", ok);
        if (!ok) r.put("message", "Kamera ist zu. In den App-Einstellungen erlauben.");
        call.resolve(r);
    }

    private void exchange(PluginCall call, String url, String method, String json) {
        if (url == null || !url.startsWith("http://") || !url.contains("/hausstand?t=")) {
            refuse(call, "Das ist kein Hausstand-Code.");
            return;
        }
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(20000);
            conn.setRequestMethod(method);
            if (json != null) {
                byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                conn.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream out = conn.getOutputStream()) {
                    out.write(bytes);
                }
            }
            int status = conn.getResponseCode();
            InputStream in = status >= 400 ? conn.getErrorStream() : conn.getInputStream();
            String text = in == null ? "" : readStream(in, MAX_BODY);
            conn.disconnect();
            if (status < 200 || status >= 300) {
                refuse(call, "Das andere Gerät hat nicht geantwortet.");
                return;
            }
            JSObject r = new JSObject();
            r.put("ok", true);
            r.put("json", text);
            call.resolve(r);
        } catch (Exception e) {
            refuse(call, "Keine Verbindung. Beide Geräte ins selbe WLAN.");
        }
    }

    private void acceptLoop() {
        while (alive) {
            ServerSocket open = server;
            if (open == null) return;
            try {
                Socket client = open.accept();
                client.setSoTimeout(8000);
                handle(client);
            } catch (Exception e) {
                if (!alive) return;
            }
        }
    }

    private void handle(Socket client) {
        try (Socket sock = client) {
            InputStream in = sock.getInputStream();
            ByteArrayOutputStream head = new ByteArrayOutputStream();
            int prev = -1;
            int b;
            while ((b = in.read()) >= 0) {
                head.write(b);
                if (head.size() > 16_000) break;
                if (prev == '\n' && b == '\n') break;
                if (prev == '\r' && b == '\n') {
                    byte[] soFar = head.toByteArray();
                    int n = soFar.length;
                    if (n >= 4 && soFar[n - 4] == '\r' && soFar[n - 3] == '\n' && soFar[n - 2] == '\r') break;
                }
                prev = b;
            }
            String header = head.toString(StandardCharsets.ISO_8859_1);
            String[] lines = header.split("\r\n");
            if (lines.length == 0) return;
            String[] req = lines[0].split(" ");
            if (req.length < 2) {
                write(sock, 400, "");
                return;
            }
            String method = req[0];
            String target = req[1];
            String want = token.get();
            String got = queryToken(target);
            if (!target.startsWith("/hausstand") || want.isEmpty() || !want.equals(got)) {
                write(sock, 404, "");
                return;
            }
            if ("GET".equals(method)) {
                write(sock, 200, hosted.get());
                return;
            }
            if ("POST".equals(method)) {
                int len = contentLength(lines);
                if (len < 2 || len > MAX_BODY) {
                    write(sock, 413, "");
                    return;
                }
                byte[] body = readExact(in, len);
                if (body == null) {
                    write(sock, 400, "");
                    return;
                }
                String json = new String(body, StandardCharsets.UTF_8);
                JSObject ev = new JSObject();
                ev.put("json", json);
                notifyListeners("incoming", ev);
                write(sock, 200, "{\"ok\":true}");
                return;
            }
            write(sock, 405, "");
        } catch (Exception ignored) {
            /* nächster Versuch */
        }
    }

    private static String queryToken(String target) {
        int q = target.indexOf("?t=");
        if (q < 0) return "";
        String rest = target.substring(q + 3);
        int amp = rest.indexOf('&');
        return amp < 0 ? rest : rest.substring(0, amp);
    }

    private static int contentLength(String[] lines) {
        for (String line : lines) {
            if (line.toLowerCase().startsWith("content-length:")) {
                try {
                    return Integer.parseInt(line.substring(15).trim());
                } catch (NumberFormatException e) {
                    return -1;
                }
            }
        }
        return -1;
    }

    private static byte[] readExact(InputStream in, int len) throws Exception {
        byte[] buf = new byte[len];
        int off = 0;
        while (off < len) {
            int n = in.read(buf, off, len - off);
            if (n < 0) return null;
            off += n;
        }
        return buf;
    }

    private static String readStream(InputStream in, int max) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) >= 0) {
            if (out.size() + n > max) break;
            out.write(buf, 0, n);
        }
        return out.toString(StandardCharsets.UTF_8);
    }

    private static void write(Socket sock, int status, String body) throws Exception {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        String text = status == 200 ? "OK" : "No";
        String head = "HTTP/1.1 " + status + " " + text + "\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: " + bytes.length + "\r\n"
                + "Connection: close\r\n\r\n";
        OutputStream out = sock.getOutputStream();
        out.write(head.getBytes(StandardCharsets.ISO_8859_1));
        out.write(bytes);
        out.flush();
    }

    private void stopServer() {
        alive = false;
        ServerSocket open = server;
        server = null;
        if (open != null) {
            try {
                open.close();
            } catch (Exception ignored) {
                /* */
            }
        }
        token.set("");
        hosted.set("");
    }

    private static String token() {
        byte[] raw = new byte[9];
        new SecureRandom().nextBytes(raw);
        StringBuilder sb = new StringBuilder();
        for (byte b : raw) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private String lanIp() {
        try {
            for (NetworkInterface nif : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!nif.isUp() || nif.isLoopback()) continue;
                for (InetAddress addr : Collections.list(nif.getInetAddresses())) {
                    if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
                    String host = addr.getHostAddress();
                    if (host == null || host.startsWith("169.254.")) continue;
                    if (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")) return host;
                }
            }
        } catch (Exception ignored) {
            /* WifiManager */
        }
        try {
            Context ctx = getContext();
            WifiManager wifi = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifi == null) return null;
            int ip = wifi.getConnectionInfo().getIpAddress();
            if (ip == 0) return null;
            return (ip & 0xff) + "." + ((ip >> 8) & 0xff) + "." + ((ip >> 16) & 0xff) + "." + ((ip >> 24) & 0xff);
        } catch (Exception e) {
            return null;
        }
    }

    private static void refuse(PluginCall call, String message) {
        JSObject r = new JSObject();
        r.put("ok", false);
        r.put("message", message);
        call.resolve(r);
    }
}
