package app.jarvis.presence;

import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.Inet6Address;
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
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Mini-HTTP nur LAN. Kein Wildcard-Bind ins WAN. Requests gehen an JS
 * ({@code handlePresenceHttp}), nicht an einen zweiten Router.
 */
@CapacitorPlugin(name = "JarvisPresence")
public class JarvisPresencePlugin extends Plugin {

    private static final int DEFAULT_PORT = 18791;
    private static final int BACKLOG = 8;
    private static final int RESPOND_MS = 25_000;

    private final List<ServerSocket> sockets = new ArrayList<>();
    private final List<Thread> acceptors = new ArrayList<>();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final Map<String, Pending> pending = new ConcurrentHashMap<>();
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile int boundPort = DEFAULT_PORT;
    private volatile boolean bindOk = false;

    private static final class Pending {
        final CountDownLatch latch = new CountDownLatch(1);
        volatile int status = 503;
        volatile String body = "{\"ok\":false,\"error\":\"Chat-Pfad nicht gebunden.\"}";
    }

    @PluginMethod
    public void start(PluginCall call) {
        int port = call.getInt("port") != null ? call.getInt("port") : DEFAULT_PORT;
        if (port < 1024 || port > 65535) port = DEFAULT_PORT;
        stopLocked();
        boundPort = port;
        List<InetAddress> addrs = lanAddresses();
        if (addrs.isEmpty()) {
            bindOk = false;
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("bindOk", false);
            r.put("port", port);
            r.put("message", "Keine LAN-Adresse. Presence bleibt zu.");
            call.resolve(r);
            return;
        }
        boolean any = false;
        running.set(true);
        for (InetAddress addr : addrs) {
            try {
                ServerSocket ss = new ServerSocket();
                ss.setReuseAddress(true);
                ss.bind(new InetSocketAddress(addr, port), BACKLOG);
                sockets.add(ss);
                Thread t = new Thread(() -> acceptLoop(ss), "jarvis-presence-" + addr.getHostAddress());
                t.setDaemon(true);
                t.start();
                acceptors.add(t);
                any = true;
            } catch (Exception ignored) {
                /* diese Adresse nicht — andere dürfen */
            }
        }
        bindOk = any;
        JSObject r = new JSObject();
        r.put("ok", any);
        r.put("bindOk", any);
        r.put("port", port);
        if (!any) {
            running.set(false);
            r.put("message", "Bind :" + port + " fehlgeschlagen. Presence bleibt zu, kein Fake-Chat.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopLocked();
        JSObject r = new JSObject();
        r.put("ok", true);
        r.put("bindOk", false);
        call.resolve(r);
    }

    @PluginMethod
    public void bound(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ok", bindOk);
        r.put("bindOk", bindOk);
        r.put("port", boundPort);
        call.resolve(r);
    }

    @PluginMethod
    public void respond(PluginCall call) {
        String id = call.getString("id", "");
        Pending p = pending.remove(id);
        if (p == null) {
            JSObject r = new JSObject();
            r.put("ok", false);
            call.resolve(r);
            return;
        }
        Integer status = call.getInt("status");
        p.status = status != null ? status : 200;
        String body = call.getString("body", "{}");
        p.body = body != null ? body : "{}";
        p.latch.countDown();
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    @Override
    public void handleOnDestroy() {
        stopLocked();
        super.handleOnDestroy();
    }

    private void stopLocked() {
        running.set(false);
        bindOk = false;
        for (ServerSocket ss : sockets) {
            try {
                ss.close();
            } catch (Exception ignored) {
                /* */
            }
        }
        sockets.clear();
        acceptors.clear();
        for (Pending p : pending.values()) p.latch.countDown();
        pending.clear();
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
                Thread w = new Thread(() -> handleConn(sock, remote), "jarvis-presence-req");
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
            sock.setSoTimeout(8_000);
            BufferedReader in =
                    new BufferedReader(new InputStreamReader(sock.getInputStream(), StandardCharsets.UTF_8));
            String requestLine = in.readLine();
            if (requestLine == null || requestLine.isEmpty()) {
                writeHttp(sock, 400, "{\"ok\":false,\"error\":\"Leere Anfrage.\"}");
                return;
            }
            String[] parts = requestLine.split(" ");
            String method = parts.length > 0 ? parts[0] : "GET";
            String path = parts.length > 1 ? parts[1] : "/";
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            JSObject headers = new JSObject();
            int contentLength = 0;
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                int colon = line.indexOf(':');
                if (colon <= 0) continue;
                String key = line.substring(0, colon).trim();
                String val = line.substring(colon + 1).trim();
                headers.put(key, val);
                if ("content-length".equalsIgnoreCase(key)) {
                    try {
                        contentLength = Integer.parseInt(val);
                    } catch (NumberFormatException ignored) {
                        contentLength = 0;
                    }
                }
            }
            if (contentLength > 8000) contentLength = 8000;
            StringBuilder body = new StringBuilder();
            if (contentLength > 0) {
                char[] buf = new char[contentLength];
                int got = 0;
                while (got < contentLength) {
                    int n = in.read(buf, got, contentLength - got);
                    if (n < 0) break;
                    got += n;
                }
                body.append(buf, 0, got);
            }
            String id = UUID.randomUUID().toString();
            Pending p = new Pending();
            pending.put(id, p);
            JSObject ev = new JSObject();
            ev.put("id", id);
            ev.put("method", method);
            ev.put("path", path);
            ev.put("headers", headers);
            ev.put("body", body.toString());
            ev.put("remoteHost", remote.getHostAddress());
            main.post(() -> notifyListeners("presenceRequest", ev));
            boolean ok = p.latch.await(RESPOND_MS, TimeUnit.MILLISECONDS);
            pending.remove(id);
            if (!ok) {
                writeHttp(sock, 504, "{\"ok\":false,\"error\":\"Hirn hat nicht geantwortet.\"}");
                return;
            }
            writeHttp(sock, p.status, p.body);
        } catch (Exception e) {
            try {
                writeHttp(sock, 500, "{\"ok\":false,\"error\":\"Presence-Fehler.\"}");
            } catch (Exception ignored) {
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

    private void writeHttp(Socket sock, int status, String body) throws Exception {
        byte[] bytes = (body == null ? "{}" : body).getBytes(StandardCharsets.UTF_8);
        String reason = status == 200 ? "OK" : "ERR";
        String head =
                "HTTP/1.1 "
                        + status
                        + " "
                        + reason
                        + "\r\nContent-Type: application/json; charset=utf-8\r\nConnection: close\r\nContent-Length: "
                        + bytes.length
                        + "\r\n\r\n";
        OutputStream out = sock.getOutputStream();
        out.write(head.getBytes(StandardCharsets.UTF_8));
        out.write(bytes);
        out.flush();
    }

    static boolean isLan(InetAddress addr) {
        if (addr == null) return false;
        if (addr.isLoopbackAddress()) return true;
        if (addr instanceof Inet4Address) {
            byte[] b = addr.getAddress();
            int a = b[0] & 0xff;
            int c = b[1] & 0xff;
            if (a == 192 && c == 168) return true;
            if (a == 10) return true;
            if (a == 127) return true;
            return false;
        }
        if (addr instanceof Inet6Address) {
            byte[] b = addr.getAddress();
            return b.length == 16 && (b[0] & 0xfe) == 0xfc;
        }
        return false;
    }

    private List<InetAddress> lanAddresses() {
        List<InetAddress> out = new ArrayList<>();
        try {
            out.add(InetAddress.getByName("127.0.0.1"));
        } catch (Exception ignored) {
            /* */
        }
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
}
