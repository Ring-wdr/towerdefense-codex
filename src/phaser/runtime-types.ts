import * as Phaser from "phaser";

import type { AttackEffect, BattleMode, BattleState, BattleStatus, TowerType } from "../game/logic";
import type { MetaProgress } from "../game/meta-progress";
import type { GameSession } from "./state/game-session";

export interface UiBridge {
  onExitToMenu: ((session: GameSession, metaProgress: MetaProgress) => void) | null;
  controlsRoot: HTMLElement | null;
}

export interface RuntimeLaunchPayload {
  session?: GameSession;
  metaProgress?: MetaProgress;
}

export interface StartGameOptions {
  launchPayload?: RuntimeLaunchPayload | null;
  onExitToMenu?: UiBridge["onExitToMenu"];
  controlsRoot?: UiBridge["controlsRoot"];
}

export interface GameBootstrapOptions {
  preBoot?: (game: Phaser.Game) => void;
  postBoot?: (game: Phaser.Game) => void;
}

export interface BattleSceneLaunchData {
  mode?: BattleMode;
  stage?: number;
}

export type OverlayMode = "paused" | "game-over" | "draft" | "campaign-complete";

export interface OverlaySceneData {
  mode?: OverlayMode;
  stage?: number;
  battleMode?: BattleMode;
  choices?: BattleState["draftChoices"];
}

export interface BattleControls {
  root: HTMLElement | null;
  startButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  towerActions: HTMLElement | null;
  upgradeAction: HTMLButtonElement | null;
  deleteAction: HTMLButtonElement | null;
  sidebar: HTMLElement | null;
  dock: HTMLElement | null;
  towerButtons: HTMLButtonElement[];
  moveButtons: HTMLButtonElement[];
  actionButtons: HTMLButtonElement[];
  selectionSummaries: HTMLElement[];
}

export interface AngleRange {
  min: number;
  max: number;
}

export interface ParticleBurstScale {
  start: number;
  end: number;
}

export interface AttackParticleBurst {
  emitterKey: TowerType;
  x: number;
  y: number;
  angle: AngleRange;
  speed: AngleRange;
  quantity: number;
  lifespan: number;
  scale: ParticleBurstScale;
  tint: number[];
  maxRadius?: number;
  radial?: boolean;
}

export type ScaleLength = (value: number) => number;

export interface BattleParticleEmitter {
  destroy(): void;
  explode(quantity: number, x: number, y: number): void;
  killAll(): void;
  setDepth(depth: number): this;
  updateConfig(config: Record<string, unknown>): void;
}

export interface SceneScaleLike {
  scale: {
    width: number;
    height: number;
  };
}

export interface CommandRowLayout {
  gap: number;
  left: number;
  right: number;
  buttonWidth: number;
  buttonHeight: number;
  positions: number[];
}

export interface BattleViewportOptions {
  safeBottomInset?: number;
  horizontalPadding?: number;
  topPadding?: number;
  bottomPadding?: number;
  dockBreakpoint?: number;
  forceBottomDock?: boolean;
  compactDockBreakpoint?: number;
  dockBottomPadding?: number;
  compactDockBottomPadding?: number;
  maxScale?: number;
  minScale?: number;
}

export interface BattleViewportLayout {
  width: number;
  height: number;
  scale: number;
  boardLeft: number;
  boardTop: number;
  boardWidth: number;
  boardHeight: number;
  boardRight: number;
  boardBottom: number;
  horizontalPadding: number;
  topPadding: number;
  bottomPadding: number;
  safeBottomInset: number;
  usesBottomDock: boolean;
}

export interface SceneLayoutOptions {
  safeBottomInset?: number;
}

export interface SceneLayout {
  width: number;
  height: number;
  margin: number;
  contentWidth: number;
  contentHeight: number;
  safeBottomInset: number;
  centerX: number;
  centerY: number;
  isMobile: boolean;
  isShort: boolean;
  header: {
    top: number;
    bottom: number;
    height: number;
  };
  focus: {
    top: number;
    bottom: number;
    height: number;
    centerY: number;
  };
  command: {
    top: number;
    bottom: number;
    height: number;
    centerY: number;
  };
  getCommandRow(count: number, preferredWidth?: number): CommandRowLayout;
}

export interface ViewportFrame extends SceneLayout {
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  footerY: number;
}

export interface RegistryPayloads {
  session: GameSession;
  metaProgress: MetaProgress;
  uiBridge: UiBridge;
}

export type RegistryKey = keyof RegistryPayloads;

export interface TransitionEnemyLike {
  defeated: boolean;
  defeatedTicks?: number;
  kind: BattleState["enemies"][number]["kind"];
  species: BattleState["enemies"][number]["species"];
  stage?: number;
}

export type BattleReadyStatus = Extract<BattleStatus, "running" | "ready" | "intermission">;
export type BattleParticleEffect = AttackEffect;
