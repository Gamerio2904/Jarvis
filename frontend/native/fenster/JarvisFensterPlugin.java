package app.jarvis.fenster;

import android.app.Activity;
import android.app.NotificationManager;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import app.jarvis.notify.JarvisNotifyPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Kopplung im selben WLAN. Bind nur an LAN-Adressen. Port 18792.
 * Kein Bildstrom. Eine Anfrage, ein Tipp, dann eine vorhandene Fläche.
 */
@CapacitorPlugin(name = "JarvisFenster")
public class JarvisFensterPlugin extends Plugin {

    private static final int PORT = 18792;
    private static final int NOTE_ID = 1879201;
    private static final int BACKLOG = 8;
    private static final int BODY_MAX = 8000;

    private final List<ServerSocket> sockets = new ArrayList<>();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile String kind = "handy";
    private volatile String deviceName = "Ultron";
    private volatile String lastJson = "";
    private volatile String lastHost = "";

    @PluginMethod
    public void listen(PluginCall call) {
        String nextKind = call.getString("kind", "handy");
        kind = "tablet".equals(nextKind) ? "tablet" : "handy";
        String nextName = call.getString("name", "Ultron");
        deviceName = nextName == null || nextName.isEmpty() ? "Ultron" : nextName;
        if (!running.get()) startLocked();
        JSObject r = new JSObject();
        r.put("ok", running.get());
        if (!running.get()) r.put("message", "Kein LAN. Die Kopplung bleibt zu.");
        call.resolve(r);
    }

    @PluginMethod
    public void seek(PluginCall call) {
        List<String> peers = scanSubnet();
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("peers", joinPeers(peers));
        call.resolve(r);
    }

