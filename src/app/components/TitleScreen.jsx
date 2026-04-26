import MenuFrame from "./MenuFrame.jsx";
import frameStyles from "./MenuFrame.module.css";
import screenStyles from "./TitleScreen.module.css";

export default function TitleScreen({ data, onStartCampaign, onOpenShop, onStartEndless }) {
  const footerActions = [
    { key: "start-campaign", label: "Start Campaign", onClick: onStartCampaign },
    { key: "shop", label: "Shop", onClick: onOpenShop },
    ...(data.isEndlessUnlocked
      ? [{ key: "endless-mode", label: "Endless Mode", onClick: onStartEndless }]
      : []),
  ];

  return (
    <MenuFrame
      kicker="Campaign Front"
      title="Stage Command"
      tone="olive"
      className={screenStyles.root}
      containerClassName={screenStyles.container}
      footerActions={footerActions}
    >
      <article className={`${frameStyles.panel} ${screenStyles.briefing}`}>
        <p className={screenStyles.copy}>{data.helperCopy}</p>
      </article>
    </MenuFrame>
  );
}
