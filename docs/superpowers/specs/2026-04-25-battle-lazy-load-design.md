# Battle Lazy Load Design

**Date:** 2026-04-25

## Goal

Improve initial main-menu load performance by ensuring Phaser battle code is not loaded until the player explicitly enters battle. While the battle runtime is loading, show a React `Suspense` fallback component instead of a blank screen.

## Approved Direction

- Phaser should load only when the player presses `Enter Battle`
- The battle boundary should be lazy imported from React
- The lazy boundary should use a dedicated `Suspense` fallback component
- The fallback should feel like a game-native deploy/loading surface, not a generic spinner

## Problem

The current app structure has already separated the menu layer into React and battle into Phaser, but the battle boundary is still imported eagerly enough that Phaser-related code can contribute to the initial application bundle.

That creates two costs:

1. More JavaScript for first menu load
2. More parsing and module initialization before the player even chooses battle

Since Phaser is only needed for the battle screen, the menu path should not pay that cost up front.

## Desired User Experience

### Main menu entry

- Title, campaign, theme, and shop should appear as quickly as possible
- No Phaser runtime should be needed to render those screens

### Battle entry

- When the player presses `Enter Battle`, React should switch into a loading transition immediately
- The player should see a game-native loading surface while the battle boundary is downloading and booting
- Once the lazy module resolves, Phaser should mount and start battle as it does now

## Architecture

## Current shape

- `App.jsx` owns top-level menu state
- `BattleHost` is the React-owned wrapper for Phaser battle
- `PhaserGame.jsx` mounts Phaser
- `src/game/main.js` bootstraps Phaser with the launch payload and UI bridge

## New shape

- `App.jsx` uses `React.lazy()` for `BattleHost`
- `App.jsx` wraps battle rendering in `Suspense`
- A new React component renders the loading fallback while `BattleHost` is loading
- `BattleHost` remains the entry point for Phaser battle boot

This keeps the existing battle boundary design, but delays loading that boundary until battle is actually requested.

## Recommended Implementation

### App-level lazy boundary

Replace the eager `BattleHost` import with:

```js
const BattleHost = lazy(() => import("./app/BattleHost.jsx"));
```

Then render battle like:

```jsx
<Suspense fallback={<BattleLoadingScreen appState={appState} />}>
  <BattleHost ... />
</Suspense>
```

This is the correct split point because `BattleHost` already represents the clean React-to-Phaser boundary.

### Fallback component

Add a dedicated loading component, for example:

- `src/app/components/BattleLoadingScreen.jsx`

Responsibilities:

- show a battle-themed loading surface
- use the existing menu design system
- optionally reflect the selected stage/theme
- avoid introducing Phaser dependencies

## Fallback UX

The fallback should not be a generic app spinner. It should feel like a tactical deployment state.

Recommended content:

- kicker: `Battle Link`
- title: `Deploying Battle Grid`
- support copy:
  - if stage/theme data is available, mention the selected front or stage
  - otherwise use a short neutral loading line

Recommended visual behavior:

- same low-light tabletop visual language as the menu system
- centered or near-centered loading module
- subtle motion only if easy and cheap
- no large layout shift when the battle host resolves

## Data Flow

1. Player is on `ThemeScreen`
2. Player presses `Enter Battle`
3. React state switches to `scene === "battle"`
4. `Suspense` begins rendering fallback
5. `BattleHost` chunk is requested
6. `BattleHost` resolves and mounts `PhaserGame`
7. `PhaserGame` lazy-loads `src/game/main.js`
8. Phaser boots with the existing battle launch payload

This creates two layers of laziness:

- React lazy boundary for `BattleHost`
- existing runtime lazy import inside `PhaserGame`

That is acceptable because the outer lazy boundary improves initial menu load, while the inner lazy import keeps the Phaser runtime isolated inside the battle path.

## Bundle Strategy

The important outcome is:

- menu chunk contains React menu UI and shared app state
- battle chunk contains `BattleHost` and Phaser-adjacent runtime
- Phaser runtime stays out of the initial menu path

The implementation may optionally add explicit Vite chunking later, but the first goal is to move the Phaser battle boundary behind a lazy import.

## Testing

### Source-level tests

Update tests to assert:

- `App.jsx` uses `lazy(() => import("./app/BattleHost.jsx"))`
- `Suspense` is used around the battle branch
- the fallback component is referenced in the battle render path

### Build verification

Run a production build and confirm:

- the output contains separated chunks for the app shell and battle runtime
- Phaser is not bundled solely into the initial menu chunk if the split works correctly

### Browser verification

Use Playwright to confirm:

- title screen loads normally
- no battle UI shows before entering battle
- clicking `Enter Battle` shows the loading fallback immediately
- battle mounts after the lazy chunk resolves
- no runtime console errors during the transition

## Constraints

- Do not change battle rules or battle UI behavior
- Do not change menu wording beyond fallback-specific loading copy
- Do not move more battle logic into React
- Keep the split point at the existing battle boundary instead of inventing a second battle abstraction

## Risks

### Double-loading feel

If the fallback is too weak or too slow, the player may perceive battle entry as slower than before even if the main menu loads faster. The fallback should make the transition feel intentional.

### Incorrect split point

If the lazy boundary is placed too high or too low, the app may either:

- still pull Phaser into the main bundle, or
- complicate the existing battle bridge unnecessarily

`BattleHost` is the preferred split point because it already expresses the correct boundary.

### Test drift

Current tests include source-shape assertions. They must be updated carefully so they verify the new lazy-loading architecture without overfitting to harmless formatting details.

## Success Criteria

The change is successful when:

- the initial menu experience loads without requiring Phaser battle code
- `Enter Battle` lazy-loads the battle boundary
- a `Suspense` fallback appears during battle loading
- battle still launches correctly after the chunk resolves
- build output confirms bundle separation
- Playwright confirms a clean transition without runtime errors
