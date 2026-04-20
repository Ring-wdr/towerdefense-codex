# Tower Attack Particles Design

## Goal

Replace the current tower attack line and circle overlays with Phaser particle-only combat effects so each tower attack reads as visually distinct and high-impact without changing combat rules.

## Scope

- Keep combat resolution in `D:\tower-defense\src\game\logic.js`.
- Keep `attackEffects` as the bridge from combat logic to presentation.
- Remove the existing attack overlay rendering from `D:\tower-defense\src\phaser\scenes\BattleScene.js`.
- Add tower-specific burst particle effects for `attack`, `slow`, `magic`, `cannon`, and `hunter`.
- Preserve gameplay readability on desktop and mobile.

## Non-Goals

- No changes to tower balance, cooldowns, damage, targeting, or enemy behavior.
- No fully simulated projectile system.
- No new long-running ambient emitters.
- No new authored art assets unless implementation proves a generated particle texture is insufficient.

## Current State

`D:\tower-defense\src\game\logic.js` creates short-lived `attackEffects` records whenever a tower fires. `D:\tower-defense\src\phaser\scenes\BattleScene.js` currently renders those effects as line or circle overlays in `drawEffects()`. The combat and presentation boundary is already in a good place, so the change should preserve that structure and swap the rendering strategy.

## Recommended Approach

Use `attackEffects` as short-lived render events and let `BattleScene` translate new effects into one-shot Phaser particle bursts. This keeps combat logic deterministic while moving all visual complexity into the scene layer.

This approach is preferred because it supports strong tower-specific identity, keeps the existing architecture intact, and avoids the maintenance risk of mixing visual projectile logic into combat resolution.

## Architecture

### Combat logic

- `D:\tower-defense\src\game\logic.js` remains responsible for attack timing, target selection, splash application, and `attackEffects` creation.
- Each generated attack effect should include enough information for presentation only:
  - a stable unique effect id
  - effect type
  - origin position
  - target position
  - optional radius when needed for cannon splash presentation
  - a short ttl for recent-event retention

### Battle scene presentation

- `D:\tower-defense\src\phaser\scenes\BattleScene.js` will own all particle setup and playback.
- The scene will create a small set of reusable particle emitters during `create()`, grouped by tower attack type.
- The scene will track which effect ids have already been played.
- On each render/update pass, the scene will detect newly seen `attackEffects` and trigger a single emitter burst for that effect.
- Existing geometric attack overlay drawing will be removed so the combat feedback is particle-only.

### Lifecycle and cleanup

- Emitters must use burst behavior only, not continuous flow.
- Effect tracking state must be cleared on restart, shutdown, and scene transitions.
- Any generated particle textures must be created once and reused.

## Visual Direction

The user-selected direction is tower-specific and intentionally flashy, but still readable during play.

- `attack`: short white-gold muzzle spark and fast impact flecks with minimal linger
- `slow`: teal frost shards with a cone-like launch and a small icy bloom on contact
- `magic`: purple-pink arcane particles that curve visually from source to target and end in a bright magical pop
- `cannon`: the largest burst, using orange fire, dust, and debris with a radial blast impression
- `hunter`: thin gold streaks with a sharp, precise impact spark and longer directional emphasis than the base attack tower

## Readability Rules

- All non-cannon effects should use short lifespans and restrained lingering glow.
- Direction should be communicated by particle velocity and spread, not by fallback lines.
- Particle counts should be capped per burst, with cannon allowed the highest count.
- Position, speed, and radius values should respect board scaling so mobile layouts remain legible.

## Data Flow

1. A tower attack resolves in `logic.js`.
2. Combat damage and status effects are applied exactly as they are today.
3. `createAttackEffects()` emits a render event with a unique id and presentation metadata.
4. `BattleScene` sees the new effect id, triggers the matching burst particle routine once, and marks it as handled.
5. The effect record ages out through ttl without requiring persistent overlay rendering.

## Testing Strategy

### Automated

- Keep `D:\tower-defense\test\game-logic.test.js` focused on combat correctness.
- Ensure current tests for damage, splash behavior, and target prioritization still pass after the render change.
- Add or update tests only if needed to cover new `attackEffects` shape guarantees such as stable ids or required metadata.

### Manual

- Verify each tower produces a visibly distinct particle burst when attacking.
- Verify attack feedback remains understandable with no line or circle overlays present.
- Verify restarting battle or changing scenes does not replay stale effects or leak emitters.
- Verify mobile-scale layouts still show enemies, towers, and particle effects clearly.
- Verify cannon remains the most dramatic effect without obscuring the board for too long.

## Acceptance Criteria

- Every tower type has a visually distinct particle-only attack effect.
- The old attack line and splash circle overlays are fully removed.
- Combat behavior remains unchanged.
- Particle bursts trigger once per attack event and do not duplicate from stale state.
- Scene restart and shutdown paths leave no lingering particle state.
- The battlefield remains readable and performance remains stable in normal play.

## Risks and Mitigations

- Duplicate bursts from scene rerenders:
  Mitigation: use stable effect ids and a handled-effect set in `BattleScene`.

- Overly noisy visuals on small screens:
  Mitigation: keep burst lifetimes short, cap counts, and scale all particle motion with board scale.

- Increased scene complexity:
  Mitigation: isolate emitter creation and playback into focused helper methods inside `BattleScene`.

- Missing particle texture support:
  Mitigation: generate a simple reusable glow or dot texture in code before considering new assets.

## Implementation Notes

- Prefer a generated particle texture or a minimal reusable existing texture to keep scope controlled.
- Keep particle behavior burst-based with `frequency: -1` or equivalent one-shot emission patterns.
- Preserve the existing logic/render separation instead of moving tower attack visuals into combat code.
