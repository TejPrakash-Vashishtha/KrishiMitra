package com.krishimitra.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridges the website's "Download App" button into the native Android
 * DownloadManager. Browsers inside a WebView cannot trigger the hidden-iframe
 * download trick the website uses, so the site calls this plugin instead:
 * the APK downloads via the system download UI, lands in the Downloads
 * folder, and the user can tap "Open" from the notification to install.
 */
@CapacitorPlugin(name = "AppDownloader")
public class AppDownloaderPlugin extends Plugin {

    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("KrishiMitra.apk");
            request.setDescription("KrishiMitra Android app");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "KrishiMitra.apk");
            DownloadManager dm =
                (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) {
                call.reject("DownloadManager unavailable");
                return;
            }
            dm.enqueue(request);
            try {
                Toast.makeText(
                    getContext(),
                    "Downloading KrishiMitra app… check notifications",
                    Toast.LENGTH_LONG
                ).show();
            } catch (Exception ignored) {
                // Toast on a background thread context — never fatal.
            }
            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("download failed: " + e.getMessage());
        }
    }
}
