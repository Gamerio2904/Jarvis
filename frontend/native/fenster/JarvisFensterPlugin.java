package app.jarvis.fenster;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import app.jarvis.notify.JarvisNotifyPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.net.SocketTimeoutException;
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
@CapacitorPlugin(
        name = "JarvisFenster",
        permissions = {
            @Permission(alias = "nearby", strings = {Manifest.permission.NEARBY_WIFI_DEVICES}),
            @Permission(alias = "local", strings = {"android.permission.ACCESS_LOCAL_NETWORK"}),
            @Permission(alias = "notify", strings = {Manifest.permission.POST_NOTIFICATIONS})
        }
)
public class JarvisFensterPlugin extends Plugin {

    private static final int PORT = 18792;
    private static final int UDP_PORT = 18793;
    private static final int NOTE_ID = 1879201;
    private static final int BACKLOG = 8;
    private static final int BODY_MAX = 8000;
    private static final String LOCAL_PERM = "android.permission.ACCESS_LOCAL_NETWORK";

    private static final List<ServerSocket> sockets = new ArrayList<>();
    private static final List<DatagramSocket> udpSockets = new ArrayList<>();
    private static final AtomicBoolean running = new AtomicBoolean(false);
    private static final AtomicBoolean front = new AtomicBoolean(false);
    private static final Handler main = new Handler(Looper.getMainLooper());
    private static volatile String kind = "handy";
    private static volatile String deviceName = "Ultron";
    private static volatile String lastJson = "";
    private static volatile String lastHost = "";
    private static volatile Context appCtx;
    private static JarvisFensterPlugin live;
    private static WifiManager.MulticastLock multicast;

    public static void setFront(boolean on) {
        front.set(on);
    }

    public static void hold(Context ctx) {
        if (ctx != null) appCtx = ctx.getApplicationContext();
        if (appCtx == null || running.get()) return;
        startLocked();
    }

    public static void reopen(Context ctx) {
        if (ctx != null) appCtx = ctx.getApplicationContext();
        stopLocked();
        startLocked();
    }

    @Override
    public void load() {
        live = this;
        super.load();
    }

    @PluginMethod
    public void listen(PluginCall call) {
        String nextKind = call.getString("kind", "handy");
        kind = "tablet".equals(nextKind) ? "tablet" : "handy";
        String nextName = call.getString("name", "Ultron");
        deviceName = nextName == null || nextName.isEmpty() ? "Ultron" : nextName;
        if (getContext() != null) appCtx = getContext().getApplicationContext();
        if (needsNearby() && getPermissionState("nearby") != PermissionState.GRANTED) {
            requestPermissionForAlias("nearby", call, "afterNearby");
            return;
        }
        afterNearby(call);
    }

    @PermissionCallback
    private void afterNearby(PluginCall call) {
        if (needsLocal() && !granted(LOCAL_PERM)) {
            try {
                requestPermissionForAlias("local", call, "afterLocal");
                return;
            } catch (Exception ignored) {
                /* Älteres System kennt das Recht nicht. */
            }
        }
        afterLocal(call);
    }

