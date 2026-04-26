import * as Phaser from "phaser";
import draculaBossSpriteUrl from "../../assets/boss/transparent/dracula-boss-transparent.png";
import flameBossSpriteUrl from "../../assets/boss/transparent/flame-boss-transparent.png";
import frostBossSpriteUrl from "../../assets/boss/transparent/frost-boss-transparent.png";
import attackTowerSpriteUrl from "../../assets/towers/attack-v2.png";
import bossEnemySpriteUrl from "../../assets/enemies/boss-v2.png";
import cannonTowerSpriteUrl from "../../assets/towers/cannon-v2.png";
import grassTile1Url from "../../assets/tiles/grass-1-v2.png";
import grassTile2Url from "../../assets/tiles/grass-2-v2.png";
import gruntEnemySpriteUrl from "../../assets/enemies/grunt-v2.png";
import hunterTowerSpriteUrl from "../../assets/towers/hunter-v2.png";
import magicTowerSpriteUrl from "../../assets/towers/magic-v2.png";
import roadTile1Url from "../../assets/tiles/road-1-v2.png";
import roadTile2Url from "../../assets/tiles/road-2-v2.png";
import runnerEnemySpriteUrl from "../../assets/enemies/runner-v2.png";
import shellbackEnemySpriteUrl from "../../assets/enemies/shellback-v2.png";
import slowTowerSpriteUrl from "../../assets/towers/slow-v2.png";
import swarmlingEnemySpriteUrl from "../../assets/enemies/swarmling-v2.png";
import wispEnemySpriteUrl from "../../assets/enemies/wisp-v2.png";
import {
  applyBattleDraftChoice,
  buildTowerAtCursor,
  canBuildTower,
  CELL_SIZE,
  createInitialState,
  deleteTowerAtCursor,
  ENEMY_DEFEAT_TICKS,
  ENEMY_SPECIES,
  findTowerAt,
  getEnemyPosition,
  getPathCells,
  getTowerStats,
  getUpgradeCost,
  GRID_COLS,
  GRID_ROWS,
  MAX_TOWER_LEVEL,
  moveCursor,
  restartGame,
  selectTowerType,
  setCursorPosition,
  startGame,
  TICK_MS,
  tickGame,
  togglePause,
  TOWER_TYPES,
  upgradeTowerAtCursor,
} from "../../game/logic.js";
import { ENDLESS_STAGE_NUMBER, getStageDefinition } from "../../game/stages.js";
import {
  beginBattleFromSelection,
  beginEndlessBattle,
  completeBattleStage,
  createGameSession,
  getCompletedBattleStage,
  returnFromBattleToTheme,
  returnToTitle,
  selectStage,
} from "../state/game-session.js";
import { loadMetaProgress, saveMetaProgress } from "../../game/meta-progress.js";
import { awardStageClearRewards } from "../../game/meta-shop.js";
import {
  BATTLE_PARTICLE_TEXTURE_KEY,
  buildAttackParticleBursts,
  ensureBattleParticleTexture,
} from "./battle-particles.js";
import type {
  BattleControls,
  BattleParticleEffect,
  BattleParticleEmitter,
  BattleReadyStatus,
  BattleSceneLaunchData,
  OverlayMode,
  OverlaySceneData,
  RegistryKey,
  RegistryPayloads,
  UiBridge,
} from "../runtime-types.js";
import { createBodyTextStyle, createHeadingTextStyle, PHASER_TEXT_FONTS } from "../ui/components.js";
import { getBattleViewportLayout, getBrowserSafeBottomInset } from "../ui/layout.js";
import type {
  AttackEffect,
  BattleMode,
  BattleState,
  BattleStatus,
  Cursor,
  Enemy,
  EnemySpeciesId,
  TowerType,
} from "../../game/logic.js";
import type { MetaProgress } from "../../game/meta-progress.js";
import type { CampaignTheme, ThemeName } from "../../game/stages.js";
import type { GameSession } from "../state/game-session.js";

const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;
const ATTACK_PARTICLE_DEPTH = 5;
const TOWER_KEYS = ["attack", "slow", "magic", "cannon", "hunter"] as const satisfies readonly TowerType[];
const TOWER_TEXTURE_KEYS = {
  attack: "tower-attack",
  slow: "tower-slow",
  magic: "tower-magic",
  cannon: "tower-cannon",
  hunter: "tower-hunter",
} satisfies Record<TowerType, string>;
const TOWER_TEXTURE_URLS = {
  "tower-attack": attackTowerSpriteUrl,
  "tower-slow": slowTowerSpriteUrl,
  "tower-magic": magicTowerSpriteUrl,
  "tower-cannon": cannonTowerSpriteUrl,
  "tower-hunter": hunterTowerSpriteUrl,
} as const;
const ENEMY_TEXTURE_KEYS = {
  boss: "enemy-boss",
  grunt: "enemy-grunt",
  runner: "enemy-runner",
  shellback: "enemy-shellback",
  swarmling: "enemy-swarmling",
  wisp: "enemy-wisp",
} satisfies Record<EnemySpeciesId, string>;
const ENEMY_TEXTURE_URLS = {
  "enemy-boss": bossEnemySpriteUrl,
  "enemy-grunt": gruntEnemySpriteUrl,
  "enemy-runner": runnerEnemySpriteUrl,
  "enemy-shellback": shellbackEnemySpriteUrl,
  "enemy-swarmling": swarmlingEnemySpriteUrl,
  "enemy-wisp": wispEnemySpriteUrl,
} as const;
const THEME_BOSS_TEXTURE_KEYS = {
  "기초 방어": "enemy-boss-frost",
  "압박 대응": "enemy-boss-flame",
  "후반 운용": "enemy-boss-dracula",
} as const satisfies Record<CampaignTheme, string>;
const THEME_BOSS_TEXTURE_URLS = {
  "enemy-boss-frost": frostBossSpriteUrl,
  "enemy-boss-flame": flameBossSpriteUrl,
  "enemy-boss-dracula": draculaBossSpriteUrl,
} as const;
const THEME_BOSS_FRAME_RECTS = {
  "기초 방어": {
    idle: { x: 8, y: 614, width: 214, height: 210 },
    death: { x: 884, y: 1098, width: 360, height: 150 },
  },
  "압박 대응": {
    idle: { x: 0, y: 601, width: 210, height: 216 },
    death: { x: 936, y: 1052, width: 318, height: 190 },
  },
  "후반 운용": {
    idle: { x: 0, y: 641, width: 160, height: 194 },
    death: { x: 36, y: 847, width: 162, height: 180 },
  },
};
const THEME_BOSS_FRAME_KEYS = {
  "기초 방어": {
    idle: "enemy-boss-frost-idle",
    death: "enemy-boss-frost-death",
  },
  "압박 대응": {
    idle: "enemy-boss-flame-idle",
    death: "enemy-boss-flame-death",
  },
  "후반 운용": {
    idle: "enemy-boss-dracula-idle",
    death: "enemy-boss-dracula-death",
  },
} as const satisfies Record<CampaignTheme, { idle: string; death: string }>;
const GRASS_TILE_TEXTURE_KEYS = ["tile-grass-1", "tile-grass-2"] as const;
const ROAD_TILE_TEXTURE_KEYS = ["tile-road-1", "tile-road-2"] as const;
const BATTLE_READY_STATUSES = ["running", "ready", "intermission"] as const satisfies readonly BattleReadyStatus[];
const TILE_TEXTURE_URLS = {
  "tile-grass-1": grassTile1Url,
  "tile-grass-2": grassTile2Url,
  "tile-road-1": roadTile1Url,
  "tile-road-2": roadTile2Url,
} as const;
const DEPTHS = {
  tiles: 0,
  towerBadges: 1,
  towers: 2,
  enemies: 3,
  overlays: 10,
  text: 11,
};

