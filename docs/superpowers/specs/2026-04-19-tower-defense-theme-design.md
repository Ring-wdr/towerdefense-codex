# Tower Defense Theme Refresh Design

## Goal
Shift the current interface away from a website-like presentation and toward a tower-defense-specific game theme without changing the core responsive layout structure shared across desktop and mobile.

## Confirmed Constraints
- Keep the main desktop/mobile layout skeleton, including the sidebar.
- Focus changes on presentation details such as spacing, palette, surfaces, typography, and button styling.
- Preserve the current gameplay structure and information architecture.

## Design Direction
Adopt an "arcade tactical board" theme with the mood of a board game played under evening lighting. The board should feel like a physical play surface, while the HUD and sidebar should read as attached control hardware rather than content cards.

## Visual System
- Replace the current light parchment website palette with a darker table-surface palette built from olive, brass, ember, and charcoal tones.
- Use stronger material separation between page background, battlefield frame, HUD strip, and side control modules.
- Replace the current document-like serif-led presentation with a display font for game headings and a compact readable UI font for controls and labels.
- Reduce roomy website spacing and make panels denser and more instrument-like.

## Layout Treatment
- Keep the current two-column desktop layout and the mobile dock pattern.
- Convert the top HUD from a row of standalone cards into a cohesive scoreboard strip.
- Restyle sidebar sections so they feel like stacked control bays with inset surfaces and stronger selection states.
- Keep the board visually dominant by increasing contrast and theatrical framing around the canvas area.

## Interaction Styling
- Tower choice buttons should feel like selectable unit tokens or loadout slots, not website cards.
- Primary action buttons should look tactile and pressable with stronger active and selected states.
- Overlay states should match the same world, reading as mission briefings rather than modal website messaging.

## Implementation Scope
- Primary changes should land in `styles.css`.
- Small supporting text or class adjustments in `index.html` are acceptable if they improve theme coherence.
- Gameplay logic and control behavior should remain untouched unless a style change requires tiny wiring support.

## Risks And Mitigations
- Risk: darker styling can reduce readability.
  Mitigation: keep contrast high for labels, values, and button text.
- Risk: strong theming can feel noisy on mobile.
  Mitigation: simplify detail density on the dock while preserving the same palette and material language.
- Risk: sidebar can still feel web-like if card rhythm remains too loose.
  Mitigation: tighten spacing and treat sections as parts of one control stack.

## Validation
- The interface should read as a game screen at first glance, not as a landing page or dashboard.
- The board remains the strongest focal point on both desktop and mobile.
- Sidebar and dock controls feel consistent with the board theme and clearly interactive.
