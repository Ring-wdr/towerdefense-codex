# Phaser Campaign Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the DOM-driven campaign menu flow with a Phaser scene-based menu and overlay system while preserving the existing gameplay rules and leaving only battle controls in HTML.

**Architecture:** Add Phaser 3 as the rendering and input shell, split the app into `TitleScene`, `CampaignScene`, `ThemeScene`, `BattleScene`, and `OverlayScene`, and keep `src/game/*.js` as the data and gameplay logic layer. `src/main.js` becomes a Phaser bootstrap entry, while the existing combat rules are adapted into a scene-managed battle loop instead of a manual canvas and DOM controller.

**Tech Stack:** Vite, Phaser 3, vanilla JavaScript ES modules, Node test runner

---

## File Structure

- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\package.json`
  Responsibility: add Phaser dependency.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html`
  Responsibility: reduce the shell to a Phaser mount container plus battle controls only.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\styles.css`
  Responsibility: remove menu-card layout assumptions and keep only root shell + battle control styling.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`
  Responsibility: replace DOM menu orchestration with Phaser bootstrap and scene registration.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\game.js`
  Responsibility: create and export the Phaser game configuration and factory.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\state\game-session.js`
  Responsibility: centralize campaign progress state and the bridge to gameplay state.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js`
  Responsibility: viewport-safe layout helpers for title, campaign, theme, and overlay scenes.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js`
  Responsibility: reusable Phaser UI primitives for buttons, panels, labels, and state chips.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`
  Responsibility: render the title scene and emit transition into campaign.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`
  Responsibility: render theme browsing with previous/next controls and theme entry.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`
  Responsibility: render stage grid plus stage detail in one scene and enter battle from there only.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\BattleScene.js`
  Responsibility: adapt the current battle drawing and update loop into Phaser.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\OverlayScene.js`
  Responsibility: render paused/game-over overlays above battle and route actions back to battle or theme.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-game-session.test.js`
  Responsibility: verify campaign state transitions independent of rendering.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js`
  Responsibility: assert the DOM shell only contains the Phaser mount + battle controls.

## Task 1: Add Phaser Dependency And Trim The DOM Shell

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\package.json`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\styles.css`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js`

- [ ] **Step 1: Rewrite the shell test to require a Phaser mount and forbid menu sections**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("ui shell exposes only the phaser mount and battle controls", () => {
  assert.match(html, /id="game-root"/);
  assert.match(html, /id="battle-controls"/);
  assert.match(html, /id="pause-button"/);
  assert.match(html, /id="tower-buttons"/);
  assert.match(html, /id="tower-buttons-dock"/);

  assert.doesNotMatch(html, /id="title-screen"/);
  assert.doesNotMatch(html, /id="campaign-menu-screen"/);
  assert.doesNotMatch(html, /id="theme-screen"/);
  assert.doesNotMatch(html, /id="stage-detail-card"/);
});
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run:

```bash
node --test test/ui-shell.test.js
```

Expected: FAIL because the current HTML still contains the old menu sections.

- [ ] **Step 3: Add Phaser to `package.json` and simplify the HTML shell**

Update `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\package.json` dependency block to include:

```json
"dependencies": {
  "lucide": "^1.8.0",
  "phaser": "^3.90.0",
  "sharp": "^0.34.5"
}
```

Replace the body of `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\index.html` with:

