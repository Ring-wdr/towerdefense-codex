# Phaser Scene UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Phaser-managed title, campaign, and theme scenes so they read like a game interface instead of a web card layout, without touching the existing DOM battle controls.

**Architecture:** Keep the existing scene flow and registry-backed session state intact, but replace the centered-card layout system with zone-based layout helpers and game-style Phaser UI primitives. Refactor shared UI helpers first, then rebuild `TitleScene`, `CampaignScene`, and `ThemeScene` on top of that shared system, and finish with Playwright visual QA on desktop and mobile widths.

**Tech Stack:** Vite, Phaser 3, vanilla JavaScript ES modules, Node test runner, Playwright

---

## File Structure

- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js`
  Responsibility: replace centered-panel measurements with zone-based scene layout helpers that keep critical UI inside the viewport.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js`
  Responsibility: replace web-card primitives with game-menu primitives for backdrop framing, title lockups, command buttons, and status strips.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`
  Responsibility: rebuild the title screen around a title lockup, lightweight context hint, and single dominant start command.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`
  Responsibility: rebuild the campaign screen around central theme focus, compact progress info, and a bottom command band.
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`
  Responsibility: rebuild the theme screen as a battle briefing screen with concise summary and dominant entry action.
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-layout.test.js`
  Responsibility: lock in zone-based layout contracts and short-viewport behavior before implementation.

## Task 1: Lock In The New Layout Contracts

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-layout.test.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js`

- [ ] **Step 1: Write the failing layout tests**

Create `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\test\phaser-layout.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";

import { getSceneLayout } from "../src/phaser/ui/layout.js";

function createScene(width, height) {
  return {
    scale: { width, height },
  };
}

test("getSceneLayout returns header, focus, and command zones for desktop", () => {
  const layout = getSceneLayout(createScene(1280, 720));

  assert.equal(layout.isMobile, false);
  assert.ok(layout.header.height > 0);
  assert.ok(layout.focus.height > 0);
  assert.ok(layout.command.height > 0);
  assert.ok(layout.focus.top >= layout.header.bottom);
  assert.ok(layout.command.top >= layout.focus.top);
  assert.ok(layout.command.bottom <= layout.height - layout.margin);
});

test("getSceneLayout compacts safely on short mobile viewports", () => {
  const layout = getSceneLayout(createScene(390, 720));

  assert.equal(layout.isMobile, true);
  assert.equal(layout.isShort, true);
  assert.ok(layout.focus.height >= 180);
  assert.ok(layout.command.height >= 88);
  assert.ok(layout.command.bottom <= layout.height - layout.margin);
});

