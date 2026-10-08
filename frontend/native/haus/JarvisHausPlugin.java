package app.jarvis.haus;

import android.Manifest;
import android.content.Context;
import android.net.wifi.WifiManager;
import app.jarvis.device.DeviceTls;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLServerSocket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletionService;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
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
    private SSLServerSocket server;
    private Thread loop;
    private volatile boolean alive;
    private volatile int generation;
    private final AtomicReference<String> standAt = new AtomicReference<>("");
    private volatile boolean persistent;
    private static final int HOME_PORT = 8765;
    private final ConcurrentHashMap<String, IncomingAck> incomingAcks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> requestIds = new ConcurrentHashMap<>();

    private static final class IncomingAck {
        final CountDownLatch latch = new CountDownLatch(1);
        volatile String status = "failed";
        volatile String syncRevision = "";
    }

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
        if (persistent && alive && server != null) {
            hosted.set(json);
            String url = "https://" + ip + ":" + server.getLocalPort();
            String fingerprint = DeviceTls.fingerprint(getContext());
            JSObject r = new JSObject();
            r.put("ok", true);
            r.put("url", url);
            r.put("code", "jarvis-haus:v3|" + url + "|" + token.get() + "|" + fingerprint);
            call.resolve(r);
            return;
        }
        stopServer();
        String next = token();
        token.set(next);
        hosted.set(json);
        try {
            SSLServerSocket sock = DeviceTls.serverSocket(getContext(), ip, 0);
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
            String url = "https://" + ip + ":" + sock.getLocalPort();
            String fingerprint = DeviceTls.fingerprint(getContext());
            JSObject r = new JSObject();
            r.put("ok", true);
            r.put("url", url);
            r.put("code", "jarvis-haus:v3|" + url + "|" + next + "|" + fingerprint);
            call.resolve(r);
        } catch (Exception e) {
            stopServer();
            refuse(call, "Das WLAN-Tor geht nicht auf.");
        }
    }


    /** Dauerhafter Hausstand-Server fürs Tablet. Die Kennung bleibt gespeichert. */
    @PluginMethod
    public void serverStart(PluginCall call) {
        String json = call.getString("json", "");
        if (json == null || json.length() < 2) json = "{}";
        if (json.length() > MAX_BODY) {
            refuse(call, "Hausstand ist zu groß für den Server.");
            return;
        }
        String ip = lanIp();
        if (ip == null) {
            refuse(call, "Kein WLAN. Das Tablet braucht das Heimnetz.");
            return;
        }
        boolean rotate = Boolean.TRUE.equals(call.getBoolean("rotate", false));
        try {
            if (!(persistent && alive && server != null)) {
                stopServer();
                SSLServerSocket sock = DeviceTls.serverSocket(getContext(), ip, HOME_PORT);
                sock.setReuseAddress(true);
                server = sock;
                alive = true;
                persistent = true;
                generation++;
                loop = new Thread(this::acceptLoop, "jarvis-haus-home");
                loop.start();
            }
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("jarvis_haus", Context.MODE_PRIVATE);
            String saved = prefs.getString("token", "");
            if (rotate || saved == null || saved.length() < 12) {
                saved = token() + token();
                prefs.edit().putString("token", saved).apply();
            }
            token.set(saved);
            hosted.set(json);
            standAt.set(cleanStamp(call.getString("standAt", "")));
            JarvisHausService.start(getContext());
            int port = server.getLocalPort();
            String base = "https://" + ip + ":" + port;
            String fingerprint = DeviceTls.fingerprint(getContext());
            JSObject r = new JSObject();
            r.put("ok", true);
            r.put("url", base);
            r.put("port", port);
            r.put("token", saved);
            r.put("fingerprint", fingerprint);
            r.put("code", "jarvis-haus:v3|" + base + "|" + saved + "|" + fingerprint);
            call.resolve(r);
        } catch (Exception e) {
            stopServer();
            refuse(call, "Der Hausstand-Server startet nicht.");
        }
    }

    @PluginMethod
    public void serverUpdate(PluginCall call) {
        String json = call.getString("json", "");
        if (!persistent || !alive || json == null || json.length() < 2 || json.length() > MAX_BODY) {
            refuse(call, "Der Hausstand-Server läuft nicht.");
            return;
        }
        hosted.set(json);
        standAt.set(cleanStamp(call.getString("standAt", "")));
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void serverStop(PluginCall call) {
        stopServer();
        JarvisHausService.stop(getContext());
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @PluginMethod
    public void serverState(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("running", persistent && alive && server != null);
        r.put("ip", lanIp());
        if (server != null) r.put("port", server.getLocalPort());
        call.resolve(r);
    }

    /** Sucht den Hausstand-Server im eigenen /24-Netz. Ohne Kennung keine Antwort vom Server. */
    @PluginMethod
    public void discover(PluginCall call) {
        final String tok = call.getString("token", "");
        final String hint = call.getString("hint", "");
        final int port = call.getInt("port", HOME_PORT);
        final String fingerprint = call.getString("fingerprint", "");
        if (tok == null || tok.length() < 12 || fingerprint == null || !fingerprint.matches("(?i)[0-9a-f]{64}")) {
            refuse(call, "Sichere Kopplung fehlt. Bitte beide Geräte neu koppeln.");
            return;
        }
        final String ownVersion = appVersion();
        final String own = lanIp();
        new Thread(() -> {
            String[] hit = null;
            if (hint != null && !hint.isEmpty()) hit = probe(hint, port, tok, fingerprint, ownVersion);
            if (hit == null && own != null) {
                String prefix = own.substring(0, own.lastIndexOf('.') + 1);
                ExecutorService pool = Executors.newFixedThreadPool(48);
                CompletionService<String[]> cs = new ExecutorCompletionService<>(pool);
                List<Future<String[]>> all = new ArrayList<>();
                int count = 0;
                for (int i = 1; i < 255; i++) {
                    final String host = prefix + i;
                    if (host.equals(own) || host.equals(hint)) continue;
                    all.add(cs.submit(() -> probe(host, port, tok, fingerprint, ownVersion)));
                    count++;
                }
                try {
                    for (int i = 0; i < count && hit == null; i++) {
                        Future<String[]> f = cs.poll(12, TimeUnit.SECONDS);
                        if (f == null) break;
                        try {
                            hit = f.get();
                        } catch (Exception ignored) {
                            /* nächster Host */
                        }
                    }
                } catch (InterruptedException ignored) {
                    /* abgebrochen */
                }
                pool.shutdownNow();
            }
            JSObject r = new JSObject();
            if (hit == null) {
                r.put("ok", false);
                r.put("message", "Kein Hausstand-Server im WLAN gefunden.");
            } else {
                r.put("ok", true);
                r.put("host", hit[0]);
                r.put("url", "https://" + hit[0] + ":" + port);
                r.put("standAt", hit[1]);
                r.put("appVersion", hit[2]);
                r.put("protocolVersion", Integer.parseInt(hit[3]));
                r.put("fingerprint", fingerprint);
                r.put("syncRevision", hit[4]);
            }
            call.resolve(r);
        }, "jarvis-haus-discover").start();
    }

    private String[] probe(String host, int port, String tok, String fingerprint, String ownVersion) {
        try {
            HttpsURLConnection conn = (HttpsURLConnection) new URL("https://" + host + ":" + port + "/ping").openConnection();
            conn.setSSLSocketFactory(DeviceTls.clientSocketFactory(getContext(), fingerprint));
            conn.setHostnameVerifier((hostname, session) -> true);
            conn.setConnectTimeout(700);
            conn.setReadTimeout(1500);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + tok);
            conn.setRequestProperty("X-Jarvis-App-Version", ownVersion);
            conn.setRequestProperty("X-Jarvis-Protocol", "3");
            conn.setRequestProperty("X-Jarvis-Request-ID", java.util.UUID.randomUUID().toString());
            conn.setRequestProperty("X-Jarvis-Request-Time", Long.toString(System.currentTimeMillis()));
            if (conn.getResponseCode() != 200) {
                conn.disconnect();
                return null;
            }
            String text = readStream(conn.getInputStream(), 2000);
            conn.disconnect();
            JSONObject ping = new JSONObject(text);
            if (ping.optInt("jarvis", 0) != 1) return null;
            JSONObject revision = ping.optJSONObject("sync_revision");
            return new String[] {
                    host,
                    ping.optString("stand_at", ""),
                    ping.optString("app_version", ""),
                    Integer.toString(ping.optInt("protocol_version", 0)),
                    revision == null ? "" : revision.toString()
            };
        } catch (Exception e) {
            return null;
        }
    }

    private String appVersion() {
        try {
            android.content.pm.PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            return info.versionName == null ? "" : info.versionName;
        } catch (Exception e) {
            return "";
        }
    }

    private static String cleanStamp(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("[^0-9TZ:.+\\-]", "");
    }

    private static boolean sameToken(String want, String got) {
        if (want == null || got == null || want.isEmpty()) return false;
        return MessageDigest.isEqual(want.getBytes(StandardCharsets.UTF_8), got.getBytes(StandardCharsets.UTF_8));
    }

    @PluginMethod
    public void pull(PluginCall call) {
        String url = call.getString("url", "");
        exchange(call, url, call.getString("token", ""), call.getString("fingerprint", ""), "GET", null);
    }

    @PluginMethod
    public void push(PluginCall call) {
        String url = call.getString("url", "");
        String json = call.getString("json", "");
        if (json == null || json.length() < 2) {
            refuse(call, "Hausstand ist leer.");
            return;
        }
        exchange(call, url, call.getString("token", ""), call.getString("fingerprint", ""), "POST", json);
    }

    @PluginMethod
    public void acknowledgeIncoming(PluginCall call) {
        String requestId = call.getString("requestId", "");
        String status = call.getString("status", "failed");
        String revision = call.getString("syncRevision", "");
        IncomingAck ack = incomingAcks.remove(requestId);
        if (ack == null || !("applied".equals(status) || "same".equals(status)
                || "conflict".equals(status) || "failed".equals(status))) {
            refuse(call, "Die Sync-Anfrage ist abgelaufen oder ungültig.");
            return;
        }
        ack.status = status;
        ack.syncRevision = revision == null ? "" : revision;
        ack.latch.countDown();
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
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

    private void exchange(PluginCall call, String url, String tok, String fingerprint, String method, String json) {
        if (url == null || !url.startsWith("https://") || url.contains("?")
                || tok == null || tok.length() < 12
                || fingerprint == null || !fingerprint.matches("(?i)[0-9a-f]{64}")) {
            refuse(call, "Das ist kein Hausstand-Code.");
            return;
        }
        try {
            HttpsURLConnection conn = (HttpsURLConnection) new URL(url + "/hausstand").openConnection();
            conn.setSSLSocketFactory(DeviceTls.clientSocketFactory(getContext(), fingerprint));
            conn.setHostnameVerifier((hostname, session) -> true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(20000);
            conn.setRequestMethod(method);
            conn.setRequestProperty("Authorization", "Bearer " + tok);
            conn.setRequestProperty("X-Jarvis-App-Version", appVersion());
            conn.setRequestProperty("X-Jarvis-Protocol", "3");
            conn.setRequestProperty("X-Jarvis-Request-ID", java.util.UUID.randomUUID().toString());
            conn.setRequestProperty("X-Jarvis-Request-Time", Long.toString(System.currentTimeMillis()));
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
            if (status == 409 || status == 422) {
                JSObject r = new JSObject();
                r.put("ok", true);
                r.put("json", text);
                call.resolve(r);
                return;
            }
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
            SSLServerSocket open = server;
            if (open == null) return;
            try {
                Socket client = open.accept();
                client.setSoTimeout(8000);
                ((javax.net.ssl.SSLSocket) client).startHandshake();
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
            String authorization = headerValue(lines, "authorization");
            String got = authorization.startsWith("Bearer ") ? authorization.substring(7) : "";
            String remoteVersion = headerValue(lines, "x-jarvis-app-version");
            String remoteProtocol = headerValue(lines, "x-jarvis-protocol");
            boolean ping = target.startsWith("/ping");
            if ((!ping && !"/hausstand".equals(target)) || !sameToken(want, got)) {
                write(sock, 404, "");
                return;
            }
            if (ping && "GET".equals(method)) {
                JSONObject backup = new JSONObject(hosted.get());
                JSONObject pingReply = new JSONObject();
                pingReply.put("jarvis", 1);
                pingReply.put("protocol_version", 3);
                pingReply.put("app_version", appVersion());
                pingReply.put("stand_at", standAt.get());
                pingReply.put("sync_revision", backup.optJSONObject("sync_revision"));
                write(sock, 200, pingReply.toString());
                return;
            }
            if (!appVersion().equals(remoteVersion) || !"3".equals(remoteProtocol)) {
                write(sock, 409, "{\"ok\":false,\"message\":\"version_mismatch\"}");
                return;
            }
            if ("GET".equals(method)) {
                write(sock, 200, hosted.get());
                return;
            }
            if ("POST".equals(method)) {
                String requestId = headerValue(lines, "x-jarvis-request-id");
                long requestTime;
                try {
                    requestTime = Long.parseLong(headerValue(lines, "x-jarvis-request-time"));
                } catch (NumberFormatException e) {
                    write(sock, 400, "{\"ok\":false,\"status\":\"failed\"}");
                    return;
                }
                long now = System.currentTimeMillis();
                requestIds.entrySet().removeIf(entry -> now - entry.getValue() > 120_000L);
                if (!requestId.matches("(?i)[0-9a-f-]{36}")
                        || Math.abs(now - requestTime) > 120_000L
                        || requestIds.putIfAbsent(requestId, requestTime) != null) {
                    write(sock, 409, "{\"ok\":false,\"status\":\"replay\"}");
                    return;
                }
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
                ev.put("requestId", requestId);
                IncomingAck ack = new IncomingAck();
                incomingAcks.put(requestId, ack);
                notifyListeners("incoming", ev);
                boolean completed;
                try {
                    completed = ack.latch.await(20, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    completed = false;
                }
                incomingAcks.remove(requestId, ack);
                if (!completed) {
                    write(sock, 504, "{\"ok\":false,\"status\":\"timeout\"}");
                    return;
                }
                JSONObject response = new JSONObject();
                response.put("ok", "applied".equals(ack.status) || "same".equals(ack.status));
                response.put("status", ack.status);
                if (!ack.syncRevision.isEmpty()) response.put("sync_revision", new JSONObject(ack.syncRevision));
                boolean accepted = "applied".equals(ack.status) || "same".equals(ack.status);
                write(sock, accepted ? 200 : 409, response.toString());
                return;
            }
            write(sock, 405, "");
        } catch (Exception ignored) {
            /* nächster Versuch */
        }
    }

    private static String headerValue(String[] lines, String name) {
        String prefix = name.toLowerCase(java.util.Locale.ROOT) + ":";
        for (String line : lines) {
            if (line.toLowerCase(java.util.Locale.ROOT).startsWith(prefix)) {
                return line.substring(prefix.length()).trim();
            }
        }
        return "";
    }

    private static String jsonEscape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
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
        SSLServerSocket open = server;
        server = null;
        if (open != null) {
            try {
                open.close();
            } catch (Exception ignored) {
                /* */
            }
        }
        persistent = false;
        token.set("");
        hosted.set("");
        standAt.set("");
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
