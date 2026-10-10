import React, { useEffect } from "react";

/**
 * ClickFeedback component adds authentic mobile & desktop app click feedback:
 * 1. Creates a smooth, glowing radial ripple centered at the exact tap/click coordinates
 * 2. Triggers light haptic vibration (10ms) on supported mobile devices
 * 3. Works seamlessly without interfering with event propagation or click handlers
 */
export default function ClickFeedback() {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Find closest interactive element
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'button, a, [role="button"], input[type="submit"], input[type="button"], .click-feedback, .app-card-press, [data-ripple="true"]'
      );

      // We provide feedback for interactive clicks
      if (!interactive) return;

      // Soft haptic feedback on mobile if supported
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(10);
        }
      } catch {
        // Safe ignore
      }

      // Create floating ripple at pointer position
      const ripple = document.createElement("div");
      ripple.className = "click-ripple-floating";

      // Style the ripple
      const size = 32;
      const x = e.clientX - size / 2;
      const y = e.clientY - size / 2;

      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;

      document.body.appendChild(ripple);

      // Remove after animation completes
      setTimeout(() => {
        ripple.remove();
      }, 550);
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return null;
}