```html
  <body>
    <main class="app-root">
      <div id="game-root" class="game-root" aria-label="Tower defense game"></div>

      <section id="battle-controls" class="battle-controls" hidden>
        <button id="pause-button" class="board-pause-button" type="button">Pause</button>

        <div id="tower-actions" class="tower-actions" hidden>
          <button id="upgrade-action" type="button" aria-label="Upgrade tower">U</button>
          <button id="delete-action" type="button" aria-label="Delete tower">X</button>
        </div>

        <aside class="sidebar" hidden>
          <section class="card card--towers">
            <h2>Loadout</h2>
            <p class="selection-summary selection-summary--desktop" data-selection-summary></p>
            <div class="tower-grid" id="tower-buttons">
              <button type="button" data-tower="attack" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="attack" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">1</span><span class="tower-choice__name">Attack</span></span>
              </button>
              <button type="button" data-tower="slow" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="slow" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">2</span><span class="tower-choice__name">Slow</span></span>
              </button>
              <button type="button" data-tower="magic" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="magic" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">3</span><span class="tower-choice__name">Magic</span></span>
              </button>
              <button type="button" data-tower="cannon" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="cannon" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">4</span><span class="tower-choice__name">Cannon</span></span>
              </button>
              <button type="button" data-tower="hunter" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="hunter" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">5</span><span class="tower-choice__name">Hunter</span></span>
              </button>
            </div>
          </section>
        </aside>

        <section id="tower-buttons-dock" class="control-dock control-dock--hybrid" aria-label="Quick play controls" hidden>
          <div class="dock-section">
            <div class="dock-header">
              <p class="dock-label">Pick Tower</p>
              <p class="dock-selection-summary" data-selection-summary></p>
            </div>
            <div class="tower-grid tower-grid--dock">
              <button type="button" data-tower="attack" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="attack" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">1</span><span class="tower-choice__name">Attack</span></span>
              </button>
              <button type="button" data-tower="slow" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="slow" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">2</span><span class="tower-choice__name">Slow</span></span>
              </button>
              <button type="button" data-tower="magic" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="magic" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">3</span><span class="tower-choice__name">Magic</span></span>
              </button>
              <button type="button" data-tower="cannon" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="cannon" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">4</span><span class="tower-choice__name">Cannon</span></span>
              </button>
              <button type="button" data-tower="hunter" class="tower-choice">
                <span class="tower-choice__icon"><img data-tower-icon="hunter" alt="" /></span>
                <span class="tower-choice__meta"><span class="tower-choice__key">5</span><span class="tower-choice__name">Hunter</span></span>
              </button>
            </div>
          </div>

          <div class="dock-actions-layout">
            <div class="dock-pad" aria-label="Move cursor">
              <button type="button" data-move="up" class="dock-pad__up" aria-label="Up">Up</button>
              <button type="button" data-move="left" class="dock-pad__left" aria-label="Left">Left</button>
              <button type="button" data-move="right" class="dock-pad__right" aria-label="Right">Right</button>
              <button type="button" data-move="down" class="dock-pad__down" aria-label="Down">Down</button>
            </div>

            <div class="dock-actions">
              <button type="button" data-action="build">Build</button>
              <button type="button" data-action="upgrade">Upgrade</button>
              <button type="button" data-action="pause">Pause</button>
              <button type="button" data-action="restart">Restart</button>
            </div>
          </div>
        </section>
      </section>
    </main>

    <script type="module" src="/src/main.js"></script>
  </body>
```

Append these shell rules near the top of `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\styles.css`:

```css
.game-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.battle-controls[hidden],
.sidebar[hidden],
.control-dock[hidden],
.tower-actions[hidden] {
  display: none !important;
}
```

- [ ] **Step 4: Install dependencies and rerun the shell test**

Run:

```bash
npm install
node --test test/ui-shell.test.js
```

Expected:
- `npm install` adds Phaser without conflicts
- `node --test test/ui-shell.test.js` passes

- [ ] **Step 5: Commit the shell preparation**

Run:

```bash
git add package.json package-lock.json index.html styles.css test/ui-shell.test.js
git commit -m "feat: prepare phaser game shell"
```

## Task 2: Add A Phaser Session State Bridge

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\state\game-session.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-game-session.test.js`

- [ ] **Step 1: Write failing tests for campaign scene transitions**

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-game-session.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  createGameSession,
  beginBattleFromSelection,
  completeBattleStage,
  cycleThemeSelection,
  selectStage,
} from "../src/phaser/state/game-session.js";

test("game session starts on the title scene with a selected first theme and stage", () => {
  const session = createGameSession();

  assert.equal(session.scene, "title");
  assert.equal(session.selectedStage, 1);
  assert.equal(session.activeStage, null);
  assert.deepEqual(session.clearedStages, []);
});

test("cycling theme selection changes the selected theme without entering battle", () => {
  const next = cycleThemeSelection(createGameSession(), 1);

  assert.equal(next.scene, "campaign");
  assert.notEqual(next.selectedTheme, createGameSession().selectedTheme);
  assert.equal(next.activeStage, null);
});

test("beginBattleFromSelection copies selected stage into active stage", () => {
  const session = beginBattleFromSelection(selectStage(createGameSession(), 1));

  assert.equal(session.scene, "battle");
  assert.equal(session.selectedStage, 1);
  assert.equal(session.activeStage, 1);
});

test("completeBattleStage records clear progress and returns to theme scene", () => {
  const session = completeBattleStage(beginBattleFromSelection(createGameSession()), 1);

  assert.equal(session.scene, "theme");
  assert.deepEqual(session.clearedStages, [1]);
  assert.equal(session.activeStage, null);
  assert.equal(session.selectedStage, 2);
});
```

