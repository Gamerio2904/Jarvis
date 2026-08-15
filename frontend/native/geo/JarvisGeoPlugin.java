package app.jarvis.geo;

import android.Manifest;
import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;

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
}