type FrameState = "idle" | "death";
type FrameRect = { x: number; y: number; width: number; height: number };
type DisplayMap<T extends { destroy(): void }> = Map<number | string, T>;

const EMPTY_UI_BRIDGE: UiBridge = { onExitToMenu: null, controlsRoot: null };

function getRegistryValue<K extends RegistryKey>(
  scene: Phaser.Scene,
  key: K,
  fallback: RegistryPayloads[K],
): RegistryPayloads[K] {
  return (scene.game.registry.get(key) as RegistryPayloads[K] | undefined) ?? fallback;
}

function getSession(scene: Phaser.Scene): GameSession {
  return getRegistryValue(scene, "session", createGameSession());
}

function getMetaProgress(scene: Phaser.Scene): MetaProgress {
  return getRegistryValue(scene, "metaProgress", loadMetaProgress());
}

function getUiBridge(scene: Phaser.Scene): UiBridge {
  return getRegistryValue(scene, "uiBridge", EMPTY_UI_BRIDGE);
}

function getCampaignTheme(theme: ThemeName | null | undefined): CampaignTheme | null {
  if (!theme || !(theme in THEME_BOSS_TEXTURE_KEYS)) {
    return null;
  }

  return theme as CampaignTheme;
}

function getControlElements(scene: Phaser.Scene): BattleControls {
  const bridge = getUiBridge(scene);
  const root = bridge.controlsRoot ?? null;

  if (!root) {
    return {
      root: null,
      startButton: null,
      pauseButton: null,
      towerActions: null,
      upgradeAction: null,
      deleteAction: null,
      sidebar: null,
      dock: null,
      towerButtons: [],
      moveButtons: [],
      actionButtons: [],
      selectionSummaries: [],
    };
  }

  const queryButton = (selector: string): HTMLButtonElement | null => root.querySelector(selector);
  const queryElement = (selector: string): HTMLElement | null => root.querySelector(selector);

  return {
    root,
    startButton: queryButton("#start-button"),
    pauseButton: queryButton("#pause-button"),
    towerActions: queryElement("#tower-actions"),
    upgradeAction: queryButton("#upgrade-action"),
    deleteAction: queryButton("#delete-action"),
    sidebar: queryElement(".sidebar"),
    dock: queryElement("#tower-buttons-dock"),
    towerButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-tower]")),
    moveButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-move]")),
    actionButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-action]")),
    selectionSummaries: Array.from(root.querySelectorAll<HTMLElement>("[data-selection-summary]")),
  };
}

export class BattleScene extends Phaser.Scene {
  state: BattleState;
  graphics!: Phaser.GameObjects.Graphics;
  towerBadgeGraphics!: Phaser.GameObjects.Graphics;
  attackParticleEmitters: Map<TowerType, BattleParticleEmitter>;
  handledAttackEffectIds: Set<number>;
  hudText!: Phaser.GameObjects.Text;
  helpText!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  tileImages: Phaser.GameObjects.Image[];
  towerSprites: Map<number, Phaser.GameObjects.Image>;
  enemySprites: Map<number, Phaser.GameObjects.Image>;
  boardOffset: Cursor;
  boardScale: number;
  scaledCellSize: number;
  scaledBoardWidth: number;
  scaledBoardHeight: number;
  lastTickAt: number;
  controls: BattleControls | null;
  domListeners: Array<() => void>;

  constructor() {
    super("BattleScene");
    this.state = createInitialState();
    this.attackParticleEmitters = new Map<TowerType, BattleParticleEmitter>();
    this.handledAttackEffectIds = new Set();
    this.tileImages = [];
    this.towerSprites = new Map();
    this.enemySprites = new Map();
    this.boardOffset = { x: 0, y: 0 };
    this.boardScale = 1;
    this.scaledCellSize = CELL_SIZE;
    this.scaledBoardWidth = BOARD_WIDTH;
    this.scaledBoardHeight = BOARD_HEIGHT;
    this.lastTickAt = 0;
    this.controls = null;
    this.domListeners = [];
  }

  preload(): void {
    for (const [key, url] of Object.entries(TOWER_TEXTURE_URLS)) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }

