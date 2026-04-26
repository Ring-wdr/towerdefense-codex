import MenuFrame from "./MenuFrame";
import frameStyles from "./MenuFrame.module.css";
import screenStyles from "./TitleScreen.module.css";
import type { TitleScreenData } from "../screen-data";
import type { FooterAction } from "./MenuFrame";

interface TitleScreenProps {
  data: TitleScreenData;
  onStartCampaign: FooterAction["onClick"];
  onOpenShop: FooterAction["onClick"];
  onStartEndless: FooterAction["onClick"];
}

export default function TitleScreen({
  data,
  onStartCampaign,
  onOpenShop,
  onStartEndless,
}: TitleScreenProps) {
  const footerActions: FooterAction[] = [
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
      className={screenStyles.root ?? ""}
      containerClassName={screenStyles.container ?? ""}
      footerActions={footerActions}
    >
      <article className={`${frameStyles.panel} ${screenStyles.briefing}`}>
        <p className={screenStyles.copy}>{data.helperCopy}</p>
      </article>
    </MenuFrame>
  );
}
