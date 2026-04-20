import Phaser from "phaser";
import { cycleThemeSelection, createGameSession } from "../state/game-session.js";
import { createBackdrop, createCommandButton, createTitleLockup } from "../ui/components.js";
import { getSceneLayout } from "../ui/layout.js";

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
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
    const layout = getSceneLayout(this);
    const isCompactTitle = layout.height <= 360 || layout.focus.height < 180;
    createBackdrop(this, layout, { fillTop: 0x16231c, fillBottom: 0x08100c, accent: 0xd3a35d });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + (layout.isMobile ? 8 : 16),
      "CAMPAIGN FRONT",
      "Stage Command",
      {
        kickerSize: layout.isMobile ? 16 : 18,
        titleSize: layout.isMobile ? 40 : 62,
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
          color: "#d9d1c4",
          fontFamily: "Segoe UI",
          fontSize: `${isCompactTitle ? (layout.isMobile ? 14 : 18) : layout.isMobile ? 16 : 21}px`,
          align: "center",
          wordWrap: { width: layout.contentWidth - (layout.isMobile ? 28 : 180) },
          lineSpacing: isCompactTitle ? 4 : 7,
        },
      )
      .setOrigin(0.5, 0);

    const helperCopy = layout.isMobile
      ? "Single campaign route. Battle controls stay external."
      : "Single campaign route. Phaser-rendered front end. Battle controls remain external.";

    const commandRow = layout.getCommandRow(1, layout.isMobile ? 220 : 260);
    if (!isCompactTitle) {
      this.add
        .text(layout.centerX, layout.focus.bottom - (layout.isMobile ? 58 : 62), helperCopy, {
          color: "#8fa18f",
          fontFamily: "Trebuchet MS",
          fontSize: `${layout.isMobile ? 12 : 15}px`,
          letterSpacing: 1,
          align: "center",
          wordWrap: layout.isMobile ? { width: layout.contentWidth - 56 } : undefined,
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
        fontSize: layout.isMobile ? 22 : 26,
      },
    );
  }
}
