# Campaign Navigation UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the campaign menu flow from the battle view so the app starts on a pure title/menu experience, supports theme pages with locked stages visible, and lets players re-enter any previously cleared stage through a stage detail card.

**Architecture:** Add a lightweight campaign progress/UI state module that tracks screen, selected theme, selected stage, active stage, and cleared stages without pushing menu concerns into combat logic. Keep `src/game/logic.js` focused on battle rules, while `src/main.js` becomes the screen-state coordinator that switches between title, campaign, theme, detail, and battle rendering. Extend the stage catalog with theme grouping helpers and route battle entry through the selected stage’s detail card.

**Tech Stack:** Vite, vanilla JavaScript ES modules, HTML, CSS, Node test runner

---

## File Structure

- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\campaign-progress.js`
  Responsibility: define menu/battle screen constants, default campaign progress state, stage unlocking checks, theme grouping helpers, and immutable progress update helpers.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\stages.js`
  Responsibility: expose theme ordering and theme-to-stage lookup helpers so menus do not hardcode stage grouping.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\logic.js`
  Responsibility: accept an explicit stage start/reset target, report stage clears in a way the menu layer can consume, and avoid assuming the first stage is always active before battle begins.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`
  Responsibility: coordinate top-level screen state, render title/campaign/theme/detail screens, enter battle from the detail card, and update campaign progress when a stage is cleared.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html`
  Responsibility: add menu shell containers and button targets for title, campaign, theme, detail, and battle layers.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\styles.css`
  Responsibility: visually separate title/campaign/theme/detail screens from the battle view and provide locked/cleared/selected stage states.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\campaign-progress.test.js`
  Responsibility: lock unlocking rules, cleared-stage reentry, and theme navigation helpers.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\game-logic.test.js`
  Responsibility: verify stage resets can target an explicit stage and that stage clear data does not break battle progression.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js`
  Responsibility: assert the menu shell markup exists for title, campaign, theme, and detail flow.

## UX Decisions Locked By This Plan

- Initial load shows only the title screen. The board is not visible.
- `Start` goes to a separate `campaign-menu` screen, not directly to battle.
- Theme browsing happens on dedicated theme pages.
- Theme pages show every stage in that theme, including locked stages.
- Clicking a stage updates a detail card instead of starting battle immediately.
- `Enter` on the detail card is the only path into battle.
- Any stage once recorded in `clearedStages` stays replayable forever.
- Locking remains linear: Stage 1 starts unlocked, and each cleared stage unlocks the next stage; clearing the last stage of a theme unlocks the next theme.
- Battle results may return to theme flow, but battle starts only from the detail card.

### Task 1: Add Campaign Progress State And Unlocking Rules

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\campaign-progress.test.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\campaign-progress.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\stages.js`

- [ ] **Step 1: Write failing progress tests for default screen, unlocking, and cleared-stage replay**

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\campaign-progress.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  createCampaignProgress,
  getThemeOrder,
  getThemeStageNumbers,
  isStageUnlocked,
  markStageCleared,
  selectStageForTheme,
} from "../src/game/campaign-progress.js";

test("campaign progress starts on the title screen with only stage 1 unlocked", () => {
  const progress = createCampaignProgress();

  assert.equal(progress.screen, "title");
  assert.equal(progress.selectedTheme, "기본 읽기");
  assert.equal(progress.selectedStage, 1);
  assert.deepEqual(progress.clearedStages, []);
  assert.equal(isStageUnlocked(progress, 1), true);
  assert.equal(isStageUnlocked(progress, 2), false);
});

test("clearing a stage unlocks the next stage and preserves replay access", () => {
  let progress = createCampaignProgress();
  progress = markStageCleared(progress, 1);

  assert.deepEqual(progress.clearedStages, [1]);
  assert.equal(isStageUnlocked(progress, 1), true);
  assert.equal(isStageUnlocked(progress, 2), true);
  assert.equal(isStageUnlocked(progress, 3), false);
});

