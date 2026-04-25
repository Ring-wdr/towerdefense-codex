import * as Phaser from "phaser";
import { OverlayScene } from "./scenes/OverlayScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

export function createGame(parent, options = {}) {
  const callbacks = {};

  if (options.preBoot !== undefined) {
    callbacks.preBoot = options.preBoot;
  }

  if (options.postBoot !== undefined) {
    callbacks.postBoot = options.postBoot;
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#162018",
    ...(Object.keys(callbacks).length > 0 ? { callbacks } : {}),
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    scene: [BattleScene, OverlayScene],
  });
}
