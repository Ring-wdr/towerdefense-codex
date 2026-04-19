# Mobile Compact Control Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the mobile control pad always available on short viewports while reclaiming more vertical space for the board.

**Architecture:** Treat the change as a responsive UI refinement centered in `styles.css`, with one small `src/main.js` text-formatting adjustment for the mobile summary line. Add a height-sensitive mobile layout mode that compresses dock density without hiding controls or changing gameplay logic.

**Tech Stack:** Vite, vanilla HTML, vanilla CSS, ES modules, Node test runner

---

## File Structure

- Modify: `D:\tower-defense\styles.css`
  Responsibility: add short-height mobile rules for the dock, compress spacing and control sizing, and preserve board visibility.
- Modify: `D:\tower-defense\src\main.js`
  Responsibility: provide a compact mobile summary string instead of the current long descriptive sentence.
- Verify: `D:\tower-defense\index.html`
  Responsibility: confirm existing dock structure is sufficient and does not need markup changes.

### Task 1: Confirm Responsive Targets And Compact Summary Hook

**Files:**
- Verify: `D:\tower-defense\index.html`
- Modify: `D:\tower-defense\src\main.js`

- [ ] **Step 1: Confirm the existing dock markup supports a styling-only compact mode**

Read these existing nodes and keep them unchanged:

```html
<section class="control-dock control-dock--hybrid" aria-label="Quick play controls">
  <div class="dock-section">
    <div class="dock-header">
      <p class="dock-label">Pick Tower</p>
      <p class="dock-selection-summary" data-selection-summary></p>
    </div>
    <div class="tower-grid tower-grid--dock" id="tower-buttons-dock">
```

Expected: no new HTML elements are required because the dock already has separate summary, tower, pad, and action regions.

- [ ] **Step 2: Introduce a compact summary formatter for mobile**

In `src/main.js`, replace the current `selectionText` assignment with a split between full and compact forms:

```js
  const selectionText = `${definition.name} tower costs ${definition.cost}. Best vs ${definition.counters}. ${definition.description} ${canBuild ? "Build ready." : "Build blocked."}${upgradeNote}`;
  const compactSelectionText = `${definition.name} • ${definition.cost}G • ${canBuild ? "Ready" : "Blocked"}${tower ? ` • Lv.${tower.level}` : ""}`;
```

Then update the summary loop to send the compact text only to dock summaries:

```js
  for (const summary of selectionSummaries) {
    const isDockSummary = summary.classList.contains("dock-selection-summary");
    summary.textContent = isDockSummary ? compactSelectionText : selectionText;
  }
```

- [ ] **Step 3: Run a focused diff check on `src/main.js`**

Run:

```bash
git diff -- src/main.js
```

Expected: only the summary text generation and assignment loop change.

- [ ] **Step 4: Commit the compact text preparation**

Run:

```bash
git add src/main.js
git commit -m "feat: add compact mobile control summary"
```

### Task 2: Add Short-Height Mobile Mode For The Dock

**Files:**
- Modify: `D:\tower-defense\styles.css`

- [ ] **Step 1: Add a short-height mobile media query**

Append a new height-sensitive mobile block after the existing mobile rules:

```css
@media (max-width: 680px) and (max-height: 760px) {
  .app-shell {
    padding-bottom: 176px;
  }

  .board-frame {
    min-height: 320px;
  }

  .control-dock {
    gap: 8px;
    padding: 10px;
    border-radius: 18px;
  }
}
```

- [ ] **Step 2: Compress the dock summary and header rhythm**

Inside that new media query, add:

```css
  .dock-header {
    gap: 4px;
  }

  .dock-label {
    margin-bottom: 2px;
    font-size: 0.66rem;
    letter-spacing: 0.12em;
  }

  .dock-selection-summary {
    min-height: 0;
    margin-bottom: 4px;
    font-size: 0.84rem;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
```

- [ ] **Step 3: Shrink tower slots into token-style controls**

Inside the same media query, add:

```css
  .tower-grid--dock {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
  }

  .tower-grid--dock .tower-choice {
    min-height: 58px;
    padding: 6px 4px;
    border-radius: 12px;
    gap: 2px;
  }

  .tower-grid--dock .tower-choice__icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .tower-grid--dock .tower-choice__icon img {
    width: 24px;
    height: 24px;
  }

  .tower-grid--dock .tower-choice__key {
    font-size: 0.58rem;
  }
```

- [ ] **Step 4: Compress d-pad and actions so the board regains height**

Inside the same media query, add:

```css
  .dock-actions-layout {
    gap: 8px;
  }

  .dock-pad {
    gap: 6px;
  }

  .dock-pad button,
  .dock-actions button {
    min-height: 38px;
    border-radius: 12px;
  }

  .dock-actions button {
    font-size: 0.9rem;
  }
```

- [ ] **Step 5: Reduce purely decorative spacing before reducing tap targets further**

Inside the same media query, add:

```css
  .control-dock .dock-section {
    min-width: 0;
  }

  .tower-choice__name {
    display: none;
  }
```

- [ ] **Step 6: Run a diff check on the responsive CSS**

Run:

```bash
git diff -- styles.css
```

Expected: changes are limited to a new short-height mobile mode and related compression rules.

- [ ] **Step 7: Commit the compact dock layout**

Run:

```bash
git add styles.css
git commit -m "feat: add compact control bar for short mobile screens"
```

### Task 3: Verify Build And Interaction Safety

**Files:**
- Verify: `D:\tower-defense\styles.css`
- Verify: `D:\tower-defense\src\main.js`

- [ ] **Step 1: Verify production build still succeeds**

Run:

```bash
npm run build
```

Expected: Vite build completes successfully.

- [ ] **Step 2: Verify tests still pass**

Run:

```bash
npm test
```

Expected: all existing `node --test` cases pass unchanged.

- [ ] **Step 3: Record manual QA expectations for handoff**

Include these checks in the final handoff note:

```text
- On short mobile heights, the board shows more rows than before
- The dock remains fully visible and no button is clipped
- Dock summary is brief and single-line
- Tower selection, d-pad, and action buttons remain usable without disappearing
```

- [ ] **Step 4: Commit the verified finish**

Run:

```bash
git add styles.css src/main.js
git commit -m "chore: verify compact mobile control bar"
```