test("getSceneLayout keeps action row width inside the viewport", () => {
  const layout = getSceneLayout(createScene(430, 932));
  const row = layout.getCommandRow(2, 156);

  assert.equal(row.positions.length, 2);
  assert.ok(row.buttonWidth <= layout.contentWidth);
  assert.ok(row.left >= layout.margin);
  assert.ok(row.right <= layout.width - layout.margin);
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
node --test test/phaser-layout.test.js
```

Expected: FAIL because `getSceneLayout` does not exist yet.

- [ ] **Step 3: Implement the zone-based layout helper**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js` with:

```js
export function getSceneLayout(scene) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const margin = Math.max(18, Math.round(Math.min(width, height) * 0.04));
  const contentWidth = width - margin * 2;
  const contentHeight = height - margin * 2;
  const isMobile = width <= 680;
  const isShort = height <= 760;
  const headerHeight = isMobile ? 116 : 132;
  const commandHeight = isShort ? 96 : isMobile ? 110 : 126;
  const focusTop = margin + headerHeight;
  const focusBottom = height - margin - commandHeight;
  const focusHeight = Math.max(180, focusBottom - focusTop);

  return {
    width,
    height,
    margin,
    contentWidth,
    contentHeight,
    centerX: width / 2,
    centerY: height / 2,
    isMobile,
    isShort,
    header: {
      top: margin,
      bottom: margin + headerHeight,
      height: headerHeight,
    },
    focus: {
      top: focusTop,
      bottom: focusTop + focusHeight,
      height: focusHeight,
      centerY: focusTop + focusHeight / 2,
    },
    command: {
      top: height - margin - commandHeight,
      bottom: height - margin,
      height: commandHeight,
      centerY: height - margin - commandHeight / 2,
    },
    getCommandRow(count, preferredWidth = 180) {
      const gap = isMobile ? 14 : 20;
      const available = contentWidth - gap * (count - 1);
      const buttonWidth = Math.min(preferredWidth, Math.floor(available / count));
      const rowWidth = buttonWidth * count + gap * (count - 1);
      const left = (width - rowWidth) / 2;

      return {
        gap,
        left,
        right: left + rowWidth,
        buttonWidth,
        buttonHeight: isMobile ? 58 : 64,
        positions: Array.from({ length: count }, (_, index) => {
          return left + buttonWidth / 2 + index * (buttonWidth + gap);
        }),
      };
    },
  };
}
```

- [ ] **Step 4: Run the layout tests to verify they pass**

Run:

```bash
node --test test/phaser-layout.test.js
```

Expected: PASS

- [ ] **Step 5: Commit the layout contract**

Run:

```bash
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design add test/phaser-layout.test.js src/phaser/ui/layout.js
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design commit -m "test: add phaser scene layout contracts"
```

## Task 2: Build A Game-Style Shared UI Primitive Set

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js`

- [ ] **Step 1: Write the shared component API in place**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js` with:

```js
function makeText(scene, x, y, value, style) {
  return scene.add.text(x, y, value, style).setOrigin(0.5);
}

export function createBackdrop(scene, layout, options = {}) {
  const fillTop = options.fillTop ?? 0x14231d;
  const fillBottom = options.fillBottom ?? 0x09110d;
  const accent = options.accent ?? 0xd1a45c;
  const graphics = scene.add.graphics();

  graphics.fillGradientStyle(fillTop, fillTop, fillBottom, fillBottom, 1, 1, 1, 1);
  graphics.fillRect(0, 0, layout.width, layout.height);
  graphics.fillStyle(0x000000, 0.14);
  graphics.fillRect(layout.margin, layout.header.bottom + 10, layout.contentWidth, layout.focus.height);
  graphics.lineStyle(2, accent, 0.18);
  graphics.strokeRect(layout.margin, layout.margin, layout.contentWidth, layout.contentHeight);
  graphics.lineStyle(1, accent, 0.28);
  graphics.beginPath();
  graphics.moveTo(layout.margin, layout.command.top - 12);
  graphics.lineTo(layout.width - layout.margin, layout.command.top - 12);
  graphics.strokePath();

  return graphics;
}

export function createTitleLockup(scene, x, top, kicker, title, options = {}) {
  const kickerText = scene.add
    .text(x, top, kicker, {
      color: options.kickerColor ?? "#d0aa6c",
      fontFamily: options.kickerFontFamily ?? "Trebuchet MS",
      fontSize: `${options.kickerSize ?? 18}px`,
      letterSpacing: options.kickerLetterSpacing ?? 6,
    })
    .setOrigin(0.5, 0);

  const titleText = scene.add
    .text(x, kickerText.y + kickerText.height + (options.gap ?? 10), title, {
      color: options.titleColor ?? "#f5efe1",
      fontFamily: options.titleFontFamily ?? "Trebuchet MS",
      fontSize: `${options.titleSize ?? 52}px`,
      fontStyle: options.titleStyle ?? "bold",
      align: "center",
      wordWrap: options.wordWrapWidth ? { width: options.wordWrapWidth } : undefined,
    })
    .setOrigin(0.5, 0);

  return { kickerText, titleText };
}

export function createCommandButton(scene, x, y, width, height, label, onPress, options = {}) {
  const container = scene.add.container(x, y);
  const isPrimary = options.variant === "primary";
  const shadow = scene.add.rectangle(0, 7, width, height, 0x000000, 0.28).setOrigin(0.5);
  const background = scene.add
    .rectangle(0, 0, width, height, isPrimary ? 0xb47b3c : 0x1b2a24, 0.96)
    .setOrigin(0.5);
  const border = scene.add
    .rectangle(0, 0, width, height)
    .setOrigin(0.5)
    .setStrokeStyle(2, isPrimary ? 0xf0d3a1 : 0x7f987d, 0.88);
  const labelText = makeText(scene, 0, 0, label, {
    color: isPrimary ? "#16110d" : "#f3efe7",
    fontFamily: "Trebuchet MS",
    fontSize: `${options.fontSize ?? 22}px`,
    fontStyle: "bold",
    align: "center",
  });

  background.setInteractive({ useHandCursor: true });
  background.on("pointerover", () => container.setY(y - 2));
  background.on("pointerout", () => container.setY(y));
  background.on("pointerdown", () => container.setY(y + 1));
  background.on("pointerup", () => {
    container.setY(y - 1);
    onPress();
  });

  container.add([shadow, background, border, labelText]);
  return { container, background, border, labelText };
}

export function createStatusStrip(scene, x, y, width, label, value, options = {}) {
  const container = scene.add.container(x, y);
  const background = scene.add.rectangle(0, 0, width, options.height ?? 72, 0x14201b, 0.74).setOrigin(0.5);
  const border = scene.add.rectangle(0, 0, width, options.height ?? 72).setOrigin(0.5).setStrokeStyle(1, 0x7c8e73, 0.4);
  const labelText = scene.add.text(0, -14, label, {
    color: options.labelColor ?? "#9fb59f",
    fontFamily: "Trebuchet MS",
    fontSize: `${options.labelSize ?? 14}px`,
    letterSpacing: 2,
  }).setOrigin(0.5);
  const valueText = scene.add.text(0, 12, value, {
    color: options.valueColor ?? "#f5efe1",
    fontFamily: "Trebuchet MS",
    fontSize: `${options.valueSize ?? 24}px`,
    fontStyle: "bold",
    align: "center",
    wordWrap: { width: width - 20 },
  }).setOrigin(0.5);

  container.add([background, border, labelText, valueText]);
  return { container, background, border, labelText, valueText };
}
```

- [ ] **Step 2: Run the existing scene-state tests to ensure no unrelated breakage**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: PASS

- [ ] **Step 3: Run a build to verify the new primitive file compiles**

Run:

```bash
npm run build
```

Expected: PASS

- [ ] **Step 4: Commit the shared UI primitive refactor**

Run:

```bash
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design add src/phaser/ui/components.js
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design commit -m "feat: add phaser menu ui primitives"
```

## Task 3: Rebuild TitleScene Around A Title Lockup And Single Command

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`

- [ ] **Step 1: Rewrite the title scene using the new primitives**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js` with:

```js
import Phaser from "phaser";
import { cycleThemeSelection, createGameSession } from "../state/game-session.js";
import { createBackdrop, createCommandButton, createTitleLockup } from "../ui/components.js";
import { getSceneLayout } from "../ui/layout.js";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#101813");
    this.game.registry.set("session", getSession(this));
    this.renderScene();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize() {
    this.scene.restart();
  }

  renderScene() {
    const layout = getSceneLayout(this);
    createBackdrop(this, layout, { fillTop: 0x16231c, fillBottom: 0x08100c, accent: 0xd3a35d });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + (layout.isMobile ? 8 : 16),
      "CAMPAIGN FRONT",
      "Stage Command",
      {
        kickerSize: layout.isMobile ? 16 : 18,
        titleSize: layout.isMobile ? 40 : 62,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 40 : 120),
      },
    );

    this.add
      .text(
        layout.centerX,
        lockup.titleText.y + lockup.titleText.height + (layout.isMobile ? 22 : 28),
        "Survey the route. Pick the theater. Commit to battle only when the brief is clear.",
        {
          color: "#d9d1c4",
          fontFamily: "Segoe UI",
          fontSize: `${layout.isMobile ? 16 : 21}px`,
          align: "center",
          wordWrap: { width: layout.contentWidth - (layout.isMobile ? 28 : 180) },
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5, 0);

    this.add
      .text(layout.centerX, layout.focus.bottom - (layout.isMobile ? 54 : 62), "Single campaign route. Phaser-rendered front end. Battle controls remain external.", {
        color: "#8fa18f",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 13 : 15}px`,
        letterSpacing: 1,
        align: "center",
      })
      .setOrigin(0.5, 0.5);

    const commandRow = layout.getCommandRow(1, layout.isMobile ? 220 : 260);
    createCommandButton(
      this,
      commandRow.positions[0],
      layout.command.centerY,
      layout.isMobile ? 228 : 280,
      commandRow.buttonHeight + (layout.isMobile ? 2 : 6),
      "Start Campaign",
      () => {
        const nextSession = cycleThemeSelection(getSession(this), 0);
        this.game.registry.set("session", nextSession);
        this.scene.start("CampaignScene");
      },
      {
        variant: "primary",
        fontSize: layout.isMobile ? 22 : 26,
      },
    );
  }
}
```

- [ ] **Step 2: Run the scene-state tests**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: PASS

- [ ] **Step 3: Run a build to ensure the title scene compiles**

Run:

```bash
npm run build
```

Expected: PASS

- [ ] **Step 4: Commit the title scene redesign**

Run:

```bash
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design add src/phaser/scenes/TitleScene.js
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design commit -m "feat: redesign phaser title scene"
```

## Task 4: Rebuild CampaignScene Around Selection Focus

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`