test("theme helpers expose ordered themes and stage numbers", () => {
  assert.deepEqual(getThemeOrder(), ["기본 읽기", "선택 압박", "후반 응용"]);
  assert.deepEqual(getThemeStageNumbers("기본 읽기"), [1, 2, 3]);
  assert.deepEqual(getThemeStageNumbers("선택 압박"), [4, 5, 6]);
});

test("selectStageForTheme updates the detail selection without entering battle", () => {
  const selected = selectStageForTheme(createCampaignProgress(), "기본 읽기", 2);

  assert.equal(selected.screen, "theme-page");
  assert.equal(selected.selectedTheme, "기본 읽기");
  assert.equal(selected.selectedStage, 2);
  assert.equal(selected.activeStage, null);
});
```

- [ ] **Step 2: Run the new progress tests and verify they fail**

Run:

```bash
node --test test/campaign-progress.test.js
```

Expected: FAIL with missing module or export errors because `src/game/campaign-progress.js` does not exist yet.

- [ ] **Step 3: Add theme lookup helpers to `stages.js` and implement `campaign-progress.js`**

Append these exports to `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\stages.js`:

```js
export function getThemeOrder() {
  return Array.from(new Set(STAGES.map((stage) => stage.theme)));
}

export function getThemeStageNumbers(theme) {
  return STAGES.filter((stage) => stage.theme === theme).map((stage) => stage.number);
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\campaign-progress.js` with:

```js
import { getStageCount, getStageDefinition, getThemeOrder, getThemeStageNumbers } from "./stages.js";

export function createCampaignProgress() {
  const firstTheme = getThemeOrder()[0];
  return {
    screen: "title",
    selectedTheme: firstTheme,
    selectedStage: 1,
    activeStage: null,
    clearedStages: [],
  };
}

export function isStageUnlocked(progress, stageNumber) {
  if (stageNumber === 1) {
    return true;
  }
  if (progress.clearedStages.includes(stageNumber)) {
    return true;
  }
  return progress.clearedStages.includes(stageNumber - 1);
}

export function markStageCleared(progress, stageNumber) {
  const clearedStages = Array.from(new Set([...progress.clearedStages, stageNumber])).sort((a, b) => a - b);
  return {
    ...progress,
    clearedStages,
  };
}

export function selectStageForTheme(progress, theme, stageNumber) {
  return {
    ...progress,
    screen: "theme-page",
    selectedTheme: theme,
    selectedStage: stageNumber,
    activeStage: null,
  };
}

export function getThemeOrder() {
  return getThemeOrderFromStages();
}

export function getThemeStageNumbers(theme) {
  return getThemeStageNumbersFromStages(theme);
}

function getThemeOrderFromStages() {
  return getThemeOrder();
}

function getThemeStageNumbersFromStages(theme) {
  return getThemeStageNumbers(theme);
}
```

Then replace the recursive helper names with distinct imports at the top of the file:

```js
import {
  getThemeOrder as getStageThemeOrder,
  getThemeStageNumbers as getStageThemeNumbers,
} from "./stages.js";
```

And replace the bottom helper implementations with:

```js
export function getThemeOrder() {
  return getStageThemeOrder();
}

export function getThemeStageNumbers(theme) {
  return getStageThemeNumbers(theme);
}
```

- [ ] **Step 4: Run the progress tests again**

Run:

```bash
node --test test/campaign-progress.test.js
```

Expected: PASS for all campaign progress tests.

- [ ] **Step 5: Commit the campaign progress helpers**

Run:

```bash
git add src/game/stages.js src/game/campaign-progress.js test/campaign-progress.test.js
git commit -m "feat: add campaign progress state helpers"
```

### Task 2: Let Battle Start On An Explicit Stage And Report Clear Results Cleanly

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\logic.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\game-logic.test.js`

- [ ] **Step 1: Write failing battle tests for targeted stage start and replay entry**

Append these tests to `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\game-logic.test.js`:

```js
test("restartGame can target an explicit stage before battle starts", () => {
  const state = restartGame(4);

  assert.equal(state.stage, 4);
  assert.equal(state.status, "menu");
  assert.equal(state.wave, 1);
});

test("startGame keeps the selected stage when entering battle", () => {
  const started = startGame(restartGame(6));

  assert.equal(started.stage, 6);
  assert.equal(started.status, "running");
});
```

- [ ] **Step 2: Run the gameplay tests and verify they fail**

Run:

```bash
node --test test/game-logic.test.js
```

Expected: FAIL because `restartGame` currently ignores a requested stage number.

- [ ] **Step 3: Update `logic.js` so battle reset/start can target a chosen stage**

In `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\logic.js`, replace `createInitialState` and `restartGame` with:

```js
export function createInitialState(stage = 1) {
  return {
    attackEffects: [],
    cursor: { x: 1, y: 1 },
    enemies: [],
    gold: 140,
    lives: 15,
    nextEnemyId: 1,
    nextTowerId: 1,
    score: 0,
    selectedTowerType: "attack",
    spawnedInWave: 0,
    stage,
    status: "menu",
    tick: 0,
    towers: [],
    wave: 1,
    nextSpawnTick: 12,
  };
}

export function restartGame(stage = 1) {
  return createInitialState(stage);
}
```

Keep `startGame` unchanged except for preserving the incoming stage value; no extra logic is needed beyond the current clone-and-set-status behavior.

- [ ] **Step 4: Run the gameplay tests again**

Run:

```bash
node --test test/game-logic.test.js
```

Expected: PASS for the new targeted-stage tests and all existing gameplay tests.

- [ ] **Step 5: Commit the targeted battle entry support**

Run:

```bash
git add src/game/logic.js test/game-logic.test.js
git commit -m "feat: support battle entry from selected stage"
```

### Task 3: Add Menu Shell Markup For Title, Campaign, Theme, And Detail Screens

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js`

- [ ] **Step 1: Extend the shell test with title/campaign/theme/detail containers**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("ui shell exposes title, campaign, theme, detail, and battle containers", () => {
  assert.match(html, /id="title-screen"/);
  assert.match(html, /id="campaign-menu-screen"/);
  assert.match(html, /id="theme-screen"/);
  assert.match(html, /id="stage-detail-card"/);
  assert.match(html, /id="battle-screen"/);
});
```

- [ ] **Step 2: Run the shell test and verify it fails**

Run:

```bash
node --test test/ui-shell.test.js
```

Expected: FAIL because the new containers do not exist yet.

- [ ] **Step 3: Add explicit menu and battle containers to `index.html`**

Replace the current `<main class="app-shell"> ... </main>` structure in `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html` with this scaffold:

```html
<main class="app-root">
  <section id="title-screen" class="screen screen--title">
    <div class="title-card">
      <p class="screen-kicker">Tower Defense</p>
      <h1>Campaign Command</h1>
      <p>Choose a theme, inspect stages, and enter battle only when you are ready.</p>
      <button id="title-start-button" type="button">Start</button>
    </div>
  </section>

  <section id="campaign-menu-screen" class="screen screen--campaign" hidden>
    <div class="menu-card">
      <p class="screen-kicker">Campaign Menu</p>
      <h2>Themes</h2>
      <div id="theme-list" class="theme-list"></div>
      <button id="campaign-back-button" type="button">Back</button>
    </div>
  </section>

  <section id="theme-screen" class="screen screen--theme" hidden>
    <div class="theme-layout">
      <div>
        <button id="theme-back-button" type="button">Back</button>
        <h2 id="theme-title"></h2>
        <div id="theme-stage-list" class="stage-list"></div>
      </div>
      <aside id="stage-detail-card" class="stage-detail-card">
        <p id="detail-theme"></p>
        <h3 id="detail-stage-name"></h3>
        <p id="detail-stage-summary"></p>
        <p id="detail-stage-status"></p>
        <button id="detail-enter-button" type="button">Enter</button>
      </aside>
    </div>
  </section>

  <section id="battle-screen" class="app-shell" hidden>
    <!-- keep the existing game-panel and sidebar markup here -->
  </section>
</main>
```

Move the existing board/sidebar markup inside `#battle-screen`, leaving the board/HUD untouched aside from that wrapping move.

- [ ] **Step 4: Run the shell test again**

Run:

```bash
node --test test/ui-shell.test.js
```

Expected: PASS because all menu and battle containers now exist.

- [ ] **Step 5: Commit the screen shell markup**

Run:

```bash
git add index.html test/ui-shell.test.js
git commit -m "feat: add campaign navigation screen shell"
```

### Task 4: Wire Screen Navigation, Theme Browsing, Detail Card, And Stage Entry

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\styles.css`

- [ ] **Step 1: Add a failing integration-style progress test for unlocked replay and selected detail state**

Append this test to `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\campaign-progress.test.js`:

```js
test("clearing a late stage keeps replay access to earlier cleared stages", () => {
  let progress = createCampaignProgress();
  progress = markStageCleared(progress, 1);
  progress = markStageCleared(progress, 2);
  progress = markStageCleared(progress, 3);

  assert.equal(isStageUnlocked(progress, 1), true);
  assert.equal(isStageUnlocked(progress, 2), true);
  assert.equal(isStageUnlocked(progress, 3), true);
  assert.equal(isStageUnlocked(progress, 4), true);
});
```

- [ ] **Step 2: Run the progress tests to verify the new replay case stays green before UI wiring**

Run:

```bash
node --test test/campaign-progress.test.js
```

Expected: PASS. This is a guard before the larger `main.js` rewrite.

- [ ] **Step 3: Rewrite `src/main.js` around a top-level `campaignProgress` state**

At the top of `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`, add these imports:

```js
import {
  createCampaignProgress,
  getThemeOrder,
  getThemeStageNumbers,
  isStageUnlocked,
  markStageCleared,
  selectStageForTheme,
} from "./game/campaign-progress.js";
```

Add top-level progress state and screen element references:

```js
let campaignProgress = createCampaignProgress();

const titleScreen = document.getElementById("title-screen");
const campaignMenuScreen = document.getElementById("campaign-menu-screen");
const themeScreen = document.getElementById("theme-screen");
const battleScreen = document.getElementById("battle-screen");
const titleStartButton = document.getElementById("title-start-button");
const campaignBackButton = document.getElementById("campaign-back-button");
const themeBackButton = document.getElementById("theme-back-button");
const themeList = document.getElementById("theme-list");
const themeTitle = document.getElementById("theme-title");
const themeStageList = document.getElementById("theme-stage-list");
const detailTheme = document.getElementById("detail-theme");
const detailStageName = document.getElementById("detail-stage-name");
const detailStageSummary = document.getElementById("detail-stage-summary");
const detailStageStatus = document.getElementById("detail-stage-status");
const detailEnterButton = document.getElementById("detail-enter-button");
```

Add these screen/render helpers above `render()`:

```js
function syncScreens() {
  titleScreen.hidden = campaignProgress.screen !== "title";
  campaignMenuScreen.hidden = campaignProgress.screen !== "campaign-menu";
  themeScreen.hidden = campaignProgress.screen !== "theme-page";
  battleScreen.hidden = !["battle", "paused", "stage-cleared", "victory", "game-over"].includes(campaignProgress.screen);
}

function renderThemeList() {
  themeList.replaceChildren(
    ...getThemeOrder().map((theme) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = theme;
      button.addEventListener("click", () => {
        campaignProgress = {
          ...campaignProgress,
          screen: "theme-page",
          selectedTheme: theme,
          selectedStage: getThemeStageNumbers(theme)[0],
        };
        render();
      });
      return button;
    }),
  );
}

