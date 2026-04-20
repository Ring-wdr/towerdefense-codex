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

function hydrateTowerIcons() {
  for (const img of document.querySelectorAll("[data-tower-icon]")) {
    const iconUrl = TOWER_ICON_URLS[img.dataset.towerIcon];
    if (!iconUrl) {
      continue;
    }

    img.src = iconUrl;
  }
}

async function startApplication() {
  hydrateTowerIcons();

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