    for (const [key, url] of Object.entries(ENEMY_TEXTURE_URLS)) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }

    for (const [key, url] of Object.entries(THEME_BOSS_TEXTURE_URLS)) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }

    for (const [key, url] of Object.entries(TILE_TEXTURE_URLS)) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }
  }

  create(data: BattleSceneLaunchData = {}): void {
    const session = getSession(this);
    const metaProgress = getMetaProgress(this);
    const mode = data.mode ?? session.battleMode ?? "campaign";
    const sessionStage = session.activeStage;
    const stage = mode === "endless" ? ENDLESS_STAGE_NUMBER : data.stage ?? sessionStage ?? 1;
    const nextSession =
      mode === "endless"
        ? beginEndlessBattle(session, metaProgress)
        : beginBattleFromSelection(selectStage(session, stage));

    this.state = createInitialState(stage, metaProgress, { mode });
    this.lastTickAt = 0;
    this.game.registry.set("session", nextSession);
    this.registerBossFrames();

    this.cameras.main.setBackgroundColor("#142018");
    this.towerBadgeGraphics = this.add.graphics();
    this.graphics = this.add.graphics();
    this.towerBadgeGraphics.setDepth(DEPTHS.towerBadges);
    this.graphics.setDepth(DEPTHS.overlays);
    this.createAttackParticles();
    this.hudText = this.add.text(0, 0, "", createBodyTextStyle({
      color: "#f5efe1",
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: "20px",
      lineSpacing: 7,
      fontStyle: "600",
    }));
    this.helpText = this.add.text(0, 0, "", createBodyTextStyle({
      color: "#c9d5c0",
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: "17px",
      lineSpacing: 6,
      wordWrap: { width: 380 },
    }));
    this.helpText.setVisible(false);
    this.statusText = this.add.text(0, 0, "", createHeadingTextStyle({
      color: "#f5efe1",
      fontFamily: PHASER_TEXT_FONTS.heading,
      fontSize: "34px",
      fontStyle: "bold",
      align: "center",
      strokeThickness: 5,
    }));
    this.hudText.setDepth(DEPTHS.text);
    this.helpText.setDepth(DEPTHS.text);
    this.statusText.setDepth(DEPTHS.text);

    this.scale.on("resize", this.handleResize, this);
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.keyboard?.on("keydown", this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

    this.bindBattleControls();
    this.syncBattleControls();
    this.handleResize();
    this.renderScene();
  }

  handleSceneShutdown(): void {
    this.scale.off("resize", this.handleResize, this);
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.unbindBattleControls();
    this.destroyAttackParticles();
    this.destroyDisplayMap(this.towerSprites);
    this.destroyDisplayMap(this.enemySprites);
    this.towerBadgeGraphics.destroy();
    for (const tile of this.tileImages) {
      tile.destroy();
    }
    this.tileImages = [];
    this.setBattleControlsVisible(false);
  }

  update(time: number): void {
    if (!["running", "intermission"].includes(this.state.status) || time - this.lastTickAt < 100) {
      this.renderScene();
      return;
    }

    this.lastTickAt = time;
    this.applyState(tickGame(this.state));
  }

  bindBattleControls(): void {
    this.controls = getControlElements(this);

    if (!this.controls.root) {
      return;
    }

    const bind = (
      element: HTMLElement | null,
      eventName: keyof HTMLElementEventMap,
      handler: EventListener,
    ): void => {
      if (!element) {
        return;
      }

      element.addEventListener(eventName, handler);
      this.domListeners.push(() => element.removeEventListener(eventName, handler));
    };

    bind(this.controls.pauseButton, "click", () => {
      this.applyState(togglePause(this.state));
    });

    bind(this.controls.startButton, "click", () => {
      this.applyState(startGame(this.state));
    });

    bind(this.controls.upgradeAction, "click", () => {
      this.applyState(upgradeTowerAtCursor(this.state));
    });

    bind(this.controls.deleteAction, "click", () => {
      this.applyState(deleteTowerAtCursor(this.state));
    });

    for (const button of this.controls.towerButtons) {
      bind(button, "click", () => {
        const towerType = button.dataset.tower;
        if (towerType && towerType in TOWER_TYPES) {
          this.applyState(selectTowerType(this.state, towerType as TowerType));
        }
      });
    }

    for (const button of this.controls.moveButtons) {
      bind(button, "click", () => {
        const deltas: Record<"up" | "down" | "left" | "right", readonly [number, number]> = {
          up: [0, -1],
          down: [0, 1],
          left: [-1, 0],
          right: [1, 0],
        };
        const move = button.dataset.move;
        const [dx, dy] = move && move in deltas ? deltas[move as keyof typeof deltas] : [0, 0];
        this.applyState(moveCursor(this.state, dx, dy));
      });
    }

    for (const button of this.controls.actionButtons) {
      bind(button, "click", () => {
        switch (button.dataset.action) {
          case "build":
            this.applyState(buildTowerAtCursor(this.state));
            break;
          case "upgrade":
            this.applyState(upgradeTowerAtCursor(this.state));
            break;
          case "pause":
            if (["running", "paused"].includes(this.state.status)) {
              this.applyState(togglePause(this.state));
            } else {
              this.applyState(startGame(this.state));
            }
            break;
          case "restart":
            this.restartBattle();
            break;
          default:
            break;
        }
      });
    }
  }

  unbindBattleControls(): void {
    for (const removeListener of this.domListeners) {
      removeListener();
    }
    this.domListeners = [];
    this.controls = null;
  }

  resumeBattle(): void {
    if (this.state.status === "paused") {
      this.state = togglePause(this.state);
    } else if (["ready", "intermission"].includes(this.state.status)) {
      this.state = startGame(this.state);
    }

    this.lastTickAt = 0;
    this.syncBattleControls();
    this.renderScene();
  }

  hideTowerActionOverlay(): void {
    if (!this.controls?.towerActions) {
      return;
    }

    this.controls.towerActions.hidden = true;
    this.controls.towerActions.style.left = "";
    this.controls.towerActions.style.top = "";

    if (this.controls.upgradeAction) {
      this.controls.upgradeAction.textContent = "Upgrade";
      this.controls.upgradeAction.disabled = false;
    }

    if (this.controls.deleteAction) {
      this.controls.deleteAction.textContent = "Delete";
      this.controls.deleteAction.disabled = false;
    }
  }

  syncTowerActionOverlay(): void {
    if (!this.controls?.towerActions || !this.controls.upgradeAction || !this.controls.deleteAction) {
      return;
    }

    const battleActive = (BATTLE_READY_STATUSES as readonly string[]).includes(this.state.status);
    const hoveredTower = findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y);

    if (!battleActive || !hoveredTower) {
      this.hideTowerActionOverlay();
      return;
    }

    const upgradeCost = getUpgradeCost(hoveredTower);
    const isMaxLevel = hoveredTower.level >= MAX_TOWER_LEVEL;
    const canAffordUpgrade = this.state.gold >= upgradeCost;
    const towerCenterX = this.boardOffset.x + hoveredTower.x * this.scaledCellSize + this.scaledCellSize / 2;
    const towerTopY = this.boardOffset.y + hoveredTower.y * this.scaledCellSize;
    const actionGap = this.scaleLength(14);
    const towerActions = this.controls.towerActions;

    this.controls.upgradeAction.textContent = isMaxLevel ? "Max" : `Upgrade ${upgradeCost}G`;
    this.controls.upgradeAction.disabled = isMaxLevel || !canAffordUpgrade;
    this.controls.deleteAction.textContent = "Delete";
    this.controls.deleteAction.disabled = false;

    towerActions.hidden = false;
    towerActions.style.left = `${towerCenterX}px`;
    towerActions.style.top = `${Math.max(24, towerTopY - actionGap)}px`;

    const bounds = towerActions.getBoundingClientRect();
    const halfWidth = bounds.width / 2;
    const clampedLeft = Phaser.Math.Clamp(towerCenterX, halfWidth + 12, this.scale.width - halfWidth - 12);
    const clampedTop = Math.max(bounds.height + 12, towerTopY - actionGap);

    towerActions.style.left = `${clampedLeft}px`;
    towerActions.style.top = `${clampedTop}px`;
  }

  restartBattle(): void {
    this.state = restartGame(this.state.stage, this.state.metaProgress);
    this.lastTickAt = 0;
    for (const emitter of this.attackParticleEmitters.values()) {
      emitter.killAll();
    }
    this.handledAttackEffectIds.clear();
    this.syncBattleControls();
    this.renderScene();
  }

  resolveDraftChoice(perkId: BattleState["draftHistory"][number]): void {
    this.applyState(applyBattleDraftChoice(this.state, perkId));
  }

  persistStageClearRewards(stageNumber: number): MetaProgress {
    const metaProgress = getMetaProgress(this);
    const nextMetaProgress = awardStageClearRewards(metaProgress, stageNumber);
    const savedProgress = saveMetaProgress(nextMetaProgress);

    this.game.registry.set("metaProgress", savedProgress);
    this.state = {
      ...this.state,
      metaProgress: savedProgress,
    };

    return savedProgress;
  }

  createAttackParticles(): void {
    ensureBattleParticleTexture(this);
    this.destroyAttackParticles();

    for (const key of ["attack", "slow", "magic", "cannon", "hunter"]) {
      const emitter = this.add.particles(0, 0, BATTLE_PARTICLE_TEXTURE_KEY, {
        active: true,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
        frequency: -1,
        lifespan: 180,
        quantity: 1,
        scale: { start: 0.18, end: 0 },
        speed: { min: 0, max: 0 },
      }) as BattleParticleEmitter;
      emitter.setDepth(ATTACK_PARTICLE_DEPTH);
      this.attackParticleEmitters.set(key as TowerType, emitter);
    }

    this.handledAttackEffectIds.clear();
  }

  destroyAttackParticles(): void {
    for (const emitter of this.attackParticleEmitters.values()) {
      emitter.destroy();
    }
    this.attackParticleEmitters.clear();
    this.handledAttackEffectIds.clear();
  }

  exitToMenu(nextSession: GameSession): void {
    const bridge = getUiBridge(this);
    const metaProgress = getMetaProgress(this);

    this.game.registry.set("session", nextSession);
    this.setBattleControlsVisible(false);

    if (typeof bridge.onExitToMenu === "function") {
      bridge.onExitToMenu(nextSession, metaProgress);
    }
  }

  returnToTheme(): void {
    const nextSession = this.state.mode === "endless"
      ? returnToTitle(getSession(this))
      : returnFromBattleToTheme(selectStage(getSession(this), this.state.stage));

    this.exitToMenu(nextSession);
  }

  handleResize(): void {
    const dockBottomPadding = this.getDockBottomPadding();
    const safeBottomInset = getBrowserSafeBottomInset();
    const viewport = getBattleViewportLayout(this, BOARD_WIDTH, BOARD_HEIGHT, {
      topPadding: 92,
      bottomPadding: 24,
      forceBottomDock: true,
      dockBottomPadding,
      compactDockBottomPadding: dockBottomPadding,
      maxScale: 1,
      safeBottomInset,
    });

    this.boardOffset = {
      x: viewport.boardLeft,
      y: viewport.boardTop,
    };
    this.boardScale = viewport.scale;
    this.scaledCellSize = CELL_SIZE * viewport.scale;
    this.scaledBoardWidth = viewport.boardWidth;
    this.scaledBoardHeight = viewport.boardHeight;

    this.hudText.setPosition(24, 20);
    this.hudText.setWordWrapWidth(Math.max(180, this.scale.width - 48));
    this.hudText.setFontSize(this.scale.width <= 480 ? "16px" : "20px");
    this.helpText.setPosition(24, this.scale.height - safeBottomInset - 116);
    this.helpText.setWordWrapWidth(Math.max(180, this.scale.width - 48));
    this.helpText.setFontSize(this.scale.width <= 480 ? "15px" : "17px");
    this.statusText.setPosition(this.scale.width / 2, 36);
    this.statusText.setOrigin(0.5, 0);
    this.statusText.setFontSize(this.scale.width <= 480 ? "26px" : "34px");
    this.syncTowerActionOverlay();
  }

  getDockBottomPadding(): number {
    if (!this.controls?.dock) {
      return 160;
    }

    const wasHidden = this.controls.dock.hidden;
    if (wasHidden) {
      this.controls.dock.hidden = false;
    }

    const dockHeight = this.controls.dock.getBoundingClientRect().height;

    if (wasHidden) {
      this.controls.dock.hidden = true;
    }

    return Math.max(160, Math.ceil(dockHeight) + 20);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const cell = this.pointerToCell(pointer.worldX, pointer.worldY);
    if (!cell) {
      return;
    }

    let nextState = setCursorPosition(this.state, cell.x, cell.y);

    if (pointer.rightButtonDown()) {
      nextState = deleteTowerAtCursor(nextState);
    } else if (findTowerAt(nextState, cell.x, cell.y)) {
      nextState = upgradeTowerAtCursor(nextState);
    } else {
      nextState = buildTowerAtCursor(nextState);
    }

    this.applyState(nextState);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key >= "1" && event.key <= "5") {
      const towerType = TOWER_KEYS[Number(event.key) - 1];
      if (towerType) {
        this.applyState(selectTowerType(this.state, towerType));
      }
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        this.applyState(moveCursor(this.state, 0, -1));
        break;
      case "ArrowDown":
        this.applyState(moveCursor(this.state, 0, 1));
        break;
      case "ArrowLeft":
        this.applyState(moveCursor(this.state, -1, 0));
        break;
      case "ArrowRight":
        this.applyState(moveCursor(this.state, 1, 0));
        break;
      case "b":
      case "B":
      case "Enter":
        this.applyState(buildTowerAtCursor(this.state));
        break;
      case "u":
      case "U":
        this.applyState(upgradeTowerAtCursor(this.state));
        break;
      case "x":
      case "X":
      case "Backspace":
      case "Delete":
        this.applyState(deleteTowerAtCursor(this.state));
        break;
      case "p":
      case "P":
      case " ":
        this.applyState(togglePause(this.state));
        break;
      case "s":
      case "S":
        if (["ready", "intermission"].includes(this.state.status)) {
          this.applyState(startGame(this.state));
        }
        break;
      case "r":
      case "R":
        this.restartBattle();
        break;
      default:
        return;
    }
  }

  applyState(nextState: BattleState): void {
    const previousStatus = this.state.status;
    this.state = nextState;

    if (previousStatus !== this.state.status) {
      this.handleStatusTransition(previousStatus);
    }

    this.syncBattleControls();
    this.renderScene();
  }

  handleStatusTransition(previousStatus: BattleStatus): void {
    if (this.state.status === "paused") {
      this.openOverlay("paused");
      return;
    }

    if (previousStatus === "paused" && this.state.status === "running") {
      this.scene.stop("OverlayScene");
      return;
    }

    if (this.state.status === "game-over") {
      this.openOverlay("game-over");
      return;
    }

    if (this.state.status === "draft") {
      this.openOverlay("draft", {
        choices: this.state.draftChoices,
      });
      return;
    }

    if (this.state.status === "stage-cleared") {
      const session = getSession(this);
      const completedStage = getCompletedBattleStage(session, this.state);
      this.persistStageClearRewards(completedStage);
      const progressedSession = completeBattleStage(session, completedStage);
      this.exitToMenu(progressedSession);
      return;
    }

    if (this.state.status === "victory") {
      const session = getSession(this);
      const completedStage = getCompletedBattleStage(session, this.state);
      this.persistStageClearRewards(completedStage);
      const nextSession = completeBattleStage(session, completedStage);
      this.game.registry.set("session", nextSession);
      this.setBattleControlsVisible(false);

      if (nextSession.scene === "campaign-complete") {
        this.scene.start("OverlayScene", {
          mode: "campaign-complete",
          stage: this.state.stage,
        });
        return;
      }

      this.exitToMenu(nextSession);
    }
  }

  openOverlay(mode: OverlayMode, data: Partial<OverlaySceneData> = {}): void {
    this.setBattleControlsVisible(false);
    this.scene.launch("OverlayScene", {
      mode,
      stage: this.state.stage,
      battleMode: this.state.mode,
      ...data,
    });
    this.scene.pause();
  }

  syncBattleControls(): void {
    if (!this.controls?.root) {
      return;
    }

    const battleActive = (BATTLE_READY_STATUSES as readonly string[]).includes(this.state.status);
    this.setBattleControlsVisible(battleActive);

    const hoveredTower = findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y);
    const selectedTower = TOWER_TYPES[this.state.selectedTowerType];
    const summary = hoveredTower
      ? `${hoveredTower.type.toUpperCase()} L${hoveredTower.level}`
      : `${selectedTower.name} ${selectedTower.cost}g`;

    for (const label of this.controls.selectionSummaries) {
      label.textContent = summary;
    }

    for (const button of this.controls.towerButtons) {
      const isSelected = button.dataset.tower === this.state.selectedTowerType;
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    }

    if (this.controls.startButton) {
      this.controls.startButton.hidden = this.state.status === "running";
      this.controls.startButton.textContent = this.state.status === "intermission" ? "Start Next" : "Start";
    }

    if (this.controls.pauseButton) {
      this.controls.pauseButton.hidden = this.state.status !== "running";
      this.controls.pauseButton.textContent = this.state.status === "paused" ? "Resume" : "Pause";
    }

    for (const button of this.controls.actionButtons) {
      if (button.dataset.action === "pause") {
        button.textContent = this.state.status === "running" ? "Pause" : "Start";
      }
    }

    this.syncTowerActionOverlay();
  }

  setBattleControlsVisible(isVisible: boolean): void {
    if (!this.controls?.root) {
      return;
    }

    this.controls.root.hidden = !isVisible;
    if (this.controls.sidebar) {
      this.controls.sidebar.hidden = !isVisible;
    }
    if (this.controls.dock) {
      this.controls.dock.hidden = !isVisible;
    }

    if (!isVisible) {
      this.hideTowerActionOverlay();
      return;
    }

    this.syncTowerActionOverlay();
  }

  pointerToCell(worldX: number, worldY: number): Cursor | null {
    const localX = worldX - this.boardOffset.x;
    const localY = worldY - this.boardOffset.y;

    if (localX < 0 || localY < 0 || localX >= this.scaledBoardWidth || localY >= this.scaledBoardHeight) {
      return null;
    }

    return {
      x: Math.floor(localX / this.scaledCellSize),
      y: Math.floor(localY / this.scaledCellSize),
    };
  }

  renderScene(): void {
    this.towerBadgeGraphics.clear();
    this.graphics.clear();
    this.drawBoard();
    this.syncBoardTiles();
    this.drawTowerRanges();
    this.drawGrid();
    this.drawCursor();
    this.drawTowerBadges();
    this.syncTowerSprites();
    this.syncEnemySprites();
    this.drawEnemyOverlays();
    this.drawEffects();
    this.syncAttackParticles();
    this.updateHud();
  }

  drawBoard(): void {
    this.graphics.lineStyle(4, 0x0b120d, 1);
    this.graphics.strokeRect(
      this.boardOffset.x,
      this.boardOffset.y,
      this.scaledBoardWidth,
      this.scaledBoardHeight,
    );
  }

  syncBoardTiles(): void {
    const roadCells = new Set(getPathCells(this.state.stage).map((cell) => `${cell.x},${cell.y}`));
    const expectedTileCount = GRID_COLS * GRID_ROWS;

    if (this.tileImages.length !== expectedTileCount) {
      for (const tile of this.tileImages) {
        tile.destroy();
      }
      this.tileImages = [];

      for (let y = 0; y < GRID_ROWS; y += 1) {
        for (let x = 0; x < GRID_COLS; x += 1) {
          const isRoad = roadCells.has(`${x},${y}`);
          const texturePool = isRoad ? ROAD_TILE_TEXTURE_KEYS : GRASS_TILE_TEXTURE_KEYS;
          const textureKey = texturePool[Math.abs((x * 31 + y * 17) % texturePool.length)]!;
          const tile = this.add.image(0, 0, textureKey).setOrigin(0, 0);
          tile.setDepth(DEPTHS.tiles);
          this.tileImages.push(tile);
        }
      }
    }

    let index = 0;
    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        const tile = this.tileImages[index]!;
        tile.setDisplaySize(this.scaledCellSize, this.scaledCellSize);
        tile.setPosition(
          this.boardOffset.x + x * this.scaledCellSize,
          this.boardOffset.y + y * this.scaledCellSize,
        );
        index += 1;
      }
    }
  }

  drawGrid(): void {
    this.graphics.lineStyle(1, 0x38503a, 0.85);

    for (let column = 0; column <= GRID_COLS; column += 1) {
      const x = this.boardOffset.x + column * this.scaledCellSize;
      this.graphics.lineBetween(x, this.boardOffset.y, x, this.boardOffset.y + this.scaledBoardHeight);
    }

    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const y = this.boardOffset.y + row * this.scaledCellSize;
      this.graphics.lineBetween(this.boardOffset.x, y, this.boardOffset.x + this.scaledBoardWidth, y);
    }
  }

  drawTowerRanges(): void {
    const selectedTowerId = findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y)?.id ?? null;

    for (const tower of this.state.towers) {
      const stats = getTowerStats(tower, this.state.metaProgress, this.state.runModifiers);
      if (stats.range <= 0) {
        continue;
      }

      const fillColor = Phaser.Display.Color.HexStringToColor(TOWER_TYPES[tower.type].color).color;
      const isSelected = tower.id === selectedTowerId;
      const x = this.boardOffset.x + tower.x * this.scaledCellSize + this.scaledCellSize / 2;
      const y = this.boardOffset.y + tower.y * this.scaledCellSize + this.scaledCellSize / 2;
      const radius = this.scaleLength(stats.range * CELL_SIZE);

      this.graphics.fillStyle(fillColor, isSelected ? 0.22 : 0.12);
      this.graphics.fillCircle(x, y, radius);
      this.graphics.lineStyle(isSelected ? 3 : 2, fillColor, isSelected ? 0.82 : 0.42);
      this.graphics.strokeCircle(x, y, radius);
    }
  }

  drawCursor(): void {
    const buildable = canBuildTower(
      this.state,
      this.state.cursor.x,
      this.state.cursor.y,
      this.state.selectedTowerType,
    );
    const cursorTower = findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y);
    const color = cursorTower ? 0xe4c47a : buildable ? 0x7fd16f : 0xd35a5a;
    const inset = Math.max(2, Math.round(this.scaledCellSize * 0.04));

    this.graphics.lineStyle(4, color, 1);
    this.graphics.strokeRect(
      this.boardOffset.x + this.state.cursor.x * this.scaledCellSize + inset,
      this.boardOffset.y + this.state.cursor.y * this.scaledCellSize + inset,
      this.scaledCellSize - inset * 2,
      this.scaledCellSize - inset * 2,
    );
  }

  syncTowerSprites(): void {
    const activeIds = new Set(this.state.towers.map((tower) => tower.id));

    for (const [id, sprite] of this.towerSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.towerSprites.delete(id);
      }
    }

    for (const tower of this.state.towers) {
      const textureKey = TOWER_TEXTURE_KEYS[tower.type];
      if (!textureKey) {
        continue;
      }

      let sprite = this.towerSprites.get(tower.id);
      if (!sprite) {
        sprite = this.add.image(0, 0, textureKey);
        sprite.setDepth(DEPTHS.towers);
        this.towerSprites.set(tower.id, sprite);
      }

      const x = this.boardOffset.x + tower.x * this.scaledCellSize + this.scaledCellSize / 2;
      const y = this.boardOffset.y + tower.y * this.scaledCellSize + this.scaledCellSize / 2;
      const size = Math.min(this.scaledCellSize, this.scaleLength(54 + tower.level * 2));
      sprite.setPosition(x, y);
      sprite.setDisplaySize(size, size);
    }
  }

  drawTowerBadges(): void {
    for (const tower of this.state.towers) {
      const x = this.boardOffset.x + tower.x * this.scaledCellSize + this.scaledCellSize / 2;
      const y = this.boardOffset.y + tower.y * this.scaledCellSize + this.scaledCellSize / 2;
      const baseY = y + this.scaleLength(12);
      const radius = this.scaleLength(15 + tower.level * 3);

      this.towerBadgeGraphics.lineStyle(2, 0xf5efe1, 0.72);
      this.towerBadgeGraphics.strokeEllipse(x, baseY, radius * 2.2, radius * 0.95);
      this.towerBadgeGraphics.lineStyle(1, 0x8b7452, 0.4);
      this.towerBadgeGraphics.strokeEllipse(
        x,
        baseY + this.scaleLength(1),
        radius * 1.75,
        radius * 0.62,
      );

      this.graphics.lineStyle(0, 0, 0);
      for (let index = 0; index < tower.level; index += 1) {
        this.graphics.fillStyle(0xf5efe1, 1);
        this.graphics.fillCircle(
          x - this.scaleLength(10) + index * this.scaleLength(10),
          baseY + this.scaleLength(10),
          Math.max(2, this.scaleLength(3)),
        );
      }
    }
  }

  syncEnemySprites(): void {
    const activeIds = new Set(this.state.enemies.map((enemy) => enemy.id));

    for (const [id, sprite] of this.enemySprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.enemySprites.delete(id);
      }
    }

    for (const enemy of this.state.enemies) {
      const textureKey = enemy.kind === "boss"
        ? this.getBossTextureKey()
        : ENEMY_TEXTURE_KEYS[enemy.species];
      if (!textureKey) {
        continue;
      }

      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        const initialFrame = enemy.kind === "boss" ? this.getBossFrameKey(enemy) ?? undefined : undefined;
        sprite = this.add.image(0, 0, textureKey, initialFrame);
        sprite.setDepth(DEPTHS.enemies);
        this.enemySprites.set(enemy.id, sprite);
      }

      const point = getEnemyPosition(enemy);
      const x = this.boardOffset.x + this.scaleLength(point.x);
      const y = this.boardOffset.y + this.scaleLength(point.y);
      const size = this.getEnemySpriteDisplaySize(enemy);
      sprite.setPosition(x, y);
      sprite.setAlpha(this.getEnemySpriteAlpha(enemy));

      if (enemy.kind === "boss") {
        const frameKey = this.getBossFrameKey(enemy);
        const frameRect = this.getBossFrameRect(enemy);
        sprite.setTexture(textureKey, frameKey ?? undefined);
        const scale = size / Math.max(frameRect.width, frameRect.height);
        sprite.setDisplaySize(
          Math.round(frameRect.width * scale),
          Math.round(frameRect.height * scale),
        );
      } else {
        sprite.setDisplaySize(size, size);
      }
    }
  }

  drawEnemyOverlays(): void {
    for (const enemy of this.state.enemies) {
      const point = getEnemyPosition(enemy);
      const species = enemy.kind === "boss"
        ? null
        : ENEMY_SPECIES[enemy.species as Exclude<EnemySpeciesId, "boss">];
      const x = this.boardOffset.x + this.scaleLength(point.x);
      const y = this.boardOffset.y + this.scaleLength(point.y);
      const spriteSize = this.getEnemySpriteDisplaySize(enemy);
      const halfWidth = Math.round(spriteSize * 0.52);
      const top = y - halfWidth - this.scaleLength(8);

      if (enemy.defeated) {
        continue;
      }

      if (enemy.slowTicks > 0) {
        this.graphics.lineStyle(2, 0x67c498, 0.55);
        this.graphics.strokeCircle(x, y, spriteSize * 0.42);
      }

      this.graphics.fillStyle(0x220909, 0.95);
      this.graphics.fillRect(x - halfWidth, top, halfWidth * 2, Math.max(3, this.scaleLength(5)));
      this.graphics.fillStyle(enemy.kind === "boss" ? 0xf0b45d : 0x68d06f, 1);
      this.graphics.fillRect(
        x - halfWidth,
        top,
        halfWidth * 2 * Math.max(0, enemy.health / enemy.maxHealth),
        Math.max(3, this.scaleLength(5)),
      );

      if (!this.enemySprites.has(enemy.id) && species) {
        const fill = Phaser.Display.Color.HexStringToColor(species.color).color;
        this.graphics.fillStyle(fill, 1);
        this.graphics.fillCircle(x, y, this.scaleLength(species.size));
      }
    }
  }

  drawEffects(): void {
    for (const effect of this.state.attackEffects) {
      this.graphics.lineStyle(effect.type === "cannon" ? 3 : 2, this.getEffectColor(effect.type), 0.9);
      this.graphics.lineBetween(
        this.boardOffset.x + this.scaleLength(effect.from.x),
        this.boardOffset.y + this.scaleLength(effect.from.y),
        this.boardOffset.x + this.scaleLength(effect.to.x),
        this.boardOffset.y + this.scaleLength(effect.to.y),
      );
    }
  }

  syncAttackParticles(): void {
    const activeIds = new Set<number>();

    for (const effect of this.state.attackEffects) {
      activeIds.add(effect.id);

      if (!this.handledAttackEffectIds.has(effect.id)) {
        this.playAttackEffect(effect);
        this.handledAttackEffectIds.add(effect.id);
      }
    }

    for (const effectId of this.handledAttackEffectIds) {
      if (!activeIds.has(effectId)) {
        this.handledAttackEffectIds.delete(effectId);
      }
    }
  }

  playAttackEffect(effect: AttackEffect): void {
    const bursts = buildAttackParticleBursts(effect, (value) => this.scaleLength(value));

    for (const burst of bursts) {
      const emitter = this.attackParticleEmitters.get(burst.emitterKey);
      if (!emitter) {
        continue;
      }

      const config: Record<string, unknown> = {
        angle: burst.angle,
        color: burst.tint,
        lifespan: burst.lifespan,
        quantity: burst.quantity,
        scale: burst.scale,
        speed: burst.speed,
      };

      if (burst.radial === true && burst.maxRadius) {
        const scaledRadius = this.scaleLength(burst.maxRadius);
        config.x = { min: -scaledRadius, max: scaledRadius };
        config.y = { min: -scaledRadius, max: scaledRadius };
      } else {
        config.x = 0;
        config.y = 0;
      }

      emitter.updateConfig(config);
      emitter.explode(
        burst.quantity,
        this.boardOffset.x + this.scaleLength(burst.x),
        this.boardOffset.y + this.scaleLength(burst.y),
      );
      emitter.updateConfig({ x: 0, y: 0 });
    }
  }

  getEffectColor(type: TowerType): number {
    switch (type) {
      case "slow":
        return 0x7fe4ff;
      case "magic":
        return 0xbf8dff;
      case "cannon":
        return 0xffc36d;
      case "hunter":
        return 0xfff2a0;
      case "attack":
      default:
        return 0xffffff;
    }
  }

  getEnemyBaseSpriteSize(enemy: Enemy): number {
    if (enemy.kind === "boss") {
      return 220;
    }

    const species = ENEMY_SPECIES[enemy.species as Exclude<EnemySpeciesId, "boss">];
    return Math.max(42, Math.round(species.size * 4.2));
  }

  getEnemySpriteDisplaySize(enemy: Enemy): number {
    return this.scaleLength(this.getEnemyBaseSpriteSize(enemy));
  }

  getEnemySpriteAlpha(enemy: Enemy): number {
    if (!enemy.defeated) {
      return 1;
    }

    return Phaser.Math.Clamp((enemy.defeatedTicks ?? 0) / ENEMY_DEFEAT_TICKS, 0, 1);
  }

  getBossTextureKey(): string {
    const stageTheme = getCampaignTheme(getStageDefinition(this.state.stage)?.theme);
    return stageTheme ? THEME_BOSS_TEXTURE_KEYS[stageTheme] : ENEMY_TEXTURE_KEYS.boss;
  }

  registerBossFrames(): void {
    for (const theme of Object.keys(THEME_BOSS_TEXTURE_KEYS) as CampaignTheme[]) {
      const textureKey = THEME_BOSS_TEXTURE_KEYS[theme];
      const texture = this.textures.get(textureKey);
      const frameKeys = THEME_BOSS_FRAME_KEYS[theme];
      const frameRects = THEME_BOSS_FRAME_RECTS[theme];

      if (!texture || !frameKeys || !frameRects) {
        continue;
      }

      for (const state of ["idle", "death"] as const satisfies readonly FrameState[]) {
        if (!texture.has(frameKeys[state])) {
          const rect = frameRects[state];
          texture.add(frameKeys[state], 0, rect.x, rect.y, rect.width, rect.height);
        }
      }
    }
  }

  getBossFrameKey(enemy: Enemy): string | null {
    const stageTheme = getCampaignTheme(getStageDefinition(enemy.stage ?? this.state.stage)?.theme);
    const themeFrames = stageTheme ? THEME_BOSS_FRAME_KEYS[stageTheme] : null;
    return enemy.defeated ? themeFrames?.death ?? null : themeFrames?.idle ?? null;
  }

  getBossFrameRect(enemy: Enemy): FrameRect {
    const stageTheme = getCampaignTheme(getStageDefinition(enemy.stage ?? this.state.stage)?.theme);
    const themeFrames = stageTheme ? THEME_BOSS_FRAME_RECTS[stageTheme] : null;
    return enemy.defeated ? themeFrames?.death ?? { x: 0, y: 0, width: 1, height: 1 } : themeFrames?.idle ?? { x: 0, y: 0, width: 1, height: 1 };
  }

  scaleLength(length: number): number {
    return length * this.boardScale;
  }

  destroyDisplayMap<T extends { destroy(): void }>(displayMap: DisplayMap<T>): void {
    for (const displayObject of displayMap.values()) {
      displayObject.destroy();
    }
    displayMap.clear();
  }

  updateHud(): void {
    const selectedTower = TOWER_TYPES[this.state.selectedTowerType];
    const hoveredTower = findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y);
    const actionHint = hoveredTower
      ? `${hoveredTower.type.toUpperCase()} L${hoveredTower.level} selected`
      : canBuildTower(this.state, this.state.cursor.x, this.state.cursor.y, this.state.selectedTowerType)
        ? `Deploy ${selectedTower.name} • ${selectedTower.cost}G`
        : "Cannot deploy here";

    const hudLines = [
      `${this.state.mode === "endless" ? "Endless" : `Stage ${this.state.stage}`}  Wave ${this.state.wave}  ♥ ${this.state.lives}  💰 ${this.state.gold}`,
      `Tower ${selectedTower.name}  Cursor ${this.state.cursor.x},${this.state.cursor.y}  ${actionHint}`,
    ];
    if (this.state.lastDraftSummary) {
      hudLines.push(`Boost ${this.state.lastDraftSummary}`);
    }

    this.hudText.setText(hudLines);

    if (this.state.status === "running") {
      this.statusText.setText("");
      return;
    }

    let label: string = this.state.status;
    if (this.state.status === "ready") {
      label = "Ready";
    } else if (this.state.status === "intermission") {
      label = `Intermission ${Math.ceil((this.state.intermissionTicks * TICK_MS) / 1000)}s`;
    } else if (this.state.status === "paused") {
      label = "Paused";
    } else if (this.state.status === "game-over") {
      label = "Game Over";
    } else if (this.state.status === "stage-cleared") {
      label = "Stage Cleared";
    } else if (this.state.status === "victory") {
      label = "Victory";
    }

    this.statusText.setText(label);
  }
}
