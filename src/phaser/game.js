import * as Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene.js";
import { CampaignScene } from "./scenes/CampaignScene.js";
import { ThemeScene } from "./scenes/ThemeScene.js";
import { ShopScene } from "./scenes/ShopScene.js";
import { OverlayScene } from "./scenes/OverlayScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

export function createGame(parent, options = {}) {
  const battleOnly = options.battleOnly === true;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#162018",
    callbacks: {
      preBoot: options.preBoot ?? undefined,
      postBoot: options.postBoot ?? undefined,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    scene: battleOnly
      ? [BattleScene, OverlayScene]
      : [TitleScene, CampaignScene, ThemeScene, ShopScene, BattleScene, OverlayScene],
  });
}