- [ ] **Step 1: Rewrite the campaign scene using the new zone layout**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js` with:

```js
import Phaser from "phaser";
import { cycleThemeSelection, createGameSession, selectStage } from "../state/game-session.js";
import { createBackdrop, createCommandButton, createStatusStrip, createTitleLockup } from "../ui/components.js";
import { getSceneLayout } from "../ui/layout.js";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function hideBattleControls() {
  const controls = document.getElementById("battle-controls");
  if (controls) {
    controls.hidden = true;
  }
}

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super("CampaignScene");
  }

  create() {
    hideBattleControls();
    this.cameras.main.setBackgroundColor("#101813");
    this.renderScene();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize() {
    this.scene.restart();
  }

  renderScene() {
    const layout = getSceneLayout(this);
    const session = getSession(this);
    createBackdrop(this, layout, { fillTop: 0x12211b, fillBottom: 0x0a120e, accent: 0x7a9b84 });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      "CAMPAIGN MAP",
      session.selectedTheme ?? "No Theme",
      {
        kickerColor: "#8fb095",
        kickerSize: layout.isMobile ? 15 : 17,
        titleSize: layout.isMobile ? 34 : 52,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 28 : 180),
      },
    );

    this.add
      .text(layout.centerX, lockup.titleText.y + lockup.titleText.height + 16, `Stage ${session.selectedStage}`, {
        color: "#e3b879",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 18 : 22}px`,
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        layout.centerX,
        layout.focus.top + (layout.isMobile ? 86 : 104),
        "Rotate the campaign theater, confirm the current sector, then push forward into the briefing screen.",
        {
          color: "#d8d1c4",
          fontFamily: "Segoe UI",
          fontSize: `${layout.isMobile ? 16 : 20}px`,
          align: "center",
          wordWrap: { width: layout.contentWidth - (layout.isMobile ? 34 : 210) },
          lineSpacing: 7,
        },
      )
      .setOrigin(0.5, 0);

    const stripY = layout.focus.bottom - (layout.isMobile ? 82 : 88);
    const stripWidth = Math.min(layout.contentWidth / 2 - 12, layout.isMobile ? 148 : 220);
    createStatusStrip(this, layout.centerX - stripWidth / 2 - 8, stripY, stripWidth, "CLEARED", `${session.clearedStages.length} STAGES`, {
      labelColor: "#88a98d",
      valueSize: layout.isMobile ? 20 : 24,
    });
    createStatusStrip(this, layout.centerX + stripWidth / 2 + 8, stripY, stripWidth, "SELECTION", `STAGE ${session.selectedStage}`, {
      labelColor: "#d9af74",
      valueSize: layout.isMobile ? 20 : 24,
    });

    const commandRow = layout.getCommandRow(3, layout.isMobile ? 104 : 164);
    createCommandButton(this, commandRow.positions[0], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Prev", () => {
      const nextSession = cycleThemeSelection(getSession(this), -1);
      this.game.registry.set("session", nextSession);
      this.scene.restart();
    });

    createCommandButton(this, commandRow.positions[1], layout.command.centerY, Math.max(commandRow.buttonWidth, layout.isMobile ? 116 : 176), commandRow.buttonHeight, "Briefing", () => {
      const current = getSession(this);
      const nextSession = selectStage(current, current.selectedStage);
      this.game.registry.set("session", nextSession);
      this.scene.start("ThemeScene");
    }, {
      variant: "primary",
      fontSize: layout.isMobile ? 18 : 22,
    });

    createCommandButton(this, commandRow.positions[2], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Next", () => {
      const nextSession = cycleThemeSelection(getSession(this), 1);
      this.game.registry.set("session", nextSession);
      this.scene.restart();
    });
  }
}
```

- [ ] **Step 2: Run the session-state tests**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: PASS

- [ ] **Step 3: Run a build after the campaign scene rewrite**

Run:

```bash
npm run build
```

Expected: PASS

- [ ] **Step 4: Commit the campaign scene redesign**

Run:

```bash
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design add src/phaser/scenes/CampaignScene.js
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design commit -m "feat: redesign phaser campaign scene"
```

## Task 5: Rebuild ThemeScene As A Battle Briefing Screen

**Files:**
- Modify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`

- [ ] **Step 1: Rewrite the theme scene as a briefing surface**

Replace `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js` with:

```js
import Phaser from "phaser";
import { getStageDefinition } from "../../game/stages.js";
import { beginBattleFromSelection, createGameSession, cycleThemeSelection } from "../state/game-session.js";
import { createBackdrop, createCommandButton, createStatusStrip, createTitleLockup } from "../ui/components.js";
import { getSceneLayout } from "../ui/layout.js";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function hideBattleControls() {
  const controls = document.getElementById("battle-controls");
  if (controls) {
    controls.hidden = true;
  }
}

export class ThemeScene extends Phaser.Scene {
  constructor() {
    super("ThemeScene");
  }

  create() {
    hideBattleControls();
    this.cameras.main.setBackgroundColor("#101813");
    this.renderScene();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize() {
    this.scene.restart();
  }

  renderScene() {
    const layout = getSceneLayout(this);
    const session = getSession(this);
    const stage = getStageDefinition(session.selectedStage ?? 1);
    createBackdrop(this, layout, { fillTop: 0x161e1a, fillBottom: 0x0a100d, accent: 0xd2aa65 });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      `${stage.theme.toUpperCase()} FRONT`,
      stage.name,
      {
        kickerSize: layout.isMobile ? 15 : 17,
        titleSize: layout.isMobile ? 30 : 46,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 28 : 180),
      },
    );

    this.add
      .text(layout.centerX, lockup.titleText.y + lockup.titleText.height + 14, `Stage ${stage.number}`, {
        color: "#89a693",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 16 : 20}px`,
        letterSpacing: 4,
      })
      .setOrigin(0.5, 0);

    const summaryTop = layout.focus.top + (layout.isMobile ? 84 : 104);
    const summaryWidth = layout.contentWidth - (layout.isMobile ? 22 : 120);
    const summaryHeight = Math.min(layout.focus.height - (layout.isMobile ? 124 : 152), layout.isMobile ? 180 : 210);
    const summaryGraphics = this.add.graphics();
    summaryGraphics.fillStyle(0x14201b, 0.72);
    summaryGraphics.fillRoundedRect((layout.width - summaryWidth) / 2, summaryTop, summaryWidth, summaryHeight, 20);
    summaryGraphics.lineStyle(1, 0x7d8f7c, 0.42);
    summaryGraphics.strokeRoundedRect((layout.width - summaryWidth) / 2, summaryTop, summaryWidth, summaryHeight, 20);

    this.add
      .text(layout.centerX, summaryTop + 20, "TACTICAL BRIEF", {
        color: "#d6ae72",
        fontFamily: "Trebuchet MS",
        fontSize: `${layout.isMobile ? 15 : 17}px`,
        letterSpacing: 3,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(layout.centerX, summaryTop + 54, stage.summary, {
        color: "#ece5d7",
        fontFamily: "Segoe UI",
        fontSize: `${layout.isMobile ? 16 : 20}px`,
        align: "center",
        wordWrap: { width: summaryWidth - 42 },
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    createStatusStrip(this, layout.centerX, layout.focus.bottom - (layout.isMobile ? 84 : 90), Math.min(280, layout.contentWidth - 36), "ROUTE", "Inspect then commit", {
      labelColor: "#90aeb6",
      valueSize: layout.isMobile ? 18 : 22,
    });

    const commandRow = layout.getCommandRow(2, layout.isMobile ? 144 : 196);
    createCommandButton(this, commandRow.positions[0], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Back", () => {
      const nextSession = cycleThemeSelection(getSession(this), 0);
      this.game.registry.set("session", nextSession);
      this.scene.start("CampaignScene");
    });

    createCommandButton(this, commandRow.positions[1], layout.command.centerY, Math.max(commandRow.buttonWidth, layout.isMobile ? 158 : 220), commandRow.buttonHeight, "Enter Battle", () => {
      const nextSession = beginBattleFromSelection(getSession(this));
      this.game.registry.set("session", nextSession);
      this.scene.start("BattleScene", { stage: nextSession.activeStage ?? nextSession.selectedStage ?? 1 });
    }, {
      variant: "primary",
      fontSize: layout.isMobile ? 18 : 22,
    });
  }
}
```

- [ ] **Step 2: Run the scene-state tests**

Run:

```bash
node --test test/phaser-game-session.test.js
```

Expected: PASS

- [ ] **Step 3: Run a build after the theme scene rewrite**

Run:

```bash
npm run build
```

Expected: PASS

- [ ] **Step 4: Commit the theme scene redesign**

Run:

```bash
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design add src/phaser/scenes/ThemeScene.js
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design commit -m "feat: redesign phaser theme scene"
```

## Task 6: Verify The Redesign End-To-End

**Files:**
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\layout.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\ui\components.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\TitleScene.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\CampaignScene.js`
- Verify: `C:\Users\김만중\private\towerdefense-codex\.worktree\campaign-stage-level-design\src\phaser\scenes\ThemeScene.js`

- [ ] **Step 1: Run the full automated test suite**

Run:

```bash
npm test
```

Expected: PASS

- [ ] **Step 2: Run a production build**

Run:

```bash
npm run build
```

Expected: PASS

- [ ] **Step 3: Run the dev server for Playwright QA**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

Expected: Vite starts successfully and serves the worktree on `http://127.0.0.1:4173`.

- [ ] **Step 4: Use Playwright to validate desktop and mobile scene quality**

Check all of these:

```text
- TitleScene opens without a centered card and presents one dominant start action.
- CampaignScene visually centers the current theme and stage before any supporting progress data.
- ThemeScene reads as a tactical briefing, not a dashboard of stacked cards.
- Desktop viewport (1600x900) keeps all critical title, summary, and command UI within the initial view.
- Mobile viewport (390x844) keeps all critical title, summary, and command UI within the initial view.
- DOM battle controls remain hidden throughout TitleScene, CampaignScene, and ThemeScene.
- Transition flow remains Title -> Campaign -> Theme -> Battle.
```

- [ ] **Step 5: If visual QA required fixes, commit them; otherwise stop without an empty commit**

If files changed during QA fixes, run:

```bash
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design add src/phaser/ui/layout.js src/phaser/ui/components.js src/phaser/scenes/TitleScene.js src/phaser/scenes/CampaignScene.js src/phaser/scenes/ThemeScene.js test/phaser-layout.test.js
git -C C:/Users/김만중/private/towerdefense-codex/.worktree/campaign-stage-level-design commit -m "fix: polish phaser scene ui redesign"
```

If no files changed, do not create an empty commit.
