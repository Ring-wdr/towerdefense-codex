# React Menu Migration Design

**Date:** 2026-04-25

## Goal

Move the non-battle parts of the game from Phaser scenes into React while keeping the actual in-game experience limited to the battle screen. After this change:

- `title`, `campaign`, `theme`, and `shop` render in React
- `battle` plus battle-time overlays remain in Phaser
- current copy and information architecture remain intact
- the visual treatment for the React-owned screens is redesigned in the `.impeccable` arcade board-game direction

## Scope

This design covers:

- React ownership of top-level app navigation state
- React implementations of the current `TitleScene`, `CampaignScene`, `ThemeScene`, and `ShopScene`
- a clean battle boundary where Phaser is mounted only for battle
- battle launch data flow from React into Phaser
- preservation of current gameplay logic, progression logic, and battle overlay behavior

This design does not cover:

- redesigning battle HUD or battle controls beyond what is required for integration
- changing current gameplay rules, progression rules, or shop economics
- changing the current copy or information hierarchy for menu screens
- moving pause, draft, defeat, victory, or similar battle overlays to React

## Product Direction

The React-owned screens should preserve the current structure and wording, but visually move toward the `.impeccable` direction:

- arcade and tactical rather than website-like
- low-light tabletop atmosphere
- tactile control modules instead of neutral cards
- compact, high-signal grouping
- desktop and mobile sharing the same visual language

The battlefield remains the hero. The React menu surfaces should feel like briefing boards and control hardware surrounding the game rather than a separate web app.

## Recommended Architecture

Use a hybrid boundary:

- React owns all top-level non-battle screens and the app-level selection state
- Phaser owns battle rendering, battle logic, and battle-only overlays
- React launches Phaser battle with explicit initial state
- Phaser keeps its current in-battle flow until the player exits back out to the menu layer

This is preferred over a full Phaser-scene rewrite or a fully mixed model because it best matches the requirement that only battle counts as in-game while minimizing risk to proven battle logic.

## Screen Ownership

### React-owned screens

- Title
- Campaign
- Theme / stage briefing
- Shop

These screens should become React components that replace the current Phaser scene rendering responsibilities.

### Phaser-owned screens

- Battle
- Pause overlay
- Draft overlay
- Defeat / victory / stage-clear overlays
- Any other overlay that appears only during battle flow

Phaser continues to manage these so that battle interaction and timing logic remain stable.

## State Ownership

### React-owned state

React becomes the source of truth for the menu layer:

- current top-level screen
- selected theme
- selected stage
- loaded meta progression
- shop-visible state and purchase results
- battle launch payload

This state should live above the menu screen components so React can switch between `title`, `campaign`, `theme`, `shop`, and `battle` without relying on Phaser scene changes.

### Phaser-owned state

Phaser remains the source of truth for live battle state:

- enemy and tower simulation
- wave state
- cursor placement state
- run modifiers and draft state
- pause / resume state
- battle result / completion state while the player remains in battle flow

### Shared boundary

The boundary between React and Phaser is explicit and one-way at battle start:

- React prepares the current stage selection and progression data
- React mounts the battle host and passes the initial payload
- Phaser initializes battle from that payload

When battle ends, Phaser may continue to own retry / continue / back choices inside battle overlays. React only regains control when the player exits back to the non-battle menu layer.

## Component Model

## AppShell

New React root that owns top-level navigation and menu state.

Responsibilities:

- load persisted meta progression
- decide which top-level screen is visible
- render either a React menu screen or the Phaser `BattleHost`
- coordinate transitions between menu screens

## TitleScreen

React replacement for `TitleScene`.

Responsibilities:

- preserve current title copy and button set
- expose `Start Campaign`, `Shop`, and gated `Endless Mode`
- maintain the new tactile arcade presentation

## CampaignScreen

React replacement for `CampaignScene`.

Responsibilities:

- render theme selection and progress overview
- preserve current information groupings and current wording
- keep the current selection model intact

## ThemeScreen

React replacement for `ThemeScene`.

Responsibilities:

- render current stage briefing
- preserve route, stage, lock, and summary information
- launch battle with the currently selected stage

## ShopScreen

React replacement for `ShopScene`.

Responsibilities:

- render progression and purchase UI
- preserve current shop categories, labels, and purchasing rules
- apply purchases into React-owned meta progression state

## BattleHost

Thin React wrapper around Phaser battle.

Responsibilities:

- mount Phaser only when the app is in battle mode
- pass the launch payload to Phaser
- keep the existing battle DOM controls available

## BattleBridge

Small integration layer that translates React-owned menu state into Phaser boot inputs and translates explicit menu returns back into React.

Responsibilities:

- take React state and prepare Phaser boot data
- allow Phaser to report when the player exits the battle flow back to a menu screen
- avoid letting menu logic leak back into Phaser scene ownership

