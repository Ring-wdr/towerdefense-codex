# Vite Code Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an async Phaser bootstrap boundary and explicit Vite chunk rules so the production bundle is split more effectively.

**Architecture:** Keep `index.html` as the single entrypoint, but move the heavy game startup path into a lazily imported bootstrap module. Use `vite.config.js` to normalize chunk grouping for Phaser and third-party dependencies while leaving gameplay code structure intact.

**Tech Stack:** Vite 7, Rollup output chunking, native ESM, Node test runner

---

### Task 1: Lock in the async entrypoint contract

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\test\code-splitting.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

test("main entry bootstraps the phaser runtime through a lazy boundary", () => {
  assert.match(mainSource, /bootstrapGame\(\)/);
  assert.match(mainSource, /import\("\.\/bootstrap\/game-bootstrap\.js"\)/);
  assert.doesNotMatch(mainSource, /from "\.\/phaser\/game\.js"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/code-splitting.test.js`
Expected: FAIL because `src/main.js` still statically imports `./phaser/game.js`.

- [ ] **Step 3: Write minimal implementation**

```js
export async function bootstrapGame() {
  const [{ createGame }, { createGameSession }] = await Promise.all([
    import("../phaser/game.js"),
    import("../phaser/state/game-session.js"),
  ]);

  const root = document.getElementById("game-root");
  if (!root) {
    throw new Error("Missing #game-root mount for Phaser bootstrap.");
  }

  const game = createGame(root);
  game.registry.set("session", createGameSession());
  return game;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/code-splitting.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/code-splitting.test.js src/main.js src/bootstrap/game-bootstrap.js
git commit -m "build: lazy-load phaser bootstrap"
```

### Task 2: Add explicit Vite chunk rules

**Files:**
- Create: `C:\Users\김만중\private\towerdefense-codex\vite.config.js`
- Modify: `C:\Users\김만중\private\towerdefense-codex\src\main.js`
- Test: `C:\Users\김만중\private\towerdefense-codex\test\code-splitting.test.js`

- [ ] **Step 1: Extend the failing test**

```js
const viteConfigSource = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");

test("vite build config defines stable phaser and vendor chunks", () => {
  assert.match(viteConfigSource, /defineConfig/);
  assert.match(viteConfigSource, /manualChunks/);
  assert.match(viteConfigSource, /node_modules\/phaser/);
  assert.match(viteConfigSource, /return "phaser"/);
  assert.match(viteConfigSource, /return "vendor"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/code-splitting.test.js`
Expected: FAIL because `vite.config.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\\\", "/");
          if (normalizedId.includes("node_modules/phaser")) {
            return "phaser";
          }
          if (normalizedId.includes("node_modules")) {
            return "vendor";
          }
          if (normalizedId.includes("/src/phaser/") || normalizedId.includes("/src/game/")) {
            return "game-runtime";
          }
        },
      },
    },
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/code-splitting.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add vite.config.js test/code-splitting.test.js src/main.js src/bootstrap/game-bootstrap.js
git commit -m "build: configure vite chunk splitting"
```

### Task 3: Verify behavior end-to-end

**Files:**
- Test: `C:\Users\김만중\private\towerdefense-codex\test\code-splitting.test.js`

- [ ] **Step 1: Run targeted regression tests**

Run: `node --test test/code-splitting.test.js`
Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: PASS and emitted output contains multiple JS chunks instead of a single entry bundle.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-20-vite-code-splitting-design.md docs/superpowers/plans/2026-04-20-vite-code-splitting.md test/code-splitting.test.js src/main.js src/bootstrap/game-bootstrap.js vite.config.js
git commit -m "build: split phaser runtime with vite"
```
