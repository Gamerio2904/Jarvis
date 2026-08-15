package app.jarvis.tv;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

@CapacitorPlugin(name = "JarvisTv")
public class JarvisTvPlugin extends Plugin {

    @PluginMethod
    public void discover(PluginCall call) {
        runBg(call, () -> resolve(call, doDiscover()));
    }

    @PluginMethod
    public void wake(PluginCall call) {
        runBg(call, () -> {
            String mac = call.getString("mac", "");
            resolve(call, doWake(mac));
        });
    }

    @PluginMethod
    public void pair(PluginCall call) {
        runBg(call, () -> {
            String host = call.getString("host", "");
            Integer port = call.getInt("port");
            String name = call.getString("name", "Jarvis");
            String token = call.getString("token", "");
            resolve(call, doPair(host, port, name, token, 45));
        });
    }

    @PluginMethod
    public void sendKey(PluginCall call) {
        runBg(call, () -> {
            String host = call.getString("host", "");
            Integer port = call.getInt("port");
            String token = call.getString("token", "");
            String key = call.getString("key", "");
            resolve(call, doSendKey(host, port, token, key));
        });
    }

    @PluginMethod
    public void test(PluginCall call) {
        runBg(call, () -> {
            String host = call.getString("host", "");
            Integer port = call.getInt("port");
            String token = call.getString("token", "");
            resolve(call, doPair(host, port, "Jarvis", token, 12));
        });
    }

    private void runBg(PluginCall call, Runnable task) {
        new Thread(() -> {
            try {
                task.run();
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("ok", false);
                ret.put("message", safeMsg(e));
                call.resolve(ret);
            }
        }, "jarvis-tv").start();
    }

    private static void resolve(PluginCall call, JSObject ret) {
        call.resolve(ret);
    }

    private static String safeMsg(Exception e) {
        String m = e.getMessage();
        return m == null || m.isEmpty() ? e.getClass().getSimpleName() : m;
    }

    private JSObject doDiscover() {
        JSObject ret = new JSObject();
        Map<String, JSObject> found = new LinkedHashMap<>();
        WifiManager.MulticastLock lock = null;
        try {
            Context ctx = getContext().getApplicationContext();
            WifiManager wifi = (WifiManager) ctx.getSystemService(Context.WIFI_SERVICE);
            if (wifi != null) {
                lock = wifi.createMulticastLock("jarvis-ssdp");
                lock.setReferenceCounted(true);
                lock.acquire();
            }
            ssdp(found);
        } catch (Exception ignored) {
            /* Portscan folgt. */
        } finally {
            if (lock != null && lock.isHeld()) lock.release();
        }
        try {
            portScan(found);
        } catch (Exception ignored) {
            /* ehrlich leer. */
        }
        JSArray items = new JSArray();
        for (JSObject row : found.values()) items.put(row);
        ret.put("ok", items.length() > 0);
        ret.put("items", items);
        if (items.length() == 0) {
            ret.put(
                "message",
                "Nichts gefunden. Gleiches WLAN wie der TV? Gastnetz/AP-Isolation blockiert oft Geräte."
            );
        }
        return ret;
    }

    private static void ssdp(Map<String, JSObject> found) throws Exception {
        MulticastSocket socket = new MulticastSocket();
        socket.setReuseAddress(true);
        socket.setSoTimeout(2200);
        InetAddress group = InetAddress.getByName("239.255.255.250");
        String[] sts = {
            "urn:samsung.com:device:RemoteControlReceiver:1",
            "urn:schemas-upnp-org:device:MediaRenderer:1",
            "ssdp:all"
        };
        for (String st : sts) {
            String body =
                "M-SEARCH * HTTP/1.1\r\n" +
                "HOST: 239.255.255.250:1900\r\n" +
                "MAN: \"ssdp:discover\"\r\n" +
                "MX: 2\r\n" +
                "ST: " + st + "\r\n\r\n";
            byte[] data = body.getBytes(StandardCharsets.UTF_8);
            socket.send(new DatagramPacket(data, data.length, group, 1900));
        }
        byte[] buf = new byte[2048];
        long until = System.currentTimeMillis() + 2500;
        while (System.currentTimeMillis() < until) {
            try {
                DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                socket.receive(pkt);
                String text = new String(pkt.getData(), 0, pkt.getLength(), StandardCharsets.UTF_8);
                String host = hostFromSsdp(text, pkt.getAddress().getHostAddress());
                if (host != null) addDevice(found, host);
            } catch (Exception timeout) {
                break;
            }
        }
        socket.close();
    }

    private static String hostFromSsdp(String text, String fallback) {
        for (String line : text.split("\r?\n")) {
            if (line.toLowerCase().startsWith("location:")) {
                String loc = line.substring(9).trim();
                try {
                    return new URL(loc).getHost();
                } catch (Exception ignored) {
                    return fallback;
                }
            }
        }
        return fallback;
    }

