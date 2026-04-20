# Phaser Scene UI Redesign

## Goal
Redesign the Phaser-managed front-end scenes so the game opens with interfaces that read like a game menu, not a web page. The redesign covers only Phaser-rendered scenes and shared Phaser UI primitives. Existing DOM battle controls remain out of scope for this step.

## Scope
- Redesign `TitleScene`, `CampaignScene`, and `ThemeScene`.
- Replace the current panel-within-panel card language with a game-style menu language.
- Update shared Phaser UI helpers in `src/phaser/ui/components.js` and `src/phaser/ui/layout.js`.
- Preserve current scene flow and session transitions.
- Do not modify DOM battle controls, their layout, or their interaction model.

## Non-Goals
- No redesign of HTML overlays or battle control DOM.
- No gameplay rule changes.
- No campaign progression rule changes.
- No new systems for animation-heavy transitions, audio, or save data.
- No attempt to redesign the active battle HUD in this phase.

## Current Problems
- The current scenes rely on centered cards that feel like a responsive web landing page rather than a game shell.
- Important information is visually flattened because headings, body copy, and action regions all use similar framed containers.
- Nested panels create a dense and static screen, especially in `CampaignScene` and `ThemeScene`.
- Mobile layout technically fits, but it still reads as a shrunk desktop card layout instead of an intentional game interface.
- Shared primitives in `components.js` enforce the same framed-box look across every scene, so each scene inherits the same weakness.

## Design Direction
The new language should feel closer to a strategy game front end:
- large scene title lockups
- strong focal center content
- clear command zone near the bottom
- restrained secondary metadata
- decorative framing built from Phaser shapes, not web-card composition

The screen should read in three passes:
1. what screen this is
2. what the current selection or context is
3. what action the player can take next

## Scene Design

### TitleScene
Purpose: deliver a clean first impression and a single clear entry action.

Structure:
- Background atmosphere built from Phaser primitives, not a centered card.
- Large game title lockup near the upper third.
- Short campaign framing line beneath the title.
- One primary command button near the bottom safe area.
- Small progress or state hint only if it helps orientation without competing with the title.

Rules:
- No large body paragraph block.
- No bordered central card.
- No secondary action competing with Start.

### CampaignScene
Purpose: let the player browse campaign context and understand the currently selected theme immediately.

Structure:
- Top command bar style heading for scene identity.
- Central focus area showing selected theme and selected stage as the primary read.
- Minimal progress strip or compact counters for campaign completion.
- Previous and next navigation commands anchored symmetrically near the lower area.
- One highlighted command that advances into theme briefing.

Rules:
- Eliminate card-in-card stats layout.
- Keep the selected theme as the visual center of gravity.
- Supporting progress info must stay subordinate to current selection.

### ThemeScene
Purpose: act as a pre-battle briefing screen, not a detail page.

Structure:
- Header block for theme, stage number, and stage name.
- One central tactical briefing region with concise readable summary text.
- Optional compact side tags or labels only if they improve scanning.
- Strong bottom command zone with Back and Enter Battle.

Rules:
- Remove decorative info chips that duplicate nearby information.
- Briefing copy should be short enough to scan in one stop.
- Enter Battle must remain the dominant action.

## Shared UI System

### Components
Replace generic web-card primitives with game-menu primitives:
- frame/backdrop containers for atmosphere and region grouping
- command buttons with clearer hierarchy between primary and secondary actions
- title lockup helper for kicker plus heading pairings
- compact status strip or marker components for lightweight metadata

Component goals:
- fewer nested borders
- clearer spacing rhythm
- stronger primary action contrast
- scene-to-scene consistency without forcing identical composition

### Layout
Update layout helpers so scenes are built around zones instead of a single centered panel.

Required zones:
- top safe header area
- central focus region
- bottom command region
- mobile-safe padding and short-height adjustments

Layout helpers must support:
- desktop and mobile widths
- short viewports without overlap
- keeping critical controls inside the visible frame without scroll

## Data And Flow
- Keep using the existing session data in `src/phaser/state/game-session.js`.
- Keep current transition flow:
  - `TitleScene -> CampaignScene`
  - `CampaignScene -> ThemeScene`
  - `ThemeScene -> BattleScene`
- No scene flow expansion in this redesign.
- No new persistent data fields unless required for layout state, and none are currently expected.

## Error Handling
- If session state is missing, scenes should continue to fall back to `createGameSession()` as they do now.
- Layout helpers must avoid negative widths or overlapping command regions on short mobile screens.
- If optional supporting labels do not fit, they should be omitted rather than forcing cramped composition.

## Testing

### Automated
- Add or update layout-oriented tests for any helper contracts introduced in `src/phaser/ui/layout.js`.
- Keep `test/phaser-game-session.test.js` passing to confirm scene flow remains intact.
- Keep `test/ui-shell.test.js` unchanged except where source references need to reflect renamed helpers or scene assumptions.

### Visual And Functional QA
Use Playwright against the worktree build and verify:
- Title screen is readable at first glance and contains one dominant start action.
- Campaign screen reads current selection before supporting progress.
- Theme screen reads as a briefing and not as a stacked detail page.
- Desktop and mobile widths keep all critical scene UI within one screen.
- No clipped title text, action buttons, or briefing copy at supported viewport sizes.

Exploratory QA:
- Resize between desktop and mobile widths and confirm scenes rebuild cleanly.
- Move through `Title -> Campaign -> Theme` and confirm visual language stays coherent across transitions.

## Implementation Plan
1. Add layout tests for any new zone helpers.
2. Refactor `src/phaser/ui/layout.js` around scene zones instead of centered-panel math.
3. Refactor `src/phaser/ui/components.js` to support game-menu framing and command hierarchy.
4. Rebuild `TitleScene` with the new title-first composition.
5. Rebuild `CampaignScene` around central selection focus and compact progress.
6. Rebuild `ThemeScene` as a briefing screen with strong entry action.
7. Run automated tests.
8. Run Playwright visual QA on desktop and mobile widths.

## Risks
- Shared component changes can unintentionally alter multiple scenes at once; scene-specific tuning will still be needed after the common refactor.
- Aggressively removing framing can make screens feel under-structured if spacing and typography are not strengthened at the same time.
- Mobile short-height layouts may still require explicit compaction rules even after the zone-based redesign.

## Success Criteria
- The first impression no longer resembles a web card layout.
- Scene hierarchy is immediately readable without studying paragraph text.
- `TitleScene`, `CampaignScene`, and `ThemeScene` share a coherent game-style visual language.
- Scene flow is unchanged functionally.
- DOM battle controls are untouched by this redesign.