- [ ] **Step 2: Run the new state tests to verify they fail**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: FAIL because the session bridge module does not exist yet.

- [ ] **Step 3: Implement the session bridge**

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\state\game-session.js` with:

```js
import {
  createCampaignProgress,
  getThemeOrder,
  getThemeStageNumbers,
  isStageUnlocked,
  markStageCleared,
  selectStageForTheme,
} from "../../src/game/campaign-progress.js";
import { getStageDefinition } from "../../src/game/stages.js";

export function createGameSession() {
  const progress = createCampaignProgress();
  return {
    scene: "title",
    ...progress,
  };
}

export function cycleThemeSelection(session, direction) {
  const themes = getThemeOrder();
  const currentIndex = Math.max(0, themes.indexOf(session.selectedTheme));
  const nextIndex = (currentIndex + direction + themes.length) % themes.length;
  const nextTheme = themes[nextIndex];
  const stageNumber = getThemeStageNumbers(nextTheme)[0];

  return {
    ...session,
    scene: "campaign",
    selectedTheme: nextTheme,
    selectedStage: stageNumber,
    activeStage: null,
  };
}

export function selectStage(session, stageNumber) {
  const stage = getStageDefinition(stageNumber);
  return selectStageForTheme(
    {
      ...session,
      scene: "theme",
    },
    stage.theme,
    stage.number,
  );
}

export function beginBattleFromSelection(session) {
  if (!isStageUnlocked(session, session.selectedStage)) {
    return session;
  }

  return {
    ...session,
    scene: "battle",
    activeStage: session.selectedStage,
  };
}

export function completeBattleStage(session, stageNumber) {
  const progress = markStageCleared(session, stageNumber);
  const nextStage = getStageDefinition(stageNumber + 1);

  return {
    ...progress,
    scene: "theme",
    selectedTheme: nextStage.theme,
    selectedStage: nextStage.number,
    activeStage: null,
  };
}
```

- [ ] **Step 4: Run the session tests again**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: PASS

- [ ] **Step 5: Commit the Phaser session bridge**

Run:

```bash
git add src/phaser/state/game-session.js test/phaser-game-session.test.js
git commit -m "feat: add phaser game session state"
```

## Task 3: Add Phaser Bootstrap, Layout Helpers, And Scene Skeletons

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\game.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\OverlayScene.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`

- [ ] **Step 1: Add a failing smoke test for the shell bootstrap**

Append this to `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\ui-shell.test.js`:

```js
test("main entry can target the phaser mount id", async () => {
  const source = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /game-root/);
});
```

- [ ] **Step 2: Run the shell tests to verify the new smoke case fails**

Run:

```bash
node --test test/ui-shell.test.js
```

Expected: FAIL because `src/main.js` still references the old DOM-driven menu shell.

