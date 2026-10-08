package app.jarvis.device;

import android.content.Context;
import android.security.KeyPairGeneratorSpec;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import java.math.BigInteger;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Date;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLServerSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.SSLServerSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.security.auth.x500.X500Principal;

/** Per-install TLS identity; clients trust only the certificate pinned during pairing. */
public final class DeviceTls {
    private static final String ALIAS = "jarvis-device-tls-v1";

    private DeviceTls() {}

    public static synchronized String fingerprint(Context context) {
        try {
            return hex(MessageDigest.getInstance("SHA-256").digest(identity(context).getCertificate(ALIAS).getEncoded()));
        } catch (Exception e) {
            throw new IllegalStateException("Device certificate fingerprint unavailable.", e);
        }
    }

    public static synchronized SSLServerSocket serverSocket(Context context, String host, int port) throws Exception {
        if (host == null || !(host.startsWith("10.") || host.startsWith("192.168.")
                || host.matches("172\\.(1[6-9]|2[0-9]|3[01])\\..*"))) {
            throw new SecurityException("Server may bind only to a private IPv4 interface.");
        }
        SSLServerSocket socket = (SSLServerSocket) serverContext(context).getServerSocketFactory().createServerSocket();
        socket.setReuseAddress(true);
        socket.bind(new InetSocketAddress(InetAddress.getByName(host), port), 8);
        socket.setEnabledProtocols(new String[] {"TLSv1.3", "TLSv1.2"});
        socket.setNeedClientAuth(true);
        return socket;
    }

    public static SSLSocket clientSocket(Context context, String fingerprint) throws Exception {
        SSLSocket socket = (SSLSocket) clientSocketFactory(context, fingerprint).createSocket();
        socket.setEnabledProtocols(new String[] {"TLSv1.3", "TLSv1.2"});
        return socket;
    }

    public static SSLSocketFactory clientSocketFactory(Context context, String fingerprint) throws Exception {
        if (fingerprint == null || !fingerprint.matches("(?i)[0-9a-f]{64}")) {
            throw new SecurityException("A pinned device certificate is required.");
        }
        SSLContext contextTls = SSLContext.getInstance("TLS");
        contextTls.init(clientKeyManagers(context), new TrustManager[] {new PinnedTrustManager(fingerprint)}, new SecureRandom());
        return contextTls.getSocketFactory();
    }

    private static SSLContext serverContext(Context context) throws Exception {
        KeyStore store = identity(context);
        KeyManagerFactory managers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        managers.init(store, null);
        SSLContext tls = SSLContext.getInstance("TLS");
        tls.init(managers.getKeyManagers(), new TrustManager[] {new ClientIdentityTrustManager()}, new SecureRandom());
        return tls;
    }

    private static javax.net.ssl.KeyManager[] clientKeyManagers(Context context) throws Exception {
        KeyManagerFactory managers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        managers.init(identity(context), null);
        return managers.getKeyManagers();
    }

    public static SSLSocket discoverySocket(Context context) throws Exception {
        SSLContext tls = SSLContext.getInstance("TLS");
        tls.init(clientKeyManagers(context), new TrustManager[] {new DiscoveryTrustManager()}, new SecureRandom());
        SSLSocket socket = (SSLSocket) tls.getSocketFactory().createSocket();
        socket.setEnabledProtocols(new String[] {"TLSv1.3", "TLSv1.2"});
        return socket;
    }

    public static String peerFingerprint(SSLSocket socket) throws Exception {
        Certificate[] chain = socket.getSession().getPeerCertificates();
        if (chain.length == 0) throw new SecurityException("Missing peer certificate.");
        return hex(MessageDigest.getInstance("SHA-256").digest(chain[0].getEncoded()));
    }

