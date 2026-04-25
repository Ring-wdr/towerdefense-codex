# React Menu Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the title, campaign, theme, and shop screens to React while keeping battle and battle-only overlays in Phaser, preserving current copy and information structure and redesigning the React-owned surfaces in the approved arcade board-game visual direction.

**Architecture:** Keep battle logic, battle rendering, and battle overlays inside Phaser, but lift the menu layer into React. React becomes the source of truth for non-battle state (`scene`, `selectedTheme`, `selectedStage`, `metaProgress`), renders the menu screens, and launches Phaser only for battle. Phaser reports explicit returns back to the menu layer through a bridge instead of starting the retired menu scenes directly.

**Tech Stack:** React 19, Vite, Phaser 4, vanilla JavaScript ES modules, Node test runner, Playwright CLI

---

## File Structure

- Modify: `D:\tower-defense\.worktrees\react-migration\src\App.jsx`
  Responsibility: replace the temporary React shell with a real app-level screen controller that owns the menu state and conditionally mounts battle.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\app-state.js`
  Responsibility: define React-owned app state helpers, menu transitions, and battle launch/return helpers built on top of the existing pure state modules.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\screen-data.js`
  Responsibility: adapt existing stage, campaign, and shop data into React-friendly view data without changing wording or progression rules.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\BattleHost.jsx`
  Responsibility: mount Phaser only for battle and pass the battle launch payload into Phaser.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\MenuFrame.jsx`
  Responsibility: provide the shared `.impeccable` low-light tabletop framing for React-owned menu screens.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\TitleScreen.jsx`
  Responsibility: React replacement for `TitleScene`.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\CampaignScreen.jsx`
  Responsibility: React replacement for `CampaignScene`.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\ThemeScreen.jsx`
  Responsibility: React replacement for `ThemeScene`.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\ShopScreen.jsx`
  Responsibility: React replacement for `ShopScene`.
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\menu-shell.css`
  Responsibility: define the React-owned visual system and responsive layout without disturbing battle-only styling.
- Modify: `D:\tower-defense\.worktrees\react-migration\src\PhaserGame.jsx`
  Responsibility: accept battle launch payloads and a React bridge callback instead of eagerly booting Phaser on every app load.
- Modify: `D:\tower-defense\.worktrees\react-migration\src\game\main.js`
  Responsibility: allow Phaser boot to receive explicit initial session, meta progress, and UI bridge callbacks from React.
- Modify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\BattleScene.js`
  Responsibility: boot from the React-supplied launch payload and return to React instead of starting retired menu scenes.
- Modify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\OverlayScene.js`
  Responsibility: keep battle overlays in Phaser but route “Back” / “Campaign” exits through the React bridge.
- Modify: `D:\tower-defense\.worktrees\react-migration\test\ui-shell.test.js`
  Responsibility: assert that menu screens are React-owned and battle is the only Phaser-mounted route.
- Modify: `D:\tower-defense\.worktrees\react-migration\test\code-splitting.test.js`
  Responsibility: keep the “battle-only Phaser mount” contract covered.
- Create: `D:\tower-defense\.worktrees\react-migration\test\react-menu-shell.test.js`
  Responsibility: source-based tests for React menu routing, screen ownership, and battle launch payload wiring.
- Modify: `D:\tower-defense\.worktrees\react-migration\README.md`
  Responsibility: describe the final React-menu / Phaser-battle split accurately.

## Task 1: Lock In The React-Owned Menu Boundary

**Files:**
- Create: `D:\tower-defense\.worktrees\react-migration\test\react-menu-shell.test.js`
- Modify: `D:\tower-defense\.worktrees\react-migration\test\ui-shell.test.js`
- Modify: `D:\tower-defense\.worktrees\react-migration\test\code-splitting.test.js`

- [ ] **Step 1: Write a failing test for React-owned menu routing**

Create `D:\tower-defense\.worktrees\react-migration\test\react-menu-shell.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const appStateSource = readFileSync(new URL("../src/app/app-state.js", import.meta.url), "utf8");
const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");

