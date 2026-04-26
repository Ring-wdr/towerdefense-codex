import type { RefObject } from "react";
import { MOVE_BUTTONS, TOWER_CHOICES } from "./battle-controls.constants";

export interface BattleControlsProps {
  controlsRootRef: RefObject<HTMLElement | null>;
}

function renderTowerChoices(keyPrefix = "") {
  return TOWER_CHOICES.map(({ type, key, name, iconUrl }) => (
    <button key={`${keyPrefix}${type}`} type="button" data-tower={type} className="tower-choice">
      <span className="tower-choice__icon">
        <img data-tower-icon={type} src={iconUrl} alt="" />
      </span>
      <span className="tower-choice__meta">
        <span className="tower-choice__key">{key}</span>
        <span className="tower-choice__name">{name}</span>
      </span>
    </button>
  ));
}

export default function BattleControls({ controlsRootRef }: BattleControlsProps) {
  return (
    <section id="battle-controls" className="battle-controls" hidden ref={controlsRootRef}>
      <button id="start-button" className="board-pause-button board-start-button" type="button">
        Start
      </button>
      <button id="pause-button" className="board-pause-button" type="button">
        Pause
      </button>

      <div id="tower-actions" className="tower-actions" hidden>
        <button id="upgrade-action" type="button" aria-label="Upgrade tower">
          Upgrade
        </button>
        <button id="delete-action" type="button" aria-label="Delete tower">
          Delete
        </button>
      </div>

      <aside className="sidebar" hidden>
        <section className="card card--towers">
          <h2>Tower Bay</h2>
          <p className="selection-summary selection-summary--desktop" data-selection-summary></p>
          <div className="tower-grid" id="tower-buttons">
            {renderTowerChoices()}
          </div>
        </section>
      </aside>

      <section
        id="tower-buttons-dock"
        className="control-dock control-dock--hybrid"
        aria-label="Quick play controls"
        hidden
      >
        <div className="dock-section">
          <div className="dock-header">
            <p className="dock-label">Select Tower</p>
            <p className="dock-selection-summary" data-selection-summary></p>
          </div>
          <div className="tower-grid tower-grid--dock">
            {renderTowerChoices("dock-")}
          </div>
        </div>

        <div className="dock-actions-layout">
          <div className="dock-pad" aria-label="Move cursor">
            {MOVE_BUTTONS.map(({ move, Icon, label, className }) => (
              <button key={move} type="button" data-move={move} className={className} aria-label={label}>
                <Icon aria-hidden={true} size={18} strokeWidth={2.4} />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>

          <div className="dock-actions">
            <button type="button" data-action="build">Build</button>
            <button type="button" data-action="upgrade">Upgrade</button>
            <button type="button" data-action="pause">Pause</button>
            <button type="button" data-action="restart">Restart</button>
          </div>
        </div>
      </section>
    </section>
  );
}
