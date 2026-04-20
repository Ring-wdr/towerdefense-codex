import * as Phaser from "phaser";
import { cycleThemeSelection, createGameSession } from "../state/game-session.js";
import {
  createBackdrop,
  createBodyTextStyle,
  createCommandButton,
  createTitleLockup,
  PHASER_TEXT_FONTS,
} from "../ui/components.js";
import { getBrowserSafeBottomInset, getSceneLayout } from "../ui/layout.js";
import titleCommandCrestUrl from "../../assets/phaser-ui/title-command-crest.png";

const TITLE_COMMAND_CREST_KEY = "phaser-ui-title-command-crest";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    if (!this.textures.exists(TITLE_COMMAND_CREST_KEY)) {
      this.load.image(TITLE_COMMAND_CREST_KEY, titleCommandCrestUrl);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#101813");
    this.game.registry.set("session", getSession(this));
    this.renderScene();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize() {
    this.scene.restart();
  }

  renderScene() {
    const layout = getSceneLayout(this, {
      safeBottomInset: getBrowserSafeBottomInset(),
    });
    const isCompactTitle = layout.height <= 360 || layout.focus.height < 180;
    createBackdrop(this, layout, { fillTop: 0x16231c, fillBottom: 0x08100c, accent: 0xd3a35d });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + (layout.isMobile ? 8 : 16),
      "CAMPAIGN FRONT",
      "Stage Command",
      {
        kickerSize: layout.isMobile ? 18 : 22,
        titleSize: layout.isMobile ? 46 : 72,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 40 : 120),
      },
    );

    this.add
      .text(
        layout.centerX,
        lockup.titleText.y + lockup.titleText.height + (isCompactTitle ? 14 : layout.isMobile ? 22 : 28),
        isCompactTitle
          ? "Survey the route. Pick the theater."
          : "Survey the route. Pick the theater. Commit to battle only when the brief is clear.",
        {
          ...createBodyTextStyle({
          color: "#d9d1c4",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${isCompactTitle ? (layout.isMobile ? 16 : 20) : layout.isMobile ? 18 : 24}px`,
          align: "center",
          wordWrap: { width: layout.contentWidth - (layout.isMobile ? 28 : 180) },
          lineSpacing: isCompactTitle ? 5 : 8,
        }),
        },
      )
      .setOrigin(0.5, 0);

    if (!isCompactTitle) {
      const crestY = lockup.titleText.y + lockup.titleText.height + (layout.isMobile ? 132 : 164);
      const crest = this.add.image(layout.centerX, crestY, TITLE_COMMAND_CREST_KEY).setOrigin(0.5);
      crest.setScale(layout.isMobile ? 0.22 : 0.28);
      crest.setAlpha(0.96);
    }

    const helperCopy = layout.isMobile
      ? "Single campaign route. Battle controls stay external."
      : "Single campaign route. Phaser-rendered front end. Battle controls remain external.";

    const commandRow = layout.getCommandRow(1, layout.isMobile ? 220 : 260);
    if (!isCompactTitle) {
      this.add
        .text(layout.centerX, layout.focus.bottom - (layout.isMobile ? 58 : 62), helperCopy, {
          ...createBodyTextStyle({
          color: "#8fa18f",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 14 : 17}px`,
          letterSpacing: 1,
          align: "center",
          wordWrap: layout.isMobile ? { width: layout.contentWidth - 56 } : undefined,
          }),
        })
        .setOrigin(0.5, 0.5);
    }

    createCommandButton(
      this,
      commandRow.positions[0],
      isCompactTitle ? layout.command.top + commandRow.buttonHeight / 2 : layout.command.centerY,
      commandRow.buttonWidth,
      commandRow.buttonHeight,
      "Start Campaign",
      () => {
        const nextSession = cycleThemeSelection(getSession(this), 0);
        this.game.registry.set("session", nextSession);
        this.scene.start("CampaignScene");
      },
      {
        variant: "primary",
        fontSize: layout.isMobile ? 24 : 30,
      },
    );
  }
}
