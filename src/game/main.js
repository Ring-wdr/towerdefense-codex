import { createGame } from "../phaser/game.js";
import { createGameSession } from "../phaser/state/game-session.js";
import { loadMetaProgress } from "./meta-progress.js";

export default function startGame(parent, options = {}) {
  const mountNode = typeof parent === "string" ? document.getElementById(parent) : parent;

  if (!mountNode) {
    throw new Error("Missing #game-root mount for Phaser bootstrap.");
  }

  const launchPayload = options.launchPayload ?? null;
  const session = launchPayload?.session ?? createGameSession();
  const metaProgress = launchPayload?.metaProgress ?? loadMetaProgress();
  const game = createGame(mountNode, {
    battleOnly: Boolean(launchPayload),
    preBoot(phaserGame) {
      phaserGame.registry.set("session", session);
      phaserGame.registry.set("metaProgress", metaProgress);
      phaserGame.registry.set("uiBridge", {
        onExitToMenu: options.onExitToMenu ?? null,
        controlsRoot: options.controlsRoot ?? null,
      });
    },
  });

  return game;
}
