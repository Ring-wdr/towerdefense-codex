import * as Phaser from "phaser";
import { getStageDefinition, getThemeOrder, getThemeStageNumbers } from "../../game/stages.js";
import { beginBattleFromSelection, createGameSession, returnToCampaign, selectStage } from "../state/game-session.js";
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
import { getRoadCurvePoints, getThemeClusterLayout } from "./theme-cluster-layout.js";
import themeFundamentalsSigilUrl from "../../assets/phaser-ui/theme-fundamentals-sigil.png";
import themeLateOperationsSigilUrl from "../../assets/phaser-ui/theme-late-operations-sigil.png";
import themePressureSigilUrl from "../../assets/phaser-ui/theme-pressure-sigil.png";

const THEME_SIGIL_KEYS = [
  { key: "phaser-ui-theme-sigil-0", url: themeFundamentalsSigilUrl },
  { key: "phaser-ui-theme-sigil-1", url: themePressureSigilUrl },
  { key: "phaser-ui-theme-sigil-2", url: themeLateOperationsSigilUrl },
];

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

function getThemeStageIndex(stageNumbers, stageNumber) {
  const index = stageNumbers.indexOf(stageNumber);
  return index >= 0 ? index : 0;
}

function getRoadStyle(road) {
  if (road.kind === "exit") {
    return road.tone === "active"
      ? { width: 5, color: 0xe5bb79, alpha: 0.82, glowWidth: 9, glowAlpha: 0.12 }
      : { width: 3, color: 0x6e836f, alpha: 0.54, glowWidth: 7, glowAlpha: 0.08 };
  }

  return road.tone === "active"
    ? { width: 7, color: 0xe1b16d, alpha: 0.84, glowWidth: 12, glowAlpha: 0.14 }
    : { width: 4, color: 0x5d7561, alpha: 0.58, glowWidth: 8, glowAlpha: 0.08 };
}

function drawRoadStroke(graphics, road, width, color, alpha) {
  const points = getRoadCurvePoints(road, 24);
  graphics.lineStyle(width, color, alpha);
  graphics.strokePoints(points, false, false);
}

function drawRoadNetwork(graphics, roads) {
  for (const road of roads) {
    const style = getRoadStyle(road);
    drawRoadStroke(graphics, road, style.glowWidth, 0x000000, style.glowAlpha);
    drawRoadStroke(graphics, road, style.width, style.color, style.alpha);

    if (road.kind === "exit") {
      const angle = Math.atan2(road.end.y - road.controlB.y, road.end.x - road.controlB.x);
      const wingLength = 13;
      graphics.lineStyle(3, style.color, Math.min(0.9, style.alpha + 0.08));
      graphics.beginPath();
      graphics.moveTo(road.end.x, road.end.y);
      graphics.lineTo(
        road.end.x - Math.cos(angle - Math.PI / 6) * wingLength,
        road.end.y - Math.sin(angle - Math.PI / 6) * wingLength,
      );
      graphics.moveTo(road.end.x, road.end.y);
      graphics.lineTo(
        road.end.x - Math.cos(angle + Math.PI / 6) * wingLength,
        road.end.y - Math.sin(angle + Math.PI / 6) * wingLength,
      );
      graphics.strokePath();
    }
  }
}

