import MenuFrame from "./MenuFrame.jsx";

const THEME_TONES = {
  "기초 방어": "olive",
  "압박 대응": "amber",
  "후반 운용": "blue",
};

function getThemeTone(theme) {
  return THEME_TONES[theme] ?? "olive";
}

export default function CampaignScreen({ data, onBack, onPreviewTheme, onOpenBriefing }) {
  const selectedTheme = data.find((entry) => entry.selected) ?? data[0] ?? null;

  if (!selectedTheme) {
    return (
      <MenuFrame
        kicker="Campaign Map"
        title="Stage Command"
        tone="olive"
        actions={
          <button className="menu-button" type="button" onClick={onBack}>
            Back
          </button>
        }
      >
        <article className="menu-card campaign-hero">
          <p className="campaign-hero__summary">아직 표시할 전선 정보가 없다.</p>
        </article>
      </MenuFrame>
    );
  }

  const selectedStage = selectedTheme.previewStage;

  return (
    <MenuFrame
      kicker="Campaign Map"
      title={selectedTheme.theme}
      tone={getThemeTone(selectedTheme.theme)}
      actions={
        <button className="menu-button" type="button" onClick={onBack}>
          Back
        </button>
      }
    >
      <section className="campaign-layout">
        <article className="menu-card campaign-hero">
          <p className="campaign-hero__eyebrow">STAGE {selectedStage.number}</p>
          <h2 className="campaign-hero__title">{selectedStage.name}</h2>
          <p className="campaign-hero__summary">{selectedStage.summary}</p>
          <div className="campaign-hero__meta">
            <p className="campaign-hero__meta-item">
              <span>Theme</span>
              <strong>{selectedTheme.theme}</strong>
            </p>
            <p className="campaign-hero__meta-item">
              <span>Progress</span>
              <strong>
                {selectedTheme.clearedCount}/{selectedTheme.stageNumbers.length} cleared
              </strong>
            </p>
          </div>
          <button
            className="menu-button campaign-hero__action"
            type="button"
            onClick={() => onOpenBriefing(selectedStage.number)}
          >
            Briefing
          </button>
        </article>

        <section className="campaign-grid" aria-label="Campaign themes">
          {data.map((theme) => (
            <button
              key={theme.theme}
              className={`menu-card campaign-card${theme.selected ? " is-selected" : ""}`}
              type="button"
              onClick={() => onPreviewTheme(theme.previewStage.number)}
            >
              <p className="campaign-card__kicker">{theme.theme}</p>
              <h2 className="campaign-card__title">{theme.previewStage.name}</h2>
              <p className="campaign-card__summary">{theme.previewStage.summary}</p>
              <p className="campaign-card__progress">
                {theme.clearedCount}/{theme.stageNumbers.length} cleared
              </p>
            </button>
          ))}
        </section>
      </section>
    </MenuFrame>
  );
}
