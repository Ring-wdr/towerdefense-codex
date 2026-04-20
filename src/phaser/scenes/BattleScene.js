import Phaser from "phaser";
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
  tickGame,
  togglePause,
  TOWER_TYPES,
  upgradeTowerAtCursor,
} from "../../game/logic.js";
import {
  beginBattleFromSelection,
  completeBattleStage,
  createGameSession,
  returnFromBattleToTheme,
  selectStage,
} from "../state/game-session.js";
import {
  BATTLE_PARTICLE_TEXTURE_KEY,
  buildAttackParticleBursts,
  ensureBattleParticleTexture,
} from "./battle-particles.js";
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
const TILE_TEXTURE_URLS = {
  "tile-grass-1": grassTile1Url,
  "tile-grass-2": grassTile2Url,
  "tile-road-1": roadTile1Url,
  "tile-road-2": roadTile2Url,
};

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getControlElements() {
  return {
    root: document.getElementById("battle-controls"),
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

    this.state = startGame(createInitialState(stage));
    this.lastTickAt = 0;
    this.game.registry.set("session", nextSession);

    this.cameras.main.setBackgroundColor("#142018");
    this.graphics = this.add.graphics();
    this.createAttackParticles();
    this.hudText = this.add.text(0, 0, "", {
      color: "#f5efe1",
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      lineSpacing: 6,
    });
    this.helpText = this.add.text(0, 0, "", {
      color: "#c9d5c0",
      fontFamily: "Segoe UI",
      fontSize: "15px",
      lineSpacing: 5,
      wordWrap: { width: 380 },
    });
    this.helpText.setVisible(false);
    this.statusText = this.add.text(0, 0, "", {
      color: "#f5efe1",
      fontFamily: "Trebuchet MS",
      fontSize: "28px",
      fontStyle: "bold",
      align: "center",
    });

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
    for (const tile of this.tileImages) {
      tile.destroy();
    }
    this.tileImages = [];
    this.setBattleControlsVisible(false);
  }

  update(time) {
    if (this.state.status !== "running" || time - this.lastTickAt < 100) {
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
            this.applyState(togglePause(this.state));
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
    }

    this.lastTickAt = 0;
    this.syncBattleControls();
    this.renderScene();
  }

  restartBattle() {
    this.state = startGame(restartGame(this.state.stage));
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
    this.hudText.setFontSize(this.scale.width <= 480 ? "14px" : "18px");
    this.helpText.setPosition(24, this.scale.height - safeBottomInset - 116);
    this.helpText.setWordWrapWidth(Math.max(180, this.scale.width - 48));
    this.helpText.setFontSize(this.scale.width <= 480 ? "13px" : "15px");
    this.statusText.setPosition(this.scale.width / 2, 36);
    this.statusText.setOrigin(0.5, 0);
    this.statusText.setFontSize(this.scale.width <= 480 ? "22px" : "28px");
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

    if (this.state.status === "stage-cleared" || this.state.status === "victory") {
      const nextSession = completeBattleStage(getSession(this), this.state.stage);
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

    const battleActive = this.state.status === "running";
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

    if (this.controls.pauseButton) {
      this.controls.pauseButton.textContent = this.state.status === "paused" ? "Resume" : "Pause";
    }

    if (this.controls.towerActions) {
      this.controls.towerActions.hidden = !battleActive || !hoveredTower;
    }
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
    if (this.controls.towerActions) {
      this.controls.towerActions.hidden = !isVisible || !findTowerAt(this.state, this.state.cursor.x, this.state.cursor.y);
    }
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
    this.graphics.clear();
    this.drawBoard();
    this.syncBoardTiles();
    this.drawGrid();
    this.drawCursor();
    this.syncTowerSprites();
    this.drawTowerBadges();
    this.syncEnemySprites();
    this.drawEnemyOverlays();
    this.drawEffects();
    this.syncAttackParticles();
    this.updateHud();
    this.children.bringToTop(this.graphics);
    for (const emitter of this.attackParticleEmitters.values()) {
      this.children.bringToTop(emitter);
    }
    this.children.bringToTop(this.hudText);
    this.children.bringToTop(this.helpText);
    this.children.bringToTop(this.statusText);
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
      const radius = this.scaleLength(12 + tower.level * 4);

      this.graphics.lineStyle(2, 0xf5efe1, 1);
      this.graphics.strokeCircle(x, y, radius / 1.8);

      this.graphics.lineStyle(0);
      for (let index = 0; index < tower.level; index += 1) {
        this.graphics.fillStyle(0xf5efe1, 1);
        this.graphics.fillCircle(
          x - this.scaleLength(10) + index * this.scaleLength(10),
          y + radius + this.scaleLength(8),
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
      ? hoveredTower.level >= MAX_TOWER_LEVEL
        ? "Max level tower"
        : `Upgrade ${hoveredTower.type} for ${getUpgradeCost(hoveredTower)}g or delete with X/right-click`
      : canBuildTower(this.state, this.state.cursor.x, this.state.cursor.y, this.state.selectedTowerType)
        ? `Build ${selectedTower.name} for ${selectedTower.cost}g`
        : "Tile unavailable for the selected tower";

    this.hudText.setText([
      `Stage ${this.state.stage}  Wave ${this.state.wave}  Lives ${this.state.lives}  Gold ${this.state.gold}`,
      `Tower ${selectedTower.name}  Cursor ${this.state.cursor.x},${this.state.cursor.y}  ${actionHint}`,
    ]);

    if (this.state.status === "running") {
      this.statusText.setText("");
      return;
    }

    let label = this.state.status;
    if (this.state.status === "paused") {
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
