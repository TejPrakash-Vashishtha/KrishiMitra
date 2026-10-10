package com.krishimitra.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebSettings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {

  private static final int PERM_REQUEST_CODE = 4711;
  private static boolean permissionsRequested = false;
  private static boolean webviewTuned = false;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Native bridge for the website's "Download App" button: hands the APK
    // URL to the Android system DownloadManager (see AppDownloaderPlugin).
    registerPlugin(AppDownloaderPlugin.class);
    super.onCreate(savedInstanceState);

    tuneWebView();

    // Ask for the runtime permissions the website's features need ONCE at
    // startup (crop-scan camera, GPS weather, voice assistant). Every
    // permission has a graceful denied-path inside the web app, so a
    // refusal never blocks usage and can never crash the app.
    if (!permissionsRequested) {
      permissionsRequested = true;
      String[] wanted = {
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.RECORD_AUDIO
      };
      requestIfNeeded(wanted);
    }
  }

  @Override
  public void onStart() {
    super.onStart();
    // Safety net: if the bridge finished initializing after onCreate,
    // make sure the tuning below is still applied.
    tuneWebView();
  }

  /**
   * Fixes the "giant text" mobile rendering bug:
   * 1) Android WebView silently multiplies text size by the SYSTEM font
   *    scale setting (Settings > Display > Font size). Farmers with an
   *    enlarged system font get a hugely inflated layout that looks nothing
   *    like the website. setTextZoom(100) pins text to the CSS-intended
   *    100% so the app matches the mobile browser rendering exactly.
   * 2) clearCache(true) on cold start guarantees the WebView always loads
   *    the LATEST deployed website version instead of stale cached assets.
   */
  private void tuneWebView() {
    if (webviewTuned || bridge == null || bridge.getWebView() == null) return;
    webviewTuned = true;
    try {
      WebSettings settings = bridge.getWebView().getSettings();
      settings.setTextZoom(100);
      bridge.getWebView().clearCache(true);
    } catch (Exception ignored) {
      // Never crash the app over a cosmetic tuning failure.
    }
  }

  private void requestIfNeeded(String[] permissions) {
    boolean anyMissing = false;
    for (String p : permissions) {
      if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
        anyMissing = true;
        break;
      }
    }
    if (anyMissing) {
      ActivityCompat.requestPermissions(this, permissions, PERM_REQUEST_CODE);
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    // Pass through to Capacitor plugin handlers, then intentionally ignore
    // the outcomes: the site degrades gracefully for every denial.
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }
}
