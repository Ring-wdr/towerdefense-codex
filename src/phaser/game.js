import * as Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene.js";
import { CampaignScene } from "./scenes/CampaignScene.js";
import { ThemeScene } from "./scenes/ThemeScene.js";
import { ShopScene } from "./scenes/ShopScene.js";
import { OverlayScene } from "./scenes/OverlayScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#162018",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    scene: [TitleScene, CampaignScene, ThemeScene, ShopScene, BattleScene, OverlayScene],
  });
}
