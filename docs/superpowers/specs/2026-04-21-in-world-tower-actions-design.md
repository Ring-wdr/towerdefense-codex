# In-World Tower Actions

## Goal
Move tower-specific `upgrade` and `delete` actions out of the fixed HUD and attach them to the selected tower itself, so players can act on a tower directly at the point of interaction. The upgrade cost must be visible on the upgrade action, making the separate HUD hint unnecessary for these actions.

## Scope
- Reuse the existing DOM `tower-actions` overlay instead of introducing a new action system.
- Reposition the action overlay so it appears directly above the tower at the current cursor location.
- Show the current upgrade cost inside the upgrade action.
- Keep keyboard shortcuts `U` and `X` working as they do now.
- Keep the mobile and desktop control docks functional.
- Remove duplicated upgrade/delete guidance from the Phaser HUD text.

## Non-Goals
- No change to tower build flow or tower selection flow.
- No change to upgrade pricing rules, delete behavior, or gameplay balance.
- No replacement of the existing mobile dock action buttons.
- No Phaser-native action buttons for this step.
- No redesign of the main battle HUD beyond removing duplicated tower-action hints.

## Current Problems
- Tower-specific actions currently live in a detached HUD overlay, so the interaction target is visually separated from the tower it affects.
- The HUD text duplicates information that should be contextual, especially upgrade cost and delete guidance.
- On smaller screens, the fixed action position makes the interaction feel more like a webpage control panel than a board-game action attached to a piece.
- The current `U` and `X` button labels do not communicate upgrade price, so players still need HUD text to understand the action cost.

## Chosen Approach
Keep the existing DOM overlay and make it context-aware.

Why this approach:
- It reuses the current event wiring for click actions with the smallest implementation risk.
- It avoids rebuilding pointer interaction inside Phaser just to move two controls.
- It allows explicit action text such as `Upgrade 45G` without inventing a new Phaser text-button component.
- It preserves input parity across desktop, mobile, and keyboard shortcuts.

## Interaction Design

### Visibility Rules
- Show the in-world action overlay only when battle controls are visible and the cursor is currently over an existing tower.
- Hide the overlay for empty tiles, road tiles, and all non-running battle states.
- Keep the overlay anchored to the hovered tower, not to the selected tower type from the loadout.

### Action Content
- Upgrade action label format: `Upgrade {cost}G`.
- If the tower is already at max level, replace the upgrade label with `Max` and disable the button.
- If the tower is not max level but the player lacks gold, keep the cost visible and disable the button.
- Delete action label stays concise, e.g. `Delete`.

### Input Model
- Clicking the in-world upgrade action runs the existing `upgradeTowerAtCursor`.
- Clicking the in-world delete action runs the existing `deleteTowerAtCursor`.
- Keyboard shortcuts `U` and `X` remain active.
- Mobile and desktop dock action buttons remain active so the input model does not regress for touch or muscle memory.

## Positioning Model
- Compute the tower center from existing battle layout state:
  - `boardOffset`
  - `scaledCellSize`
  - cursor tile coordinates
- Convert that board position into screen-space coordinates for the DOM overlay.
- Position the overlay horizontally centered on the tower and vertically above the tower sprite with a small gap.
- Clamp the overlay horizontally so it does not spill off the left or right edge of the viewport.
- If a tower is near the top HUD region, allow the overlay to sit slightly closer to the tower rather than jumping to a distant fallback location.

## Visual Direction
- Replace the current pair of small circular icon buttons with two compact command chips that read clearly over the board.
- Upgrade should use the existing positive/success color bias.
- Delete should use the existing danger color bias.
- The overlay should feel like a tactical board annotation, not a floating app toolbar.
- On mobile, the chips should stay compact enough to avoid covering neighboring cells more than necessary.

## HUD Changes
- Keep core battle HUD information such as stage, wave, lives, gold, selected tower, and cursor position.
- Remove the HUD sentence that currently explains upgrade/delete behavior and upgrade price.
- Keep build-state guidance for empty tiles, because build affordability still depends on the selected loadout tower rather than an in-world tower target.

## Components And File Responsibilities

### `src/phaser/scenes/BattleScene.js`
- Own action overlay visibility, label content, disabled state, and absolute positioning.
- Reuse existing state helpers such as `findTowerAt`, `getUpgradeCost`, `MAX_TOWER_LEVEL`, and battle layout metrics.
- Update HUD copy so tower-action guidance no longer duplicates the in-world actions.

### `index.html`
- Keep the existing `tower-actions` container.
- Expand button text from single-letter labels to readable action labels.
- Preserve stable element ids for event binding.

### `styles.css`
- Restyle `tower-actions` from round icon buttons into compact readable chips.
- Support disabled visual states for unaffordable or max-level upgrades.
- Ensure the overlay remains readable on both desktop and mobile widths.

### `test/ui-shell.test.js`
- Assert that the action overlay markup supports readable action labels rather than only single-character button text.
- Assert that the battle scene source now drives contextual tower-action labels and no longer relies on the old HUD upgrade/delete sentence.

## Error Handling
- If the cursor is over no tower, hide the overlay and clear any stale action labels.
- If DOM elements are missing, the scene should continue to run without throwing, as it already does for optional controls.
- If the upgrade action is unavailable, disable it rather than hiding it so the action state remains legible.

## Testing

### Automated
- Update `test/ui-shell.test.js` for the new action markup and source expectations.
- Keep game-logic tests unchanged; upgrade and delete behavior should remain covered there.
- Run the full Node test suite.
- Run a production build to catch any static import or CSS issues.

### Visual And Functional QA
- Verify that selecting a tower shows the action chips directly above that tower.
- Verify that moving the cursor to another tower moves the chips with it.
- Verify that empty tiles do not show tower-action chips.
- Verify that insufficient gold disables upgrade while still showing the correct cost.
- Verify that max-level towers show a disabled `Max` upgrade chip.
- Verify that `U`, `X`, touch controls, and dock actions still work.
- Verify mobile widths do not let the overlay clip off-screen.

## Risks
- DOM overlay positioning can drift if board scaling math and DOM layout math diverge during resize; the action position must be recomputed during normal render sync.
- Wider action labels can cover more of the board than the old icon buttons; chip sizing and clamping need restraint.
- Keeping both the in-world overlay and dock actions means there are two ways to trigger upgrade on mobile, so labels and disabled states must stay consistent.

## Success Criteria
- Tower-specific actions appear directly above the tower under the cursor.
- Upgrade cost is visible on the upgrade action itself.
- HUD text no longer carries duplicate upgrade/delete guidance.
- Existing keyboard and dock controls still work.
- The interaction reads as part of the battlefield rather than a detached HUD panel.
