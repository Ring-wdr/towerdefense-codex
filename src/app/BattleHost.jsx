import PhaserGame from "../PhaserGame.jsx";

export default function BattleHost({ launchPayload, onExitToMenu, controlsRootRef }) {
  return (
    <PhaserGame
      launchPayload={launchPayload}
      onExitToMenu={onExitToMenu}
      controlsRootRef={controlsRootRef}
    />
  );
}