function createStageNode(scene, node, stage, isLocked, onPress) {
  const container = scene.add.container(node.x, node.y);
  const graphics = scene.add.graphics();
  const hitAreaSize = node.radius * 2.8;
  const hitArea = scene.add.zone(0, 0, hitAreaSize, hitAreaSize);
  const labelX = node.labelDx;
  const labelY = node.labelDy;
  const labelOriginX = node.labelAlign === "left" ? 0 : node.labelAlign === "right" ? 1 : 0.5;
  const isSelected = node.state === "selected";
  const isCleared = node.state === "cleared";
  const isAvailable = node.state === "available";
  const nameOffsetY = node.isMobile ? 18 : 22;
  const statusOffsetY = node.isMobile ? 42 : 56;
  const fillColor = isSelected ? 0xd6a869 : isCleared ? 0x557765 : isLocked ? 0x1b2320 : 0x24362c;
  const fillAlpha = isLocked ? 0.64 : 0.96;
  const borderColor = isSelected ? 0xf6ddb1 : isCleared ? 0xb7d1bc : isLocked ? 0x526057 : 0x8aa089;
  const innerTextColor = isSelected ? "#18120d" : isLocked ? "#95a19a" : "#eff3e9";
  const stageTag = scene.add
    .text(0, 0, `${node.order}`, createHeadingTextStyle({
      color: innerTextColor,
      fontFamily: PHASER_TEXT_FONTS.heading,
      fontSize: `${isSelected ? 24 : 18}px`,
      stroke: isSelected ? "#f6ddb1" : "#09100d",
      strokeThickness: isSelected ? 0 : 4,
    }))
    .setOrigin(0.5);
  const label = scene.add
    .text(labelX, labelY, `STAGE ${node.order}`, createBodyTextStyle({
      color: isSelected ? "#f1d7aa" : isLocked ? "#86948b" : "#bfd0c2",
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: `${isSelected ? 17 : 15}px`,
      letterSpacing: 2,
      fontStyle: "700",
      align: node.labelAlign,
    }))
    .setOrigin(labelOriginX, 0.5);
  const name = scene.add
    .text(labelX, labelY + nameOffsetY, stage.name, createBodyTextStyle({
      color: isSelected ? "#fff3dd" : isLocked ? "#acb6b1" : "#e7ece4",
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: `${node.isMobile ? (isSelected ? 18 : 16) : isSelected ? 20 : 18}px`,
      fontStyle: isSelected ? "700" : "600",
      align: node.labelAlign,
      wordWrap: { width: node.isMobile ? 128 : 180 },
    }))
    .setOrigin(labelOriginX, 0);
  const status = scene.add
    .text(labelX, labelY + statusOffsetY, isLocked ? "LOCKED" : isCleared ? "CLEARED" : isAvailable ? "READY" : "SELECTED", createBodyTextStyle({
      color: isSelected ? "#f6ddb1" : isLocked ? "#7f8d85" : "#97b4a1",
      fontFamily: PHASER_TEXT_FONTS.body,
      fontSize: `${node.isMobile ? 12 : 14}px`,
      letterSpacing: 2,
      fontStyle: "700",
      align: node.labelAlign,
    }))
    .setOrigin(labelOriginX, 0);

  drawNode();

  if (!isLocked) {
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on("pointerover", () => {
      container.setScale(1.04);
    });
    hitArea.on("pointerout", () => {
      container.setScale(1);
    });
    hitArea.on("pointerdown", () => {
      container.setScale(0.98);
    });
    hitArea.on("pointerup", () => {
      container.setScale(1.05);
      onPress();
    });
  }

  container.add([graphics, stageTag, label, name, status, hitArea]);
  return container;

  function drawNode() {
    graphics.clear();
    graphics.fillStyle(0x000000, isLocked ? 0.18 : 0.22);
    graphics.fillCircle(5, 7, node.radius + (isSelected ? 10 : 7));

    if (isSelected) {
      graphics.fillStyle(0xe7c58f, 0.12);
      graphics.fillCircle(0, 0, node.radius + 18);
    }

    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillCircle(0, 0, node.radius);
    graphics.lineStyle(isSelected ? 3 : 2, borderColor, isLocked ? 0.6 : 0.95);
    graphics.strokeCircle(0, 0, node.radius);

    if (!isLocked) {
      graphics.fillStyle(isSelected ? 0xfff2d9 : 0xd7e4d8, isSelected ? 0.9 : 0.72);
      graphics.fillCircle(node.radius + 10, -node.radius + 6, isSelected ? 4 : 3);
    }
  }
}

