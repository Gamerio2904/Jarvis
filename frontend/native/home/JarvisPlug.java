package app.jarvis.home;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.zip.CRC32;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** Lokale WLAN-Steckdosen: Shelly, Tasmota, Tuya-LAN, HTTP, Broadlink-SP. Keine Tuya-Cloud. */
final class JarvisPlug {
    private static final byte[] UDP_KEY = "yGAdlopoPVldABfn".getBytes(StandardCharsets.US_ASCII);
    private static final SecureRandom RNG = new SecureRandom();

    private JarvisPlug() {}

    static JSObject discover() {
        JSObject ret = new JSObject();
        Map<String, JSObject> found = new LinkedHashMap<>();
        try {
            listenTuya(found, 6666, false);
        } catch (Exception ignored) {
        }
        try {
            listenTuya(found, 6667, true);
        } catch (Exception ignored) {
        }
        try {
            Map<String, JSObject> extra = new LinkedHashMap<>();
            JarvisHomePlugin.Broadlink.discover(extra);
            for (JSObject row : extra.values()) {
                Integer typeObj = row.getInteger("type");
                int type = typeObj == null ? 0 : typeObj;
                if (JarvisHomePlugin.Broadlink.isPlugType(type)) {
                    row.put("kind", "broadlink");
                    String n = row.getString("name", "Broadlink-Steckdose");
                    row.put("name", n == null || n.isEmpty() ? "Broadlink-Steckdose" : n);
                    found.put("broadlink:" + row.getString("host", ""), row);
                }
            }
        } catch (Exception ignored) {
        }
        JSArray items = new JSArray();
        for (JSObject row : found.values()) items.put(row);
        ret.put("ok", items.length() > 0);
        ret.put("items", items);
        if (items.length() == 0) {
            ret.put(
                "message",
                "Keine Steckdose im WLAN gemeldet. Shelly/Tasmota: IP eintragen und prüfen. Tuya: Gerät an, nicht Gastnetz."
            );
        }
        return ret;
    }

    static JSObject probe(JSObject opts) {
        JSObject ret = new JSObject();
        String host = str(opts, "host");
        if (host.isEmpty()) {
            ret.put("ok", false);
            ret.put("message", "Keine IP.");
            return ret;
        }
        String kind = str(opts, "kind");
        String hit = tryHttpKind(host, kind);
        if (hit != null) {
            ret.put("ok", true);
            ret.put("kind", hit);
            ret.put("host", host);
            ret.put("message", "Erreichbar als " + label(hit) + ": " + host);
            return ret;
        }
        String id = str(opts, "deviceId");
        String key = str(opts, "localKey");
        if (!id.isEmpty() && key.length() == 16) {
            try {
                Tuya.set(host, id, key, str(opts, "version"), dps(opts), true, true);
                ret.put("ok", true);
                ret.put("kind", "tuya");
                ret.put("host", host);
                ret.put("message", "Tuya lokal erreichbar: " + host);
                return ret;
            } catch (Exception e) {
                ret.put("ok", false);
                ret.put("message", "Tuya: " + safe(e) + " Local Key und IP prüfen, gleiches WLAN.");
                return ret;
            }
        }
        ret.put("ok", false);
        ret.put(
            "message",
            "Kein Shelly/Tasmota unter " + host + ". Bei Smart Life Local Key eintragen, dann nochmal prüfen."
        );
        return ret;
    }

