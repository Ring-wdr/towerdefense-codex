import * as Phaser from "phaser";
import { createGameSession, returnToTitle, selectStage } from "../state/game-session.js";
import { isStageUnlocked } from "../../game/campaign-progress.js";
import {
  createBackdrop,
  createBodyTextStyle,
  createCommandButton,
  createHeadingTextStyle,
  createTitleLockup,
  PHASER_TEXT_FONTS,
} from "../ui/components.js";
import { getBrowserSafeBottomInset, getSceneLayout } from "../ui/layout.js";
import { getStageDefinition, getThemeOrder, getThemeStageNumbers } from "../../game/stages.js";
import themeFundamentalsSigilUrl from "../../assets/phaser-ui/theme-fundamentals-sigil.png";
import themeLateOperationsSigilUrl from "../../assets/phaser-ui/theme-late-operations-sigil.png";
import themePressureSigilUrl from "../../assets/phaser-ui/theme-pressure-sigil.png";

const THEME_SIGIL_KEYS = [
  { key: "phaser-ui-theme-sigil-0", url: themeFundamentalsSigilUrl },
  { key: "phaser-ui-theme-sigil-1", url: themePressureSigilUrl },
  { key: "phaser-ui-theme-sigil-2", url: themeLateOperationsSigilUrl },
];
const COMPACT_CAMPAIGN_BREAKPOINT = 960;

const THEME_CARD_STYLES = {
  "기초 방어": {
    kicker: "FOUNDATION LINE",
    label: "EARLY GRID",
    description: "직선과 코너를 먼저 장악해 초반 화력을 안정시키는 전선이다.",
    mobileDescription: "직선과 코너를 장악하는 초반 전선이다.",
    accent: 0x7fb486,
    accentText: "#a8d8ad",
    buttonFill: 0x85bc86,
    buttonText: "#102214",
    chipFill: 0x16261d,
    panelFill: 0x122019,
    footerFill: 0x0d1712,
    glow: 0x2f5640,
  },
  "압박 대응": {
    kicker: "PRESSURE LINE",
    label: "MID HOLD",
    description: "병목과 출구 압박을 읽으며 구간별 전담 배치를 만드는 전선이다.",
    mobileDescription: "병목과 출구 압박을 관리하는 중반 전선이다.",
    accent: 0xd8a25f,
    accentText: "#f0cc8c",
    buttonFill: 0xd8a25f,
    buttonText: "#211409",
    chipFill: 0x241b13,
    panelFill: 0x20170f,
    footerFill: 0x16100a,
    glow: 0x6d4220,
  },
  "후반 운용": {
    kicker: "FINAL LINE",
    label: "ENDGAME",
    description: "장거리 엄호와 압축 화력을 동시에 굴려야 버티는 후반 전선이다.",
    mobileDescription: "장거리 엄호와 압축 화력을 굴리는 후반 전선이다.",
    accent: 0x83a9c8,
    accentText: "#c3dcf3",
    buttonFill: 0x83a9c8,
    buttonText: "#0e1720",
    chipFill: 0x16212b,
    panelFill: 0x111b24,
    footerFill: 0x0d141b,
    glow: 0x294763,
  },
};

function getSession(scene) {
  return scene.game.registry.get("session") ?? createGameSession();
}

function getThemeSigilKey(theme) {
  const themeIndex = getThemeOrder().indexOf(theme);
  return THEME_SIGIL_KEYS[Math.max(0, themeIndex)]?.key ?? THEME_SIGIL_KEYS[0].key;
}

function hideBattleControls() {
  const controls = document.getElementById("battle-controls");
  if (controls) {
    controls.hidden = true;
  }
}

function getThemeCardStyle(theme) {
  return THEME_CARD_STYLES[theme] ?? THEME_CARD_STYLES["기초 방어"];
}

function getThemeEntryStage(theme) {
  const entryStageNumber = getThemeStageNumbers(theme)[0] ?? 1;
  return getStageDefinition(entryStageNumber);
}

function getThemeSelectionStage(session, theme) {
  const currentStage = getStageDefinition(session.selectedStage ?? 1);
  if (currentStage.theme === theme) {
    return currentStage;
  }

  return getThemeEntryStage(theme);
}

function getThemeProgress(session, theme) {
  const stageNumbers = getThemeStageNumbers(theme);
  return stageNumbers.filter((stageNumber) => session.clearedStages.includes(stageNumber)).length;
}

function setCampaignTheme(session, theme) {
  const stageNumber = getThemeStageNumbers(theme)[0] ?? session.selectedStage ?? 1;
  return {
    ...session,
    scene: "campaign",
    screen: "campaign-menu",
    selectedTheme: theme,
    selectedStage: stageNumber,
    activeStage: null,
  };
}