    @PermissionCallback
    private void afterLocal(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notify") != PermissionState.GRANTED) {
            try {
                requestPermissionForAlias("notify", call, "afterNotify");
                return;
            } catch (Exception ignored) {
                /* */
            }
        }
        afterNotify(call);
    }

    @PermissionCallback
    private void afterNotify(PluginCall call) {
        Context ctx = getContext();
        boolean blocked = lanBlocked(ctx);
        if (!blocked) {
            reopen(ctx);
            if (ctx != null) JarvisFensterService.start(ctx);
        }
        JSObject r = new JSObject();
        r.put("ok", running.get());
        r.put("blocked", blocked);
        if (blocked) r.put("message", "lan");
        else if (!running.get()) r.put("message", "Kein LAN. Die Kopplung bleibt zu.");
        call.resolve(r);
    }

    @PluginMethod
    public void seek(PluginCall call) {
        boolean blocked = lanBlocked(getContext());
        List<String> peers = blocked ? new ArrayList<>() : scanSubnet();
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("blocked", blocked);
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
        if (live == this) live = null;
        super.handleOnDestroy();
    }

    private static void startLocked() {
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
        if (any) {
            holdMulticast();
            try {
                DatagramSocket udp = new DatagramSocket(null);
                udp.setReuseAddress(true);
                udp.setBroadcast(true);
                udp.bind(new InetSocketAddress(UDP_PORT));
                udpSockets.add(udp);
                Thread u = new Thread(() -> udpLoop(udp), "jarvis-fenster-udp");
                u.setDaemon(true);
                u.start();
            } catch (Exception ignored) {
                /* Broadcast kommt nur an 0.0.0.0 an, nicht an eine einzelne IP */
            }
        }
        if (!any) running.set(false);
    }

    private static void stopLocked() {
        running.set(false);
        for (ServerSocket ss : sockets) {
            try {
                ss.close();
            } catch (Exception ignored) {
                /* */
            }
        }
        sockets.clear();
        for (DatagramSocket udp : udpSockets) {
            try {
                udp.close();
            } catch (Exception ignored) {
                /* */
            }
        }
        udpSockets.clear();
        dropMulticast();
    }

    private static void holdMulticast() {
        try {
            Context ctx = appCtx;
            if (ctx == null) return;
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm == null) return;
            if (multicast == null) {
                multicast = wm.createMulticastLock("jarvis-fenster");
                multicast.setReferenceCounted(false);
            }
            if (!multicast.isHeld()) multicast.acquire();
        } catch (Exception ignored) {
            /* ohne Lock filtert Android den Broadcast */
        }
    }

    private static void dropMulticast() {
        try {
            if (multicast != null && multicast.isHeld()) multicast.release();
        } catch (Exception ignored) {
            /* */
        }
    }

    private static void acceptLoop(ServerSocket ss) {
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

    private static void handleConn(Socket sock, InetAddress remote) {
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
                    if (live != null) {
                        JSObject ev = new JSObject();
                        ev.put("json", payload);
                        ev.put("fromHost", host);
                        live.notifyListeners("anfrage", ev);
                    }
                    if (!pairing || front.get() || appCtx == null) return;
                    JarvisNotifyPlugin.showQuiet(
                            appCtx,
                            NOTE_ID,
                            "Ultron",
                            "Kopplungsanfrage. Antippen zum Bestätigen.");
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

    private static void udpLoop(DatagramSocket sock) {
        byte[] buf = new byte[240];
        while (running.get() && !sock.isClosed()) {
            try {
                DatagramPacket packet = new DatagramPacket(buf, buf.length);
                sock.receive(packet);
                String text = new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8);
                if (!text.startsWith("ULTRON-FENSTER")) continue;
                if (!isLan(packet.getAddress())) continue;
                String hello = "ULTRON-JA {\"ok\":true,\"kind\":\"" + kind + "\"}";
                byte[] out = hello.getBytes(StandardCharsets.UTF_8);
                sock.send(new DatagramPacket(out, out.length, packet.getAddress(), packet.getPort()));
            } catch (Exception ignored) {
                if (!running.get() || sock.isClosed()) return;
            }
        }
    }

    private static List<String> scanSubnet() {
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
        List<String> heard = udpSeek(own, bases);
        if (!heard.isEmpty()) return heard;
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
            pool.awaitTermination(4000, TimeUnit.MILLISECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        pool.shutdownNow();
        return found;
    }

    private static List<String> udpSeek(List<String> own, List<String> bases) {
        List<String> found = new ArrayList<>();
        if (bases.isEmpty()) return found;
        DatagramSocket sock = null;
        try {
            sock = new DatagramSocket();
            sock.setBroadcast(true);
            sock.setSoTimeout(180);
            byte[] msg = "ULTRON-FENSTER".getBytes(StandardCharsets.UTF_8);
            for (String base : bases) sendUdp(sock, base + ".255", msg);
            sendUdp(sock, "255.255.255.255", msg);
            long end = System.currentTimeMillis() + 1200;
            byte[] buf = new byte[400];
            while (System.currentTimeMillis() < end) {
                try {
                    DatagramPacket packet = new DatagramPacket(buf, buf.length);
                    sock.receive(packet);
                    String text = new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8);
                    if (!text.startsWith("ULTRON-JA")) continue;
                    String host = packet.getAddress() == null ? "" : packet.getAddress().getHostAddress();
                    if (host == null || own.contains(host) || !isLanHost(host)) continue;
                    String peerKind = text.contains("\"tablet\"") ? "tablet" : "handy";
                    String row = "{\"host\":\"" + host + "\",\"port\":" + PORT + ",\"name\":\"Ultron\",\"kind\":\"" + peerKind + "\"}";
                    if (!found.contains(row)) found.add(row);
                } catch (SocketTimeoutException ignored) {
                    /* weiter warten */
                }
            }
        } catch (Exception ignored) {
            /* kein Broadcast */
        } finally {
            if (sock != null) {
                try {
                    sock.close();
                } catch (Exception ignored) {
                    /* */
                }
            }
        }
        return found;
    }

    private static void sendUdp(DatagramSocket sock, String host, byte[] msg) {
        try {
            sock.send(new DatagramPacket(msg, msg.length, InetAddress.getByName(host), UDP_PORT));
        } catch (Exception ignored) {
            /* diese Adresse nicht */
        }
    }

    private static boolean needsNearby() {
        return Build.VERSION.SDK_INT >= 33;
    }

    private static boolean needsLocal() {
        return Build.VERSION.SDK_INT >= 36 && permissionKnown(appCtx, LOCAL_PERM);
    }

    private boolean granted(String perm) {
        Context ctx = getContext();
        if (ctx == null) return false;
        return ctx.checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED;
    }

    private static boolean permissionKnown(Context ctx, String perm) {
        try {
            if (ctx == null) return false;
            ctx.getPackageManager().getPermissionInfo(perm, 0);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    static boolean lanBlocked(Context ctx) {
        if (ctx == null || Build.VERSION.SDK_INT < 36) return false;
        if (permissionKnown(ctx, LOCAL_PERM)) {
            return ctx.checkSelfPermission(LOCAL_PERM) != PackageManager.PERMISSION_GRANTED;
        }
        return ctx.checkSelfPermission(Manifest.permission.NEARBY_WIFI_DEVICES) != PackageManager.PERMISSION_GRANTED;
    }

    private static String hello(String host) {
        Socket sock = new Socket();
        try {
            sock.connect(new InetSocketAddress(host, PORT), 220);
            sock.setSoTimeout(500);
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

    private static boolean sendPost(String host, int port, String json) {
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
            if (a == 172 && b >= 16 && b <= 31) return true;
            if (a == 127) return true;
        } catch (NumberFormatException ignored) {
            return false;
        }
        return false;
    }

    private static List<InetAddress> lanAddresses() {
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
