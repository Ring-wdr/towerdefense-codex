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
  getTowerStats,
  GRID_COLS,
  GRID_ROWS,
  isRoadCell,
  moveCursor,
  restartGame,
  selectTowerType,
  setCursorPosition,
  startGame,
  tickGame,
  TICK_MS,
  TOWER_TYPES,
  togglePause,
  upgradeTowerAtCursor,
} from "./game/logic.js";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, createIcons } from "lucide";
import attackTowerSpriteUrl from "./assets/towers/attack-v2.png";
import bossEnemySpriteUrl from "./assets/enemies/boss.png";
import cannonTowerSpriteUrl from "./assets/towers/cannon-v2.png";
import grassTile1Url from "./assets/tiles/grass-1.png";
import grassTile2Url from "./assets/tiles/grass-2.png";
import gruntEnemySpriteUrl from "./assets/enemies/grunt.png";
import hunterTowerSpriteUrl from "./assets/towers/hunter-v2.png";
import magicTowerSpriteUrl from "./assets/towers/magic-v2.png";
import roadTile1Url from "./assets/tiles/road-1.png";
import roadTile2Url from "./assets/tiles/road-2.png";
import runnerEnemySpriteUrl from "./assets/enemies/runner.png";
import shellbackEnemySpriteUrl from "./assets/enemies/shellback.png";
import slowTowerSpriteUrl from "./assets/towers/slow-v2.png";
import swarmlingEnemySpriteUrl from "./assets/enemies/swarmling.png";
import wispEnemySpriteUrl from "./assets/enemies/wisp.png";

const canvas = document.getElementById("game-board");
const context = canvas.getContext("2d");
const overlay = document.getElementById("overlay-message");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const overlayPrimary = document.getElementById("overlay-primary");
const overlaySecondary = document.getElementById("overlay-secondary");
const towerActions = document.getElementById("tower-actions");
const upgradeAction = document.getElementById("upgrade-action");
const deleteAction = document.getElementById("delete-action");
const waveValue = document.getElementById("wave-value");
const goldValue = document.getElementById("gold-value");
const scoreValue = document.getElementById("score-value");
const livesValue = document.getElementById("lives-value");
const statusValue = document.getElementById("status-value");
const pauseButton = document.getElementById("pause-button");
const selectionSummaries = Array.from(document.querySelectorAll("[data-selection-summary]"));
const towerButtons = Array.from(document.querySelectorAll("[data-tower]"));
const touchButtons = Array.from(document.querySelectorAll("[data-move], [data-action]"));

let state = createInitialState();

const roadCells = getPathCells();
const towerSpriteUrls = {
  attack: attackTowerSpriteUrl,
  cannon: cannonTowerSpriteUrl,
  hunter: hunterTowerSpriteUrl,
  magic: magicTowerSpriteUrl,
  slow: slowTowerSpriteUrl,
};
const towerSprites = loadSprites({
  attack: attackTowerSpriteUrl,
  cannon: cannonTowerSpriteUrl,
  hunter: hunterTowerSpriteUrl,
  magic: magicTowerSpriteUrl,
  slow: slowTowerSpriteUrl,
});
const enemySprites = loadSprites({
  boss: bossEnemySpriteUrl,
  grunt: gruntEnemySpriteUrl,
  runner: runnerEnemySpriteUrl,
  shellback: shellbackEnemySpriteUrl,
  swarmling: swarmlingEnemySpriteUrl,
  wisp: wispEnemySpriteUrl,
});
const grassTileSprites = loadSpriteList([grassTile1Url, grassTile2Url]);
const roadTileSprites = loadSpriteList([roadTile1Url, roadTile2Url]);

hydrateTowerIcons();
hydrateControlIcons();

function render() {
  drawBoard();
  drawRoad();
  drawGrid();
  drawTowers();
  drawEnemies();
  drawAttackEffects();
  drawCursor();
  drawLegend();
  syncHud();
}

function drawBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      drawTile(x, y, grassTileSprites, "#dbe5bc");
    }
  }
}

