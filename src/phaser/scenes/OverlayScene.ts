import * as Phaser from "phaser";
import type { BattleScene } from "./BattleScene.js";
import {
  beginEndlessBattle,
  createGameSession,
  returnToCampaign,
  retryBattle,
  selectStage,
} from "../state/game-session.js";
import { loadMetaProgress } from "../../game/meta-progress.js";
import {
  createBodyTextStyle,
  createButton,
  createHeadingTextStyle,
  createPanel,
  PHASER_TEXT_FONTS,
} from "../ui/components.js";
import { getActionLayout, getViewportFrame } from "../ui/layout.js";
import type { BattleState } from "../../game/logic.js";
import type { BattleDraftChoice } from "../../game/battle-perks.js";
import type { BattleMode } from "../../game/logic.js";
import type { ViewportFrame, OverlayMode, OverlaySceneData } from "../runtime-types.js";
import type { GameSession } from "../state/game-session.js";

interface OverlayAction {
  label: string;
  run: () => void;
}

interface OverlayCopy {
  title: string;
  body: string;
  actions: OverlayAction[];
}

function getSession(scene: Phaser.Scene): GameSession {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getBattleScene(scene: Phaser.Scene): BattleScene {
  return scene.scene.get("BattleScene") as BattleScene;
}

export class OverlayScene extends Phaser.Scene {
  constructor() {
    super("OverlayScene");
  }

  create(data: OverlaySceneData = {}): void {
    const frame = getViewportFrame(this);
    const mode = data.mode ?? "paused";
    const stage = data.stage ?? getSession(this).selectedStage ?? 1;
    const battleMode = data.battleMode ?? getSession(this).battleMode ?? "campaign";
    const escHandler = () => {
      this.resumePausedBattle();
    };

    this.cameras.main.setBackgroundColor("rgba(6, 9, 8, 0.68)");
    if (mode === "draft") {
      this.renderDraftOverlay(frame, data.choices ?? []);
      return;
    }

    createPanel(this, frame.panelX, frame.panelY + 24, frame.panelWidth, Math.min(frame.panelHeight - 48, frame.isMobile ? 318 : 336), {
      fill: 0x111311,
      alpha: 0.92,
    });

    const copy = this.getOverlayCopy(mode, stage, battleMode);
    this.add
      .text(frame.centerX, frame.panelY + 72, copy.title, createHeadingTextStyle({
        color: "#f5efe1",
        fontFamily: PHASER_TEXT_FONTS.heading,
        fontSize: `${frame.isMobile ? 34 : 44}px`,
        fontStyle: "bold",
      }))
      .setOrigin(0.5, 0);

    this.add
      .text(frame.centerX, frame.panelY + 136, copy.body, createBodyTextStyle({
        color: "#d9d0bf",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${frame.isMobile ? 18 : 22}px`,
        align: "center",
        wordWrap: { width: frame.panelWidth - 72 },
        lineSpacing: 8,
      }))
      .setOrigin(0.5, 0);

    const actions = getActionLayout(frame, copy.actions.length, frame.isMobile ? 100 : 150);
    const buttonY = frame.panelY + (frame.isMobile ? 258 : 274);

    for (const [index, action] of copy.actions.entries()) {
      createButton(
        this,
        actions.positions[index]!,
        buttonY,
        actions.buttonWidth,
        frame.isMobile ? 54 : 58,
        action.label,
        () => {
          action.run();
        },
        {
          fontSize: frame.isMobile ? 20 : 24,
          backgroundColor: index === 0 ? 0x8a5a2f : 0x31414c,
          textColor: index === 0 ? "#fff0d6" : "#f5efe1",
        },
      );
    }

    if (mode === "paused" && this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", escHandler);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.keyboard?.off("keydown-ESC", escHandler);
      });
    }
  }

  renderDraftOverlay(frame: ViewportFrame, choices: BattleDraftChoice[]): void {
    const headingY = frame.panelY + (frame.isMobile ? 42 : 52);
    const titleY = frame.panelY + (frame.isMobile ? 70 : 82);
    const introY = frame.panelY + (frame.isMobile ? 114 : 136);

    createPanel(
      this,
      frame.panelX,
      frame.panelY + 16,
      frame.panelWidth,
      Math.min(frame.panelHeight - 32, frame.isMobile ? 540 : 430),
      {
        fill: 0x111311,
        alpha: 0.94,
        stroke: 0x92a0ff,
      },
    );

    this.add
      .text(frame.centerX, headingY, "FIELD CHOICE", createBodyTextStyle({
        color: "#9eabff",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${frame.isMobile ? 18 : 20}px`,
        letterSpacing: 4,
        fontStyle: "700",
      }))
      .setOrigin(0.5, 0);

    this.add
      .text(frame.centerX, titleY, "현장 보급", createHeadingTextStyle({
        color: "#f5efe1",
        fontFamily: PHASER_TEXT_FONTS.heading,
        fontSize: `${frame.isMobile ? 34 : 44}px`,
        fontStyle: "bold",
      }))
      .setOrigin(0.5, 0);

    this.add
      .text(frame.centerX, introY, "다음 웨이브 전에 현장 보급 하나를 선택한다.", createBodyTextStyle({
        color: "#d9d0bf",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${frame.isMobile ? 17 : 21}px`,
        align: "center",
        wordWrap: { width: frame.panelWidth - 72 },
        lineSpacing: 8,
      }))
      .setOrigin(0.5, 0);

    const columns = frame.isMobile ? 1 : Math.max(1, choices.length);
    const gap = frame.isMobile ? 8 : 16;
    const cardWidth = frame.isMobile
      ? frame.panelWidth - 52
      : Math.floor((frame.panelWidth - 52 - gap * (columns - 1)) / columns);
    const cardHeight = frame.isMobile ? 108 : 180;
    const startX = frame.panelX + 26;
    const startY = frame.panelY + (frame.isMobile ? 166 : 198);

    choices.forEach((choice: BattleDraftChoice, index: number) => {
      const column = frame.isMobile ? 0 : index;
      const row = frame.isMobile ? index : 0;
      const x = startX + column * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);
      const summaryY = y + (frame.isMobile ? 42 : 48);
      const descriptionY = y + (frame.isMobile ? 60 : 78);
      const actionCenterY = y + cardHeight - (frame.isMobile ? 24 : 34);
      createPanel(this, x, y, cardWidth, cardHeight, {
        fill: 0x171b2d,
        alpha: 0.96,
        stroke: 0x92a0ff,
      });

      this.add
        .text(x + 14, y + 14, choice.title ?? "", createHeadingTextStyle({
          color: "#eef1ff",
          fontFamily: PHASER_TEXT_FONTS.heading,
          fontSize: `${frame.isMobile ? 24 : 28}px`,
          strokeThickness: 4,
        }))
        .setOrigin(0, 0);

      this.add
        .text(x + 14, summaryY, choice.summary ?? "", createBodyTextStyle({
          color: "#9eabff",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${frame.isMobile ? 13 : 16}px`,
          fontStyle: "700",
          wordWrap: { width: frame.isMobile ? cardWidth - 124 : cardWidth - 124 },
        }))
        .setOrigin(0, 0);

      this.add
        .text(x + 14, descriptionY, choice.description ?? "", createBodyTextStyle({
          color: "#d8dcf5",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${frame.isMobile ? 14 : 17}px`,
          wordWrap: { width: cardWidth - 28 },
          lineSpacing: frame.isMobile ? 4 : 6,
        }))
        .setOrigin(0, 0);

      createButton(
        this,
        x + cardWidth - (frame.isMobile ? 50 : 58),
        actionCenterY,
        frame.isMobile ? 76 : 92,
        frame.isMobile ? 30 : 38,
        "Take",
        () => {
          this.applyDraftChoice(choice.id);
        },
        {
          backgroundColor: 0x6b7dff,
          strokeColor: 0xd9e0ff,
          textColor: "#fdfcff",
          fontSize: frame.isMobile ? 15 : 17,
        },
      );
    });
  }

  getOverlayCopy(mode: OverlayMode, stage: number, battleMode: BattleMode = "campaign"): OverlayCopy {
    const isEndless = battleMode === "endless";

    if (mode === "game-over") {
      return {
        title: "Game Over",
        body: isEndless
          ? "무한 전장 방어선이 무너졌다. 같은 도전을 다시 시도하거나 타이틀로 복귀한다."
          : `Stage ${stage} 방어선이 무너졌다. 같은 구간을 다시 시도하거나 브리핑으로 복귀한다.`,
        actions: [
          {
            label: "Retry",
            run: () => {
              const session = isEndless
                ? beginEndlessBattle(getSession(this), this.game.registry.get("metaProgress") ?? loadMetaProgress())
                : retryBattle(selectStage(getSession(this), stage));
              this.game.registry.set("session", session);
              this.scene.stop("BattleScene");
              this.scene.start("BattleScene", isEndless ? { mode: "endless" } : { stage });
            },
          },
          {
            label: "Back",
            run: () => {
              const battle = getBattleScene(this);
              battle.returnToTheme();
              this.scene.stop("BattleScene");
              this.scene.stop();
            },
          },
        ],
      };
    }

    if (mode === "campaign-complete") {
      return {
        title: "Campaign Complete",
        body: `Stage ${stage} 확보 완료. 이제 모든 전장을 캠페인에서 다시 선택할 수 있다.`,
        actions: [
          {
            label: "Replay",
            run: () => {
              const session = retryBattle(selectStage(getSession(this), stage));
              this.game.registry.set("session", session);
              this.scene.start("BattleScene", { stage });
            },
          },
          {
            label: "Campaign",
            run: () => {
              const nextSession = returnToCampaign(getSession(this));
              this.game.registry.set("session", nextSession);
              const battle = getBattleScene(this);
              battle.exitToMenu(nextSession);
              this.scene.stop("BattleScene");
              this.scene.stop();
            },
          },
        ],
      };
    }

    return {
      title: "Paused",
      body: isEndless
        ? "무한 전장 교전이 중지됐다. 전투를 재개하거나 타이틀로 복귀할 수 있다."
        : `Stage ${stage} 교전이 중지됐다. 전투를 재개하거나 재정비 후 복귀할 수 있다.`,
      actions: [
        {
          label: "Resume",
          run: () => {
            this.resumePausedBattle();
          },
        },
        {
          label: "Retry",
          run: () => {
            const session = isEndless
              ? beginEndlessBattle(getSession(this), this.game.registry.get("metaProgress") ?? loadMetaProgress())
              : retryBattle(selectStage(getSession(this), stage));
            this.game.registry.set("session", session);
            this.scene.stop("BattleScene");
            this.scene.start("BattleScene", isEndless ? { mode: "endless" } : { stage });
          },
        },
        {
          label: "Back",
          run: () => {
            const battle = getBattleScene(this);
            battle.returnToTheme();
            this.scene.stop("BattleScene");
            this.scene.stop();
          },
        },
      ],
    };
  }

  resumePausedBattle(): void {
    const battle = getBattleScene(this);
    battle.resumeBattle();
    this.scene.resume("BattleScene");
    this.scene.stop();
  }

  applyDraftChoice(perkId: BattleState["draftHistory"][number]): void {
    const battle = getBattleScene(this);
    battle.resolveDraftChoice(perkId);
    this.scene.resume("BattleScene");
    this.scene.stop();
  }
}