## Data Flow

### Menu flow

1. React loads `metaProgress`
2. React shows `TitleScreen`
3. Player navigates through `CampaignScreen`, `ThemeScreen`, and `ShopScreen`
4. React updates `selectedTheme`, `selectedStage`, and progression state directly

### Battle start flow

1. Player chooses `Enter Battle` from `ThemeScreen`
2. React switches top-level screen to `battle`
3. React mounts `BattleHost`
4. `BattleHost` starts Phaser with the selected stage and current progression data
5. Phaser battle initializes from this payload instead of owning menu selection state

### Battle end flow

1. Phaser handles battle overlays internally
2. Retry / continue / back behavior remains inside Phaser while the player is still in battle flow
3. Only when the player exits back to the outer menu layer does Phaser notify React
4. React then remounts the appropriate menu screen and becomes the visible owner again

## Scene and File Impact

### Phaser code that should remain

- battle scene implementation
- battle overlay implementation
- gameplay logic modules
- progression and shop calculation logic
- reusable stage and progression data

### Phaser code that should shrink or be retired

- `TitleScene`
- `CampaignScene`
- `ThemeScene`
- `ShopScene`

These should no longer be responsible for rendering the menu layer once the React replacements are complete.

### React code that should be introduced

- new app-level state container
- React menu screen components
- battle launch bridge
- screen-specific presentational components and shared design tokens

## UX Constraints

The migration must preserve:

- current copy
- current menu information hierarchy
- current stage and theme progression rules
- current shop feature set
- current battle entry points

The redesign may change:

- panel shapes
- spacing system
- typography treatment
- decorative treatments
- layout composition
- motion and transitions

The redesign must not change:

- what information appears on each screen
- the meaning of actions
- the order of the player journey

## Responsive Expectations

Desktop and mobile should use the same visual language, but layout can reflow.

- Desktop can present richer framing and multi-zone composition
- Mobile should collapse into compact briefing modules and stacked controls
- No React-owned menu screen should feel like a generic web dashboard
- Battle controls should remain out of the way until battle starts

## Error Handling

React menu screens should handle:

- missing or malformed persisted progression by falling back to normalized defaults
- locked stages and locked modes with current gating rules
- safe re-entry to menu screens after a battle exit

Phaser battle should continue handling:

- invalid in-battle actions
- pause / resume
- draft resolution
- battle completion and defeat overlays

## Testing Strategy

### Unit tests

Keep and preserve existing coverage for:

- gameplay logic
- stage definitions
- progression and purchase math
- battle initialization logic

### React structure tests

Add or rewrite tests so they assert:

- the app shell renders React-owned title / campaign / theme / shop screens
- battle is the only route that mounts Phaser
- current copy and key buttons remain present on each React screen
- battle controls remain hidden before battle

### Integration tests

Verify:

- `title -> campaign -> theme -> battle`
- `title -> shop`
- selected stage and progression are passed correctly into battle
- exiting battle returns control to the correct React-owned menu screen

### Playwright verification

Use Playwright on desktop and mobile widths to confirm:

- non-battle screens are React-rendered
- battle screen still mounts Phaser once
- battle controls appear only in battle
- the React redesign preserves current navigation structure and wording

## Migration Plan Shape

The implementation should happen in phases:

### Phase 1: Lift menu state to React

React becomes the source of truth for:

- current menu screen
- selected theme
- selected stage
- meta progression

Phaser menu scenes may still temporarily exist, but React should own the authoritative state.

### Phase 2: Replace menu screens one by one

Replace:

- title
- campaign
- theme
- shop

with React equivalents while preserving current copy and behavior.

### Phase 3: Lock the battle boundary

Ensure Phaser mounts only for battle and battle-time overlays, with explicit boot payloads from React.

### Phase 4: Remove obsolete menu-scene dependencies

After React replacements are stable:

- reduce or remove old Phaser menu scene responsibilities
- update tests to target React ownership
- keep battle-specific code isolated

## Risks

### State drift between React and Phaser

If menu state is partially left in Phaser and partially moved to React, the two can diverge. The implementation must treat React as the single source of truth for non-battle state.

### Tests tied to scene source

Current tests inspect Phaser scene source directly. Some of these will need to be rewritten so that they validate React menu ownership instead of legacy scene markup.

### Overcoupling battle and menu flow

The migration must avoid letting React own in-battle transient behavior. The boundary should stay clear: React for menu, Phaser for battle.

## Success Criteria

The migration is successful when:

- only battle and battle-only overlays remain in Phaser
- title, campaign, theme, and shop render in React
- current wording and information architecture remain intact
- the visual design of the menu layer follows the `.impeccable` direction
- tests pass
- Playwright confirms battle-only Phaser mounting and stable menu flow on desktop and mobile