function renderLabelText(scene, x, y, value, color, size, options = {}) {
  return scene.add
    .text(x, y, value, createBodyTextStyle({
      color,
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: `${size}px`,
      fontStyle: options.fontStyle ?? "700",
      letterSpacing: options.letterSpacing ?? 2,
      align: options.align ?? "left",
      wordWrap: options.wordWrap,
      lineSpacing: options.lineSpacing,
      strokeThickness: options.strokeThickness ?? 2,
    }))
    .setOrigin(options.originX ?? 0, options.originY ?? 0);
}

function renderThemeChip(scene, x, y, width, label, fill, textColor) {
  const container = scene.add.container(x, y);
  const background = scene.add.rectangle(0, 0, width, 28, fill, 0.92).setOrigin(0);
  const border = scene.add.rectangle(0, 0, width, 28).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.1);
  const text = renderLabelText(scene, 12, 7, label, textColor, 13, {
    letterSpacing: 2,
    strokeThickness: 0,
  });
  container.add([background, border, text]);
  return container;
}

function createThemeSelectorChip(scene, config) {
  const container = scene.add.container(config.x, config.y);
  const active = Boolean(config.active);
  const showProgress = !config.layout.isMobile;
  const shadow = scene.add.rectangle(0, 4, config.width, config.height, 0x000000, active ? 0.22 : 0.16).setOrigin(0);
  const background = scene.add
    .rectangle(0, 0, config.width, config.height, active ? config.style.accent : 0x15201b, active ? 0.96 : 0.9)
    .setOrigin(0);
  const border = scene.add
    .rectangle(0, 0, config.width, config.height)
    .setOrigin(0)
    .setStrokeStyle(1, active ? 0xffffff : config.style.accent, active ? 0.24 : 0.36);
  const label = renderLabelText(
    scene,
    config.width / 2,
    showProgress ? config.height / 2 - 8 : config.height / 2,
    config.theme,
    active ? "#0f160f" : "#e5ece5",
    config.layout.isMobile ? 15 : 16,
    {
      originX: 0.5,
      originY: 0.5,
      align: "center",
      strokeThickness: 0,
      fontStyle: active ? "700" : "600",
    },
  );
  const hitArea = scene.add.zone(config.width / 2, config.height / 2, config.width, config.height);

  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on("pointerover", () => {
    container.setY(config.y - 2);
  });
  hitArea.on("pointerout", () => {
    container.setY(config.y);
  });
  hitArea.on("pointerdown", () => {
    container.setY(config.y + 1);
  });
  hitArea.on("pointerup", () => {
    container.setY(config.y);
    config.onPress();
  });

  container.add([shadow, background, border, label, hitArea]);
  if (showProgress) {
    const progress = renderLabelText(
      scene,
      config.width / 2,
      config.height / 2 + 10,
      `${config.clearedCount}/${config.stageCount} cleared`,
      active ? "#16311a" : config.style.accentText,
      11,
      {
        originX: 0.5,
        originY: 0.5,
        align: "center",
        strokeThickness: 0,
        letterSpacing: 1,
      },
    );
    container.add(progress);
  }
  return container;
}

function createThemePreviewCard(scene, config) {
  const container = scene.add.container(config.x, config.y);
  const backgroundLayer = scene.add.container(0, 0).setDepth(-9999);
  const foregroundLayer = scene.add.container(0, 0);
  const cardHeight = config.height;
  const style = config.style;
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.2);
  shadow.fillRoundedRect(0, 8, config.width, cardHeight, 26);

  const frame = scene.add.graphics();
  frame.fillStyle(style.panelFill, 0.96);
  frame.fillRoundedRect(0, 0, config.width, cardHeight, 26);
  frame.lineStyle(1, style.accent, 0.34);
  frame.strokeRoundedRect(0, 0, config.width, cardHeight, 26);
  frame.fillStyle(style.glow, 0.18);
  frame.fillCircle(config.width - 34, 34, 42);
  frame.fillStyle(0x000000, 0.18);
  frame.fillRect(0, cardHeight - 86, config.width, 86);

  const sigil = scene.add
    .image(config.width / 2, 64, getThemeSigilKey(config.theme))
    .setOrigin(0.5)
    .setScale(config.layout.isMobile ? 0.13 : 0.16)
    .setAlpha(0.74);

  const chip = renderThemeChip(scene, 16, 16, 98, config.label, style.chipFill, style.accentText);
  const title = scene.add
    .text(config.width / 2, cardHeight - 68, config.theme, createHeadingTextStyle({
      color: "#f5efe1",
      fontFamily: PHASER_TEXT_FONTS.heading,
      fontSize: `${config.layout.isMobile ? 22 : 24}px`,
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: config.width - 24 },
      strokeThickness: 4,
    }))
    .setOrigin(0.5, 0.5);
  const progress = renderLabelText(
    scene,
    config.width / 2,
    cardHeight - 30,
    config.locked ? "ENTRY LOCKED" : `${config.clearedCount}/${config.stageCount} cleared`,
    config.locked ? "#c4b49b" : style.accentText,
    12,
    {
      originX: 0.5,
      originY: 0.5,
      align: "center",
      strokeThickness: 0,
      letterSpacing: 1,
    },
  );
  const hitArea = scene.add.zone(config.width / 2, cardHeight / 2, config.width, cardHeight);

  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on("pointerover", () => {
    container.setY(config.y - 3);
  });
  hitArea.on("pointerout", () => {
    container.setY(config.y);
  });
  hitArea.on("pointerdown", () => {
    container.setY(config.y + 1);
  });
  hitArea.on("pointerup", () => {
    container.setY(config.y);
    config.onPress();
  });

  backgroundLayer.add([shadow, frame, sigil]);
  foregroundLayer.add([chip, title, progress]);
  container.add([backgroundLayer, foregroundLayer, hitArea]);
  return container;
}

