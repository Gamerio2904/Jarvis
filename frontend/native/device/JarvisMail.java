package app.jarvis.device;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/** Kleiner IMAP-FETCH. Kein JavaMail, kein OAuth — App-Passwort, TLS. */
final class JarvisMail {
    private JarvisMail() {}

    static JSObject list(String host, String user, String pass, int limit, String query) {
        JSObject out = new JSObject();
        String h = host == null ? "" : host.trim();
        String u = user == null ? "" : user.trim();
        String p = pass == null ? "" : pass;
        if (h.isEmpty() || u.isEmpty() || p.isEmpty()) {
            out.put("ok", false);
            out.put("message", "E-Mail-Zugang fehlt. App-Passwort unter Einstellungen.");
            return out;
        }
        int cap = Math.max(1, Math.min(limit <= 0 ? 8 : limit, 12));
        SSLSocket sock = null;
        try {
            SSLSocketFactory sf = (SSLSocketFactory) SSLSocketFactory.getDefault();
            sock = (SSLSocket) sf.createSocket();
            sock.connect(new InetSocketAddress(h, 993), 8_000);
            sock.setSoTimeout(10_000);
            sock.startHandshake();
            BufferedReader in =
                    new BufferedReader(new InputStreamReader(sock.getInputStream(), StandardCharsets.US_ASCII));
            BufferedWriter wr =
                    new BufferedWriter(new OutputStreamWriter(sock.getOutputStream(), StandardCharsets.US_ASCII));
            readUntagged(in);
            String login = tagCmd(wr, in, "LOGIN " + q(u) + " " + q(p));
            if (!ok(login)) {
                out.put("ok", false);
                out.put("message", "Anmeldung abgelehnt. App-Passwort prüfen, nicht das normale Passwort.");
                tagCmd(wr, in, "LOGOUT");
                return out;
            }
            tagCmd(wr, in, "SELECT INBOX");
            List<Integer> ids = searchIds(wr, in, query);
            JSArray mails = new JSArray();
            int from = Math.max(0, ids.size() - cap);
            for (int i = ids.size() - 1; i >= from; i -= 1) {
                JSObject row = fetchOne(wr, in, ids.get(i));
                if (row != null) mails.put(row);
            }
            tagCmd(wr, in, "LOGOUT");
            out.put("ok", true);
            out.put("mails", mails);
        } catch (Exception e) {
            out.put("ok", false);
            out.put("message", "Postfach nicht erreichbar.");
        } finally {
            if (sock != null) {
                try {
                    sock.close();
                } catch (Exception ignored) {
                }
            }
        }
        return out;
    }

    private static List<Integer> searchIds(BufferedWriter wr, BufferedReader in, String query) throws Exception {
        String q = query == null ? "" : query.trim();
        String crit = q.isEmpty() ? "UNSEEN" : "FROM " + q(q);
        String raw = tagCmd(wr, in, "SEARCH " + crit);
        List<Integer> ids = parseSearch(raw);
        if (ids.isEmpty() && !q.isEmpty()) {
            raw = tagCmd(wr, in, "SEARCH UNSEEN");
            ids = parseSearch(raw);
        }
        if (ids.isEmpty()) {
            raw = tagCmd(wr, in, "SEARCH ALL");
            ids = parseSearch(raw);
        }
        return ids;
    }

    private static List<Integer> parseSearch(String raw) {
        List<Integer> ids = new ArrayList<>();
        if (raw == null) return ids;
        for (String line : raw.split("\n")) {
            String t = line.trim();
            if (!t.toUpperCase(Locale.ROOT).startsWith("* SEARCH")) continue;
            String rest = t.substring("* SEARCH".length()).trim();
            if (rest.isEmpty()) continue;
            for (String part : rest.split("\\s+")) {
                try {
                    ids.add(Integer.parseInt(part));
                } catch (Exception ignored) {
                }
            }
        }
        return ids;
    }

    private static JSObject fetchOne(BufferedWriter wr, BufferedReader in, int id) throws Exception {
        String raw = tagCmd(wr, in, "FETCH " + id + " BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)]");
        if (raw == null) return null;
        String from = header(raw, "From");
        String subject = header(raw, "Subject");
        String date = header(raw, "Date");
        if (from.isEmpty() && subject.isEmpty()) return null;
        JSObject row = new JSObject();
        row.put("from", from);
        row.put("subject", subject);
        row.put("date", date);
        return row;
    }

    private static String header(String raw, String name) {
        String want = name.toLowerCase(Locale.ROOT) + ":";
        String found = "";
        for (String line : raw.split("\n")) {
            String t = line.replace("\r", "");
            if (t.toLowerCase(Locale.ROOT).startsWith(want)) {
                found = t.substring(want.length()).trim();
            } else if (!found.isEmpty() && t.startsWith(" ") && !t.startsWith("A")) {
                found = found + " " + t.trim();
            }
        }
        return found.replaceAll("\\s+", " ").trim();
    }

    private static String tagCmd(BufferedWriter wr, BufferedReader in, String cmd) throws Exception {
        String tag = "J" + Integer.toHexString((int) (System.nanoTime() & 0xffff));
        wr.write(tag + " " + cmd + "\r\n");
        wr.flush();
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) {
            sb.append(line).append('\n');
            if (line.startsWith(tag + " ")) break;
            int lit = literalSize(line);
            if (lit > 0 && lit < 64_000) {
                char[] buf = new char[lit];
                int got = 0;
                while (got < lit) {
                    int n = in.read(buf, got, lit - got);
                    if (n < 0) break;
                    got += n;
                }
                sb.append(buf, 0, got).append('\n');
            }
        }
        return sb.toString();
    }

    private static void readUntagged(BufferedReader in) throws Exception {
        in.readLine();
    }

    private static boolean ok(String raw) {
        if (raw == null) return false;
        String[] lines = raw.split("\n");
        String last = lines[lines.length - 1].trim();
        return last.toUpperCase(Locale.ROOT).contains(" OK ");
    }

    private static int literalSize(String line) {
        int open = line.lastIndexOf('{');
        int close = line.lastIndexOf('}');
        if (open < 0 || close <= open) return 0;
        try {
            return Integer.parseInt(line.substring(open + 1, close));
        } catch (Exception e) {
            return 0;
        }
    }

    private static String q(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
