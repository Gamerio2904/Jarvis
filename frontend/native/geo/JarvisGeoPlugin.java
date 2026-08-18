package app.jarvis.geo;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.location.LocationListener;
import android.net.Uri;
import android.os.Build;
import android.os.Looper;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "JarvisGeo",
        permissions = {
                @Permission(
                        alias = "location",
                        strings = {
                                Manifest.permission.ACCESS_COARSE_LOCATION,
                                Manifest.permission.ACCESS_FINE_LOCATION
                        }
                )
        }
)
public class JarvisGeoPlugin extends Plugin {

    private LocationListener watchListener;

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", getPermissionState("location") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("granted", true);
            call.resolve(r);
            return;
        }
        requestPermissionForAlias("location", call, "onLocPerm");
    }

    @PermissionCallback
    private void onLocPerm(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", getPermissionState("location") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void locationEnabled(PluginCall call) {
        JSObject r = new JSObject();
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            boolean on =
                    lm != null
                            && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
                                    || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER));
            r.put("ok", true);
            r.put("enabled", on);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("enabled", false);
        }
        call.resolve(r);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        String kind = call.getString("kind", "app");
        JSObject r = new JSObject();
        try {
            Intent i;
            if ("location".equals(kind)) {
                i = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            } else {
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            }
            Activity a = getActivity();
            if (a != null) {
                a.startActivity(i);
            } else {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            }
            r.put("ok", true);
        } catch (Exception e) {
            r.put("ok", false);
            r.put("message", "Einstellungen nicht geöffnet.");
        }
        call.resolve(r);
    }

    @PluginMethod
    public void getLocation(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "onLocThenRead");
            return;
        }
        resolveLocation(call);
    }

    @PermissionCallback
    private void onLocThenRead(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Standort verweigert. Unter Android erlauben oder einen Ort nennen.");
            call.resolve(r);
            return;
        }
        resolveLocation(call);
    }

    private void resolveLocation(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm == null) {
                JSObject r = new JSObject();
                r.put("ok", false);
                r.put("message", "Kein Standort-Dienst.");
                call.resolve(r);
                return;
            }
            Location loc = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                loc = lm.getLastKnownLocation(LocationManager.FUSED_PROVIDER);
            }
            if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            if (loc == null) loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (loc == null) loc = lm.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
            JSObject r = new JSObject();
            if (loc == null) {
                r.put("ok", false);
                r.put("message", "Noch kein Standort. Kurz draußen/WLAN an, dann nochmal.");
            } else {
                r.put("ok", true);
                r.put("lat", loc.getLatitude());
                r.put("lon", loc.getLongitude());
            }
            call.resolve(r);
        } catch (SecurityException e) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Standort verweigert.");
            call.resolve(r);
        }
    }

    @PluginMethod
    public void startWatch(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "onLocThenWatch");
            return;
        }
        beginWatch(call);
    }

    @PermissionCallback
    private void onLocThenWatch(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Standort verweigert. Unter Android erlauben oder einen Ort nennen.");
            call.resolve(r);
            return;
        }
        beginWatch(call);
    }

    private void beginWatch(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm == null) {
                JSObject r = new JSObject();
                r.put("ok", false);
                r.put("message", "Kein Standort-Dienst.");
                call.resolve(r);
                return;
            }
            stopWatchLocked(lm);
            watchListener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    emitFix(location);
                }
            };
            Looper loop = Looper.getMainLooper();
            boolean any = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try {
                    lm.requestLocationUpdates(LocationManager.FUSED_PROVIDER, 800L, 1.5f, watchListener, loop);
                    any = true;
                } catch (IllegalArgumentException ignored) {
                    /* Gerät ohne Fused */
                }
            }
            try {
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 800L, 1.5f, watchListener, loop);
                any = true;
            } catch (IllegalArgumentException ignored) {
                /* kein GPS */
            }
            try {
                lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1200L, 4f, watchListener, loop);
                any = true;
            } catch (IllegalArgumentException ignored) {
                /* kein Netz-Standort */
            }
            JSObject r = new JSObject();
            if (!any) {
                r.put("ok", false);
                r.put("message", "Kein Standort-Provider.");
                call.resolve(r);
                return;
            }
            Location last = lastKnown(lm);
            if (last != null) emitFix(last);
            r.put("ok", true);
            call.resolve(r);
        } catch (SecurityException e) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("message", "Standort verweigert.");
            call.resolve(r);
        }
    }

    @PluginMethod
    public void stopWatch(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) stopWatchLocked(lm);
        } catch (SecurityException ignored) {
            /* ignore */
        }
        JSObject r = new JSObject();
        r.put("ok", true);
        call.resolve(r);
    }

    private void stopWatchLocked(LocationManager lm) {
        if (watchListener != null) {
            try {
                lm.removeUpdates(watchListener);
            } catch (SecurityException ignored) {
                /* ignore */
            }
            watchListener = null;
        }
    }

    private Location lastKnown(LocationManager lm) {
        Location loc = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            loc = lm.getLastKnownLocation(LocationManager.FUSED_PROVIDER);
        }
        if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
        if (loc == null) loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        if (loc == null) loc = lm.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
        return loc;
    }

    private void emitFix(Location loc) {
        if (loc == null) return;
        JSObject r = new JSObject();
        r.put("lat", loc.getLatitude());
        r.put("lon", loc.getLongitude());
        if (loc.hasBearing()) r.put("bearing", loc.getBearing());
        if (loc.hasSpeed()) r.put("speed", loc.getSpeed());
        notifyListeners("fix", r);
    }
}
