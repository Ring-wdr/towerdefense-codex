import * as Phaser from "phaser";

import type { GameBootstrapOptions } from "./runtime-types.js";
import { OverlayScene } from "./scenes/OverlayScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

type GameConfig = NonNullable<ConstructorParameters<typeof Phaser.Game>[0]>;

export function createGame(parent: GameConfig["parent"], options: GameBootstrapOptions = {}): Phaser.Game {
  const callbacks: NonNullable<GameConfig["callbacks"]> = {};
  const configParent = parent ?? null;

  if (options.preBoot !== undefined) {
    callbacks.preBoot = options.preBoot;
  }

  if (options.postBoot !== undefined) {
    callbacks.postBoot = options.postBoot;
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: configParent,
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
