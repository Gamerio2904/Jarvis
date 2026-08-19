package app.jarvis.home;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Calendar;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

@CapacitorPlugin(name = "JarvisHome")
public class JarvisHomePlugin extends Plugin {
    private static final byte[] INIT_KEY = hex("097628343dfe262c743d8248833a18f3");
    private static final byte[] IV = hex("562e17996d093d28ddb3ba695a2e6f58");

    @PluginMethod
    public void discover(PluginCall call) {
        runBg(call, () -> resolve(call, doDiscover()));
    }

    @PluginMethod
    public void test(PluginCall call) {
        runBg(call, () -> {
            String host = call.getString("host", "");
            JSObject ret = new JSObject();
            if (host == null || host.isEmpty()) {
                ret.put("ok", false);
                ret.put("message", "Keine Brücken-IP.");
                resolve(call, ret);
                return;
            }
            Broadlink dev = Broadlink.connect(host, call.getString("mac", ""));
            if (dev == null) {
                ret.put("ok", false);
                ret.put("message", "Brücke antwortet nicht. Gleiches WLAN, RM4 Pro an, feste IP sinnvoll.");
                resolve(call, ret);
                return;
            }
            ret.put("ok", true);
            ret.put("host", dev.host);
            ret.put("mac", dev.macHex);
            ret.put("message", "Brücke erreichbar: " + dev.host);
            resolve(call, ret);
        });
    }

    @PluginMethod
    public void learn(PluginCall call) {
        runBg(call, () -> {
            String host = call.getString("host", "");
            JSObject ret = new JSObject();
            Broadlink dev = Broadlink.connect(host, call.getString("mac", ""));
            if (dev == null) {
                ret.put("ok", false);
                ret.put("message", "Brücke nicht da. IP prüfen, gleiches WLAN.");
                resolve(call, ret);
                return;
            }
            try {
                String code = dev.learn();
                if (code == null || code.isEmpty()) {
                    ret.put("ok", false);
                    ret.put("message", "Nichts empfangen. Fernbedienung auf die Brücke, Taste 1–2 Sekunden.");
                } else {
                    ret.put("ok", true);
                    ret.put("code", code);
                    ret.put("host", dev.host);
                    ret.put("mac", dev.macHex);
                    ret.put("message", "Taste gelernt.");
                }
            } catch (Exception e) {
                ret.put("ok", false);
                ret.put("message", "Lernen: " + safe(e));
            }
            resolve(call, ret);
        });
    }

    @PluginMethod
    public void send(PluginCall call) {
        runBg(call, () -> {
            String host = call.getString("host", "");
            String code = call.getString("code", "");
            JSObject ret = new JSObject();
            if (code == null || code.isEmpty()) {
                ret.put("ok", false);
                ret.put("message", "Kein Code. Erst lernen.");
                resolve(call, ret);
                return;
            }
            Broadlink dev = Broadlink.connect(host, call.getString("mac", ""));
            if (dev == null) {
                ret.put("ok", false);
                ret.put("message", "Brücke nicht erreichbar.");
                resolve(call, ret);
                return;
            }
            try {
                dev.send(code);
                ret.put("ok", true);
                ret.put("message", "Code gesendet.");
            } catch (Exception e) {
                ret.put("ok", false);
                ret.put("message", "Senden: " + safe(e));
            }
            resolve(call, ret);
        });
    }

    @PluginMethod
    public void plugDiscover(PluginCall call) {
        runBg(call, () -> {
            JSObject ret = JarvisPlug.discover();
            try {
                Map<String, JSObject> extra = new LinkedHashMap<>();
                Broadlink.discover(extra);
                JSArray items = ret.getJSArray("items");
                if (items == null) items = new JSArray();
                for (JSObject row : extra.values()) {
                    Integer typeObj = row.getInteger("type");
                    int type = typeObj == null ? 0 : typeObj;
                    if (Broadlink.isPlugType(type)) {
                        row.put("kind", "broadlink");
                        row.put("name", row.getString("name", "Broadlink-Steckdose"));
                        items.put(row);
                    }
                }
                ret.put("items", items);
                ret.put("ok", items.length() > 0);
                if (items.length() > 0) ret.put("message", "Gefunden.");
            } catch (Exception ignored) {
            }
            resolve(call, ret);
        });
    }

    @PluginMethod
    public void plugProbe(PluginCall call) {
        runBg(call, () -> resolve(call, JarvisPlug.probe(call.getData())));
    }

    @PluginMethod
    public void plugSet(PluginCall call) {
        runBg(call, () -> resolve(call, JarvisPlug.set(call.getData())));
    }

    private void runBg(PluginCall call, Runnable task) {
        new Thread(() -> {
            try {
                task.run();
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("ok", false);
                ret.put("message", safe(e));
                call.resolve(ret);
            }
        }, "jarvis-home").start();
    }