    static JSObject set(JSObject opts) {
        JSObject ret = new JSObject();
        String host = str(opts, "host");
        String kind = str(opts, "kind").toLowerCase();
        boolean on = opts.getBoolean("on", true);
        boolean statusOnly = opts.getBoolean("statusOnly", false);
        if (host.isEmpty() && !"http".equals(kind)) {
            ret.put("ok", false);
            ret.put("message", "Keine IP.");
            return ret;
        }
        try {
            if ("http".equals(kind)) {
                String url = on ? str(opts, "onUrl") : str(opts, "offUrl");
                if (url.isEmpty()) throw new IllegalStateException("Keine Schalt-URL.");
                http(url, "GET", null, 4000);
                ret.put("ok", true);
                ret.put("on", on);
                ret.put("message", on ? "An." : "Aus.");
                return ret;
            }
            if ("shelly".equals(kind) || kind.isEmpty() || "auto".equals(kind)) {
                if (tryShelly(host, on, statusOnly, ret)) return ret;
                if ("shelly".equals(kind)) {
                    ret.put("ok", false);
                    ret.put("message", "Shelly antwortet nicht. IP und gleiches WLAN prüfen.");
                    return ret;
                }
            }
            if ("tasmota".equals(kind) || "auto".equals(kind) || kind.isEmpty()) {
                if (tryTasmota(host, on, statusOnly, ret)) return ret;
                if ("tasmota".equals(kind)) {
                    ret.put("ok", false);
                    ret.put("message", "Tasmota antwortet nicht.");
                    return ret;
                }
            }
            if ("tuya".equals(kind) || "auto".equals(kind) || kind.isEmpty()) {
                String id = str(opts, "deviceId");
                String key = str(opts, "localKey");
                if (id.isEmpty() || key.length() != 16) {
                    if ("tuya".equals(kind)) {
                        ret.put("ok", false);
                        ret.put("message", "Tuya braucht Device-ID und 16-stelligen Local Key.");
                        return ret;
                    }
                } else {
                    Boolean state = Tuya.set(host, id, key, str(opts, "version"), dps(opts), on, statusOnly);
                    boolean isOn = state == null ? on : state;
                    ret.put("ok", true);
                    ret.put("on", isOn);
                    ret.put("message", isOn ? "An." : "Aus.");
                    return ret;
                }
            }
            if ("broadlink".equals(kind)) {
                JarvisHomePlugin.Broadlink dev =
                    JarvisHomePlugin.Broadlink.connect(host, str(opts, "mac"));
                if (dev == null) {
                    ret.put("ok", false);
                    ret.put("message", "Broadlink-Steckdose nicht erreichbar.");
                    return ret;
                }
                if (!statusOnly) dev.setPower(on);
                ret.put("ok", true);
                ret.put("on", on);
                ret.put("message", on ? "An." : "Aus.");
                return ret;
            }
            ret.put("ok", false);
            ret.put("message", "Steckdose nicht geschaltet. Typ, IP und Local Key prüfen.");
        } catch (Exception e) {
            ret.put("ok", false);
            ret.put("message", safe(e));
        }
        return ret;
    }

