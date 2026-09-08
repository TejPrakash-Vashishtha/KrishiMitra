import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Global error handler to catch uncaught errors
window.onerror = function (message, source, lineno, colno, error) {
  console.error("[AgriNexus Global Error]", { message, source, lineno, colno, error });
  // Show a visible error message if React fails to mount
  const root = document.getElementById("root");
  if (root && root.innerHTML.trim() === "") {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:system-ui">
        <div style="text-align:center;max-width:500px">
          <div style="font-size:4rem;margin-bottom:1rem">⚠️</div>
          <h1 style="color:#dc2626;font-size:1.5rem;font-weight:bold;margin-bottom:0.5rem">App failed to load</h1>
          <p style="color:#64748b;margin-bottom:1rem">${String(message)}</p>
          <p style="color:#94a3b8;font-size:0.875rem">${source || ""}:${lineno || 0}:${colno || 0}</p>
          <button onclick="window.location.reload()" style="margin-top:1rem;padding:0.75rem 1.5rem;background:#059669;color:white;border:none;border-radius:0.75rem;font-weight:600;cursor:pointer">Refresh</button>
        </div>
      </div>`;
  }
  return false;
};

window.onunhandledrejection = function (event) {
  console.error("[AgriNexus Unhandled Promise]", event.reason);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ErrorBoundary>
);