    private static void resolve(PluginCall call, JSObject ret) {
        call.resolve(ret);
    }

    private static String safe(Exception e) {
        String m = e.getMessage();
        return m == null || m.isEmpty() ? e.getClass().getSimpleName() : m;
    }

    private JSObject doDiscover() {
        JSObject ret = new JSObject();
        Map<String, JSObject> found = new LinkedHashMap<>();
        try {
            Broadlink.discover(found);
        } catch (Exception ignored) {
        }
        JSArray items = new JSArray();
        for (JSObject row : found.values()) items.put(row);
        ret.put("ok", items.length() > 0);
        ret.put("items", items);
        if (items.length() == 0) {
            ret.put("message", "Keine Broadlink-Brücke. RM4 Pro im selben WLAN, nicht Gastnetz.");
        }
        return ret;
    }

    static final class Broadlink {
        String host;
        String macHex = "";
        byte[] mac = new byte[6];
        byte[] key = INIT_KEY.clone();
        int id;
        int count = new SecureRandom().nextInt(0xffff);
        int type;

        static Broadlink connect(String host, String macHex) {
            if (host == null || host.isEmpty()) return null;
            Broadlink b = new Broadlink();
            b.host = host.trim();
            if (macHex != null && macHex.replaceAll("[^0-9a-fA-F]", "").length() == 12) {
                b.macHex = macHex.replaceAll("[^0-9a-fA-F]", "");
                b.mac = hex(b.macHex);
            }
            try {
                if (!b.auth()) return ping(b) ? b : null;
                return b;
            } catch (Exception e) {
                return ping(b) ? b : null;
            }
        }