function drawRoad() {
  for (const cell of roadCells) {
    drawTile(cell.x, cell.y, roadTileSprites, "#b08d60");
    context.strokeStyle = "rgba(84, 58, 29, 0.22)";
    context.strokeRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
}

function drawGrid() {
  context.strokeStyle = "rgba(31, 36, 48, 0.12)";
  for (let x = 0; x <= GRID_COLS; x += 1) {
    context.beginPath();
    context.moveTo(x * CELL_SIZE, 0);
    context.lineTo(x * CELL_SIZE, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y += 1) {
    context.beginPath();
    context.moveTo(0, y * CELL_SIZE);
    context.lineTo(canvas.width, y * CELL_SIZE);
    context.stroke();
  }
}

function drawTowers() {
  for (const tower of state.towers) {
    const cx = tower.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = tower.y * CELL_SIZE + CELL_SIZE / 2;
    const stats = getTowerStats(tower);

    drawTowerRange(cx, cy, stats.range * CELL_SIZE);
    drawTowerSprite(tower, cx, cy);
    drawTowerLevelBadge(cx, cy, tower.level);
  }
}

function drawTowerRange(cx, cy, radius) {
  context.save();
  context.strokeStyle = "rgba(31, 36, 48, 0.18)";
  context.lineWidth = 1.2;
  context.setLineDash([5, 6]);
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawTowerSprite(tower, cx, cy) {
  const sprite = towerSprites[tower.type];
  if (sprite?.complete && sprite.naturalWidth > 0) {
    const size = Math.min(CELL_SIZE, 54 + tower.level * 2);
    context.drawImage(sprite, cx - size / 2, cy - size / 2, size, size);
  }
}

function drawTowerLevelBadge(cx, cy, level) {
  context.save();
  context.fillStyle = "#fffdf7";
  context.beginPath();
  context.arc(cx + 17, cy - 17, 9, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(31, 36, 48, 0.18)";
  context.stroke();
  context.fillStyle = "#1f2430";
  context.font = "bold 10px Georgia";
  context.textAlign = "center";
  context.fillText(String(level), cx + 17, cy - 13);
  context.restore();
}

function loadSprites(spriteUrls) {
  return Object.fromEntries(
    Object.entries(spriteUrls).map(([towerType, url]) => {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      image.addEventListener("load", () => {
        render();
      });
      return [towerType, image];
    }),
  );
}

function loadSpriteList(spriteUrls) {
  return spriteUrls.map((url) => {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    image.addEventListener("load", () => {
      render();
    });
    return image;
  });
}

function pickTileSprite(x, y, sprites) {
  const index = Math.abs((x * 31 + y * 17) % sprites.length);
  return sprites[index];
}

function drawTile(x, y, sprites, fallbackColor) {
  const sprite = pickTileSprite(x, y, sprites);
  const left = x * CELL_SIZE;
  const top = y * CELL_SIZE;

  if (sprite?.complete && sprite.naturalWidth > 0) {
    context.drawImage(sprite, left, top, CELL_SIZE, CELL_SIZE);
    return;
  }

  context.fillStyle = fallbackColor;
  context.fillRect(left, top, CELL_SIZE, CELL_SIZE);
}

function hydrateTowerIcons() {
  const iconImages = Array.from(document.querySelectorAll("[data-tower-icon]"));
  for (const image of iconImages) {
    const towerType = image.dataset.towerIcon;
    image.src = towerSpriteUrls[towerType];
  }
}

function hydrateControlIcons() {
  createIcons({
    icons: {
      ChevronDown,
      ChevronLeft,
      ChevronRight,
      ChevronUp,
    },
  });
}

function getEnemySpriteSize(enemy, species = null) {
  if (enemy.kind === "boss") {
    return 72;
  }

  return Math.max(42, Math.round(species.size * 4.2));
}

function getEnemyHealthBarHalfWidth(enemy, species = null) {
  return Math.round(getEnemySpriteSize(enemy, species) * 0.52);
}

function drawEnemySprite(enemy, point, species = null) {
  const spriteKey = enemy.kind === "boss" ? "boss" : enemy.species;
  const sprite = enemySprites[spriteKey];
  if (!sprite?.complete || sprite.naturalWidth <= 0) {
    return false;
  }

  const size = getEnemySpriteSize(enemy, species);
  context.drawImage(sprite, point.x - size / 2, point.y - size / 2, size, size);
  return true;
}

function drawEnemySlowAura(point, radius) {
  context.save();
  context.strokeStyle = "rgba(73, 165, 110, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    const point = getEnemyPosition(enemy);
    if (enemy.kind === "boss") {
      drawBossEnemy(point, enemy);
      continue;
    }

    const species = ENEMY_SPECIES[enemy.species] || ENEMY_SPECIES.grunt;
    if (!drawEnemySprite(enemy, point, species)) {
      drawSpeciesMarker(point, species);
    }
    if (enemy.slowTicks > 0) {
      drawEnemySlowAura(point, getEnemySpriteSize(enemy, species) * 0.42);
    }
    drawHealthBar(point, enemy, getEnemyHealthBarHalfWidth(enemy, species), "#b8df72");
  }
}

function drawAttackEffects() {
  for (const effect of state.attackEffects) {
    if (effect.type === "attack") {
      drawLineEffect(effect, "#4a77dd", 3);
    } else if (effect.type === "slow") {
      drawLineEffect(effect, "#49a56e", 4, [8, 5]);
      drawPulse(effect.to, 12 + effect.ttl * 2, "rgba(73, 165, 110, 0.22)");
    } else if (effect.type === "magic") {
      drawLineEffect(effect, "#9c62d9", 4);
      drawPulse(effect.to, 10 + effect.ttl, "rgba(156, 98, 217, 0.18)");
    } else if (effect.type === "cannon") {
      drawLineEffect(effect, "#9d6a35", 3);
      drawExplosion(effect.to, effect.radius * (0.5 + effect.ttl * 0.12));
    } else if (effect.type === "hunter") {
      drawLineEffect(effect, "#7d5534", 2);
      drawPulse(effect.to, 6 + effect.ttl, "rgba(125, 85, 52, 0.18)");
    }
  }
}

function drawLineEffect(effect, color, width, dash = []) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.globalAlpha = 0.35 + effect.ttl * 0.15;
  context.setLineDash(dash);
  context.beginPath();
  context.moveTo(effect.from.x, effect.from.y);
  context.lineTo(effect.to.x, effect.to.y);
  context.stroke();
  context.restore();
}

function drawPulse(point, radius, color) {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawExplosion(point, radius) {
  context.save();
  context.fillStyle = "rgba(212, 137, 54, 0.18)";
  context.strokeStyle = "rgba(156, 96, 28, 0.4)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawBossEnemy(point, enemy) {
  if (drawEnemySprite(enemy, point)) {
    if (enemy.slowTicks > 0) {
      drawEnemySlowAura(point, getEnemySpriteSize(enemy) * 0.44);
    }
    drawHealthBar(point, enemy, getEnemyHealthBarHalfWidth(enemy), "#f0b45d");
    return;
  }

  context.fillStyle = enemy.slowTicks > 0 ? "#476b9e" : "#5e1f1f";
  context.beginPath();
  context.arc(point.x, point.y, 18, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f8f5ec";
  context.font = "bold 11px Georgia";
  context.textAlign = "center";
  context.fillText("BOSS", point.x, point.y + 4);

  drawHealthBar(point, enemy, 24, "#f0b45d");
}

function drawSpeciesMarker(point, species) {
  context.fillStyle = species.color;
  context.strokeStyle = "rgba(31, 36, 48, 0.18)";
  context.lineWidth = 1.2;

  if (species.shape === "diamond") {
    context.beginPath();
    context.moveTo(point.x, point.y - species.size);
    context.lineTo(point.x + species.size, point.y);
    context.lineTo(point.x, point.y + species.size);
    context.lineTo(point.x - species.size, point.y);
    context.closePath();
    context.fill();
    context.stroke();
    return;
  }

  if (species.shape === "square") {
    context.fillRect(point.x - species.size, point.y - species.size, species.size * 2, species.size * 2);
    context.strokeRect(point.x - species.size, point.y - species.size, species.size * 2, species.size * 2);
    return;
  }

  if (species.shape === "triangle") {
    context.beginPath();
    context.moveTo(point.x, point.y - species.size - 1);
    context.lineTo(point.x + species.size, point.y + species.size);
    context.lineTo(point.x - species.size, point.y + species.size);
    context.closePath();
    context.fill();
    context.stroke();
    return;
  }

  if (species.shape === "ring") {
    context.beginPath();
    context.arc(point.x, point.y, species.size, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#dbe5bc";
    context.beginPath();
    context.arc(point.x, point.y, Math.max(3, species.size - 4), 0, Math.PI * 2);
    context.fill();
    return;
  }

  context.beginPath();
  context.arc(point.x, point.y, species.size, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawHealthBar(point, enemy, halfWidth, barColor) {
  const top = point.y - halfWidth - 8;
  context.fillStyle = "rgba(0, 0, 0, 0.2)";
  context.fillRect(point.x - halfWidth, top, halfWidth * 2, 4);
  context.fillStyle = barColor;
  context.fillRect(point.x - halfWidth, top, halfWidth * 2 * (enemy.health / enemy.maxHealth), 4);
}

function drawCursor() {
  context.strokeStyle = state.status === "game-over" ? "#8a2d2d" : "#1f2430";
  context.lineWidth = 3;
  context.strokeRect(
    state.cursor.x * CELL_SIZE + 3,
    state.cursor.y * CELL_SIZE + 3,
    CELL_SIZE - 6,
    CELL_SIZE - 6,
  );
  context.lineWidth = 1;
}

function drawLegend() {
  const tower = findTowerAt(state, state.cursor.x, state.cursor.y);
  const boxY = canvas.height - 58;
  context.fillStyle = "rgba(248, 245, 236, 0.94)";
  context.fillRect(12, boxY, canvas.width - 24, 46);
  context.fillStyle = "#1f2430";
  context.font = "14px Georgia";
  context.textAlign = "left";

  const tileLabel = isRoadCell(state.cursor.x, state.cursor.y)
    ? "Road tile"
    : tower
      ? `${TOWER_TYPES[tower.type].name} tower Lv.${tower.level}`
      : "Empty build tile";

  context.fillText(
    `Cursor ${state.cursor.x + 1},${state.cursor.y + 1} • ${tileLabel}`,
    24,
    boxY + 20,
  );
  context.fillStyle = "#58606e";
  context.font = "13px Georgia";
  context.fillText("Normal waves now mix species with different resistances and speeds.", 24, boxY + 38);
}

function syncHud() {
  waveValue.textContent = String(state.wave);
  goldValue.textContent = String(state.gold);
  scoreValue.textContent = String(state.score);
  livesValue.textContent = String(state.lives);
  statusValue.textContent =
    state.status === "menu"
      ? "Main"
      : state.status === "game-over"
        ? "Game Over"
        : state.status === "paused"
          ? "Paused"
          : "Running";

  const definition = TOWER_TYPES[state.selectedTowerType];
  const canBuild = canBuildTower(state, state.cursor.x, state.cursor.y, state.selectedTowerType);
  const tower = findTowerAt(state, state.cursor.x, state.cursor.y);
  const upgradeNote = tower
    ? ` Upgrade: ${tower.level < 3 ? `cost ${Math.round(TOWER_TYPES[tower.type].cost * (0.7 + tower.level * 0.25))}` : "maxed"}`
    : "";
  const selectionText = `${definition.name} tower costs ${definition.cost}. Best vs ${definition.counters}. ${definition.description} ${canBuild ? "Build ready." : "Build blocked."}${upgradeNote}`;
  for (const summary of selectionSummaries) {
    summary.textContent = selectionText;
  }
  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  pauseButton.disabled = ["menu", "game-over"].includes(state.status);

  overlay.hidden = state.status === "running";
  if (state.status === "menu") {
    overlayKicker.textContent = "Main Menu";
    overlayTitle.textContent = "Classic Tower Defense";
    overlayBody.textContent =
      "Normal waves now mix runners, shellbacks, wisps, and swarmlings. Click Start Game to counter the first wave.";
    overlayPrimary.textContent = "Start Game";
    overlayPrimary.dataset.action = "start";
    overlaySecondary.hidden = true;
  } else if (state.status === "paused") {
    overlayKicker.textContent = "Paused";
    overlayTitle.textContent = "Game Stopped Temporarily";
    overlayBody.textContent = "Enemy movement, tower attacks, and wave progress are all frozen until you resume.";
    overlayPrimary.textContent = "Resume";
    overlayPrimary.dataset.action = "resume";
    overlaySecondary.hidden = false;
    overlaySecondary.textContent = "Restart";
  } else if (state.status === "game-over") {
    overlayKicker.textContent = "Game Over";
    overlayTitle.textContent = `Final Score: ${state.score}`;
    overlayBody.textContent = "The swarm reached the exit. Restart to return to the menu and try again.";
    overlayPrimary.textContent = "Restart";
    overlayPrimary.dataset.action = "restart";
    overlaySecondary.hidden = true;
  }

  syncTowerActions(tower);

  for (const button of towerButtons) {
    button.classList.toggle("is-selected", button.dataset.tower === state.selectedTowerType);
  }
}

function syncTowerActions(selectedTower) {
  if (state.status !== "running" || !selectedTower) {
    towerActions.hidden = true;
    return;
  }

  const boardBounds = canvas.getBoundingClientRect();
  const scaleX = boardBounds.width / canvas.width;
  const scaleY = boardBounds.height / canvas.height;
  const centerX = (selectedTower.x + 0.5) * CELL_SIZE * scaleX;
  const topY = selectedTower.y * CELL_SIZE * scaleY;

  towerActions.style.left = `${centerX}px`;
  towerActions.style.top = `${Math.max(44, topY - 10)}px`;
  towerActions.hidden = false;
}

function update(action) {
  state = action(state);
  render();
}

document.addEventListener("keydown", (event) => {
  if (event.repeat && ![" ", "Enter"].includes(event.key)) {
    return;
  }

  const key = event.key.toLowerCase();
  if (state.status === "menu") {
    if (key === "enter" || key === " ") {
      event.preventDefault();
      update((current) => startGame(current));
    }
    return;
  }

  if (["arrowup", "w"].includes(key)) {
    event.preventDefault();
    update((current) => moveCursor(current, 0, -1));
  } else if (["arrowdown", "s"].includes(key)) {
    event.preventDefault();
    update((current) => moveCursor(current, 0, 1));
  } else if (["arrowleft", "a"].includes(key)) {
    event.preventDefault();
    update((current) => moveCursor(current, -1, 0));
  } else if (["arrowright", "d"].includes(key)) {
    event.preventDefault();
    update((current) => moveCursor(current, 1, 0));
  } else if (["1", "2", "3", "4", "5"].includes(key)) {
    const towerType = {
      1: "attack",
      2: "slow",
      3: "magic",
      4: "cannon",
      5: "hunter",
    }[key];
    update((current) => selectTowerType(current, towerType));
  } else if (key === " " || key === "enter") {
    event.preventDefault();
    update((current) => buildTowerAtCursor(current));
  } else if (key === "u") {
    update((current) => upgradeTowerAtCursor(current));
  } else if (key === "p") {
    update((current) => togglePause(current));
  } else if (key === "r") {
    state = restartGame();
    render();
  }
});

for (const button of towerButtons) {
  button.addEventListener("click", () => {
    update((current) => selectTowerType(current, button.dataset.tower));
  });
}

canvas.addEventListener("click", (event) => {
  if (state.status !== "running") {
    return;
  }

  const bounds = canvas.getBoundingClientRect();
  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;
  const cellX = Math.floor(((event.clientX - bounds.left) * scaleX) / CELL_SIZE);
  const cellY = Math.floor(((event.clientY - bounds.top) * scaleY) / CELL_SIZE);

  update((current) => setCursorPosition(current, cellX, cellY));
});

overlayPrimary.addEventListener("click", () => {
  if (overlayPrimary.dataset.action === "start") {
    update((current) => startGame(current));
  } else if (overlayPrimary.dataset.action === "resume") {
    update((current) => togglePause(current));
  } else if (overlayPrimary.dataset.action === "restart") {
    state = restartGame();
    render();
  }
});

overlaySecondary.addEventListener("click", () => {
  state = restartGame();
  render();
});

pauseButton.addEventListener("click", () => {
  update((current) => togglePause(current));
});

upgradeAction.addEventListener("click", (event) => {
  event.stopPropagation();
  update((current) => upgradeTowerAtCursor(current));
});

deleteAction.addEventListener("click", (event) => {
  event.stopPropagation();
  update((current) => deleteTowerAtCursor(current));
});

for (const button of touchButtons) {
  button.addEventListener("click", () => {
    const { action, move } = button.dataset;
    if (move === "up") update((current) => moveCursor(current, 0, -1));
    if (move === "down") update((current) => moveCursor(current, 0, 1));
    if (move === "left") update((current) => moveCursor(current, -1, 0));
    if (move === "right") update((current) => moveCursor(current, 1, 0));
    if (action === "build") update((current) => buildTowerAtCursor(current));
    if (action === "upgrade") update((current) => upgradeTowerAtCursor(current));
    if (action === "pause") update((current) => togglePause(current));
    if (action === "restart") {
      state = restartGame();
      render();
    }
  });
}

setInterval(() => {
  state = tickGame(state);
  render();
}, TICK_MS);

render();
