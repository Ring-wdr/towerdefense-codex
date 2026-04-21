import * as Phaser from "phaser";
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
  buildTowerAtCursor,
  canBuildTower,
  CELL_SIZE,
  continueCampaign,
  createInitialState,
  deleteTowerAtCursor,
  ENEMY_SPECIES,
  findTowerAt,
  getEnemyPosition,
  getPathCells,
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
import {
  beginBattleFromSelection,
  completeBattleStage,
  createGameSession,
  getCompletedBattleStage,
  returnFromBattleToTheme,
  selectStage,
} from "../state/game-session.js";
import {
  BATTLE_PARTICLE_TEXTURE_KEY,
  buildAttackParticleBursts,
  ensureBattleParticleTexture,
} from "./battle-particles.js";
import { createBodyTextStyle, createHeadingTextStyle, PHASER_TEXT_FONTS } from "../ui/components.js";
import { getBattleViewportLayout, getBrowserSafeBottomInset } from "../ui/layout.js";

const BOARD_WIDTH = GRID_COLS * CELL_SIZE;
const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE;
const ATTACK_PARTICLE_DEPTH = 5;
const TOWER_KEYS = ["attack", "slow", "magic", "cannon", "hunter"];
const TOWER_TEXTURE_KEYS = {
  attack: "tower-attack",
  slow: "tower-slow",
  magic: "tower-magic",
  cannon: "tower-cannon",
  hunter: "tower-hunter",
};
const TOWER_TEXTURE_URLS = {
  "tower-attack": attackTowerSpriteUrl,
  "tower-slow": slowTowerSpriteUrl,
  "tower-magic": magicTowerSpriteUrl,
  "tower-cannon": cannonTowerSpriteUrl,
  "tower-hunter": hunterTowerSpriteUrl,
};
const ENEMY_TEXTURE_KEYS = {
  boss: "enemy-boss",
  grunt: "enemy-grunt",
  runner: "enemy-runner",
  shellback: "enemy-shellback",
  swarmling: "enemy-swarmling",
  wisp: "enemy-wisp",
};
const ENEMY_TEXTURE_URLS = {
  "enemy-boss": bossEnemySpriteUrl,
  "enemy-grunt": gruntEnemySpriteUrl,
  "enemy-runner": runnerEnemySpriteUrl,
  "enemy-shellback": shellbackEnemySpriteUrl,
  "enemy-swarmling": swarmlingEnemySpriteUrl,
  "enemy-wisp": wispEnemySpriteUrl,
};
const GRASS_TILE_TEXTURE_KEYS = ["tile-grass-1", "tile-grass-2"];
const ROAD_TILE_TEXTURE_KEYS = ["tile-road-1", "tile-road-2"];
const BATTLE_READY_STATUSES = ["running", "ready", "intermission"];
const TILE_TEXTURE_URLS = {
  "tile-grass-1": grassTile1Url,
  "tile-grass-2": grassTile2Url,
  "tile-road-1": roadTile1Url,
  "tile-road-2": roadTile2Url,
};
const DEPTHS = {
  tiles: 0,
  towerBadges: 1,
  towers: 2,
  enemies: 3,
  overlays: 10,
  text: 11,
};

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getControlElements() {
  return {
    root: document.getElementById("battle-controls"),
    startButton: document.getElementById("start-button"),
    pauseButton: document.getElementById("pause-button"),
    towerActions: document.getElementById("tower-actions"),
    upgradeAction: document.getElementById("upgrade-action"),
    deleteAction: document.getElementById("delete-action"),
    sidebar: document.querySelector(".sidebar"),
    dock: document.getElementById("tower-buttons-dock"),
    towerButtons: Array.from(document.querySelectorAll("[data-tower]")),
    moveButtons: Array.from(document.querySelectorAll("[data-move]")),
    actionButtons: Array.from(document.querySelectorAll("[data-action]")),
    selectionSummaries: Array.from(document.querySelectorAll("[data-selection-summary]")),
  };
}

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
    this.state = createInitialState();
    this.graphics = null;
    this.towerBadgeGraphics = null;
    this.attackParticleEmitters = new Map();
    this.handledAttackEffectIds = new Set();
    this.hudText = null;
    this.helpText = null;
    this.statusText = null;
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

  preload() {
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

    for (const [key, url] of Object.entries(TILE_TEXTURE_URLS)) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }
  }

  create(data = {}) {
    const sessionStage = getSession(this).activeStage;
    const stage = data.stage ?? sessionStage ?? 1;
    const nextSession = beginBattleFromSelection(selectStage(getSession(this), stage));
    const metaProgress = this.game.registry.get("metaProgress");

    this.state = createInitialState(stage, metaProgress);
    this.lastTickAt = 0;
    this.game.registry.set("session", nextSession);

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
    this.input.keyboard.on("keydown", this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

    this.bindBattleControls();
    this.syncBattleControls();
    this.handleResize();
    this.renderScene();
  }

  handleSceneShutdown() {
    this.scale.off("resize", this.handleResize, this);
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.unbindBattleControls();
    this.destroyAttackParticles();
    this.destroyDisplayMap(this.towerSprites);
    this.destroyDisplayMap(this.enemySprites);
    this.towerBadgeGraphics?.destroy();
    this.towerBadgeGraphics = null;
    for (const tile of this.tileImages) {
      tile.destroy();
    }
    this.tileImages = [];
    this.setBattleControlsVisible(false);
  }

  update(time) {
    if (!["running", "intermission"].includes(this.state.status) || time - this.lastTickAt < 100) {
      this.renderScene();
      return;
    }

    this.lastTickAt = time;
    this.applyState(tickGame(this.state));
  }

  bindBattleControls() {
    this.controls = getControlElements();

    if (!this.controls.root) {
      return;
    }

    const bind = (element, eventName, handler) => {
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
        this.applyState(selectTowerType(this.state, button.dataset.tower));
      });
    }

    for (const button of this.controls.moveButtons) {
      bind(button, "click", () => {
        const deltas = {
          up: [0, -1],
          down: [0, 1],
          left: [-1, 0],
          right: [1, 0],
        };
        const [dx, dy] = deltas[button.dataset.move] ?? [0, 0];
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

  unbindBattleControls() {
    for (const removeListener of this.domListeners) {
      removeListener();
    }
    this.domListeners = [];
    this.controls = null;
  }

  resumeBattle() {
    if (this.state.status === "paused") {
      this.state = togglePause(this.state);
    } else if (["ready", "intermission"].includes(this.state.status)) {
      this.state = startGame(this.state);
    }

    this.lastTickAt = 0;
    this.syncBattleControls();
    this.renderScene();
  }

  hideTowerActionOverlay() {
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

  syncTowerActionOverlay() {
    if (!this.controls?.towerActions || !this.controls.upgradeAction || !this.controls.deleteAction) {
      return;
    }

    const battleActive = BATTLE_READY_STATUSES.includes(this.state.status);
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

  restartBattle() {
    this.state = restartGame(this.state.stage, this.state.metaProgress);
    this.lastTickAt = 0;
    for (const emitter of this.attackParticleEmitters.values()) {
      emitter.killAll();
    }
    this.handledAttackEffectIds.clear();
    this.syncBattleControls();
    this.renderScene();
  }

  createAttackParticles() {
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
      });
      emitter.setDepth(ATTACK_PARTICLE_DEPTH);
      this.attackParticleEmitters.set(key, emitter);
    }

    this.handledAttackEffectIds.clear();
  }

  destroyAttackParticles() {
    for (const emitter of this.attackParticleEmitters.values()) {
      emitter.destroy();
    }
    this.attackParticleEmitters.clear();
    this.handledAttackEffectIds.clear();
  }

  returnToTheme() {
    const nextSession = returnFromBattleToTheme(selectStage(getSession(this), this.state.stage));

    this.game.registry.set("session", nextSession);
    this.setBattleControlsVisible(false);
  }

  handleResize() {
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

  getDockBottomPadding() {
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

  handlePointerDown(pointer) {
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

  handleKeyDown(event) {
    if (event.key >= "1" && event.key <= "5") {
      const towerType = TOWER_KEYS[Number(event.key) - 1];
      this.applyState(selectTowerType(this.state, towerType));
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

  applyState(nextState) {
    const previousStatus = this.state.status;
    this.state = nextState;

    if (previousStatus !== this.state.status) {
      this.handleStatusTransition(previousStatus);
    }

    this.syncBattleControls();
    this.renderScene();
  }

  handleStatusTransition(previousStatus) {
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

    if (this.state.status === "stage-cleared") {
      const session = getSession(this);
      const completedStage = getCompletedBattleStage(session, this.state);
      const progressedSession = completeBattleStage(session, completedStage);
      const nextSession = beginBattleFromSelection(progressedSession);
      this.game.registry.set("session", nextSession);
      this.state = continueCampaign(this.state);
      this.lastTickAt = 0;
      return;
    }

    if (this.state.status === "victory") {
      const session = getSession(this);
      const completedStage = getCompletedBattleStage(session, this.state);
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

      this.scene.start("ThemeScene");
    }
  }

  openOverlay(mode) {
    this.setBattleControlsVisible(false);
    this.scene.launch("OverlayScene", {
      mode,
      stage: this.state.stage,
    });
    this.scene.pause();
  }

  syncBattleControls() {
    if (!this.controls?.root) {
      return;
    }

    const battleActive = BATTLE_READY_STATUSES.includes(this.state.status);
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

  setBattleControlsVisible(isVisible) {
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

  pointerToCell(worldX, worldY) {
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

  renderScene() {
    this.towerBadgeGraphics.clear();
    this.graphics.clear();
    this.drawBoard();
    this.syncBoardTiles();
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

  drawBoard() {
    this.graphics.lineStyle(4, 0x0b120d, 1);
    this.graphics.strokeRect(
      this.boardOffset.x,
      this.boardOffset.y,
      this.scaledBoardWidth,
      this.scaledBoardHeight,
    );
  }

  syncBoardTiles() {
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
          const textureKey = texturePool[Math.abs((x * 31 + y * 17) % texturePool.length)];
          const tile = this.add.image(0, 0, textureKey).setOrigin(0, 0);
          tile.setDepth(DEPTHS.tiles);
          this.tileImages.push(tile);
        }
      }
    }

    let index = 0;
    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        const tile = this.tileImages[index];
        tile.setDisplaySize(this.scaledCellSize, this.scaledCellSize);
        tile.setPosition(
          this.boardOffset.x + x * this.scaledCellSize,
          this.boardOffset.y + y * this.scaledCellSize,
        );
        index += 1;
      }
    }
  }

  drawGrid() {
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

  drawCursor() {
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

  syncTowerSprites() {
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

  drawTowerBadges() {
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

      this.graphics.lineStyle(0);
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

  syncEnemySprites() {
    const activeIds = new Set(this.state.enemies.map((enemy) => enemy.id));

    for (const [id, sprite] of this.enemySprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.enemySprites.delete(id);
      }
    }

    for (const enemy of this.state.enemies) {
      const textureKey = ENEMY_TEXTURE_KEYS[enemy.kind === "boss" ? "boss" : enemy.species];
      if (!textureKey) {
        continue;
      }

      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        sprite = this.add.image(0, 0, textureKey);
        sprite.setDepth(DEPTHS.enemies);
        this.enemySprites.set(enemy.id, sprite);
      }

      const point = getEnemyPosition(enemy);
      const x = this.boardOffset.x + this.scaleLength(point.x);
      const y = this.boardOffset.y + this.scaleLength(point.y);
      const size = this.getEnemySpriteDisplaySize(enemy);
      sprite.setPosition(x, y);
      sprite.setDisplaySize(size, size);
    }
  }

  drawEnemyOverlays() {
    for (const enemy of this.state.enemies) {
      const point = getEnemyPosition(enemy);
      const species = ENEMY_SPECIES[enemy.species];
      const x = this.boardOffset.x + this.scaleLength(point.x);
      const y = this.boardOffset.y + this.scaleLength(point.y);
      const spriteSize = this.getEnemySpriteDisplaySize(enemy);
      const halfWidth = Math.round(spriteSize * 0.52);
      const top = y - halfWidth - this.scaleLength(8);

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

  drawEffects() {
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

  syncAttackParticles() {
    const activeIds = new Set();

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

  playAttackEffect(effect) {
    const bursts = buildAttackParticleBursts(effect, (value) => this.scaleLength(value));

    for (const burst of bursts) {
      const emitter = this.attackParticleEmitters.get(burst.emitterKey);
      if (!emitter) {
        continue;
      }

      const config = {
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

  getEffectColor(type) {
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

  getEnemyBaseSpriteSize(enemy) {
    if (enemy.kind === "boss") {
      return 72;
    }

    const species = ENEMY_SPECIES[enemy.species];
    return Math.max(42, Math.round((species?.size ?? 10) * 4.2));
  }

  getEnemySpriteDisplaySize(enemy) {
    return this.scaleLength(this.getEnemyBaseSpriteSize(enemy));
  }

  scaleLength(length) {
    return length * this.boardScale;
  }

  destroyDisplayMap(displayMap) {
    for (const displayObject of displayMap.values()) {
      displayObject.destroy();
    }
    displayMap.clear();
  }

  updateHud() {
    const selectedTower = TOWER_TYPES[this.state.selectedTowerType];
    const hoveredTower = findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y);
    const actionHint = hoveredTower
      ? `${hoveredTower.type.toUpperCase()} L${hoveredTower.level} selected`
      : canBuildTower(this.state, this.state.cursor.x, this.state.cursor.y, this.state.selectedTowerType)
        ? `Deploy ${selectedTower.name} • ${selectedTower.cost}G`
        : "Cannot deploy here";

    this.hudText.setText([
      `Stage ${this.state.stage}  Wave ${this.state.wave}  ♥ ${this.state.lives}  💰 ${this.state.gold}`,
      `Tower ${selectedTower.name}  Cursor ${this.state.cursor.x},${this.state.cursor.y}  ${actionHint}`,
    ]);

    if (this.state.status === "running") {
      this.statusText.setText("");
      return;
    }

    let label = this.state.status;
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