function renderThemePage() {
  const stageNumbers = getThemeStageNumbers(campaignProgress.selectedTheme);
  themeTitle.textContent = campaignProgress.selectedTheme;
  themeStageList.replaceChildren(
    ...stageNumbers.map((stageNumber) => {
      const stage = getStageDefinition(stageNumber);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stage-list__item";
      button.dataset.state = campaignProgress.clearedStages.includes(stageNumber)
        ? "cleared"
        : isStageUnlocked(campaignProgress, stageNumber)
          ? "open"
          : "locked";
      button.textContent = `Stage ${stage.number}: ${stage.name}`;
      button.addEventListener("click", () => {
        campaignProgress = selectStageForTheme(campaignProgress, campaignProgress.selectedTheme, stageNumber);
        render();
      });
      return button;
    }),
  );
}

function renderStageDetail() {
  const stage = getStageDefinition(campaignProgress.selectedStage);
  const unlocked = isStageUnlocked(campaignProgress, stage.number);
  const cleared = campaignProgress.clearedStages.includes(stage.number);

  detailTheme.textContent = stage.theme;
  detailStageName.textContent = `Stage ${stage.number}: ${stage.name}`;
  detailStageSummary.textContent = stage.summary;
  detailStageStatus.textContent = cleared ? "Cleared" : unlocked ? "Ready" : "Locked";
  detailEnterButton.disabled = !unlocked;
}
```

Update the main `render()` function to branch by screen:

```js
function render() {
  syncScreens();
  renderThemeList();
  renderThemePage();
  renderStageDetail();

  if (!battleScreen.hidden) {
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
}
```

Update `syncHud()` so battle status depends on `campaignProgress.screen` instead of `state.status`:

```js
statusValue.textContent =
  campaignProgress.screen === "paused"
    ? "Paused"
    : campaignProgress.screen === "stage-cleared"
      ? "Stage Clear"
      : campaignProgress.screen === "victory"
        ? "Victory"
        : campaignProgress.screen === "game-over"
          ? "Game Over"
          : "Running";
```

Update `tickGame` integration so stage clears record progress:

```js
setInterval(() => {
  if (campaignProgress.screen !== "battle") {
    return;
  }

  state = tickGame(state);

  if (state.status === "stage-cleared") {
    campaignProgress = markStageCleared(campaignProgress, state.stage - 1);
    campaignProgress = {
      ...campaignProgress,
      screen: "theme-page",
      selectedTheme: getStageDefinition(state.stage).theme,
      selectedStage: state.stage,
      activeStage: null,
    };
  } else if (state.status === "victory") {
    campaignProgress = markStageCleared(campaignProgress, state.stage);
    campaignProgress = {
      ...campaignProgress,
      screen: "campaign-menu",
      activeStage: null,
    };
  } else if (state.status === "game-over") {
    campaignProgress = {
      ...campaignProgress,
      screen: "theme-page",
      activeStage: null,
    };
  }

  render();
}, TICK_MS);
```

Add navigation event handlers:

```js
titleStartButton.addEventListener("click", () => {
  campaignProgress = { ...campaignProgress, screen: "campaign-menu" };
  render();
});

campaignBackButton.addEventListener("click", () => {
  campaignProgress = { ...campaignProgress, screen: "title" };
  render();
});

themeBackButton.addEventListener("click", () => {
  campaignProgress = { ...campaignProgress, screen: "campaign-menu" };
  render();
});

detailEnterButton.addEventListener("click", () => {
  if (!isStageUnlocked(campaignProgress, campaignProgress.selectedStage)) {
    return;
  }

  state = restartGame(campaignProgress.selectedStage);
  state = startGame(state);
  campaignProgress = {
    ...campaignProgress,
    screen: "battle",
    activeStage: campaignProgress.selectedStage,
  };
  render();
});
```

Update the pause/restart handlers to use `campaignProgress.screen`:

```js
pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  campaignProgress = {
    ...campaignProgress,
    screen: state.status === "paused" ? "paused" : "battle",
  };
  render();
});