    @PluginMethod
    public void post(PluginCall call) {
        String host = call.getString("host", "");
        Integer port = call.getInt("port", PORT);
        String json = call.getString("json", "");
        boolean ok = host != null && isLanHost(host) && json != null && sendPost(host, port == null ? PORT : port, json);
        JSObject r = new JSObject();
        r.put("ok", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void pending(PluginCall call) {
        JSObject r = new JSObject();
        String json = lastJson;
        r.put("ok", json != null && !json.isEmpty());
        r.put("json", json == null ? "" : json);
        r.put("fromHost", lastHost == null ? "" : lastHost);
        call.resolve(r);
    }

    @PluginMethod
    public void clearPending(PluginCall call) {
        lastJson = "";
        lastHost = "";
        try {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTE_ID);
        } catch (Exception ignored) {
            /* */
        }
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @Override
    public void handleOnDestroy() {
        stopLocked();
        super.handleOnDestroy();
    }

    private void startLocked() {
        stopLocked();
        List<InetAddress> addrs = lanAddresses();
        running.set(true);
        boolean any = false;
        for (InetAddress addr : addrs) {
            if (!isLan(addr) || addr.isLoopbackAddress()) continue;
            try {
                ServerSocket ss = new ServerSocket();
                ss.setReuseAddress(true);
                ss.bind(new InetSocketAddress(addr, PORT), BACKLOG);
                sockets.add(ss);
                Thread t = new Thread(() -> acceptLoop(ss), "jarvis-fenster-" + addr.getHostAddress());
                t.setDaemon(true);
                t.start();
                any = true;
            } catch (Exception ignored) {
                /* diese Adresse nicht */
            }
        }
        if (!any) running.set(false);
    }

    private void stopLocked() {
        running.set(false);
        for (ServerSocket ss : sockets) {
            try {
                ss.close();
            } catch (Exception ignored) {
                /* */
            }
        }
        sockets.clear();
    }

    private void acceptLoop(ServerSocket ss) {
        while (running.get() && !ss.isClosed()) {
            try {
                Socket sock = ss.accept();
                InetAddress remote = sock.getInetAddress();
                if (remote == null || !isLan(remote)) {
                    try {
                        sock.close();
                    } catch (Exception ignored) {
                        /* */
                    }
                    continue;
                }
                Thread w = new Thread(() -> handleConn(sock, remote), "jarvis-fenster-req");
                w.setDaemon(true);
                w.start();
            } catch (SocketException se) {
                if (!running.get()) return;
            } catch (Exception ignored) {
                if (!running.get()) return;
            }
        }
    }

    private void handleConn(Socket sock, InetAddress remote) {
        try {
            sock.setSoTimeout(4_000);
            BufferedReader in = new BufferedReader(new InputStreamReader(sock.getInputStream(), StandardCharsets.UTF_8));
            String requestLine = in.readLine();
            if (requestLine == null || requestLine.isEmpty()) {
                writeHttp(sock, 400, "{\"ok\":false}");
                return;
            }
            String[] parts = requestLine.split(" ");
            String method = parts.length > 0 ? parts[0] : "GET";
            String path = parts.length > 1 ? parts[1] : "/";
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            int contentLength = 0;
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon <= 0) continue;
                String key = line.substring(0, colon).trim();
                String val = line.substring(colon + 1).trim();
                if ("content-length".equalsIgnoreCase(key)) {
                    try {
                        contentLength = Integer.parseInt(val);
                    } catch (NumberFormatException ignored) {
                        contentLength = 0;
                    }
                }
            }
            if (contentLength > BODY_MAX) contentLength = BODY_MAX;
            StringBuilder body = new StringBuilder();
            if (contentLength > 0 && "POST".equalsIgnoreCase(method)) {
                char[] buf = new char[contentLength];
                int got = 0;
                while (got < contentLength) {
                    int n = in.read(buf, got, contentLength - got);
                    if (n < 0) break;
                    got += n;
                }
                body.append(buf, 0, got);
            }
            if ("GET".equalsIgnoreCase(method) && "/fenster".equals(path)) {
                String hello = "{\"ok\":true,\"name\":\"" + escape(deviceName) + "\",\"kind\":\"" + kind + "\"}";
                writeHttp(sock, 200, hello);
                return;
            }
            if ("POST".equalsIgnoreCase(method) && "/fenster".equals(path)) {
                String payload = body.toString();
                String host = remote.getHostAddress();
                lastJson = payload;
                lastHost = host;
                boolean pairing = payload.contains("\"op\":\"anfrage\"");
                main.post(() -> {
                    JSObject ev = new JSObject();
                    ev.put("json", payload);
                    ev.put("fromHost", host);
                    notifyListeners("anfrage", ev);
                    if (!pairing) return;
                    Activity act = getActivity();
                    boolean front = act != null && act.hasWindowFocus();
                    if (!front && getContext() != null) {
                        JarvisNotifyPlugin.showQuiet(
                                getContext(),
                                NOTE_ID,
                                "Ultron",
                                "Kopplungsanfrage. Antippen zum Bestätigen.");
                    }
                });
                writeHttp(sock, 200, "{\"ok\":true}");
                return;
            }
            writeHttp(sock, 404, "{\"ok\":false}");
        } catch (Exception ignored) {
            try {
                writeHttp(sock, 500, "{\"ok\":false}");
            } catch (Exception nested) {
                /* */
            }
        } finally {
            try {
                sock.close();
            } catch (Exception ignored) {
                /* */
            }
        }
    }

