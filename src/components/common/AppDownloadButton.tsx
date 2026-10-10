import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

// ============================================================
// Android app download button — lives in the navbar right
// cluster (Subscribe -> Download App -> Settings).
// 1. Inside the KrishiMitra Android app (Capacitor WebView),
//    the native AppDownloader plugin hands the APK URL to the
//    Android DownloadManager (system notification + install).
// 2. On the web, if a GitHub Release on Amanyadavv007/KrishiMitra
//    has an .apk asset, it is served directly — always up to date.
// 3. Otherwise the bundled fallback in /downloads is used.
// Single tap starts the download immediately.
// ============================================================
const GITHUB_REPO = "Amanyadavv007/KrishiMitra";
const FALLBACK_URL = "/downloads/KrishiMitra.apk";

type CapacitorLike = {
  PluginListenerHeader?: unknown;
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function getCapacitor(): CapacitorLike | null {
  const cap = (window as unknown as { Capacitor?: CapacitorLike }).Capacitor;
  return cap ?? null;
}

function isAndroidApp(): boolean {
  const cap = getCapacitor();
  try {
    return !!cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android";
  } catch {
    return false;
  }
}

/** Native bridge: queue the APK in Android's DownloadManager. */
function nativeDownload(url: string): boolean {
  const cap = getCapacitor() as unknown as {
    nativePromise?: (
    plugin: string,
      method: string,
      options: { url: string }
    ) => Promise<unknown>;
  } | null;
  if (!cap?.nativePromise) return false;
  try {
    cap.nativePromise("AppDownloader", "download", { url });
    return true;
  } catch {
    return false;
  }
}

function triggerDownload(url: string) {
  // Hidden iframe forces the download without navigating away.
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  frame.src = url;
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 60_000);
}

export default function AppDownloadButton() {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isAndroidApp()) {
        // Inside the app itself: system DownloadManager via native plugin.
        nativeDownload("https://agri.freebuff.app/downloads/KrishiMitra.apk");
      } else {
        // On the web: prefer the latest GitHub Release asset, fall back to
        // the copy bundled with the site.
        let url = FALLBACK_URL;
        try {
          const res = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
            { headers: { Accept: "application/vnd.github+json" } }
          );
          if (res.ok) {
            const rel = await res.json();
            const asset = (rel.assets || []).find((a: { name: string }) =>
              /\.apk$/i.test(a.name)
            );
            if (asset?.browser_download_url) url = asset.browser_download_url;
          }
        } catch {
          /* offline or rate-limited -> fallback */
        }
        triggerDownload(url);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title="Download the KrishiMitra Android app"
      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 transition-colors active:scale-95 disabled:opacity-70 cursor-pointer"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span className="hidden md:inline">Download App</span>
      <span className="hidden sm:inline md:hidden">App</span>
    </button>
  );
}