overlayPrimary.addEventListener("click", () => {
  if (overlayPrimary.dataset.action === "resume") {
    state = togglePause(state);
    campaignProgress = { ...campaignProgress, screen: "battle" };
  } else if (overlayPrimary.dataset.action === "restart") {
    state = restartGame(campaignProgress.activeStage ?? campaignProgress.selectedStage ?? 1);
    state = startGame(state);
    campaignProgress = { ...campaignProgress, screen: "battle" };
  }
  render();
});
```

In `styles.css`, append menu/navigation styles:

```css
.app-root {
  min-height: 100vh;
}

.screen {
  min-height: 100vh;
  padding: 32px;
}

.screen[hidden] {
  display: none;
}

.screen--title,
.screen--campaign,
.screen--theme {
  display: grid;
  place-items: center;
}

.title-card,
.menu-card,
.stage-detail-card {
  width: min(100%, 640px);
  padding: 24px;
  border-radius: 24px;
  border: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(255, 245, 214, 0.06), rgba(0, 0, 0, 0)),
    linear-gradient(180deg, var(--panel) 0%, var(--panel-inset) 100%);
  box-shadow: var(--shadow);
}

.theme-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 20px;
  width: min(1100px, 100%);
}

.theme-list,
.stage-list {
  display: grid;
  gap: 10px;
}

