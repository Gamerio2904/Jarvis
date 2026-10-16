package app.jarvis.welt;

import android.Manifest;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.ImageFormat;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.media.Image;
import android.opengl.EGL14;
import android.opengl.EGLConfig;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.opengl.EGLSurface;
import android.opengl.GLES20;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Camera;
import com.google.ar.core.CameraIntrinsics;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Plane;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.UnavailableException;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.List;

@CapacitorPlugin(
        name = "JarvisWelt",
        permissions = {
                @Permission(alias = "camera", strings = { Manifest.permission.CAMERA })
        }
)
public class JarvisWeltPlugin extends Plugin {
    private Session session;
    private HandlerThread thread;
    private Handler handler;
    private EGLDisplay display = EGL14.EGL_NO_DISPLAY;
    private EGLContext context = EGL14.EGL_NO_CONTEXT;
    private EGLSurface surface = EGL14.EGL_NO_SURFACE;
    private int textureId;
    private volatile JSObject latest = missing();
    private long lastJpegAt;
    private boolean installAsked;
    private PluginCall pendingStart;

    private static JSObject missing() {
        JSObject o = new JSObject();
        o.put("available", false);
        o.put("tracking", "weg");
        o.put("reason", "ARCore fehlt");
        return o;
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "onCamera");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void onCamera(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            call.resolve(missing());
            return;
        }
        begin(call);
    }

    private void begin(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(getContext());
                if (availability.isTransient()) {
                    new Handler(getActivity().getMainLooper()).postDelayed(() -> begin(call), 200);
                    return;
                }
                if (availability == ArCoreApk.Availability.SUPPORTED_NOT_INSTALLED
                        || availability == ArCoreApk.Availability.SUPPORTED_APK_TOO_OLD) {
                    try {
                        ArCoreApk.InstallStatus status = ArCoreApk.getInstance().requestInstall(getActivity(), !installAsked);
                        installAsked = true;
                        if (status == ArCoreApk.InstallStatus.INSTALL_REQUESTED) {
                            pendingStart = call;
                            return;
                        }
                    } catch (Exception e) {
                        call.resolve(missing());
                        return;
                    }
                } else if (availability != ArCoreApk.Availability.SUPPORTED_INSTALLED) {
                    call.resolve(missing());
                    return;
                }
                stopSession();
                thread = new HandlerThread("jarvis-welt");
                thread.start();
                handler = new Handler(thread.getLooper());
                handler.post(() -> {
                    try {
                        openGl();
                        session = new Session(getContext());
                        session.setCameraTextureName(textureId);
                        Config config = new Config(session);
                        config.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL);
                        config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
                        config.setLightEstimationMode(Config.LightEstimationMode.DISABLED);
                        session.configure(config);
                        session.resume();
                        tick();
                        JSObject ok = new JSObject();
                        ok.put("available", true);
                        ok.put("reason", "");
                        call.resolve(ok);
                    } catch (UnavailableException e) {
                        call.resolve(missing());
                    } catch (Exception e) {
                        call.resolve(missing());
                    }
                });
            } catch (RuntimeException e) {
                call.resolve(missing());
            }
        });
    }

    private void tick() {
        if (handler == null || session == null) return;
        handler.postDelayed(() -> {
            if (session == null) return;
            try {
                Frame frame = session.update();
                Camera camera = frame.getCamera();
                JSObject snap = new JSObject();
                snap.put("available", true);
                boolean tracking = camera.getTrackingState() == TrackingState.TRACKING;
                snap.put("tracking", tracking ? "hält" : "weg");
                long now = System.currentTimeMillis();
                if (now - lastJpegAt > 280) {
                    String jpeg = jpegOf(frame);
                    if (jpeg != null) {
                        snap.put("jpeg", jpeg);
                        lastJpegAt = now;
                    }
                }
                if (tracking) {
                    Pose pose = camera.getPose();
                    float[] t = pose.getTranslation();
                    float[] q = pose.getRotationQuaternion();
                    CameraIntrinsics intrinsics = camera.getImageIntrinsics();
                    float[] focal = intrinsics.getFocalLength();
                    float[] principal = intrinsics.getPrincipalPoint();
                    int[] dims = intrinsics.getImageDimensions();
                    JSObject cam = new JSObject();
                    cam.put("px", t[0]);
                    cam.put("py", t[1]);
                    cam.put("pz", t[2]);
                    cam.put("qx", q[0]);
                    cam.put("qy", q[1]);
                    cam.put("qz", q[2]);
                    cam.put("qw", q[3]);
                    cam.put("fx", focal[0]);
                    cam.put("fy", focal[1]);
                    cam.put("cx", principal[0]);
                    cam.put("cy", principal[1]);
                    if (dims.length >= 2 && dims[0] > 0) {
                        cam.put("viewWidth", dims[0]);
                        cam.put("viewHeight", dims[1]);
                    }
                    snap.put("camera", cam);
                    JSArray planes = new JSArray();
                    for (Plane plane : session.getAllTrackables(Plane.class)) {
                        if (plane.getTrackingState() != TrackingState.TRACKING) continue;
                        if (plane.getType() != Plane.Type.HORIZONTAL_UPWARD_FACING) continue;
                        Pose center = plane.getCenterPose();
                        float[] pt = center.getTranslation();
                        float[] pn = center.getYAxis();
                        JSObject row = new JSObject();
                        row.put("id", String.valueOf(plane.hashCode()));
                        row.put("px", pt[0]);
                        row.put("py", pt[1]);
                        row.put("pz", pt[2]);
                        row.put("nx", pn[0]);
                        row.put("ny", pn[1]);
                        row.put("nz", pn[2]);
                        row.put("hx", plane.getExtentX() * 0.5f);
                        row.put("hz", plane.getExtentZ() * 0.5f);
                        float[] pq = center.getRotationQuaternion();
                        row.put("qx", pq[0]);
                        row.put("qy", pq[1]);
                        row.put("qz", pq[2]);
                        row.put("qw", pq[3]);
                        planes.put(row);
                    }
                    try {
                        float[] origin = pose.getTranslation();
                        float[] dir = pose.rotateVector(new float[]{0f, -0.42f, -1f});
                        float len = (float) Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
                        if (len > 1e-4f) {
                            dir[0] /= len;
                            dir[1] /= len;
                            dir[2] /= len;
                            List<HitResult> hits = frame.hitTest(origin, 0, dir, 0);
                            int n = 0;
                            for (HitResult hit : hits) {
                                if (n >= 3 || hit.getDistance() < 0.2f || hit.getDistance() > 2.4f) continue;
                                Pose hp = hit.getHitPose();
                                float[] up = hp.getYAxis();
                                if (up[1] < 0.72f) continue;
                                float[] pt = hp.getTranslation();
                                JSObject row = new JSObject();
                                row.put("id", "h" + n);
                                row.put("px", pt[0]);
                                row.put("py", pt[1]);
                                row.put("pz", pt[2]);
                                row.put("nx", up[0]);
                                row.put("ny", up[1]);
                                row.put("nz", up[2]);
                                row.put("hx", 0.45f);
                                row.put("hz", 0.45f);
                                float[] hq = hp.getRotationQuaternion();
                                row.put("qx", hq[0]);
                                row.put("qy", hq[1]);
                                row.put("qz", hq[2]);
                                row.put("qw", hq[3]);
                                planes.put(row);
                                n++;
                            }
                        }
                    } catch (RuntimeException ignored) {
                        /* Der Strahl trifft keine Fläche. */
                    }
                    snap.put("planes", planes);
                }
                latest = snap;
            } catch (Exception e) {
                JSObject held = new JSObject();
                held.put("available", true);
                held.put("tracking", "weg");
                latest = held;
            }
            tick();
        }, 80);
    }

    private String jpegOf(Frame frame) {
        Image image = null;
        try {
            image = frame.acquireCameraImage();
            if (image.getFormat() != ImageFormat.YUV_420_888) return null;
            byte[] nv21 = nv21(image);
            YuvImage yuv = new YuvImage(nv21, ImageFormat.NV21, image.getWidth(), image.getHeight(), null);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            yuv.compressToJpeg(new Rect(0, 0, image.getWidth(), image.getHeight()), 40, out);
            return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) {
            return null;
        } finally {
            if (image != null) image.close();
        }
    }

    private static byte[] nv21(Image image) {
        int width = image.getWidth();
        int height = image.getHeight();
        byte[] out = new byte[width * height * 3 / 2];
        Image.Plane y = image.getPlanes()[0];
        Image.Plane u = image.getPlanes()[1];
        Image.Plane v = image.getPlanes()[2];
        ByteBuffer yb = y.getBuffer();
        ByteBuffer ub = u.getBuffer();
        ByteBuffer vb = v.getBuffer();
        int row = 0;
        for (int i = 0; i < height; i++) {
            yb.position(i * y.getRowStride());
            yb.get(out, row, width);
            row += width;
        }
        int chromaH = height / 2;
        int chromaW = width / 2;
        int uv = width * height;
        for (int i = 0; i < chromaH; i++) {
            for (int j = 0; j < chromaW; j++) {
                int ui = i * u.getRowStride() + j * u.getPixelStride();
                int vi = i * v.getRowStride() + j * v.getPixelStride();
                out[uv++] = vb.get(vi);
                out[uv++] = ub.get(ui);
            }
        }
        return out;
    }

    private void openGl() {
        display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY);
        int[] version = new int[2];
        EGL14.eglInitialize(display, version, 0, version, 1);
        int[] attrib = {
                EGL14.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
                EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT,
                EGL14.EGL_NONE
        };
        EGLConfig[] configs = new EGLConfig[1];
        int[] count = new int[1];
        EGL14.eglChooseConfig(display, attrib, 0, configs, 0, 1, count, 0);
        int[] ctxAttrib = { EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL14.EGL_NONE };
        context = EGL14.eglCreateContext(display, configs[0], EGL14.EGL_NO_CONTEXT, ctxAttrib, 0);
        int[] surfAttrib = { EGL14.EGL_WIDTH, 16, EGL14.EGL_HEIGHT, 16, EGL14.EGL_NONE };
        surface = EGL14.eglCreatePbufferSurface(display, configs[0], surfAttrib, 0);
        EGL14.eglMakeCurrent(display, surface, surface, context);
        int[] tex = new int[1];
        GLES20.glGenTextures(1, tex, 0);
        textureId = tex[0];
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
    }

    @PluginMethod
    public void landscape(PluginCall call) {
        boolean on = call.getBoolean("on", true);
        Activity activity = getActivity();
        if (activity != null) {
            activity.setRequestedOrientation(on
                    ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                    : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
        JSObject ok = new JSObject();
        ok.put("ok", true);
        call.resolve(ok);
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        PluginCall call = pendingStart;
        if (call == null) return;
        pendingStart = null;
        begin(call);
    }

    @PluginMethod
    public void sample(PluginCall call) {
        call.resolve(latest);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopSession();
        JSObject ok = new JSObject();
        ok.put("ok", true);
        call.resolve(ok);
    }

    @Override
    protected void handleOnDestroy() {
        stopSession();
        super.handleOnDestroy();
    }

    private void stopSession() {
        Session current = session;
        session = null;
        Handler local = handler;
        handler = null;
        if (local != null) {
            local.post(() -> {
                try {
                    if (current != null) {
                        current.pause();
                        current.close();
                    }
                } catch (RuntimeException ignored) {
                    /* */
                }
                closeGl();
            });
        } else {
            closeGl();
        }
        if (thread != null) {
            thread.quitSafely();
            thread = null;
        }
        latest = missing();
    }

    private void closeGl() {
        if (display != EGL14.EGL_NO_DISPLAY) {
            EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT);
            if (surface != EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display, surface);
            if (context != EGL14.EGL_NO_CONTEXT) EGL14.eglDestroyContext(display, context);
            EGL14.eglTerminate(display);
        }
        display = EGL14.EGL_NO_DISPLAY;
        context = EGL14.EGL_NO_CONTEXT;
        surface = EGL14.EGL_NO_SURFACE;
    }
}
