import MenuFrame from "./MenuFrame.jsx";

const LOCKED_COPY = "이 구간은 아직 봉쇄 상태다. 캠페인에서 앞선 전장을 먼저 확보해야 한다.";
const THEME_TONES = {
  "기초 방어": "olive",
  "압박 대응": "amber",
  "후반 운용": "blue",
};

function getThemeTone(theme) {
  return THEME_TONES[theme] ?? "olive";
}

function getNodeStatus(stageNumber, locked, selected, session) {
  if (locked) {
    return "LOCKED";
  }

  if (selected) {
    return "SELECTED";
  }

  if (session?.clearedStages?.includes(stageNumber)) {
    return "CLEARED";
  }

  return "READY";
}

export default function ThemeScreen({ data, session, onBack, onSelectStage, onEnterBattle }) {
  const stage = data?.stage ?? null;

  if (!stage) {
    return (
      <MenuFrame
        kicker="Campaign Front"
        title="Stage Briefing"
        tone="olive"
        actions={
          <button className="menu-button" type="button" onClick={onBack}>
            Back
          </button>
        }
      >
        <article className="menu-card theme-briefing">
          <p className="theme-briefing__copy">선택된 전장 정보가 없다.</p>
        </article>
      </MenuFrame>
    );
  }

  const selectedEntry = data.stageNumbers.find((entry) => entry.selected) ?? null;
  const battleLocked = selectedEntry?.locked ?? false;
  const routeLabel = selectedEntry
    ? `ROUTE ${data.stageNumbers.indexOf(selectedEntry) + 1} OF ${data.stageNumbers.length}`
    : `ROUTE UNKNOWN OF ${data.stageNumbers.length}`;

  return (
    <MenuFrame
      kicker={`${stage.theme} 전선`}
      title={stage.name}
      tone={getThemeTone(stage.theme)}
      actions={
        <>
          <button className="menu-button" type="button" onClick={onBack}>
            Back
          </button>
          <button
            className="menu-button"
            type="button"
            onClick={battleLocked ? undefined : onEnterBattle}
            disabled={battleLocked}
          >
            {battleLocked ? "Locked" : "Enter Battle"}
          </button>
        </>
      }
    >
      <section className="theme-layout">
        <article className="menu-card theme-briefing">
          <p className="theme-briefing__eyebrow">Stage {stage.number}</p>
          <p className="theme-briefing__route">{routeLabel}</p>
          <h2 className="theme-briefing__title">{battleLocked ? "ENTRY LOCKED" : "TACTICAL BRIEF"}</h2>
          <p className="theme-briefing__copy">{battleLocked ? LOCKED_COPY : stage.summary}</p>
        </article>

        <section className="theme-stage-list" aria-label={`${stage.theme} stages`}>
          {data.stageNumbers.map(({ stage: entryStage, locked, selected }) => (
            <button
              key={entryStage.number}
              className={`menu-card theme-stage-node${selected ? " is-selected" : ""}`}
              type="button"
              onClick={() => {
                if (!locked) {
                  onSelectStage(entryStage.number);
                }
              }}
              disabled={locked}
            >
              <p className="theme-stage-node__eyebrow">STAGE {entryStage.number}</p>
              <h2 className="theme-stage-node__title">{entryStage.name}</h2>
              <p className="theme-stage-node__summary">{entryStage.summary}</p>
              <p className="theme-stage-node__status">
                {getNodeStatus(entryStage.number, locked, selected, session)}
              </p>
            </button>
          ))}
        </section>
      </section>
    </MenuFrame>
  );
}