        static boolean ping(Broadlink b) {
            try (DatagramSocket s = new DatagramSocket()) {
                s.setSoTimeout(1200);
                byte[] hello = discoverPacket(localIpv4(), 0);
                s.send(new DatagramPacket(hello, hello.length, InetAddress.getByName(b.host), 80));
                byte[] buf = new byte[256];
                DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                s.receive(pkt);
                parseHello(b, pkt.getData(), pkt.getLength(), b.host);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        static void discover(Map<String, JSObject> found) throws Exception {
            String local = localIpv4();
            if (local == null) return;
            try (DatagramSocket s = new DatagramSocket(null)) {
                s.setReuseAddress(true);
                s.setBroadcast(true);
                s.setSoTimeout(900);
                s.bind(new InetSocketAddress(0));
                int port = s.getLocalPort();
                byte[] hello = discoverPacket(local, port);
                InetAddress[] targets = new InetAddress[] {
                    InetAddress.getByName("255.255.255.255"),
                    subnetBroadcast(local)
                };
                for (InetAddress t : targets) {
                    if (t == null) continue;
                    s.send(new DatagramPacket(hello, hello.length, t, 80));
                }
                byte[] buf = new byte[256];
                long until = System.currentTimeMillis() + 2500;
                while (System.currentTimeMillis() < until) {
                    try {
                        DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                        s.receive(pkt);
                        Broadlink b = new Broadlink();
                        parseHello(b, pkt.getData(), pkt.getLength(), pkt.getAddress().getHostAddress());
                        if (b.host == null || b.host.isEmpty()) continue;
                        JSObject row = new JSObject();
                        row.put("host", b.host);
                        row.put("mac", b.macHex);
                        row.put("name", isPlugType(b.type) ? "Broadlink-Steckdose" : "Broadlink");
                        row.put("kind", "broadlink");
                        row.put("type", b.type);
                        found.put(b.host, row);
                    } catch (Exception timeout) {
                        break;
                    }
                }
            }
        }

        boolean auth() throws Exception {
            byte[] payload = new byte[0x50];
            for (int i = 0x04; i < 0x14; i++) payload[i] = 0x31;
            payload[0x1e] = 0x01;
            payload[0x2d] = 0x01;
            byte[] name = "Jarvis".getBytes(StandardCharsets.US_ASCII);
            System.arraycopy(name, 0, payload, 0x30, name.length);
            byte[] resp = sendPacket(0x65, payload);
            if (resp == null || resp.length < 0x38 + 16) return false;
            byte[] dec = decrypt(slice(resp, 0x38, resp.length), INIT_KEY);
            id = leInt(dec, 0);
            System.arraycopy(dec, 4, key, 0, 16);
            return true;
        }

        String learn() throws Exception {
            byte[] enter = new byte[16];
            enter[0] = 0x03;
            sendPacket(0x6a, enter);
            long until = System.currentTimeMillis() + 18_000;
            while (System.currentTimeMillis() < until) {
                Thread.sleep(700);
                byte[] check = new byte[16];
                check[0] = 0x04;
                byte[] resp = sendPacket(0x6a, check);
                if (resp == null || resp.length < 0x38 + 16) continue;
                int err = (resp[0x22] & 0xff) | ((resp[0x23] & 0xff) << 8);
                if (err != 0) continue;
                byte[] dec = decrypt(slice(resp, 0x38, resp.length), key);
                if (dec.length <= 6) continue;
                byte[] data = slice(dec, 6, dec.length);
                if (allZero(data)) continue;
                return toHex(data);
            }
            byte[] rf = new byte[16];
            rf[0] = 0x19;
            sendPacket(0x6a, rf);
            return null;
        }

        void send(String hexCode) throws Exception {
            byte[] data = hex(hexCode);
            byte[] payload = new byte[4 + data.length];
            payload[0] = 0x02;
            System.arraycopy(data, 0, payload, 4, data.length);
            byte[] resp = sendPacket(0x6a, payload);
            if (resp == null) throw new IllegalStateException("keine Antwort");
        }

        void setPower(boolean on) throws Exception {
            byte[] payload = new byte[16];
            payload[0] = 0x02;
            payload[4] = (byte) (on ? 1 : 0);
            byte[] resp = sendPacket(0x6a, payload);
            if (resp == null) throw new IllegalStateException("keine Antwort");
        }

        static boolean isPlugType(int type) {
            switch (type) {
                case 0x2711:
                case 0x2719:
                case 0x271a:
                case 0x2720:
                case 0x2733:
                case 0x273e:
                case 0x753e:
                case 0x7530:
                case 0x7918:
                case 0x7919:
                case 0x791a:
                case 0x7d0d:
                case 0x9479:
                case 0x947a:
                case 0x9475:
                case 0x7568:
                case 0x756c:
                case 0x756f:
                case 0x7587:
                case 0x758b:
                case 0x7592:
                case 0x7599:
                case 0x759a:
                case 0x75a1:
                case 0x75a2:
                case 0x5115:
                case 0x51e2:
                case 0x6111:
                    return true;
                default:
                    return false;
            }
        }

        byte[] sendPacket(int command, byte[] payload) throws Exception {
            count = (count + 1) & 0xffff;
            byte[] pad = pad16(payload);
            byte[] packet = new byte[0x38 + pad.length];
            packet[0] = 0x5a;
            packet[1] = (byte) 0xa5;
            packet[2] = (byte) 0xaa;
            packet[3] = 0x55;
            packet[4] = 0x5a;
            packet[5] = (byte) 0xa5;
            packet[6] = (byte) 0xaa;
            packet[7] = 0x55;
            packet[0x24] = 0x2a;
            packet[0x25] = 0x27;
            packet[0x26] = (byte) command;
            packet[0x28] = (byte) (count & 0xff);
            packet[0x29] = (byte) ((count >> 8) & 0xff);
            for (int i = 0; i < 6; i++) packet[0x2a + i] = mac[5 - i];
            writeLe(packet, 0x30, id);
            int cs = 0xbeaf;
            for (byte b : pad) cs = (cs + (b & 0xff)) & 0xffff;
            packet[0x34] = (byte) (cs & 0xff);
            packet[0x35] = (byte) ((cs >> 8) & 0xff);
            byte[] enc = encrypt(pad, key);
            System.arraycopy(enc, 0, packet, 0x38, enc.length);
            cs = 0xbeaf;
            for (byte b : packet) cs = (cs + (b & 0xff)) & 0xffff;
            packet[0x20] = (byte) (cs & 0xff);
            packet[0x21] = (byte) ((cs >> 8) & 0xff);
            try (DatagramSocket s = new DatagramSocket()) {
                s.setSoTimeout(2500);
                s.send(new DatagramPacket(packet, packet.length, InetAddress.getByName(host), 80));
                byte[] buf = new byte[1024];
                DatagramPacket pkt = new DatagramPacket(buf, buf.length);
                s.receive(pkt);
                byte[] out = new byte[pkt.getLength()];
                System.arraycopy(pkt.getData(), 0, out, 0, pkt.getLength());
                return out;
            }
        }

        static void parseHello(Broadlink b, byte[] data, int len, String from) {
            b.host = from;
            if (len >= 0x40) {
                b.type = (data[0x34] & 0xff) | ((data[0x35] & 0xff) << 8);
                byte[] m = new byte[6];
                for (int i = 0; i < 6; i++) m[i] = data[0x3a + i];
                b.mac = reverse(m);
                b.macHex = toHex(b.mac);
            }
        }

        static byte[] discoverPacket(String local, int port) {
            byte[] packet = new byte[0x30];
            Calendar c = Calendar.getInstance();
            int year = c.get(Calendar.YEAR);
            packet[0x08] = (byte) (year & 0xff);
            packet[0x09] = (byte) ((year >> 8) & 0xff);
            packet[0x0a] = (byte) c.get(Calendar.MINUTE);
            packet[0x0b] = (byte) c.get(Calendar.HOUR_OF_DAY);
            packet[0x0c] = (byte) (year - 2000);
            int dow = c.get(Calendar.DAY_OF_WEEK);
            packet[0x0d] = (byte) (dow == Calendar.SUNDAY ? 7 : dow - 1);
            packet[0x0e] = (byte) c.get(Calendar.DAY_OF_MONTH);
            packet[0x0f] = (byte) (c.get(Calendar.MONTH) + 1);
            byte[] ip = ipv4(local);
            if (ip != null) {
                packet[0x18] = ip[3];
                packet[0x19] = ip[2];
                packet[0x1a] = ip[1];
                packet[0x1b] = ip[0];
            }
            packet[0x1c] = (byte) (port & 0xff);
            packet[0x1d] = (byte) ((port >> 8) & 0xff);
            packet[0x26] = 6;
            int cs = 0xbeaf;
            for (byte p : packet) cs = (cs + (p & 0xff)) & 0xffff;
            packet[0x20] = (byte) (cs & 0xff);
            packet[0x21] = (byte) ((cs >> 8) & 0xff);
            return packet;
        }
    }

    private static byte[] encrypt(byte[] data, byte[] key) throws Exception {
        Cipher c = Cipher.getInstance("AES/CBC/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(IV));
        return c.doFinal(data);
    }

    private static byte[] decrypt(byte[] data, byte[] key) throws Exception {
        Cipher c = Cipher.getInstance("AES/CBC/NoPadding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(IV));
        return c.doFinal(pad16(data));
    }

    private static byte[] pad16(byte[] data) {
        int n = (16 - (data.length % 16)) % 16;
        if (n == 0) return data;
        byte[] out = new byte[data.length + n];
        System.arraycopy(data, 0, out, 0, data.length);
        return out;
    }

    private static byte[] slice(byte[] src, int from, int to) {
        int end = Math.min(to, src.length);
        int start = Math.min(from, end);
        byte[] out = new byte[end - start];
        System.arraycopy(src, start, out, 0, out.length);
        return out;
    }

    private static boolean allZero(byte[] d) {
        for (byte b : d) if (b != 0) return false;
        return true;
    }

    private static void writeLe(byte[] p, int off, int v) {
        p[off] = (byte) (v & 0xff);
        p[off + 1] = (byte) ((v >> 8) & 0xff);
        p[off + 2] = (byte) ((v >> 16) & 0xff);
        p[off + 3] = (byte) ((v >> 24) & 0xff);
    }

    private static int leInt(byte[] p, int off) {
        return (p[off] & 0xff) | ((p[off + 1] & 0xff) << 8) | ((p[off + 2] & 0xff) << 16) | ((p[off + 3] & 0xff) << 24);
    }

    private static byte[] reverse(byte[] in) {
        byte[] out = new byte[in.length];
        for (int i = 0; i < in.length; i++) out[i] = in[in.length - 1 - i];
        return out;
    }

    private static String toHex(byte[] d) {
        StringBuilder sb = new StringBuilder(d.length * 2);
        for (byte b : d) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static byte[] hex(String s) {
        String h = s.replaceAll("[^0-9a-fA-F]", "");
        if ((h.length() & 1) == 1) h = "0" + h;
        byte[] out = new byte[h.length() / 2];
        for (int i = 0; i < out.length; i++) {
            out[i] = (byte) Integer.parseInt(h.substring(i * 2, i * 2 + 2), 16);
        }
        return out;
    }

    private static byte[] ipv4(String local) {
        if (local == null) return null;
        String[] p = local.split("\\.");
        if (p.length != 4) return null;
        return new byte[] {
            (byte) Integer.parseInt(p[0]),
            (byte) Integer.parseInt(p[1]),
            (byte) Integer.parseInt(p[2]),
            (byte) Integer.parseInt(p[3])
        };
    }

    private static InetAddress subnetBroadcast(String local) {
        int last = local.lastIndexOf('.');
        if (last < 0) return null;
        try {
            return InetAddress.getByName(local.substring(0, last + 1) + "255");
        } catch (Exception e) {
            return null;
        }
    }

    private static String localIpv4() {
        try {
            Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces();
            while (en.hasMoreElements()) {
                NetworkInterface ni = en.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                Enumeration<java.net.InetAddress> addrs = ni.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    java.net.InetAddress a = addrs.nextElement();
                    if (a instanceof java.net.Inet4Address && !a.isLoopbackAddress()) {
                        return a.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