function createThemeHeroCard(scene, config) {
  const container = scene.add.container(config.x, config.y);
  const style = config.style;
  const isCompact = Boolean(config.compact);
  const usesDesktopActionLane = !isCompact && !config.layout.isMobile;
  const contentWidth = config.width - 40;
  const cardHeight = config.height;
  const descriptionText = config.layout.isMobile ? "" : config.description;
  const desktopActionLaneWidth = usesDesktopActionLane ? 228 : 0;
  const textWrapWidth = contentWidth - (isCompact ? 8 : 146) - desktopActionLaneWidth;

  const panel = scene.add.graphics();
  panel.fillStyle(0x000000, 0.24);
  panel.fillRoundedRect(0, 10, config.width, cardHeight, 30);
  panel.fillStyle(style.footerFill, 0.98);
  panel.fillRoundedRect(0, 0, config.width, cardHeight, 30);
  panel.lineStyle(2, style.accent, 0.56);
  panel.strokeRoundedRect(0, 0, config.width, cardHeight, 30);
  panel.lineStyle(1, 0xffffff, 0.06);
  panel.strokeRoundedRect(12, 12, config.width - 24, cardHeight - 24, 22);

  const statusLabel = config.locked
    ? "ENTRY LOCKED"
    : config.clearedCount >= config.stageCount
      ? "FRONT SECURED"
      : `${config.clearedCount}/${config.stageCount} cleared`;
  const actionLabel = config.locked ? "VIEW BRIEFING" : "OPEN BRIEFING";

  const labelChip = renderThemeChip(scene, 24, 22, 132, config.label, style.chipFill, style.accentText);
  const statusChip = renderThemeChip(scene, config.width - 152, 22, 128, statusLabel, style.chipFill, style.accentText);
  const stageChip = renderThemeChip(scene, 24, 0, 124, `STAGE ${config.stage.number}`, style.chipFill, style.accentText);
  const kicker = renderLabelText(scene, 24, 0, style.kicker, style.accentText, 15, {
    letterSpacing: 3,
    strokeThickness: 0,
  });
  const title = scene.add
    .text(24, 0, config.theme, createHeadingTextStyle({
      color: "#f5efe1",
      fontFamily: PHASER_TEXT_FONTS.heading,
      fontSize: `${config.layout.isMobile ? 30 : isCompact ? 36 : 42}px`,
      fontStyle: "bold",
      wordWrap: { width: textWrapWidth },
      strokeThickness: 5,
    }))
    .setOrigin(0, 0);
  const description = descriptionText
    ? renderLabelText(scene, 24, 0, descriptionText, "#dfe7e0", isCompact ? 18 : 20, {
        wordWrap: { width: textWrapWidth },
        lineSpacing: isCompact ? 5 : 7,
        letterSpacing: 0,
        strokeThickness: 1,
        fontStyle: "500",
      })
    : null;

  const actionButtonWidth = isCompact ? config.width - 48 : config.layout.isMobile ? 132 : 152;
  const actionButtonHeight = 42;
  const actionButtonX = isCompact
    ? 24
    : usesDesktopActionLane
      ? config.width - actionButtonWidth - 34
      : config.width - actionButtonWidth - 24;
  const actionButtonY = cardHeight - actionButtonHeight - 24;
  const textBlockBottom = actionButtonY - (config.layout.isMobile ? 16 : 18);
  const descriptionY = description ? textBlockBottom - description.height : null;
  const titleY = description ? descriptionY - (config.layout.isMobile ? 10 : 12) - title.height : textBlockBottom - title.height;
  const kickerY = titleY - (config.layout.isMobile ? 12 : 14) - kicker.height;
  const stageChipY = kickerY - (config.layout.isMobile ? 16 : 18) - 28;

  stageChip.setY(stageChipY);
  kicker.setY(kickerY);
  title.setY(titleY);
  if (description) {
    description.setY(descriptionY);
  }

  const actionButton = scene.add
    .rectangle(actionButtonX, actionButtonY, actionButtonWidth, actionButtonHeight, style.buttonFill, 0.98)
    .setOrigin(0, 0);
  const actionBorder = scene.add
    .rectangle(actionButtonX, actionButtonY, actionButtonWidth, actionButtonHeight)
    .setOrigin(0, 0)
    .setStrokeStyle(1, 0xffffff, 0.14);
  const actionText = renderLabelText(
    scene,
    actionButtonX + actionButtonWidth / 2,
    actionButtonY + actionButtonHeight / 2,
    actionLabel,
    style.buttonText,
    config.layout.isMobile ? 13 : 14,
    {
      originX: 0.5,
      originY: 0.5,
      align: "center",
      strokeThickness: 0,
      letterSpacing: 2,
    },
  );

  actionButton.setInteractive({ useHandCursor: true });
  actionButton.on("pointerover", () => {
    container.setY(config.y - 2);
  });
  actionButton.on("pointerout", () => {
    container.setY(config.y);
  });
  actionButton.on("pointerdown", () => {
    container.setY(config.y + 1);
  });
  actionButton.on("pointerup", () => {
    container.setY(config.y);
    config.onOpen();
  });

  const hitArea = scene.add.zone(config.width / 2, cardHeight / 2, config.width, cardHeight);
  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on("pointerup", () => {
    config.onOpen();
  });

  container.add([
    panel,
    labelChip,
    statusChip,
    stageChip,
    actionButton,
    actionBorder,
    actionText,
    kicker,
    title,
    hitArea,
  ]);
  if (description) {
    container.add(description);
  }
  return container;
}

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super("CampaignScene");
  }

  preload() {
    for (const { key, url } of THEME_SIGIL_KEYS) {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    }
  }

  create() {
    hideBattleControls();
    this.cameras.main.setBackgroundColor("#101813");
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
    const session = getSession(this);
    const selectedTheme = session.selectedTheme ?? getThemeOrder()[0] ?? "기초 방어";
    const selectedStage = getThemeSelectionStage(session, selectedTheme);
    const selectedStyle = getThemeCardStyle(selectedTheme);
    const selectedStageNumbers = getThemeStageNumbers(selectedTheme);
    const selectedClearedCount = getThemeProgress(session, selectedTheme);
    const isCompactCampaignLayout = layout.width <= COMPACT_CAMPAIGN_BREAKPOINT;

    createBackdrop(this, layout, { fillTop: 0x12211b, fillBottom: 0x09100c, accent: selectedStyle.accent });

    createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      "CAMPAIGN MAP",
      selectedTheme,
      {
        kickerColor: selectedStyle.accentText,
        kickerSize: layout.isMobile ? 14 : 20,
        titleSize: layout.isMobile ? 30 : 56,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 32 : 180),
      },
    );

    if (layout.isMobile) {
      const chipGap = 8;
      const chipWidth = Math.floor((layout.contentWidth - chipGap * 2) / 3);
      const chipY = layout.focus.top + 4;
      const heroY = chipY + 58;
      const heroHeight = Math.max(0, layout.focus.bottom - heroY - 8);

      getThemeOrder().forEach((theme, index) => {
        const stageNumbers = getThemeStageNumbers(theme);
        createThemeSelectorChip(this, {
          x: layout.margin + index * (chipWidth + chipGap),
          y: chipY,
          width: chipWidth,
          height: 48,
          theme,
          layout,
          stageCount: stageNumbers.length,
          clearedCount: getThemeProgress(session, theme),
          active: theme === selectedTheme,
          style: getThemeCardStyle(theme),
          onPress: () => {
            this.game.registry.set("session", setCampaignTheme(getSession(this), theme));
            this.scene.restart();
          },
        });
      });

      createThemeHeroCard(this, {
        x: layout.margin,
        y: heroY,
        width: layout.contentWidth,
        height: heroHeight,
        layout,
        theme: selectedTheme,
        label: selectedStyle.label,
        style: selectedStyle,
        stage: selectedStage,
        description: selectedStage.summary ?? selectedStyle.description,
        mobileDescription: selectedStyle.description,
        compact: isCompactCampaignLayout,
        stageCount: selectedStageNumbers.length,
        clearedCount: selectedClearedCount,
        locked: !isStageUnlocked(session, selectedStage.number),
        onOpen: () => {
          const nextSession = selectStage(getSession(this), selectedStage.number);
          this.game.registry.set("session", nextSession);
          this.scene.start("ThemeScene");
        },
      });
    } else {
      const sideGap = isCompactCampaignLayout ? 12 : 18;
      const previewWidth = isCompactCampaignLayout
        ? Math.max(112, Math.min(132, Math.floor(layout.contentWidth * 0.14)))
        : Math.max(122, Math.min(176, Math.floor((layout.contentWidth - 360 - sideGap * 2) / 2)));
      const heroWidth = layout.contentWidth - previewWidth * 2 - sideGap * 2;
      const heroHeight = Math.max(0, layout.focus.height - (isCompactCampaignLayout ? 22 : 8));
      const previewHeight = Math.max(0, heroHeight - (isCompactCampaignLayout ? 82 : 42));
      const previewY = layout.focus.top + Math.floor((heroHeight - previewHeight) / 2);
      const heroX = layout.margin + previewWidth + sideGap;

      const themeOrder = getThemeOrder();
      const selectedIndex = Math.max(0, themeOrder.indexOf(selectedTheme));
      const previousTheme = themeOrder[(selectedIndex + themeOrder.length - 1) % themeOrder.length];
      const nextTheme = themeOrder[(selectedIndex + 1) % themeOrder.length];

      const leftStyle = getThemeCardStyle(previousTheme);
      const leftStages = getThemeStageNumbers(previousTheme);
      createThemePreviewCard(this, {
        x: layout.margin,
        y: previewY,
        width: previewWidth,
        height: previewHeight,
        theme: previousTheme,
        label: leftStyle.label,
        style: leftStyle,
        layout,
        stageCount: leftStages.length,
        clearedCount: getThemeProgress(session, previousTheme),
        locked: !isStageUnlocked(session, leftStages[0] ?? 1),
        onPress: () => {
          this.game.registry.set("session", setCampaignTheme(getSession(this), previousTheme));
          this.scene.restart();
        },
      });

      createThemeHeroCard(this, {
        x: heroX,
        y: layout.focus.top + (isCompactCampaignLayout ? 4 : 0),
        width: heroWidth,
        height: heroHeight,
        layout,
        theme: selectedTheme,
        label: selectedStyle.label,
        style: selectedStyle,
        stage: selectedStage,
        description: selectedStage.summary ?? selectedStyle.description,
        mobileDescription: selectedStyle.description,
        compact: isCompactCampaignLayout,
        stageCount: selectedStageNumbers.length,
        clearedCount: selectedClearedCount,
        locked: !isStageUnlocked(session, selectedStage.number),
        onOpen: () => {
          const nextSession = selectStage(getSession(this), selectedStage.number);
          this.game.registry.set("session", nextSession);
          this.scene.start("ThemeScene");
        },
      });

      const rightStyle = getThemeCardStyle(nextTheme);
      const rightStages = getThemeStageNumbers(nextTheme);
      createThemePreviewCard(this, {
        x: layout.width - layout.margin - previewWidth,
        y: previewY,
        width: previewWidth,
        height: previewHeight,
        theme: nextTheme,
        label: rightStyle.label,
        style: rightStyle,
        layout,
        stageCount: rightStages.length,
        clearedCount: getThemeProgress(session, nextTheme),
        locked: !isStageUnlocked(session, rightStages[0] ?? 1),
        onPress: () => {
          this.game.registry.set("session", setCampaignTheme(getSession(this), nextTheme));
          this.scene.restart();
        },
      });
    }

    const commandRow = layout.getCommandRow(2, layout.isMobile ? 158 : 188);
    createCommandButton(this, commandRow.positions[0], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Back", () => {
      const nextSession = returnToTitle(getSession(this));
      this.game.registry.set("session", nextSession);
      this.scene.start("TitleScene");
    }, {
      fontSize: layout.isMobile ? 18 : 22,
    });

    createCommandButton(this, commandRow.positions[1], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Briefing", () => {
      const nextSession = selectStage(getSession(this), selectedStage.number);
      this.game.registry.set("session", nextSession);
      this.scene.start("ThemeScene");
    }, {
      variant: "primary",
      fontSize: layout.isMobile ? 18 : 22,
    });
  }
}