.stage-list__item[data-state="locked"] {
  opacity: 0.55;
}

.stage-list__item[data-state="cleared"] {
  border-color: color-mix(in srgb, var(--success) 70%, white 30%);
}
```

- [ ] **Step 4: Run the full test suite and build after the UI flow rewrite**

Run:

```bash
npm test
npm run build
```

Expected:
- All tests pass, including `campaign-progress.test.js`, `game-logic.test.js`, and `ui-shell.test.js`
- Vite build succeeds with the new menu shell

- [ ] **Step 5: Commit the navigation UX flow**

Run:

```bash
git add src/game/campaign-progress.js src/game/stages.js src/game/logic.js src/main.js index.html styles.css test/campaign-progress.test.js test/game-logic.test.js test/ui-shell.test.js
git commit -m "feat: add campaign navigation ux flow"
```

### Task 5: Manual QA The Menu/Battle Separation

**Files:**
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\styles.css`

- [ ] **Step 1: Run the dev server**

Run:

```bash
npm run dev
```

- [ ] **Step 2: Manually verify the title-to-battle flow**

Check all of these:

```text
- On first load, only the title screen is visible and the board is not visible behind it
- Clicking Start moves to a separate campaign menu, not straight into battle
- Clicking a theme opens a theme page with every stage in that theme visible
- Locked stages are still shown with a visually locked state
- Clicking a stage updates the detail card without starting battle
- Enter is disabled for locked stages and enabled for unlocked/cleared stages
- Enter starts the chosen stage and shows the battle screen
```

- [ ] **Step 3: Manually verify clear/replay behavior**

Check all of these:

```text
- Clearing Stage 1 returns the player to theme browsing rather than silently chaining into Stage 2 battle
- Stage 1 remains replayable after it has been cleared
- Stage 2 becomes enterable after Stage 1 clear
- Clearing the last stage of a theme allows browsing into the next theme
- A previously cleared stage can be selected and replayed at any time from its theme page
```

- [ ] **Step 4: If manual fixes were required, commit them; otherwise stop without an empty commit**

If files changed during QA fixes, run:

```bash
git add src/game/campaign-progress.js src/game/stages.js src/game/logic.js src/main.js index.html styles.css test/campaign-progress.test.js test/game-logic.test.js test/ui-shell.test.js
git commit -m "fix: polish campaign navigation ux"
```

If no files changed, do not create an empty commit.