- [ ] **Step 3: Add the Phaser bootstrap and scene skeletons**

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js`:

```js
export function getViewportFrame(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const margin = Math.max(16, Math.round(Math.min(width, height) * 0.04));

  return {
    width,
    height,
    margin,
    centerX: width / 2,
    centerY: height / 2,
    contentWidth: width - margin * 2,
    contentHeight: height - margin * 2,
  };
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js`:

```js
export function createButton(scene, x, y, width, height, label, onPress) {
  const background = scene.add.rectangle(x, y, width, height, 0x31414c, 0.95).setStrokeStyle(2, 0xe4c47a);
  const text = scene.add.text(x, y, label, {
    color: "#f5efe1",
    fontFamily: "Trebuchet MS",
    fontSize: "24px",
  }).setOrigin(0.5);

  background.setInteractive({ useHandCursor: true }).on("pointerup", onPress);
  return { background, text };
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`:

```js
import Phaser from "phaser";
import { createButton } from "../ui/components.js";
import { getViewportFrame } from "../ui/layout.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const frame = getViewportFrame(this);
    this.add.text(frame.centerX, frame.margin + 48, "Stage Command", {
      color: "#f5efe1",
      fontFamily: "Trebuchet MS",
      fontSize: "44px",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    this.add.text(frame.centerX, frame.centerY - 40, "Browse themes, inspect stages, and enter battle when ready.", {
      color: "#d9d0bf",
      fontFamily: "Segoe UI",
      fontSize: "22px",
      align: "center",
      wordWrap: { width: frame.contentWidth * 0.82 },
    }).setOrigin(0.5);

    createButton(this, frame.centerX, frame.height - 96, Math.min(320, frame.contentWidth), 72, "Start", () => {
      this.scene.start("CampaignScene");
    });
  }
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`:

```js
import Phaser from "phaser";
import { createButton } from "../ui/components.js";
import { getViewportFrame } from "../ui/layout.js";

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super("CampaignScene");
  }

  create() {
    const frame = getViewportFrame(this);
    this.add.text(frame.centerX, frame.margin + 24, "Campaign", {
      color: "#f5efe1",
      fontFamily: "Trebuchet MS",
      fontSize: "38px",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    createButton(this, frame.centerX, frame.height - 96, Math.min(360, frame.contentWidth), 72, "Enter Theme", () => {
      this.scene.start("ThemeScene");
    });
  }
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`:

```js
import Phaser from "phaser";
import { createButton } from "../ui/components.js";
import { getViewportFrame } from "../ui/layout.js";

export class ThemeScene extends Phaser.Scene {
  constructor() {
    super("ThemeScene");
  }

  create() {
    const frame = getViewportFrame(this);
    this.add.text(frame.centerX, frame.margin + 24, "Theme", {
      color: "#f5efe1",
      fontFamily: "Trebuchet MS",
      fontSize: "34px",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    createButton(this, frame.centerX, frame.height - 96, Math.min(360, frame.contentWidth), 72, "Enter", () => {
      this.scene.start("BattleScene");
    });
  }
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\OverlayScene.js`:

```js
import Phaser from "phaser";

export class OverlayScene extends Phaser.Scene {
  constructor() {
    super("OverlayScene");
  }
}
```

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\game.js`:

```js
import Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene.js";
import { CampaignScene } from "./scenes/CampaignScene.js";
import { ThemeScene } from "./scenes/ThemeScene.js";
import { OverlayScene } from "./scenes/OverlayScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#162018",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene: [TitleScene, CampaignScene, ThemeScene, BattleScene, OverlayScene],
  });
}
```

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js` with:

```js
import { createGame } from "./phaser/game.js";

const root = document.getElementById("game-root");

createGame(root);
```

- [ ] **Step 4: Run the shell tests again**

Run:

```bash
node --test test/ui-shell.test.js
```

Expected: PASS

- [ ] **Step 5: Commit the Phaser bootstrap**

Run:

```bash
git add src/main.js src/phaser/game.js src/phaser/ui/layout.js src/phaser/ui/components.js src/phaser/scenes/TitleScene.js src/phaser/scenes/CampaignScene.js src/phaser/scenes/ThemeScene.js src/phaser/scenes/OverlayScene.js test/ui-shell.test.js
git commit -m "feat: add phaser scene bootstrap"
```

## Task 4: Port The Battle Runtime Into `BattleScene`

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\BattleScene.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\game\logic.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\game-logic.test.js`

- [ ] **Step 1: Add a failing gameplay test for external battle stage boot**

Append to `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\game-logic.test.js`:

```js
test("createInitialState accepts an explicit stage for phaser scene boot", () => {
  const state = createInitialState(5);
  assert.equal(state.stage, 5);
  assert.equal(state.status, "menu");
});
```

- [ ] **Step 2: Run the gameplay tests to verify the new boot case is green or fix if needed**

Run:

```bash
node --test test/game-logic.test.js
```

Expected: PASS or a small update needed if `createInitialState(stage)` regressed.

- [ ] **Step 3: Implement the first Phaser battle scene adapter**

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\BattleScene.js` with:

```js
import Phaser from "phaser";
import {
  CELL_SIZE,
  createInitialState,
  getEnemyPosition,
  getPathCells,
  GRID_COLS,
  GRID_ROWS,
  tickGame,
} from "../../game/logic.js";

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
    this.state = createInitialState();
  }

  create(data = {}) {
    this.state = createInitialState(data.stage ?? 1);
    this.state.status = "running";
    this.graphics = this.add.graphics();
  }

  update() {
    this.state = tickGame(this.state);
    this.drawBoard();
  }

  drawBoard() {
    this.graphics.clear();
    this.graphics.fillStyle(0x95b36b, 1);
    this.graphics.fillRect(0, 0, GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE);

    this.graphics.fillStyle(0xb08d60, 1);
    for (const cell of getPathCells(this.state.stage)) {
      this.graphics.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    this.graphics.fillStyle(0xc64646, 1);
    for (const enemy of this.state.enemies) {
      const point = getEnemyPosition(enemy);
      this.graphics.fillCircle(point.x, point.y, 10);
    }
  }
}
```

- [ ] **Step 4: Run gameplay tests and build**

Run:

```bash
node --test test/game-logic.test.js
npm run build
```

Expected:
- gameplay tests pass
- build passes with the new `BattleScene`

- [ ] **Step 5: Commit the battle scene port**

Run:

```bash
git add src/phaser/scenes/BattleScene.js src/game/logic.js test/game-logic.test.js
git commit -m "feat: add phaser battle scene"
```

## Task 5: Connect Scene Navigation To Session State And Battle Controls

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\state\game-session.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\BattleScene.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\OverlayScene.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js`

- [ ] **Step 1: Extend the session tests with replay and overlay-return behavior**

Append to `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-game-session.test.js`:

```js
test("selecting a cleared stage remains valid for replay", () => {
  const cleared = completeBattleStage(beginBattleFromSelection(createGameSession()), 1);
  const replay = selectStage(cleared, 1);

  assert.equal(replay.selectedStage, 1);
  assert.deepEqual(replay.clearedStages, [1]);
});
```

- [ ] **Step 2: Run the session tests to verify they stay green before scene wiring**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: PASS

- [ ] **Step 3: Replace placeholder scene transitions with real session-backed flow**

Update `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\main.js` to create the session once and register it in Phaser:

```js
import { createGame } from "./phaser/game.js";
import { createGameSession } from "./phaser/state/game-session.js";

const root = document.getElementById("game-root");
const game = createGame(root);

game.registry.set("session", createGameSession());
```

Update each scene to read/write `this.game.registry.get("session")` and `this.game.registry.set("session", nextSession)` instead of hardcoded transitions.

In `ThemeScene`, use `beginBattleFromSelection(session)` before starting `BattleScene`.

In `BattleScene`, when `tickGame()` produces `stage-cleared`, `victory`, or `game-over`, update the registry session and either start `ThemeScene` or `OverlayScene` as appropriate.

In `OverlayScene`, wire `Resume`, `Retry`, and `Back` actions so they route to `BattleScene` or `ThemeScene` with the current session state.

- [ ] **Step 4: Run the full test suite and build**

Run:

```bash
npm test
npm run build
```

Expected: PASS for both

- [ ] **Step 5: Commit the integrated Phaser campaign flow**

Run:

```bash
git add src/main.js src/phaser/state/game-session.js src/phaser/scenes/CampaignScene.js src/phaser/scenes/ThemeScene.js src/phaser/scenes/BattleScene.js src/phaser/scenes/OverlayScene.js test/phaser-game-session.test.js
git commit -m "feat: connect phaser campaign scenes"
```

## Task 6: Manual QA The Mobile One-Screen Flow

**Files:**
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\BattleScene.js`

- [ ] **Step 1: Run the dev server**

Run:

```bash
npm run dev
```

- [ ] **Step 2: Verify the menu scenes are one-screen on mobile**

Check all of these:

```text
- The title scene fits on one mobile screen without scroll
- The campaign scene shows a single focused theme panel, not stacked cards
- The theme scene shows stage selection and detail together on one screen
- Menu interaction works by tapping inside the Phaser canvas, not DOM buttons
```

- [ ] **Step 3: Verify battle/control behavior**

Check all of these:

```text
- Enter battle only works from the theme scene
- Battle controls are the only remaining HTML controls visible during play
- Battle controls are hidden outside active play
- Clearing a stage returns to theme flow instead of auto-starting the next battle
- A cleared stage can be selected again and replayed
```

- [ ] **Step 4: If QA fixes were needed, commit them; otherwise stop without an empty commit**

If files changed during QA fixes, run:

```bash
git add src/main.js src/phaser src/game/logic.js index.html styles.css test
git commit -m "fix: polish phaser campaign flow"
```

If no files changed, do not create an empty commit.
