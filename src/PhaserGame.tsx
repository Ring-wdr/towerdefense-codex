import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { RefObject } from "react";
import type { GameSession } from "./phaser/state/game-session";
import type { MetaProgress } from "./game/meta-progress";
import type { BattleLaunchPayload } from "./app/app-state";

interface PhaserRuntime {
  destroy(removeCanvas?: boolean): void;
}

interface StartGameModule {
  default: (
    container: HTMLDivElement,
    options: {
      launchPayload: BattleLaunchPayload;
      onExitToMenu: (session: GameSession, metaProgress: MetaProgress) => void;
      controlsRoot: HTMLElement | null;
    },
  ) => PhaserRuntime;
}

export interface PhaserGameHandle {
  readonly game: PhaserRuntime | null;
}

export interface PhaserGameProps {
  launchPayload: BattleLaunchPayload | null;
  onExitToMenu: (session: GameSession, metaProgress: MetaProgress) => void;
  controlsRootRef: RefObject<HTMLElement | null>;
}

const PhaserGame = forwardRef<PhaserGameHandle, PhaserGameProps>(function PhaserGame(
  { launchPayload, onExitToMenu, controlsRootRef },
  ref,
) {
  const gameContainer = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<PhaserRuntime | null>(null);
  const onExitToMenuRef = useRef(onExitToMenu);

  onExitToMenuRef.current = onExitToMenu;

  useImperativeHandle(
    ref,
    () => ({
      get game() {
        return gameRef.current;
      },
    }),
    [],
  );

  useEffect(() => {
    if (!launchPayload || gameRef.current || !gameContainer.current) {
      return;
    }

    const activeLaunchPayload = launchPayload;
    let cancelled = false;

    async function bootGame() {
      const { default: startGame } = await import("./game/main.js") as StartGameModule;

      if (cancelled || gameRef.current || !gameContainer.current) {
        return;
      }

      gameRef.current = startGame(gameContainer.current, {
        launchPayload: activeLaunchPayload,
        onExitToMenu: (session, metaProgress) => onExitToMenuRef.current(session, metaProgress),
        controlsRoot: controlsRootRef?.current ?? null,
      });
    }

    void bootGame();

    return () => {
      cancelled = true;

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [launchPayload, controlsRootRef]);

  return <div id="game-root" ref={gameContainer} className="game-root" aria-label="Tower defense game"></div>;
});

export default PhaserGame;