export class ThemeScene extends Phaser.Scene {
  constructor() {
    super("ThemeScene");
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
    const stage = getStageDefinition(session.selectedStage ?? 1);
    const themeOrder = getThemeOrder();
    const themeIndex = Math.max(0, themeOrder.indexOf(stage.theme));
    const themeStageNumbers = getThemeStageNumbers(stage.theme);
    const themeStageIndex = getThemeStageIndex(themeStageNumbers, stage.number);
    createBackdrop(this, layout, { fillTop: 0x161e1a, fillBottom: 0x0a100d, accent: 0xd2aa65 });

    const lockup = createTitleLockup(
      this,
      layout.centerX,
      layout.header.top + 2,
      `${stage.theme} 전선`,
      stage.name,
      {
        kickerSize: layout.isMobile ? 17 : 20,
        titleSize: layout.isMobile ? 35 : 52,
        wordWrapWidth: layout.contentWidth - (layout.isMobile ? 28 : 180),
      },
    );

    this.add
      .text(layout.centerX, lockup.titleText.y + lockup.titleText.height + 14, `Stage ${stage.number}`, createHeadingTextStyle({
        color: "#89a693",
        fontFamily: PHASER_TEXT_FONTS.heading,
        fontSize: `${layout.isMobile ? 20 : 24}px`,
        letterSpacing: 4,
        strokeThickness: 4,
      }))
      .setOrigin(0.5, 0);

    this.add
      .text(layout.centerX, lockup.titleText.y + lockup.titleText.height + 54, `ROUTE ${themeStageIndex + 1} OF ${themeStageNumbers.length}`, createBodyTextStyle({
        color: "#c9d5c3",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${layout.isMobile ? 15 : 18}px`,
        letterSpacing: 2,
        fontStyle: "600",
      }))
      .setOrigin(0.5, 0.5);

    const battleLocked = !isStageUnlocked(session, stage.number);
    const focusPaddingTop = layout.isMobile ? 10 : 18;
    const focusPaddingBottom = layout.isMobile ? 8 : 12;
    const fieldTop = layout.focus.top + focusPaddingTop;
    const fieldWidth = Math.max(0, layout.contentWidth - (layout.isMobile ? 12 : 44));
    const fieldLeft = (layout.width - fieldWidth) / 2;
    const maxFieldHeight = Math.max(0, layout.focus.height - (layout.isMobile ? 84 : 114));
    const desiredFieldHeight = Math.round(layout.focus.height * (layout.isMobile ? 0.64 : 0.68));
    const fieldHeight = Math.max(
      Math.min(maxFieldHeight, layout.isMobile ? 136 : 190),
      Math.min(maxFieldHeight, desiredFieldHeight),
    );
    const summaryTop = fieldTop + fieldHeight + (layout.isMobile ? 10 : 14);
    const summaryHeight = Math.max(0, layout.focus.bottom - focusPaddingBottom - summaryTop);
    const summaryVisible = summaryHeight >= (layout.isMobile ? 52 : 64);
    const unlockedStageNumbers = themeStageNumbers.filter((stageNumber) => isStageUnlocked(session, stageNumber));
    const cluster = getThemeClusterLayout({
      width: fieldWidth,
      height: fieldHeight,
      stageNumbers: themeStageNumbers,
      selectedStage: stage.number,
      clearedStages: session.clearedStages ?? [],
      unlockedStages: unlockedStageNumbers,
      themeIndex,
      themeCount: themeOrder.length,
      isMobile: layout.isMobile,
    });

    const fieldGraphics = this.add.graphics();
    fieldGraphics.fillStyle(0x122019, 0.48);
    fieldGraphics.fillRoundedRect(fieldLeft, fieldTop, fieldWidth, fieldHeight, 26);
    fieldGraphics.lineStyle(2, 0x799077, 0.26);
    fieldGraphics.strokeRoundedRect(fieldLeft, fieldTop, fieldWidth, fieldHeight, 26);
    fieldGraphics.lineStyle(1, 0xd5b06d, 0.14);
    fieldGraphics.beginPath();
    fieldGraphics.moveTo(fieldLeft + 24, fieldTop + 30);
    fieldGraphics.lineTo(fieldLeft + fieldWidth - 24, fieldTop + 30);
    fieldGraphics.strokePath();

    this.add
      .text(fieldLeft + 24, fieldTop + 14, "FIELD ROUTE", createBodyTextStyle({
        color: "#d6ae72",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${layout.isMobile ? 15 : 16}px`,
        letterSpacing: 2,
        fontStyle: "700",
      }))
      .setOrigin(0, 0);

    this.add
      .text(fieldLeft + fieldWidth - 24, fieldTop + 14, themeIndex < themeOrder.length - 1 ? "NEXT FRONT" : "FINAL LINE", createBodyTextStyle({
        color: "#96afa0",
        fontFamily: PHASER_TEXT_FONTS.body,
        fontSize: `${layout.isMobile ? 14 : 15}px`,
        letterSpacing: 2,
        fontStyle: "700",
      }))
      .setOrigin(1, 0);

    const clusterContainer = this.add.container(fieldLeft, fieldTop);
    const sigil = this.add.image(fieldWidth * 0.84, fieldHeight * 0.22, getThemeSigilKey(stage.theme)).setOrigin(0.5);
    sigil.setScale(layout.isMobile ? 0.14 : 0.18);
    sigil.setAlpha(0.1);
    const roadGraphics = this.add.graphics();
    drawRoadNetwork(roadGraphics, cluster.roads);
    clusterContainer.add([sigil, roadGraphics]);

    for (const node of cluster.nodes) {
      const nodeStage = getStageDefinition(node.stageNumber);
      clusterContainer.add(createStageNode(this, node, nodeStage, node.state === "locked", () => {
        const nextSession = selectStage(getSession(this), node.stageNumber);
        this.game.registry.set("session", nextSession);
        this.scene.restart();
      }));
    }

    if (summaryVisible) {
      const summaryWidth = fieldWidth;
      const summaryLeft = fieldLeft;
      const summaryGraphics = this.add.graphics();
      summaryGraphics.fillStyle(0x14201b, 0.72);
      summaryGraphics.fillRoundedRect(summaryLeft, summaryTop, summaryWidth, summaryHeight, 18);
      summaryGraphics.lineStyle(1, 0x7d8f7c, 0.38);
      summaryGraphics.strokeRoundedRect(summaryLeft, summaryTop, summaryWidth, summaryHeight, 18);

      this.add
        .text(layout.centerX, summaryTop + 12, battleLocked ? "ENTRY LOCKED" : "TACTICAL BRIEF", createBodyTextStyle({
          color: "#d6ae72",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 16 : 18}px`,
          letterSpacing: 3,
          fontStyle: "700",
        }))
        .setOrigin(0.5, 0);

      this.add
        .text(layout.centerX, summaryTop + 40, battleLocked
          ? "이 구간은 아직 봉쇄 상태다. 캠페인에서 앞선 전장을 먼저 확보해야 한다."
          : stage.summary, createBodyTextStyle({
          color: "#ece5d7",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 16 : 18}px`,
          align: "center",
          wordWrap: { width: summaryWidth - (layout.isMobile ? 34 : 56) },
          lineSpacing: 7,
        }))
        .setOrigin(0.5, 0);
    }

