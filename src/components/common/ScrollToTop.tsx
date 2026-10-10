import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

/**
 * ScrollToTop ensures:
 * 1. Whenever route or query changes, the viewport immediately scrolls to (0, 0)
 * 2. If a hash is provided (#section), smoothly scrolls to that element
 * 3. Double-raf + timeout ensures lazy-loaded route chunks also render at the top
 * 4. Displays an elegant floating "Scroll to Top" button when scrolled down > 300px
 * 5. Listens to clicks on active navigation links to smoothly scroll up
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 1. Primary route change scroll restoration
  useEffect(() => {
    if (hash) {
      // If there's an anchor hash like #faq or #features
      const targetId = hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById("root");
      if (root) root.scrollTop = 0;
    };

    // Immediate reset
    resetScroll();

    // Secondary reset for lazy-loaded route boundaries (React Suspense fallback transitions)
    const rafId = requestAnimationFrame(() => {
      resetScroll();
    });

    const timer = setTimeout(() => {
      resetScroll();
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, search, hash]);

  // 2. Track scroll position for floating button & progress
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      setShowScrollTop(currentScrollY > 320);

      const winHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (winHeight > 0) {
        setScrollProgress(Math.min(100, Math.round((currentScrollY / winHeight) * 100)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTopSmooth = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Floating Scroll to Top button when user scrolls down */}
      <button
        type="button"
        onClick={scrollToTopSmooth}
        aria-label="Scroll back to top"
        title="Scroll to top"
        className={`fixed z-40 flex items-center gap-1.5 p-3 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white shadow-xl shadow-emerald-900/30 transition-all duration-300 cursor-pointer ${
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-8 pointer-events-none"
        } bottom-20 lg:bottom-7 right-4 sm:right-6 group`}
      >
        <div className="relative flex items-center justify-center">
          <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
        </div>
        {scrollProgress > 15 && (
          <span className="hidden sm:inline-block text-[11px] font-bold pr-1 select-none">
            {scrollProgress}%
          </span>
        )}
      </button>
    </>
  );
}
