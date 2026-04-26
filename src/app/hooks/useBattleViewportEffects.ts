import { useEffect } from "react";

const BROWSER_SAFE_BOTTOM_VAR = "--browser-safe-bottom";

function syncBrowserSafeBottomInset() {
  const viewport = window.visualViewport;
  const safeBottomInset = viewport
    ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
    : 0;

  document.documentElement.style.setProperty(BROWSER_SAFE_BOTTOM_VAR, `${safeBottomInset}px`);
}

export default function useBattleViewportEffects() {
  useEffect(() => {
    syncBrowserSafeBottomInset();

    const sync = () => {
      syncBrowserSafeBottomInset();
    };

    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    let lastTouchEndAt = 0;
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0 || event.changedTouches.length > 1) {
        return;
      }

      const now = Date.now();
      if (now - lastTouchEndAt <= 300) {
        event.preventDefault();
      }

      lastTouchEndAt = now;
    };

    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);
}
