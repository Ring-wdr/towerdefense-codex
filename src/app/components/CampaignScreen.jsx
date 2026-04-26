import MenuFrame from "./MenuFrame.jsx";
import frameStyles from "./MenuFrame.module.css";
import screenStyles from "./CampaignScreen.module.css";

const THEME_TONES = {
  "기초 방어": "olive",
  "압박 대응": "amber",
  "후반 운용": "blue",
};

function getThemeTone(theme) {
  return THEME_TONES[theme] ?? "olive";
}

function formatStageRange(stageNumbers) {
  const firstStage = stageNumbers[0];
  const lastStage = stageNumbers[stageNumbers.length - 1];

  return firstStage === lastStage ? `Stage ${firstStage}` : `Stages ${firstStage}-${lastStage}`;
}

export default function CampaignScreen({ data, onBack, onPreviewTheme, onOpenBriefing }) {
  const selectedTheme = data.find((entry) => entry.selected) ?? data[0] ?? null;

  if (!selectedTheme) {
    return (
      <MenuFrame
        kicker="Campaign Map"
        title="Stage Command"
        tone="olive"
        className={screenStyles.root}
        containerClassName={screenStyles.container}
        footerActions={[{ key: "back", label: "Back", onClick: onBack }]}
      >
        <article className={`${frameStyles.panel} ${screenStyles.hero}`}>
          <p className={screenStyles.summary}>아직 표시할 전선 정보가 없다.</p>
        </article>
      </MenuFrame>
    );
  }

  const selectedStage = selectedTheme.previewStage;
  const footerActions = [
    { key: "back", label: "Back", onClick: onBack },
    { key: "briefing", label: "Briefing", onClick: () => onOpenBriefing(selectedStage.number) },
  ];

  return (
    <MenuFrame
      kicker="Campaign Map"
      title="Stage Command"
      tone={getThemeTone(selectedTheme.theme)}
      className={screenStyles.root}
      containerClassName={screenStyles.container}
      headerContent={
        <p className={screenStyles.headerStatus}>
          {selectedTheme.theme} · {formatStageRange(selectedTheme.stageNumbers)}
        </p>
      }
      footerActions={footerActions}
    >
      <section className={screenStyles.stack}>
        <article className={`${frameStyles.panel} ${screenStyles.hero}`}>
          <p className={screenStyles.eyebrow}>{selectedTheme.theme}</p>
          <p className={screenStyles.route}>{formatStageRange(selectedTheme.stageNumbers)}</p>
          <h2 className={screenStyles.title}>{selectedStage.name}</h2>
          <p className={screenStyles.summary}>{selectedStage.summary}</p>
          <div className={screenStyles.meta}>
            <p className={screenStyles.stat}>
              <span>Progress</span>
              <strong>
                {selectedTheme.clearedCount}/{selectedTheme.stageNumbers.length} cleared
              </strong>
            </p>
          </div>
        </article>

        <section className={screenStyles.grid} aria-label="Campaign themes">
          {data.map((theme) => (
            <button
              key={theme.theme}
              className={[
                frameStyles.panel,
                screenStyles.card,
                theme.selected ? screenStyles.selected : "",
              ].filter(Boolean).join(" ")}
              type="button"
              onClick={() => onPreviewTheme(theme.previewStage.number)}
            >
              <p className={screenStyles.label}>{theme.selected ? "Selected Front" : "Open Front"}</p>
              <h2 className={screenStyles.cardTitle}>{theme.theme}</h2>
              <p className={screenStyles.metaText}>
                {formatStageRange(theme.stageNumbers)} · {theme.clearedCount}/{theme.stageNumbers.length} cleared
              </p>
            </button>
          ))}
        </section>
      </section>
    </MenuFrame>
  );
}
