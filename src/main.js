import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, createIcons } from "lucide";
import attackTowerIconUrl from "./assets/towers/attack-v2.png";
import cannonTowerIconUrl from "./assets/towers/cannon-v2.png";
import hunterTowerIconUrl from "./assets/towers/hunter-v2.png";
import magicTowerIconUrl from "./assets/towers/magic-v2.png";
import slowTowerIconUrl from "./assets/towers/slow-v2.png";

const TOWER_ICON_URLS = {
  attack: attackTowerIconUrl,
  slow: slowTowerIconUrl,
  magic: magicTowerIconUrl,
  cannon: cannonTowerIconUrl,
  hunter: hunterTowerIconUrl,
};
const BROWSER_SAFE_BOTTOM_VAR = "--browser-safe-bottom";

function hydrateTowerIcons() {
  for (const img of document.querySelectorAll("[data-tower-icon]")) {
    const iconUrl = TOWER_ICON_URLS[img.dataset.towerIcon];
    if (!iconUrl) {
      continue;
    }

    img.src = iconUrl;
  }
}

function hydrateControlIcons() {
  createIcons({
    icons: {
      ArrowUp,
      ArrowLeft,
      ArrowRight,
      ArrowDown,
    },
  });
}

function syncBrowserSafeBottomInset() {
  const viewport = window.visualViewport;
  const safeBottomInset = viewport
    ? Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
    : 0;

  document.documentElement.style.setProperty(BROWSER_SAFE_BOTTOM_VAR, `${safeBottomInset}px`);
}

function bindBrowserSafeBottomInset() {
  syncBrowserSafeBottomInset();

  const sync = () => {
    syncBrowserSafeBottomInset();
  };

  window.visualViewport?.addEventListener("resize", sync);
  window.visualViewport?.addEventListener("scroll", sync);
  window.addEventListener("resize", sync);
}

function bindDoubleTapZoomGuard() {
  let lastTouchEndAt = 0;

  document.addEventListener("touchend", (event) => {
    if (event.touches.length > 0 || event.changedTouches.length > 1) {
      return;
    }

    const now = Date.now();
    if (now - lastTouchEndAt <= 300) {
      event.preventDefault();
    }

    lastTouchEndAt = now;
  }, { passive: false });
}

async function startApplication() {
  hydrateTowerIcons();
  hydrateControlIcons();
  bindBrowserSafeBottomInset();
  bindDoubleTapZoomGuard();

  const { default: startGame } = await import("./game/main.js");
  return startGame("game-root");
}

document.addEventListener("DOMContentLoaded", () => {
  void startApplication().catch((error) => {
    setTimeout(() => {
      throw error;
    });
  });
});
