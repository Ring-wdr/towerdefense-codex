import { createGame } from "../phaser/game.js";
import { createGameSession } from "../phaser/state/game-session.js";
import { loadMetaProgress } from "./meta-progress.js";

export default function startGame(parent) {
  const mountNode = typeof parent === "string" ? document.getElementById(parent) : parent;

  if (!mountNode) {
    throw new Error("Missing #game-root mount for Phaser bootstrap.");
  }

  const game = createGame(mountNode);

  game.registry.set("session", createGameSession());
  game.registry.set("metaProgress", loadMetaProgress());

  return game;
}