    private static boolean tryShelly(String host, boolean on, boolean statusOnly, JSObject ret) {
        try {
            String body = http(
                "http://" + host + "/rpc/Switch.Set",
                "POST",
                "{\"id\":0,\"on\":" + on + "}",
                2500
            );
            if (body != null) {
                ret.put("ok", true);
                ret.put("kind", "shelly");
                ret.put("on", on);
                ret.put("message", on ? "An." : "Aus.");
                return true;
            }
        } catch (Exception ignored) {
        }
        try {
            String path = statusOnly ? "/relay/0" : "/relay/0?turn=" + (on ? "on" : "off");
            String body = http("http://" + host + path, "GET", null, 2500);
            if (body != null && (body.contains("ison") || body.contains("\"id\""))) {
                boolean ison = body.contains("\"ison\":true") || body.contains("\"output\":true");
                ret.put("ok", true);
                ret.put("kind", "shelly");
                ret.put("on", statusOnly ? ison : on);
                ret.put("message", (statusOnly ? ison : on) ? "An." : "Aus.");
                return true;
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private static boolean tryTasmota(String host, boolean on, boolean statusOnly, JSObject ret) {
        try {
            String cmd = statusOnly ? "Power" : (on ? "Power%20On" : "Power%20Off");
            String body = http("http://" + host + "/cm?cmnd=" + cmd, "GET", null, 2500);
            if (body != null && body.toUpperCase().contains("POWER")) {
                boolean ison = body.toUpperCase().contains("ON");
                ret.put("ok", true);
                ret.put("kind", "tasmota");
                ret.put("on", statusOnly ? ison : on);
                ret.put("message", (statusOnly ? ison : on) ? "An." : "Aus.");
                return true;
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private static String tryHttpKind(String host, String prefer) {
        String p = prefer == null ? "" : prefer.toLowerCase();
        if (p.isEmpty() || "auto".equals(p) || "shelly".equals(p)) {
            try {
                String b = http("http://" + host + "/shelly", "GET", null, 1800);
                if (b != null && (b.contains("type") || b.contains("mac"))) return "shelly";
            } catch (Exception ignored) {
            }
            try {
                String b = http("http://" + host + "/rpc/Shelly.GetDeviceInfo", "POST", "{}", 1800);
                if (b != null && b.contains("id")) return "shelly";
            } catch (Exception ignored) {
            }
            try {
                String b = http("http://" + host + "/relay/0", "GET", null, 1800);
                if (b != null && b.contains("ison")) return "shelly";
            } catch (Exception ignored) {
            }
        }
        if (p.isEmpty() || "auto".equals(p) || "tasmota".equals(p)) {
            try {
                String b = http("http://" + host + "/cm?cmnd=Status", "GET", null, 1800);
                if (b != null && (b.contains("Status") || b.contains("POWER"))) return "tasmota";
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private static void listenTuya(Map<String, JSObject> found, int port, boolean enc) throws Exception {
        try (DatagramSocket s = new DatagramSocket(null)) {
            s.setReuseAddress(true);
            s.setBroadcast(true);
            s.setSoTimeout(700);
            s.bind(new InetSocketAddress(port));
            byte[] buf = new byte[512];
            long until = System.currentTimeMillis() + 2200;
            while (System.currentTimeMillis() < until) {
                try {
                    DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                    s.receive(pkt);
                    byte[] raw = new byte[pkt.getLength()];
                    System.arraycopy(pkt.getData(), 0, raw, 0, pkt.getLength());
                    String json = enc ? decryptUdp(raw) : new String(raw, StandardCharsets.UTF_8);
                    int brace = json.indexOf('{');
                    if (brace < 0) continue;
                    json = json.substring(brace);
                    String ip = extract(json, "ip");
                    if (ip == null || ip.isEmpty()) ip = pkt.getAddress().getHostAddress();
                    String gw = extract(json, "gwId");
                    if (gw == null) gw = extract(json, "devId");
                    JSObject row = new JSObject();
                    row.put("host", ip);
                    row.put("kind", "tuya");
                    row.put("deviceId", gw == null ? "" : gw);
                    row.put("name", "Tuya " + (gw == null || gw.length() < 4 ? ip : gw.substring(0, 4)));
                    row.put("version", extract(json, "version"));
                    found.put("tuya:" + ip, row);
                } catch (Exception timeout) {
                    break;
                }
            }
        }
    }

    private static String decryptUdp(byte[] raw) throws Exception {
        int from = 0;
        if (raw.length > 20 && raw[0] == 0 && raw[1] == 0 && (raw[2] == 0x55 || raw[3] == (byte) 0xaa)) {
            from = 20;
            if (raw.length > from + 8) {
                int end = raw.length - 8;
                byte[] enc = new byte[end - from];
                System.arraycopy(raw, from, enc, 0, enc.length);
                raw = enc;
            }
        }
        Cipher c = Cipher.getInstance("AES/ECB/PKCS5Padding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(UDP_KEY, "AES"));
        byte[] dec = c.doFinal(pad16(raw));
        return new String(unpad(dec), StandardCharsets.UTF_8);
    }

    private static String http(String url, String method, String body, int timeoutMs) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeoutMs);
        c.setReadTimeout(timeoutMs);
        c.setRequestMethod(method);
        c.setInstanceFollowRedirects(true);
        if (body != null) {
            byte[] data = body.getBytes(StandardCharsets.UTF_8);
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("Content-Length", String.valueOf(data.length));
            try (OutputStream os = c.getOutputStream()) {
                os.write(data);
            }
        }
        int code = c.getResponseCode();
        InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
        if (in == null) return code >= 200 && code < 300 ? "" : null;
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        if (code < 200 || code >= 300) return null;
        return sb.toString();
    }

    private static String str(JSObject o, String k) {
        String v = o.getString(k, "");
        return v == null ? "" : v.trim();
    }

    private static String dps(JSObject o) {
        String v = str(o, "dps");
        return v.isEmpty() ? "1" : v;
    }

    private static String label(String kind) {
        if ("shelly".equals(kind)) return "Shelly";
        if ("tasmota".equals(kind)) return "Tasmota";
        if ("tuya".equals(kind)) return "Tuya lokal";
        if ("broadlink".equals(kind)) return "Broadlink";
        return kind;
    }

    private static String extract(String json, String key) {
        String needle = "\"" + key + "\"";
        int i = json.indexOf(needle);
        if (i < 0) return null;
        int colon = json.indexOf(':', i + needle.length());
        if (colon < 0) return null;
        int q = json.indexOf('"', colon + 1);
        if (q < 0) return null;
        int q2 = json.indexOf('"', q + 1);
        if (q2 < 0) return null;
        return json.substring(q + 1, q2);
    }

    private static String safe(Exception e) {
        String m = e.getMessage();
        return m == null || m.isEmpty() ? e.getClass().getSimpleName() : m;
    }

    private static byte[] pad16(byte[] data) {
        int n = (16 - (data.length % 16)) % 16;
        if (n == 0) return data;
        byte[] out = new byte[data.length + n];
        System.arraycopy(data, 0, out, 0, data.length);
        return out;
    }

    private static byte[] unpad(byte[] d) {
        if (d.length == 0) return d;
        int n = d[d.length - 1] & 0xff;
        if (n <= 0 || n > 16 || n > d.length) return d;
        byte[] out = new byte[d.length - n];
        System.arraycopy(d, 0, out, 0, out.length);
        return out;
    }

    static final class Tuya {
        static Boolean set(
            String host,
            String devId,
            String localKey,
            String version,
            String dps,
            boolean on,
            boolean statusOnly
        ) throws Exception {
            String ver = version == null || version.isEmpty() ? "3.3" : version;
            Exception last = null;
            String[] tryVer = "3.4".equals(ver) ? new String[] {"3.4", "3.3"} : new String[] {"3.3", "3.4"};
            for (String v : tryVer) {
                try {
                    return exchange(host, devId, localKey, v, dps, on, statusOnly);
                } catch (Exception e) {
                    last = e;
                }
            }
            if (last != null) throw last;
            throw new IllegalStateException("Tuya ohne Antwort.");
        }

        private static Boolean exchange(
            String host,
            String devId,
            String localKey,
            String ver,
            String dps,
            boolean on,
            boolean statusOnly
        ) throws Exception {
            byte[] key = localKey.getBytes(StandardCharsets.US_ASCII);
            if (key.length != 16) throw new IllegalStateException("Local Key muss 16 Zeichen haben.");
            try (Socket sock = new Socket()) {
                sock.connect(new InetSocketAddress(InetAddress.getByName(host), 6668), 2500);
                sock.setSoTimeout(3500);
                int seq = 1;
                byte[] session = key;
                if ("3.4".equals(ver)) {
                    session = negotiate34(sock, key, seq);
                    seq = 4;
                }
                if (statusOnly) {
                    byte[] q = encode(ver, session, seq++, "3.4".equals(ver) ? 16 : 10, statusPayload(ver, devId), true);
                    writeAll(sock, q);
                    readPacket(sock);
                    return null;
                }
                String json = controlJson(ver, devId, dps, on);
                int[] cmds = "3.4".equals(ver) ? new int[] {13} : new int[] {7, 13};
                Exception sendErr = null;
                for (int cmd : cmds) {
                    try {
                        byte[] pkt = encode(ver, session, seq++, cmd, json.getBytes(StandardCharsets.UTF_8), true);
                        writeAll(sock, pkt);
                        readPacket(sock);
                        return on;
                    } catch (Exception e) {
                        sendErr = e;
                    }
                }
                if (sendErr != null) throw sendErr;
                return on;
            }
        }

        private static byte[] negotiate34(Socket sock, byte[] localKey, int seq) throws Exception {
            byte[] localNonce = new byte[16];
            RNG.nextBytes(localNonce);
            byte[] start = encode("3.4", localKey, seq, 3, localNonce, true);
            writeAll(sock, start);
            byte[] resp = readPacket(sock);
            byte[] payload = slicePayload34(resp);
            payload = decryptEcb(payload, localKey);
            if (payload.length < 16) throw new IllegalStateException("Tuya 3.4 Handshake leer.");
            byte[] remote = new byte[16];
            System.arraycopy(payload, 0, remote, 0, 16);
            byte[] hmacRemote = hmac(localKey, remote);
            byte[] finish = encode("3.4", localKey, seq + 1, 5, hmacRemote, true);
            writeAll(sock, finish);
            byte[] session = new byte[16];
            for (int i = 0; i < 16; i++) session[i] = (byte) (localNonce[i] ^ remote[i]);
            return encryptEcbRaw(session, localKey);
        }

        private static byte[] statusPayload(String ver, String devId) {
            if ("3.4".equals(ver)) {
                return ("{\"data\":{\"ctype\":0,\"cid\":\"" + devId + "\"},\"protocol\":5,\"t\":" + now() + "}")
                    .getBytes(StandardCharsets.UTF_8);
            }
            return ("{\"gwId\":\"" + devId + "\",\"devId\":\"" + devId + "\"}").getBytes(StandardCharsets.UTF_8);
        }

        private static String controlJson(String ver, String devId, String dps, boolean on) {
            String dpsJson = "{\"" + dps + "\":" + on + "}";
            if ("3.4".equals(ver)) {
                return "{\"data\":{\"ctype\":0,\"cid\":\""
                    + devId
                    + "\",\"dps\":"
                    + dpsJson
                    + "},\"protocol\":5,\"t\":"
                    + now()
                    + "}";
            }
            return "{\"devId\":\""
                + devId
                + "\",\"uid\":\"\",\"t\":"
                + now()
                + ",\"dps\":"
                + dpsJson
                + "}";
        }

        private static byte[] encode(String ver, byte[] key, int seq, int cmd, byte[] data, boolean encrypt)
            throws Exception {
            byte[] payload = data == null ? new byte[0] : data;
            if ("3.4".equals(ver)) {
                if (cmd != 10 && cmd != 9 && cmd != 16 && cmd != 3 && cmd != 5 && cmd != 18) {
                    byte[] hdr = new byte[payload.length + 15];
                    byte[] tag = "3.4".getBytes(StandardCharsets.US_ASCII);
                    System.arraycopy(tag, 0, hdr, 0, 3);
                    System.arraycopy(payload, 0, hdr, 15, payload.length);
                    payload = hdr;
                }
                payload = pkcs7(payload);
                payload = encryptEcbRaw(payload, key);
                byte[] packet = new byte[payload.length + 52];
                putInt(packet, 0, 0x000055AA);
                putInt(packet, 4, seq);
                putInt(packet, 8, cmd);
                putInt(packet, 12, payload.length + 0x24);
                System.arraycopy(payload, 0, packet, 16, payload.length);
                byte[] mac = hmac(key, slice(packet, 0, payload.length + 16));
                System.arraycopy(mac, 0, packet, payload.length + 16, 32);
                putInt(packet, payload.length + 48, 0x0000AA55);
                return packet;
            }
            if ("3.3".equals(ver) || encrypt) {
                payload = encryptEcb(payload, key);
                if (cmd != 10 && cmd != 18) {
                    byte[] hdr = new byte[payload.length + 15];
                    byte[] tag = "3.3".getBytes(StandardCharsets.US_ASCII);
                    System.arraycopy(tag, 0, hdr, 0, 3);
                    System.arraycopy(payload, 0, hdr, 15, payload.length);
                    payload = hdr;
                }
            }
            byte[] packet = new byte[payload.length + 24];
            putInt(packet, 0, 0x000055AA);
            putInt(packet, 4, seq);
            putInt(packet, 8, cmd);
            putInt(packet, 12, payload.length + 8);
            System.arraycopy(payload, 0, packet, 16, payload.length);
            CRC32 crc = new CRC32();
            crc.update(packet, 0, payload.length + 16);
            putInt(packet, payload.length + 16, (int) crc.getValue());
            putInt(packet, payload.length + 20, 0x0000AA55);
            return packet;
        }

        private static void writeAll(Socket sock, byte[] data) throws Exception {
            sock.getOutputStream().write(data);
            sock.getOutputStream().flush();
        }

        private static byte[] readPacket(Socket sock) throws Exception {
            InputStream in = sock.getInputStream();
            byte[] head = readN(in, 16);
            int len = ByteBuffer.wrap(head, 12, 4).order(ByteOrder.BIG_ENDIAN).getInt();
            if (len < 8 || len > 4096) throw new IllegalStateException("Tuya-Paket ungültig.");
            byte[] rest = readN(in, len);
            byte[] all = new byte[16 + rest.length];
            System.arraycopy(head, 0, all, 0, 16);
            System.arraycopy(rest, 0, all, 16, rest.length);
            return all;
        }

        private static byte[] slicePayload34(byte[] packet) {
            int len = ByteBuffer.wrap(packet, 12, 4).order(ByteOrder.BIG_ENDIAN).getInt();
            int payloadLen = Math.max(0, len - 0x24);
            return slice(packet, 16, 16 + payloadLen);
        }

        private static byte[] readN(InputStream in, int n) throws Exception {
            byte[] buf = new byte[n];
            int off = 0;
            while (off < n) {
                int r = in.read(buf, off, n - off);
                if (r < 0) throw new IllegalStateException("Tuya hat getrennt.");
                off += r;
            }
            return buf;
        }

        private static byte[] encryptEcb(byte[] data, byte[] key) throws Exception {
            Cipher c = Cipher.getInstance("AES/ECB/PKCS5Padding");
            c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"));
            return c.doFinal(data);
        }

        private static byte[] encryptEcbRaw(byte[] data, byte[] key) throws Exception {
            Cipher c = Cipher.getInstance("AES/ECB/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"));
            return c.doFinal(data);
        }

        private static byte[] decryptEcb(byte[] data, byte[] key) throws Exception {
            Cipher c = Cipher.getInstance("AES/ECB/NoPadding");
            c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"));
            return c.doFinal(pad16(data));
        }

        private static byte[] hmac(byte[] key, byte[] data) throws Exception {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data);
        }

        private static byte[] pkcs7(byte[] data) {
            int n = 16 - (data.length % 16);
            if (n == 0) n = 16;
            byte[] out = new byte[data.length + n];
            System.arraycopy(data, 0, out, 0, data.length);
            for (int i = data.length; i < out.length; i++) out[i] = (byte) n;
            return out;
        }

        private static void putInt(byte[] p, int off, int v) {
            p[off] = (byte) ((v >>> 24) & 0xff);
            p[off + 1] = (byte) ((v >>> 16) & 0xff);
            p[off + 2] = (byte) ((v >>> 8) & 0xff);
            p[off + 3] = (byte) (v & 0xff);
        }

        private static byte[] slice(byte[] src, int from, int to) {
            int end = Math.min(to, src.length);
            int start = Math.min(from, end);
            byte[] out = new byte[end - start];
            System.arraycopy(src, start, out, 0, out.length);
            return out;
        }

        private static long now() {
            return System.currentTimeMillis() / 1000L;
        }
    }
}
