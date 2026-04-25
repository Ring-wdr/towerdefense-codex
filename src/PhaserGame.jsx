import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const PhaserGame = forwardRef(function PhaserGame({ launchPayload, onExitToMenu, controlsRootRef }, ref) {
  const gameContainer = useRef(null);
  const gameRef = useRef(null);
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

    let cancelled = false;

    async function bootGame() {
      const { default: startGame } = await import("./game/main.js");

      if (cancelled || gameRef.current || !gameContainer.current) {
        return;
      }

      gameRef.current = startGame(gameContainer.current, {
        launchPayload,
        onExitToMenu: (...args) => onExitToMenuRef.current?.(...args),
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
