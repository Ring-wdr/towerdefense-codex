import type { RefObject } from "react";
import PhaserGame from "../PhaserGame";
import type { PhaserGameProps } from "../PhaserGame";
import type { GameSession } from "../phaser/state/game-session";
import type { MetaProgress } from "../game/meta-progress";
import type { BattleLaunchPayload } from "./app-state";

export interface BattleHostProps {
  launchPayload: BattleLaunchPayload | null;
  onExitToMenu: (session: GameSession, metaProgress: MetaProgress) => void;
  controlsRootRef: RefObject<HTMLElement | null>;
}

export default function BattleHost({ launchPayload, onExitToMenu, controlsRootRef }: BattleHostProps) {
  const phaserGameProps: PhaserGameProps = {
    launchPayload,
    onExitToMenu,
    controlsRootRef,
  };

  return (
    <PhaserGame {...phaserGameProps} />
  );
}