    const commandRow = layout.getCommandRow(2, layout.isMobile ? 144 : 196);
    createCommandButton(this, commandRow.positions[0], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, "Back", () => {
      const nextSession = returnToCampaign(getSession(this));
      this.game.registry.set("session", nextSession);
      this.scene.start("CampaignScene");
    });

    if (battleLocked && !summaryVisible) {
      this.add
        .text(layout.centerX, layout.command.top + (layout.isMobile ? 8 : 10), "이 구간은 아직 봉쇄 상태다. 캠페인에서 앞선 전장을 먼저 확보해야 한다.", createBodyTextStyle({
          color: "#d6ae72",
          fontFamily: PHASER_TEXT_FONTS.body,
          fontSize: `${layout.isMobile ? 15 : 18}px`,
          align: "center",
          wordWrap: { width: layout.contentWidth - (layout.isMobile ? 32 : 120) },
          fontStyle: "600",
        }))
        .setOrigin(0.5, 0);
    }

    createCommandButton(this, commandRow.positions[1], layout.command.centerY, commandRow.buttonWidth, commandRow.buttonHeight, battleLocked ? "Locked" : "Enter Battle", () => {
      if (battleLocked) {
        const nextSession = returnToCampaign(getSession(this));
        this.game.registry.set("session", nextSession);
        this.scene.start("CampaignScene");
        return;
      }

      const nextSession = beginBattleFromSelection(getSession(this));
      this.game.registry.set("session", nextSession);
      if (nextSession.scene === "battle") {
        this.scene.start("BattleScene", { stage: nextSession.activeStage ?? nextSession.selectedStage ?? 1 });
      }
    }, {
      variant: battleLocked ? undefined : "primary",
      fontSize: layout.isMobile ? 21 : 25,
    });
  }
}