    private void portScan(Map<String, JSObject> found) {
        String local = localIpv4();
        if (local == null) return;
        int lastDot = local.lastIndexOf('.');
        if (lastDot < 0) return;
        String prefix = local.substring(0, lastDot + 1);
        ExecutorService pool = Executors.newFixedThreadPool(32);
        List<String> hits = new ArrayList<>();
        for (int i = 1; i <= 254; i++) {
            final String host = prefix + i;
            if (host.equals(local)) continue;
            pool.execute(() -> {
                if (portOpen(host, 8001, 180) || portOpen(host, 8002, 180)) {
                    synchronized (hits) {
                        hits.add(host);
                    }
                }
            });
        }
        pool.shutdown();
        try {
            pool.awaitTermination(6, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        for (String host : hits) addDevice(found, host);
    }

    private static void addDevice(Map<String, JSObject> found, String host) {
        if (host == null || host.isEmpty() || found.containsKey(host)) return;
        JSObject row = new JSObject();
        row.put("host", host);
        row.put("port", portOpen(host, 8002, 250) ? 8002 : 8001);
        JSONObject info = fetchInfo(host);
        if (info != null) {
            JSONObject device = info.optJSONObject("device");
            if (device != null) {
                String name = device.optString("name", "");
                String mac = device.optString("wifiMac", device.optString("wifiMac", ""));
                if (name.isEmpty()) name = device.optString("modelName", "");
                if (!name.isEmpty()) row.put("name", name);
                if (!mac.isEmpty()) row.put("mac", mac);
            }
        }
        if (!row.has("name")) row.put("name", "Samsung TV");
        found.put(host, row);
    }

    private static JSONObject fetchInfo(String host) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL("http://" + host + ":8001/api/v2/").openConnection();
            c.setConnectTimeout(500);
            c.setReadTimeout(700);
            c.setRequestMethod("GET");
            if (c.getResponseCode() >= 400) return null;
            BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            return new JSONObject(sb.toString());
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private static boolean portOpen(String host, int port, int timeoutMs) {
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static String localIpv4() {
        try {
            Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces();
            while (en.hasMoreElements()) {
                NetworkInterface ni = en.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                Enumeration<InetAddress> addrs = ni.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress a = addrs.nextElement();
                    if (a instanceof Inet4Address && !a.isLoopbackAddress()) {
                        return a.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private JSObject doWake(String mac) {
        JSObject ret = new JSObject();
        try {
            byte[] addr = parseMac(mac);
            byte[] packet = new byte[6 + 16 * 6];
            for (int i = 0; i < 6; i++) packet[i] = (byte) 0xFF;
            for (int i = 0; i < 16; i++) {
                System.arraycopy(addr, 0, packet, 6 + i * 6, 6);
            }
            InetAddress[] targets = new InetAddress[] {
                InetAddress.getByName("255.255.255.255"),
                subnetBroadcast()
            };
            for (InetAddress target : targets) {
                if (target == null) continue;
                try (DatagramSocket socket = new DatagramSocket()) {
                    socket.setBroadcast(true);
                    for (int n = 0; n < 3; n++) {
                        socket.send(new DatagramPacket(packet, packet.length, target, 9));
                        socket.send(new DatagramPacket(packet, packet.length, target, 7));
                    }
                }
            }
            ret.put("ok", true);
            ret.put("message", "Magic-Packet gesendet.");
        } catch (Exception e) {
            ret.put("ok", false);
            ret.put("message", "WOL fehlgeschlagen: " + safeMsg(e));
        }
        return ret;
    }

    private static InetAddress subnetBroadcast() {
        String local = localIpv4();
        if (local == null) return null;
        int last = local.lastIndexOf('.');
        if (last < 0) return null;
        try {
            return InetAddress.getByName(local.substring(0, last + 1) + "255");
        } catch (Exception e) {
            return null;
        }
    }

    private static byte[] parseMac(String mac) {
        String hex = mac == null ? "" : mac.replaceAll("[^0-9a-fA-F]", "");
        if (hex.length() != 12) {
            throw new IllegalArgumentException("MAC ungültig");
        }
        byte[] out = new byte[6];
        for (int i = 0; i < 6; i++) {
            out[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return out;
    }

    private JSObject doPair(String host, Integer port, String name, String token, int waitSec) {
        JSObject ret = new JSObject();
        if (host == null || host.isEmpty()) {
            ret.put("ok", false);
            ret.put("message", "Kein Host.");
            return ret;
        }
        List<Integer> ports = new ArrayList<>();
        if (port != null && port > 0) ports.add(port);
        if (token != null && !token.isEmpty()) {
            if (!ports.contains(8002)) ports.add(8002);
            if (!ports.contains(8001)) ports.add(8001);
        } else {
            if (!ports.contains(8001)) ports.add(8001);
            if (!ports.contains(8002)) ports.add(8002);
        }
        String last = "Keine Verbindung.";
        for (int p : ports) {
            TizenSession session = new TizenSession();
            try {
                session.open(host, p, name, token);
                if (!session.await(waitSec)) {
                    last = p == 8001
                        ? "Keine Antwort. Am TV erlauben und gleiches WLAN prüfen."
                        : "Port " + p + " antwortet nicht.";
                    session.close();
                    continue;
                }
                if (session.unauthorized) {
                    last = "TV hat abgelehnt. Am Fernseher erlauben und neu koppeln.";
                    session.close();
                    continue;
                }
                ret.put("ok", true);
                ret.put("port", p);
                if (session.token != null && !session.token.isEmpty()) {
                    ret.put("token", session.token);
                } else if (token != null && !token.isEmpty()) {
                    ret.put("token", token);
                }
                ret.put("message", "Verbunden" + (session.token != null ? ", Token da." : "."));
                session.close();
                return ret;
            } catch (Exception e) {
                last = safeMsg(e);
                session.close();
            }
        }
        ret.put("ok", false);
        ret.put("message", last);
        return ret;
    }

    private JSObject doSendKey(String host, Integer port, String token, String key) {
        JSObject ret = new JSObject();
        if (key == null || key.isEmpty()) {
            ret.put("ok", false);
            ret.put("message", "Keine Taste.");
            return ret;
        }
        List<Integer> ports = new ArrayList<>();
        if (port != null && port > 0) ports.add(port);
        if (!ports.contains(8002)) ports.add(8002);
        if (!ports.contains(8001)) ports.add(8001);
        String last = "Taste nicht gesendet.";
        for (int p : ports) {
            TizenSession session = new TizenSession();
            try {
                session.open(host, p, "Jarvis", token);
                if (!session.await(10) || session.unauthorized) {
                    last = session.unauthorized
                        ? "TV hat abgelehnt. Neu koppeln."
                        : "TV nicht erreichbar auf Port " + p + ".";
                    session.close();
                    continue;
                }
                session.sendKey(key);
                Thread.sleep(200);
                ret.put("ok", true);
                ret.put("port", p);
                ret.put("message", "Taste gesendet.");
                session.close();
                return ret;
            } catch (Exception e) {
                last = safeMsg(e);
                session.close();
            }
        }
        ret.put("ok", false);
        ret.put("message", last);
        return ret;
    }

    private static final class TizenSession {
        private WebSocket ws;
        private OkHttpClient client;
        private final CountDownLatch latch = new CountDownLatch(1);
        String token;
        boolean unauthorized;
        String error;

        void open(String host, int port, String name, String token) throws Exception {
            String encoded = Base64.encodeToString(
                (name == null || name.isEmpty() ? "Jarvis" : name).getBytes(StandardCharsets.UTF_8),
                Base64.NO_WRAP
            );
            String scheme = port == 8002 ? "wss" : "ws";
            String url = scheme + "://" + host + ":" + port +
                "/api/v2/channels/samsung.remote.control?name=" + encoded;
            if (token != null && !token.isEmpty()) {
                url += "&token=" + token;
            }
            this.token = token;
            client = port == 8002 ? insecureClient() : new OkHttpClient.Builder()
                .connectTimeout(8, TimeUnit.SECONDS)
                .readTimeout(45, TimeUnit.SECONDS)
                .build();
            Request req = new Request.Builder().url(url).build();
            ws = client.newWebSocket(req, new WebSocketListener() {
                @Override
                public void onMessage(WebSocket webSocket, String text) {
                    try {
                        JSONObject ev = new JSONObject(text);
                        String event = ev.optString("event", "");
                        if ("ms.channel.unauthorized".equals(event)) {
                            unauthorized = true;
                            latch.countDown();
                            return;
                        }
                        if ("ms.channel.connect".equals(event)) {
                            JSONObject data = ev.optJSONObject("data");
                            if (data != null) {
                                String t = data.optString("token", "");
                                if (!t.isEmpty()) TizenSession.this.token = t;
                            }
                            latch.countDown();
                        }
                    } catch (Exception ignored) {
                    }
                }

                @Override
                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                    error = t.getMessage();
                    latch.countDown();
                }
            });
        }

        boolean await(int seconds) throws InterruptedException {
            boolean ok = latch.await(seconds, TimeUnit.SECONDS);
            return ok && !unauthorized && error == null;
        }

        void sendKey(String key) {
            if (ws == null) return;
            String payload =
                "{\"method\":\"ms.remote.control\",\"params\":{" +
                "\"Cmd\":\"Click\",\"DataOfCmd\":\"" + key + "\"," +
                "\"Option\":\"false\",\"TypeOfRemote\":\"SendRemoteKey\"}}";
            ws.send(payload);
        }

        void close() {
            try {
                if (ws != null) ws.close(1000, "done");
            } catch (Exception ignored) {
            }
            try {
                if (client != null) {
                    client.dispatcher().executorService().shutdown();
                    client.connectionPool().evictAll();
                }
            } catch (Exception ignored) {
            }
        }
    }

    private static OkHttpClient insecureClient() throws Exception {
        X509TrustManager trustAll = new X509TrustManager() {
            public void checkClientTrusted(X509Certificate[] c, String a) {}
            public void checkServerTrusted(X509Certificate[] c, String a) {}
            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
        };
        SSLContext ssl = SSLContext.getInstance("TLS");
        ssl.init(null, new TrustManager[] { trustAll }, new SecureRandom());
        return new OkHttpClient.Builder()
            .sslSocketFactory(ssl.getSocketFactory(), trustAll)
            .hostnameVerifier((h, s) -> true)
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .build();
    }
}
