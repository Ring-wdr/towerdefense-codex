import * as Phaser from "phaser";
import {
  createGameSession,
  returnToCampaign,
  retryBattle,
  selectStage,
} from "../state/game-session.js";
import {
  createBodyTextStyle,
  createButton,
  createHeadingTextStyle,
  createPanel,
  PHASER_TEXT_FONTS,
} from "../ui/components.js";
import { getActionLayout, getViewportFrame } from "../ui/layout.js";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

export class OverlayScene extends Phaser.Scene {
  constructor() {
    super("OverlayScene");
  }

  create(data = {}) {
    const frame = getViewportFrame(this);
    const mode = data.mode ?? "paused";
    const stage = data.stage ?? getSession(this).selectedStage ?? 1;

    this.cameras.main.setBackgroundColor("rgba(6, 9, 8, 0.68)");
    createPanel(this, frame.panelX, frame.panelY + 24, frame.panelWidth, Math.min(frame.panelHeight - 48, frame.isMobile ? 318 : 336), {
      fill: 0x111311,
      alpha: 0.92,
    });

    const copy = this.getOverlayCopy(mode, stage);
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
        actions.positions[index],
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
  }

  getOverlayCopy(mode, stage) {
    if (mode === "game-over") {
      return {
        title: "Game Over",
        body: `Stage ${stage} defense collapsed. Retry the route or return to the theme screen.`,
        actions: [
          {
            label: "Retry",
            run: () => {
              const session = retryBattle(selectStage(getSession(this), stage));
              this.game.registry.set("session", session);
              this.scene.stop("BattleScene");
              this.scene.start("BattleScene", { stage });
            },
          },
          {
            label: "Back",
            run: () => {
              const battle = this.scene.get("BattleScene");
              battle.returnToTheme();
              this.scene.stop("BattleScene");
              this.scene.start("ThemeScene");
            },
          },
        ],
      };
    }

    if (mode === "campaign-complete") {
      return {
        title: "Campaign Complete",
        body: `Stage ${stage} cleared. Every stage is now replayable from the campaign flow.`,
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
              this.game.registry.set("session", returnToCampaign(getSession(this)));
              this.scene.start("CampaignScene");
            },
          },
        ],
      };
    }

    return {
      title: "Paused",
      body: `Stage ${stage} is on hold. Resume, retry, or step back to the theme screen.`,
      actions: [
        {
          label: "Resume",
          run: () => {
            const battle = this.scene.get("BattleScene");
            battle.resumeBattle();
            this.scene.resume("BattleScene");
            this.scene.stop();
          },
        },
        {
          label: "Retry",
          run: () => {
            const session = retryBattle(selectStage(getSession(this), stage));
            this.game.registry.set("session", session);
            this.scene.stop("BattleScene");
            this.scene.start("BattleScene", { stage });
          },
        },
        {
          label: "Back",
          run: () => {
            const battle = this.scene.get("BattleScene");
            battle.returnToTheme();
            this.scene.stop("BattleScene");
            this.scene.start("ThemeScene");
          },
        },
      ],
    };
  }
}