    private static KeyStore identity(Context context) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (!store.containsAlias(ALIAS)) {
            KeyPairGenerator generator = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore");
            long now = System.currentTimeMillis();
            if (Build.VERSION.SDK_INT >= 23) {
                generator.initialize(new KeyGenParameterSpec.Builder(
                        ALIAS,
                        KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
                        .setKeySize(2048)
                        .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
                        .setCertificateSubject(new X500Principal("CN=Ultron Device"))
                        .setCertificateSerialNumber(BigInteger.valueOf(new SecureRandom().nextLong() & Long.MAX_VALUE))
                        .setCertificateNotBefore(new Date(now - 60_000L))
                        .setCertificateNotAfter(new Date(now + 10L * 365 * 24 * 60 * 60 * 1000))
                        .build());
            } else {
                generator.initialize(new KeyPairGeneratorSpec.Builder(context)
                        .setAlias(ALIAS)
                        .setKeySize(2048)
                        .setSubject(new X500Principal("CN=Ultron Device"))
                        .setSerialNumber(BigInteger.ONE)
                        .setStartDate(new Date(now - 60_000L))
                        .setEndDate(new Date(now + 10L * 365 * 24 * 60 * 60 * 1000))
                        .build());
            }
            generator.generateKeyPair();
            store.load(null);
        }
        Certificate certificate = store.getCertificate(ALIAS);
        if (!(certificate instanceof X509Certificate)) throw new SecurityException("Device identity is unavailable.");
        ((X509Certificate) certificate).checkValidity();
        return store;
    }

    private static String hex(byte[] bytes) {
        StringBuilder out = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) out.append(String.format("%02x", value & 0xff));
        return out.toString();
    }

    private static final class PinnedTrustManager implements X509TrustManager {
        private final String expected;

        PinnedTrustManager(String expected) {
            this.expected = expected.toLowerCase(java.util.Locale.ROOT);
        }

        @Override
        public void checkClientTrusted(X509Certificate[] chain, String authType) throws java.security.cert.CertificateException {
            throw new java.security.cert.CertificateException("Client certificates are not accepted.");
        }

        @Override
        public void checkServerTrusted(X509Certificate[] chain, String authType) throws java.security.cert.CertificateException {
            if (chain == null || chain.length == 0) throw new java.security.cert.CertificateException("Missing peer certificate.");
            try {
                chain[0].checkValidity();
                String actual = hex(MessageDigest.getInstance("SHA-256").digest(chain[0].getEncoded()));
                if (!MessageDigest.isEqual(
                        actual.getBytes(java.nio.charset.StandardCharsets.US_ASCII),
                        expected.getBytes(java.nio.charset.StandardCharsets.US_ASCII))) {
                    throw new java.security.cert.CertificateException("Device certificate pin mismatch.");
                }
            } catch (java.security.cert.CertificateException e) {
                throw e;
            } catch (Exception e) {
                throw new java.security.cert.CertificateException("Unable to verify device certificate.", e);
            }

        }

        @Override
        public X509Certificate[] getAcceptedIssuers() {
            return new X509Certificate[0];
        }
    }

    private static final class DiscoveryTrustManager implements X509TrustManager {
        @Override
        public void checkClientTrusted(X509Certificate[] chain, String authType) throws java.security.cert.CertificateException {
            throw new java.security.cert.CertificateException("Unexpected client certificate.");
        }

        @Override
        public void checkServerTrusted(X509Certificate[] chain, String authType) throws java.security.cert.CertificateException {
            if (chain == null || chain.length == 0) throw new java.security.cert.CertificateException("Missing peer certificate.");
            chain[0].checkValidity();
        }

        @Override
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
    }

    private static final class ClientIdentityTrustManager implements X509TrustManager {
        @Override
        public void checkClientTrusted(X509Certificate[] chain, String authType) throws java.security.cert.CertificateException {
            if (chain == null || chain.length == 0) throw new java.security.cert.CertificateException("Missing client certificate.");
            chain[0].checkValidity();
        }

        @Override
        public void checkServerTrusted(X509Certificate[] chain, String authType) throws java.security.cert.CertificateException {
            throw new java.security.cert.CertificateException("Unexpected server certificate.");
        }

        @Override
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
    }
}