    private List<String> scanSubnet() {
        List<String> own = new ArrayList<>();
        List<String> bases = new ArrayList<>();
        for (InetAddress addr : lanAddresses()) {
            if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
            String ip = addr.getHostAddress();
            if (ip == null || !isLanHost(ip)) continue;
            own.add(ip);
            int cut = ip.lastIndexOf('.');
            if (cut > 0) bases.add(ip.substring(0, cut));
        }
        List<String> found = Collections.synchronizedList(new ArrayList<>());
        if (bases.isEmpty()) return found;
        ExecutorService pool = Executors.newFixedThreadPool(32);
        for (String base : bases) {
            for (int i = 1; i <= 254; i++) {
                String host = base + "." + i;
                if (own.contains(host)) continue;
                pool.submit(() -> {
                    String row = hello(host);
                    if (row != null) found.add(row);
                });
            }
        }
        pool.shutdown();
        try {
            pool.awaitTermination(2500, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        pool.shutdownNow();
        return found;
    }

    private String hello(String host) {
        Socket sock = new Socket();
        try {
            sock.connect(new InetSocketAddress(host, PORT), 120);
            sock.setSoTimeout(400);
            String req = "GET /fenster HTTP/1.1\r\nHost: " + host + "\r\nConnection: close\r\n\r\n";
            OutputStream out = sock.getOutputStream();
            out.write(req.getBytes(StandardCharsets.UTF_8));
            out.flush();
            BufferedReader in = new BufferedReader(new InputStreamReader(sock.getInputStream(), StandardCharsets.UTF_8));
            String status = in.readLine();
            if (status == null || !status.contains("200")) return null;
            StringBuilder rest = new StringBuilder();
            char[] buf = new char[512];
            int n;
            while ((n = in.read(buf)) >= 0 && rest.length() < 800) rest.append(buf, 0, n);
            String text = rest.toString();
            int brace = text.indexOf('{');
            if (brace < 0) return null;
            String json = text.substring(brace);
            if (!json.contains("\"ok\":true") && !json.contains("\"ok\": true")) return null;
            String peerKind = json.contains("\"tablet\"") ? "tablet" : "handy";
            return "{\"host\":\"" + host + "\",\"port\":" + PORT + ",\"name\":\"Ultron\",\"kind\":\"" + peerKind + "\"}";
        } catch (Exception ignored) {
            return null;
        } finally {
            try {
                sock.close();
            } catch (Exception ignored) {
                /* */
            }
        }
    }

    private boolean sendPost(String host, int port, String json) {
        if (port < 1 || port > 65535) port = PORT;
        Socket sock = new Socket();
        try {
            sock.connect(new InetSocketAddress(host, port), 1500);
            sock.setSoTimeout(2000);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            if (bytes.length > BODY_MAX) return false;
            String head = "POST /fenster HTTP/1.1\r\nHost: " + host
                    + "\r\nContent-Type: application/json; charset=utf-8\r\nConnection: close\r\nContent-Length: "
                    + bytes.length + "\r\n\r\n";
            OutputStream out = sock.getOutputStream();
            out.write(head.getBytes(StandardCharsets.UTF_8));
            out.write(bytes);
            out.flush();
            BufferedReader in = new BufferedReader(new InputStreamReader(sock.getInputStream(), StandardCharsets.UTF_8));
            String status = in.readLine();
            return status != null && status.contains("200");
        } catch (Exception ignored) {
            return false;
        } finally {
            try {
                sock.close();
            } catch (Exception ignored) {
                /* */
            }
        }
    }

    private static String joinPeers(List<String> peers) {
        StringBuilder sb = new StringBuilder();
        sb.append('[');
        for (int i = 0; i < peers.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(peers.get(i));
        }
        sb.append(']');
        return sb.toString();
    }

    private static void writeHttp(Socket sock, int status, String body) throws Exception {
        byte[] bytes = (body == null ? "{}" : body).getBytes(StandardCharsets.UTF_8);
        String head = "HTTP/1.1 " + status + (status == 200 ? " OK" : " ERR")
                + "\r\nContent-Type: application/json; charset=utf-8\r\nConnection: close\r\nContent-Length: "
                + bytes.length + "\r\n\r\n";
        OutputStream out = sock.getOutputStream();
        out.write(head.getBytes(StandardCharsets.UTF_8));
        out.write(bytes);
        out.flush();
    }

    static boolean isLan(InetAddress addr) {
        if (addr == null) return false;
        if (addr.isLoopbackAddress()) return true;
        if (addr instanceof Inet4Address) return isLanHost(addr.getHostAddress());
        return false;
    }

    static boolean isLanHost(String host) {
        if (host == null) return false;
        if ("127.0.0.1".equals(host) || "localhost".equals(host)) return true;
        String[] p = host.split("\\.");
        if (p.length != 4) return false;
        try {
            int a = Integer.parseInt(p[0]);
            int b = Integer.parseInt(p[1]);
            int c = Integer.parseInt(p[2]);
            int d = Integer.parseInt(p[3]);
            if (c < 0 || c > 255 || d < 0 || d > 255) return false;
            if (a == 192 && b == 168) return true;
            if (a == 10 && b >= 0 && b <= 255) return true;
            if (a == 127) return true;
        } catch (NumberFormatException ignored) {
            return false;
        }
        return false;
    }

    private List<InetAddress> lanAddresses() {
        List<InetAddress> out = new ArrayList<>();
        try {
            Enumeration<NetworkInterface> nics = NetworkInterface.getNetworkInterfaces();
            if (nics == null) return out;
            for (NetworkInterface nic : Collections.list(nics)) {
                if (!nic.isUp() || nic.isLoopback()) continue;
                for (InetAddress addr : Collections.list(nic.getInetAddresses())) {
                    if (isLan(addr) && !addr.isLoopbackAddress()) out.add(addr);
                }
            }
        } catch (Exception ignored) {
            /* */
        }
        return out;
    }

    private static String escape(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "").replace("\"", "").replace("\n", " ").replace("\r", "");
    }
}