test("app shell renders React-owned menu screens and mounts battle through BattleHost only", () => {
  assert.match(appSource, /TitleScreen/);
  assert.match(appSource, /CampaignScreen/);
  assert.match(appSource, /ThemeScreen/);
  assert.match(appSource, /ShopScreen/);
  assert.match(appSource, /BattleHost/);
  assert.doesNotMatch(appSource, /<PhaserGame/);
});

test("app state keeps React as the source of truth for non-battle screens", () => {
  assert.match(appStateSource, /export function createAppState/);
  assert.match(appStateSource, /scene:\s*"title"/);
  assert.match(appStateSource, /metaProgress:/);
  assert.match(appStateSource, /selectedTheme:/);
  assert.match(appStateSource, /selectedStage:/);
});

test("battle host passes launch payload and exit callbacks into Phaser", () => {
  assert.match(battleHostSource, /launchPayload/);
  assert.match(battleHostSource, /onExitToMenu/);
  assert.match(battleHostSource, /PhaserGame/);
});
```

- [ ] **Step 2: Retarget the existing shell tests to the final ownership model**

Update `D:\tower-defense\.worktrees\react-migration\test\ui-shell.test.js` so it also asserts:

```js
test("app shell keeps battle controls hidden outside battle and exposes React menu screens", () => {
  assert.match(appSource, /TitleScreen/);
  assert.match(appSource, /CampaignScreen/);
  assert.match(appSource, /ThemeScreen/);
  assert.match(appSource, /ShopScreen/);
  assert.match(appSource, /scene === "battle"/);
  assert.match(appSource, /battle-controls/);
});
```

- [ ] **Step 3: Update the code-splitting contract so Phaser is battle-only**

Extend `D:\tower-defense\.worktrees\react-migration\test\code-splitting.test.js` with:

```js
test("battle host is the only component that reaches for the Phaser bridge", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const battleHostSource = readFileSync(new URL("../src/app/BattleHost.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(appSource, /from ["']\.\/PhaserGame\.jsx["']/);
  assert.match(battleHostSource, /from ["']\.\.\/PhaserGame\.jsx["']/);
});
```

- [ ] **Step 4: Run the focused tests and verify they fail for the right reason**

Run:

```powershell
node --test test/react-menu-shell.test.js test/ui-shell.test.js test/code-splitting.test.js
```

Expected: FAIL because the React menu files and battle-only ownership model do not exist yet.

- [ ] **Step 5: Commit the failing test baseline**

Run:

```powershell
git add test/react-menu-shell.test.js test/ui-shell.test.js test/code-splitting.test.js
git commit -m "test: lock in react-owned menu boundary"
```

## Task 2: Lift Menu State Into React

**Files:**
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\app-state.js`
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\screen-data.js`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\App.jsx`

- [ ] **Step 1: Add the React-owned app state helper**

Create `D:\tower-defense\.worktrees\react-migration\src\app\app-state.js` with:

```js
import {
  beginBattleFromSelection,
  beginEndlessBattle,
  createGameSession,
  cycleThemeSelection,
  openShop,
  returnToCampaign,
  returnToTitle,
  selectStage,
} from "../phaser/state/game-session.js";
import { createMetaProgress, normalizeMetaProgress } from "../game/meta-progress.js";

export function createAppState() {
  const session = createGameSession();

  return {
    scene: session.scene,
    session,
    metaProgress: createMetaProgress(),
    battleLaunch: null,
  };
}

export function hydrateAppState(session, metaProgress) {
  return {
    scene: session.scene,
    session,
    metaProgress: normalizeMetaProgress(metaProgress),
    battleLaunch: null,
  };
}

export function openCampaign(appState) {
  const session = cycleThemeSelection(appState.session, 0);
  return { ...appState, scene: "campaign", session };
}

export function openTheme(appState, stageNumber) {
  const session = selectStage(appState.session, stageNumber);
  return { ...appState, scene: "theme", session };
}

export function openShopScreen(appState) {
  const session = openShop(appState.session);
  return { ...appState, scene: "shop", session };
}

export function launchBattle(appState) {
  const session = beginBattleFromSelection(appState.session);
  return {
    ...appState,
    scene: "battle",
    session,
    battleLaunch: {
      session,
      metaProgress: appState.metaProgress,
      mode: session.battleMode ?? "campaign",
      stage: session.activeStage ?? session.selectedStage,
    },
  };
}

export function launchEndless(appState) {
  const session = beginEndlessBattle(appState.session, appState.metaProgress);
  return {
    ...appState,
    scene: "battle",
    session,
    battleLaunch: {
      session,
      metaProgress: appState.metaProgress,
      mode: "endless",
      stage: session.activeStage ?? session.selectedStage,
    },
  };
}

export function returnFromBattle(appState, session) {
  const nextSession = session.scene === "title"
    ? returnToTitle(session)
    : session.scene === "campaign"
      ? returnToCampaign(session)
      : session;

  return {
    ...appState,
    scene: nextSession.scene,
    session: nextSession,
    battleLaunch: null,
  };
}
```

- [ ] **Step 2: Add screen-data adapters so React reuses the current game data and wording**

Create `D:\tower-defense\.worktrees\react-migration\src\app\screen-data.js` with:

```js
import { isStageUnlocked } from "../game/campaign-progress.js";
import { META_SHOP_CATALOG } from "../game/meta-shop.js";
import { getStageDefinition, getStageCount, getThemeOrder, getThemeStageNumbers } from "../game/stages.js";
import { getShopEntryState } from "../phaser/scenes/ShopScene.js";

export function getTitleScreenData(session, metaProgress) {
  return {
    isEndlessUnlocked: metaProgress.highestClearedStage >= getStageCount(),
    helperCopy: "단일 캠페인 루트. 각 전선은 순차적으로 개방된다.",
    session,
  };
}

export function getCampaignScreenData(session) {
  return getThemeOrder().map((theme) => {
    const stageNumbers = getThemeStageNumbers(theme);
    return {
      theme,
      stageNumbers,
      selected: session.selectedTheme === theme,
      clearedCount: stageNumbers.filter((stageNumber) => session.clearedStages.includes(stageNumber)).length,
      previewStage: getStageDefinition(stageNumbers[0]),
    };
  });
}

export function getThemeScreenData(session) {
  const stage = getStageDefinition(session.selectedStage);
  return {
    stage,
    stageNumbers: getThemeStageNumbers(stage.theme).map((stageNumber) => {
      const definition = getStageDefinition(stageNumber);
      return {
        stage: definition,
        locked: !isStageUnlocked(session, stageNumber),
        selected: stageNumber === session.selectedStage,
      };
    }),
  };
}

export function getShopScreenData(metaProgress) {
  return META_SHOP_CATALOG.map((entry) => ({
    entry,
    summary: getShopEntryState(metaProgress, entry),
  }));
}
```

- [ ] **Step 3: Rewrite `App.jsx` to own the top-level menu state**

Replace the top of `D:\tower-defense\.worktrees\react-migration\src\App.jsx` with:

```jsx
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, createIcons } from "lucide";
import { loadMetaProgress, saveMetaProgress } from "./game/meta-progress.js";
import { createAppState, hydrateAppState, launchBattle, launchEndless, openCampaign, openShopScreen, openTheme, returnFromBattle } from "./app/app-state.js";
import { getCampaignScreenData, getShopScreenData, getThemeScreenData, getTitleScreenData } from "./app/screen-data.js";
import BattleHost from "./app/BattleHost.jsx";
import TitleScreen from "./app/components/TitleScreen.jsx";
import CampaignScreen from "./app/components/CampaignScreen.jsx";
import ThemeScreen from "./app/components/ThemeScreen.jsx";
import ShopScreen from "./app/components/ShopScreen.jsx";
import "./app/menu-shell.css";
```

Then initialize state like:

```jsx
const [appState, setAppState] = useState(() => hydrateAppState(createAppState().session, loadMetaProgress()));
```

- [ ] **Step 4: Wire top-level screen selection without changing battle controls**

In `D:\tower-defense\.worktrees\react-migration\src\App.jsx`, replace the direct `<PhaserGame />` render with:

```jsx
const titleData = useMemo(() => getTitleScreenData(appState.session, appState.metaProgress), [appState]);
const campaignData = useMemo(() => getCampaignScreenData(appState.session), [appState.session]);
const themeData = useMemo(() => getThemeScreenData(appState.session), [appState.session]);
const shopData = useMemo(() => getShopScreenData(appState.metaProgress), [appState.metaProgress]);
```

and:

```jsx
{appState.scene === "title" && (
  <TitleScreen
    data={titleData}
    onStartCampaign={() => setAppState((current) => openCampaign(current))}
    onOpenShop={() => setAppState((current) => openShopScreen(current))}
    onStartEndless={() => setAppState((current) => launchEndless(current))}
  />
)}
{appState.scene === "campaign" && (
  <CampaignScreen
    data={campaignData}
    session={appState.session}
    onBack={() => setAppState((current) => ({ ...current, scene: "title", session: returnToTitle(current.session) }))}
    onSelectStage={(stageNumber) => setAppState((current) => openTheme(current, stageNumber))}
  />
)}
{appState.scene === "theme" && (
  <ThemeScreen
    data={themeData}
    onBack={() => setAppState((current) => ({ ...current, scene: "campaign", session: returnToCampaign(current.session) }))}
    onSelectStage={(stageNumber) => setAppState((current) => openTheme(current, stageNumber))}
    onEnterBattle={() => setAppState((current) => launchBattle(current))}
  />
)}
{appState.scene === "shop" && (
  <ShopScreen
    data={shopData}
    metaProgress={appState.metaProgress}
    onBack={() => setAppState((current) => ({ ...current, scene: "title", session: returnToTitle(current.session) }))}
    onPurchase={(nextProgress) => {
      const saved = saveMetaProgress(nextProgress);
      setAppState((current) => ({ ...current, metaProgress: saved }));
    }}
  />
)}
{appState.scene === "battle" && (
  <BattleHost
    launchPayload={appState.battleLaunch}
    onExitToMenu={(session, metaProgress) => {
      const saved = saveMetaProgress(metaProgress);
      setAppState((current) => returnFromBattle({ ...current, metaProgress: saved }, session));
    }}
  />
)}
```

- [ ] **Step 5: Run the focused routing tests and verify they pass**

Run:

```powershell
node --test test/react-menu-shell.test.js test/ui-shell.test.js test/code-splitting.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit the React app-state foundation**

Run:

```powershell
git add src/App.jsx src/app/app-state.js src/app/screen-data.js
git commit -m "feat: lift menu state into react"
```

## Task 3: Build The Shared React Menu Design System

**Files:**
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\MenuFrame.jsx`
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\menu-shell.css`

- [ ] **Step 1: Add the shared menu frame component**

Create `D:\tower-defense\.worktrees\react-migration\src\app\components\MenuFrame.jsx` with:

```jsx
export default function MenuFrame({ kicker, title, children, tone = "olive", actions = null }) {
  return (
    <section className={`menu-frame menu-frame--${tone}`}>
      <div className="menu-frame__backdrop" aria-hidden="true" />
      <header className="menu-frame__header">
        <p className="menu-frame__kicker">{kicker}</p>
        <h1 className="menu-frame__title">{title}</h1>
      </header>
      <div className="menu-frame__body">{children}</div>
      {actions ? <footer className="menu-frame__actions">{actions}</footer> : null}
    </section>
  );
}
```

- [ ] **Step 2: Add the approved `.impeccable` visual system**

Create `D:\tower-defense\.worktrees\react-migration\src\app\menu-shell.css` with:

```css
:root {
  --menu-bg-top: #0f1612;
  --menu-bg-bottom: #050806;
  --menu-panel: rgba(19, 27, 22, 0.92);
  --menu-panel-strong: rgba(26, 35, 29, 0.96);
  --menu-line: rgba(255, 240, 214, 0.18);
  --menu-text: #f3ecde;
  --menu-muted: #b6b19f;
  --menu-olive: #8fb095;
  --menu-amber: #d6ae72;
  --menu-blue: #89a7cf;
  --menu-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.app-root {
  min-height: 100vh;
  position: relative;
}

.menu-frame {
  position: relative;
  min-height: 100vh;
  padding: 28px 22px 132px;
  color: var(--menu-text);
  background:
    radial-gradient(circle at top, rgba(214, 174, 114, 0.15), transparent 28%),
    linear-gradient(180deg, var(--menu-bg-top), var(--menu-bg-bottom));
}

.menu-frame__header,
.menu-frame__body,
.menu-frame__actions {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.menu-frame__kicker {
  margin: 0 0 10px;
  color: var(--menu-amber);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font: 700 0.95rem/1 "Barlow Condensed", sans-serif;
}

.menu-frame__title {
  margin: 0;
  font: 700 clamp(2.8rem, 7vw, 4.8rem)/0.95 "Black Ops One", system-ui;
  text-transform: uppercase;
}

.menu-card {
  background: var(--menu-panel);
  border: 1px solid var(--menu-line);
  box-shadow: var(--menu-shadow);
  border-radius: 22px;
}

.menu-button {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(180deg, rgba(214, 174, 114, 0.28), rgba(111, 74, 35, 0.78));
  color: var(--menu-text);
  border-radius: 999px;
  min-height: 52px;
  padding: 0 22px;
  font: 700 1rem/1 "Barlow Condensed", sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .menu-frame {
    padding: 22px 16px 128px;
  }
}
```

- [ ] **Step 3: Run a build to confirm the new CSS enters cleanly**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit the shared React menu style system**

Run:

```powershell
git add src/app/components/MenuFrame.jsx src/app/menu-shell.css
git commit -m "feat: add react menu design system"
```

## Task 4: Implement React Title, Campaign, And Theme Screens

**Files:**
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\TitleScreen.jsx`
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\CampaignScreen.jsx`
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\ThemeScreen.jsx`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\App.jsx`

- [ ] **Step 1: Create the title screen**

Create `D:\tower-defense\.worktrees\react-migration\src\app\components\TitleScreen.jsx` with:

```jsx
import MenuFrame from "./MenuFrame.jsx";

export default function TitleScreen({ data, onStartCampaign, onOpenShop, onStartEndless }) {
  return (
    <MenuFrame
      kicker="Campaign Front"
      title="Stage Command"
      tone="olive"
      actions={
        <>
          <button className="menu-button" type="button" onClick={onStartCampaign}>Start Campaign</button>
          <button className="menu-button" type="button" onClick={onOpenShop}>Shop</button>
          {data.isEndlessUnlocked ? (
            <button className="menu-button" type="button" onClick={onStartEndless}>Endless Mode</button>
          ) : null}
        </>
      }
    >
      <article className="menu-card title-briefing">
        <p>{data.helperCopy}</p>
      </article>
    </MenuFrame>
  );
}
```

- [ ] **Step 2: Create the campaign screen**

Create `D:\tower-defense\.worktrees\react-migration\src\app\components\CampaignScreen.jsx` with:

```jsx
import MenuFrame from "./MenuFrame.jsx";

export default function CampaignScreen({ data, onBack, onSelectStage }) {
  return (
    <MenuFrame
      kicker="Campaign Map"
      title="Active Fronts"
      tone="amber"
      actions={<button className="menu-button" type="button" onClick={onBack}>Back</button>}
    >
      <section className="campaign-grid">
        {data.map((theme) => (
          <button
            key={theme.theme}
            className={`menu-card campaign-card${theme.selected ? " is-selected" : ""}`}
            type="button"
            onClick={() => onSelectStage(theme.previewStage.number)}
          >
            <p className="campaign-card__kicker">{theme.previewStage.theme}</p>
            <h2>{theme.previewStage.name}</h2>
            <p>{theme.clearedCount}/{theme.stageNumbers.length} cleared</p>
          </button>
        ))}
      </section>
    </MenuFrame>
  );
}
```

- [ ] **Step 3: Create the theme screen**

Create `D:\tower-defense\.worktrees\react-migration\src\app\components\ThemeScreen.jsx` with:

```jsx
import MenuFrame from "./MenuFrame.jsx";

export default function ThemeScreen({ data, onBack, onSelectStage, onEnterBattle }) {
  return (
    <MenuFrame
      kicker={`${data.stage.theme} 전선`}
      title={data.stage.name}
      tone="blue"
      actions={
        <>
          <button className="menu-button" type="button" onClick={onBack}>Back</button>
          <button className="menu-button" type="button" onClick={onEnterBattle}>Enter Battle</button>
        </>
      }
    >
      <article className="menu-card theme-briefing">
        <p>Stage {data.stage.number}</p>
        <p>{data.stage.summary}</p>
      </article>
      <section className="theme-stage-list">
        {data.stageNumbers.map(({ stage, locked, selected }) => (
          <button
            key={stage.number}
            className={`menu-card theme-stage-node${selected ? " is-selected" : ""}`}
            type="button"
            onClick={() => !locked && onSelectStage(stage.number)}
            disabled={locked}
          >
            <p>STAGE {stage.number}</p>
            <h2>{stage.name}</h2>
            <p>{locked ? "LOCKED" : selected ? "SELECTED" : "READY"}</p>
          </button>
        ))}
      </section>
    </MenuFrame>
  );
}
```

- [ ] **Step 4: Add matching layout rules for these screens**

Append to `D:\tower-defense\.worktrees\react-migration\src\app\menu-shell.css`:

```css
.campaign-grid,
.theme-stage-list {
  display: grid;
  gap: 18px;
}

.campaign-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.campaign-card,
.theme-stage-node,
.title-briefing,
.theme-briefing {
  padding: 20px;
  text-align: left;
}

.campaign-card.is-selected,
.theme-stage-node.is-selected {
  outline: 2px solid rgba(214, 174, 114, 0.5);
}

@media (max-width: 900px) {
  .campaign-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run the focused tests and a Playwright smoke pass on title -> campaign -> theme**

Run:

```powershell
node --test test/react-menu-shell.test.js test/ui-shell.test.js test/code-splitting.test.js
```

Then:

```powershell
npm run dev -- --host 127.0.0.1 --port 4175
```

And in Playwright:

```powershell
npx --yes --package @playwright/cli playwright-cli --session td-react-menu open http://127.0.0.1:4175 --headed
npx --yes --package @playwright/cli playwright-cli --session td-react-menu snapshot
```

Expected: Title, campaign, and theme are React-rendered, preserve current wording, and no Phaser menu scene is required to see them.

- [ ] **Step 6: Commit the React title/campaign/theme screens**

Run:

```powershell
git add src/app/components/TitleScreen.jsx src/app/components/CampaignScreen.jsx src/app/components/ThemeScreen.jsx src/app/menu-shell.css src/App.jsx
git commit -m "feat: move title campaign and theme to react"
```

## Task 5: Implement The React Shop Screen

**Files:**
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\components\ShopScreen.jsx`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\App.jsx`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\app\menu-shell.css`

- [ ] **Step 1: Create the React shop screen**

Create `D:\tower-defense\.worktrees\react-migration\src\app\components\ShopScreen.jsx` with:

```jsx
import { purchaseUpgrade } from "../../game/meta-shop.js";
import MenuFrame from "./MenuFrame.jsx";

export default function ShopScreen({ data, metaProgress, onBack, onPurchase }) {
  return (
    <MenuFrame
      kicker="Meta Shop"
      title="Field Arsenal"
      tone="amber"
      actions={<button className="menu-button" type="button" onClick={onBack}>Back</button>}
    >
      <article className="menu-card shop-status">
        <p>CURRENCY {metaProgress.currency} G</p>
        <p>CLEARED STAGE {metaProgress.highestClearedStage}</p>
        <p>영구 보급을 정비해 다음 전투의 기본 전력을 끌어올린다.</p>
      </article>
      <section className="shop-grid">
        {data.map(({ entry, summary }) => (
          <article key={entry.id} className="menu-card shop-card">
            <p>{entry.label}</p>
            <h2>Lv {summary.currentLevel}/{entry.maxLevel}</h2>
            <p>{summary.detailLabel}</p>
            <button
              className="menu-button"
              type="button"
              disabled={!summary.isPurchaseEnabled}
              onClick={() => {
                if (!summary.isPurchaseEnabled) {
                  return;
                }

                onPurchase(purchaseUpgrade(metaProgress, entry.id));
              }}
            >
              {summary.buttonLabel}
            </button>
          </article>
        ))}
      </section>
    </MenuFrame>
  );
}
```

- [ ] **Step 2: Add shop-specific responsive layout rules**

Append to `D:\tower-defense\.worktrees\react-migration\src\app\menu-shell.css`:

```css
.shop-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.shop-card,
.shop-status {
  padding: 18px;
}

@media (max-width: 900px) {
  .shop-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Run the focused tests and verify shop wiring**

Run:

```powershell
node --test test/react-menu-shell.test.js test/ui-shell.test.js
```

Expected: PASS.

- [ ] **Step 4: Commit the React shop screen**

Run:

```powershell
git add src/app/components/ShopScreen.jsx src/app/menu-shell.css src/App.jsx
git commit -m "feat: move shop to react"
```

## Task 6: Lock Battle To A React-Driven Launch And Return Boundary

**Files:**
- Create: `D:\tower-defense\.worktrees\react-migration\src\app\BattleHost.jsx`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\PhaserGame.jsx`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\game\main.js`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\BattleScene.js`
- Modify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\OverlayScene.js`

- [ ] **Step 1: Add the battle host wrapper**

Create `D:\tower-defense\.worktrees\react-migration\src\app\BattleHost.jsx` with:

```jsx
import PhaserGame from "../PhaserGame.jsx";

export default function BattleHost({ launchPayload, onExitToMenu }) {
  return (
    <PhaserGame
      launchPayload={launchPayload}
      onExitToMenu={onExitToMenu}
    />
  );
}
```

- [ ] **Step 2: Update the Phaser bridge to boot lazily from a launch payload**

Replace `D:\tower-defense\.worktrees\react-migration\src\PhaserGame.jsx` with:

```jsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const PhaserGame = forwardRef(function PhaserGame({ launchPayload, onExitToMenu }, ref) {
  const gameContainer = useRef(null);
  const gameRef = useRef(null);

  useImperativeHandle(ref, () => ({ get game() { return gameRef.current; } }), []);

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
        onExitToMenu,
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
  }, [launchPayload, onExitToMenu]);

  return <div id="game-root" className="game-root" aria-label="Tower defense game" ref={gameContainer} />;
});

export default PhaserGame;
```

- [ ] **Step 3: Allow `startGame` to accept launch payload and UI bridge callbacks**

Replace `D:\tower-defense\.worktrees\react-migration\src\game\main.js` with:

```js
import { createGame } from "../phaser/game.js";
import { createGameSession } from "../phaser/state/game-session.js";
import { loadMetaProgress } from "./meta-progress.js";

export default function startGame(parent, options = {}) {
  const mountNode = typeof parent === "string" ? document.getElementById(parent) : parent;

  if (!mountNode) {
    throw new Error("Missing #game-root mount for Phaser bootstrap.");
  }

  const game = createGame(mountNode);
  const launchPayload = options.launchPayload ?? null;
  const session = launchPayload?.session ?? createGameSession();
  const metaProgress = launchPayload?.metaProgress ?? loadMetaProgress();

  game.registry.set("session", session);
  game.registry.set("metaProgress", metaProgress);
  game.registry.set("uiBridge", {
    onExitToMenu: options.onExitToMenu ?? null,
  });

  return game;
}
```

- [ ] **Step 4: Route battle exits through the React bridge instead of menu scenes**

In `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\BattleScene.js`, add:

```js
function getUiBridge(scene) {
  return scene.game.registry.get("uiBridge") ?? { onExitToMenu: null };
}
```

and:

```js
exitToMenu(nextSession) {
  const bridge = getUiBridge(this);
  const metaProgress = this.game.registry.get("metaProgress") ?? loadMetaProgress();

  if (typeof bridge.onExitToMenu === "function") {
    bridge.onExitToMenu(nextSession, metaProgress);
    return;
  }
}
```

Then replace battle-to-menu transitions that currently start `ThemeScene` or `TitleScene` with `this.exitToMenu(nextSession)`.

- [ ] **Step 5: Update battle overlays so “Back” and “Campaign” also return through React**

In `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\OverlayScene.js`, replace:

```js
this.scene.start(isEndless ? "TitleScene" : "ThemeScene");
```

with:

```js
const battle = this.scene.get("BattleScene");
battle.exitToMenu(getSession(this));
this.scene.stop("BattleScene");
this.scene.stop();
```

and replace:

```js
this.game.registry.set("session", returnToCampaign(getSession(this)));
this.scene.start("CampaignScene");
```

with:

```js
const nextSession = returnToCampaign(getSession(this));
this.game.registry.set("session", nextSession);
const battle = this.scene.get("BattleScene");
battle.exitToMenu(nextSession);
this.scene.stop("BattleScene");
this.scene.stop();
```

- [ ] **Step 6: Run the full automated test suite**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit the battle boundary changes**

Run:

```powershell
git add src/app/BattleHost.jsx src/PhaserGame.jsx src/game/main.js src/phaser/scenes/BattleScene.js src/phaser/scenes/OverlayScene.js src/App.jsx
git commit -m "feat: make battle a react-launched phaser boundary"
```

## Task 7: Clean Up Legacy Menu-Scene Dependencies And Verify End-To-End

**Files:**
- Modify: `D:\tower-defense\.worktrees\react-migration\README.md`
- Verify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\TitleScene.js`
- Verify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\CampaignScene.js`
- Verify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\ThemeScene.js`
- Verify: `D:\tower-defense\.worktrees\react-migration\src\phaser\scenes\ShopScene.js`

- [ ] **Step 1: Remove stale assumptions from the README**

Update `D:\tower-defense\.worktrees\react-migration\README.md` so it says:

```md
React owns the title, campaign, theme, and shop screens.
Phaser owns battle and battle-only overlays.
```

- [ ] **Step 2: Audit legacy menu scenes so they are no longer on the user-facing path**

Run:

```powershell
rg -n "TitleScene|CampaignScene|ThemeScene|ShopScene" src\App.jsx src\app src\phaser\scenes\BattleScene.js src\phaser\scenes\OverlayScene.js
```

Expected: React owns menu routing; any remaining references to those scenes are either transitional or removable.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run Playwright desktop verification**

Run:

```powershell
npm run dev -- --host 127.0.0.1 --port 4176
npx --yes --package @playwright/cli playwright-cli --session td-react-menus open http://127.0.0.1:4176 --headed
npx --yes --package @playwright/cli playwright-cli --session td-react-menus resize 1600 900
npx --yes --package @playwright/cli playwright-cli --session td-react-menus snapshot
```

Verify:

```text
- Title is React-rendered and preserves current wording.
- Campaign is React-rendered and preserves current theme/stage information.
- Theme is React-rendered and preserves current stage briefing structure.
- Shop is React-rendered and preserves current item labels and costs.
- Phaser is not mounted until entering battle.
```

- [ ] **Step 5: Run Playwright battle verification**

Continue in the same session and verify:

```text
- Entering battle mounts Phaser once.
- Battle controls appear only in battle.
- Pause, draft, defeat, victory, and campaign-complete overlays remain Phaser-managed.
- Leaving battle returns control to the correct React-owned menu screen.
```

Capture screenshots:

```powershell
npx --yes --package @playwright/cli playwright-cli --session td-react-menus screenshot
npx --yes --package @playwright/cli playwright-cli --session td-react-menus resize 390 844
npx --yes --package @playwright/cli playwright-cli --session td-react-menus screenshot
```

- [ ] **Step 6: Commit any final parity fixes**

If files changed during QA fixes, run:

```powershell
git add README.md src/App.jsx src/app src/PhaserGame.jsx src/game/main.js src/phaser/scenes/BattleScene.js src/phaser/scenes/OverlayScene.js test/react-menu-shell.test.js test/ui-shell.test.js test/code-splitting.test.js
git commit -m "fix: polish react menu migration"
```

If no files changed, do not create an empty commit.

## Self-Review

- Spec coverage: the plan covers React menu ownership, Phaser battle isolation, preserved wording and structure, visual redesign constraints, and Playwright verification.
- Placeholder scan: there are no `TBD`, `TODO`, or deferred implementation placeholders in the task steps.
- Type consistency: all new UI files remain JavaScript/JSX to match the current repo and avoid combining this migration with a TypeScript conversion.
