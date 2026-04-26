import { describe, expect, test } from "vitest";

import * as layoutModule from "../src/phaser/ui/layout.js";

function createScene(width: number, height: number) {
  return {
    scale: { width, height },
  };
}

if (process.env.VITEST) {
  describe("phaser layout", () => {
    test("getSceneLayout returns header, focus, and command zones for desktop", () => {
      const layout = layoutModule.getSceneLayout(createScene(1280, 720));

      expect(layout.isMobile).toBe(false);
      expect(layout.header.height).toBeGreaterThan(0);
      expect(layout.focus.height).toBeGreaterThan(0);
      expect(layout.command.height).toBeGreaterThan(0);
      expect(layout.focus.top).toBeGreaterThanOrEqual(layout.header.bottom);
      expect(layout.command.top).toBeGreaterThanOrEqual(layout.focus.top);
      expect(layout.command.bottom).toBeLessThanOrEqual(layout.height - layout.margin);
    });

  test("getSceneLayout compacts safely on short mobile viewports", () => {
    const layout = layoutModule.getSceneLayout(createScene(390, 720));

    expect(layout.isMobile).toBe(true);
    expect(layout.isShort).toBe(true);
    expect(layout.focus.height).toBeGreaterThanOrEqual(180);
    expect(layout.command.height).toBeGreaterThanOrEqual(88);
    expect(layout.command.bottom).toBeLessThanOrEqual(layout.height - layout.margin);
  });

  test("getSceneLayout keeps action row width inside the viewport", () => {
    const layout = layoutModule.getSceneLayout(createScene(430, 932));
    const row = layout.getCommandRow(2, 156);

    expect(row.positions).toHaveLength(2);
    expect(row.buttonWidth).toBeLessThanOrEqual(layout.contentWidth);
    expect(row.left).toBeGreaterThanOrEqual(layout.margin);
    expect(row.right).toBeLessThanOrEqual(layout.width - layout.margin);
  });

  test("layout module preserves compatibility exports and avoids overlap on short viewports", () => {
    expect(typeof layoutModule.getViewportFrame).toBe("function");
    expect(typeof layoutModule.getActionLayout).toBe("function");

    const scene = createScene(390, 400);
    const layout = layoutModule.getSceneLayout(scene);
    const frame = layoutModule.getViewportFrame(scene);
    const action = layoutModule.getActionLayout(frame, 3, 156);

    expect(layout.focus.bottom).toBeLessThanOrEqual(layout.command.top);
    expect(frame.panelHeight).toBeGreaterThan(0);
    expect(action.positions.length).toBeGreaterThan(0);
    expect(action.buttonWidth).toBeGreaterThan(0);
    expect(action.buttonHeight).toBeGreaterThan(0);
  });

  test("getSceneLayout stays ordered on extremely short viewports", () => {
    const layout = layoutModule.getSceneLayout(createScene(390, 240));

    expect(layout.header.bottom).toBeLessThanOrEqual(layout.focus.top);
    expect(layout.focus.bottom).toBeLessThanOrEqual(layout.command.top);
    expect(layout.command.top).toBeLessThanOrEqual(layout.command.bottom);
    expect(layout.focus.height).toBeGreaterThanOrEqual(0);
  });

  test("getSceneLayout clamps tiny viewport geometry", () => {
    const layout = layoutModule.getSceneLayout(createScene(20, 20));
    const row = layout.getCommandRow(3, 18);

    expect(layout.contentWidth).toBeGreaterThanOrEqual(0);
    expect(layout.contentHeight).toBeGreaterThanOrEqual(0);
    expect(row.buttonHeight).toBeLessThanOrEqual(layout.command.height);
    expect(row.buttonWidth).toBeGreaterThanOrEqual(0);
    expect(row.left).toBeLessThanOrEqual(row.right);
    expect(row.positions[0]!).toBeLessThanOrEqual(row.positions[1]!);
    expect(row.positions[1]!).toBeLessThanOrEqual(row.positions[2]!);
  });

  test("getBattleViewportLayout shrinks the battle board to fit narrow viewports", () => {
    expect(typeof layoutModule.getBattleViewportLayout).toBe("function");

    const layout = layoutModule.getBattleViewportLayout(createScene(390, 720), 720, 480);

    expect(layout.scale).toBeLessThan(1);
    expect(layout.boardWidth).toBeLessThan(720);
    expect(layout.boardHeight).toBeLessThan(480);
    expect(layout.boardLeft).toBeGreaterThanOrEqual(0);
    expect(layout.boardRight).toBeLessThanOrEqual(390);
    expect(layout.boardBottom).toBeLessThanOrEqual(720);
  });

  test("getBattleViewportLayout preserves the base board size on roomy viewports", () => {
    expect(typeof layoutModule.getBattleViewportLayout).toBe("function");

    const layout = layoutModule.getBattleViewportLayout(createScene(1440, 900), 720, 480);

    expect(layout.scale).toBe(1);
    expect(layout.boardWidth).toBe(720);
    expect(layout.boardHeight).toBe(480);
    expect(layout.boardLeft).toBe(Math.round((1440 - 720) / 2));
  });

  test("getBattleViewportLayout pins the battle board directly below the HUD padding", () => {
    const layout = layoutModule.getBattleViewportLayout(createScene(1280, 900), 720, 480, {
      topPadding: 92,
      bottomPadding: 24,
    });

    expect(layout.boardTop).toBe(92);
  });

  test("getBattleViewportLayout reserves space for the bottom dock on tablet widths", () => {
    const layout = layoutModule.getBattleViewportLayout(createScene(735, 869), 640, 640, {
      topPadding: 92,
      bottomPadding: 24,
      forceBottomDock: true,
      dockBottomPadding: 220,
      compactDockBottomPadding: 232,
    });

    expect(layout.usesBottomDock).toBe(true);
    expect(layout.bottomPadding).toBe(220);
    expect(layout.scale).toBeLessThan(1);
    expect(layout.boardBottom).toBeLessThanOrEqual(869 - 220);
  });

  test("getBattleViewportLayout can reserve bottom dock space on wide viewports too", () => {
    const layout = layoutModule.getBattleViewportLayout(createScene(1280, 900), 720, 480, {
      topPadding: 92,
      bottomPadding: 24,
      forceBottomDock: true,
      dockBottomPadding: 180,
    });

    expect(layout.usesBottomDock).toBe(true);
    expect(layout.bottomPadding).toBe(180);
    expect(layout.boardBottom).toBeLessThanOrEqual(900 - 180);
  });

  test("getSceneLayout reserves extra command safe area when the browser UI overlaps the bottom edge", () => {
    const layout = layoutModule.getSceneLayout(createScene(390, 844), {
      safeBottomInset: 48,
    });

    expect(layout.safeBottomInset).toBe(48);
    expect(layout.command.bottom).toBe(844 - layout.margin - 48);
  });

  test("getBattleViewportLayout adds safe bottom inset on top of dock padding", () => {
    const layout = layoutModule.getBattleViewportLayout(createScene(390, 844), 720, 480, {
      topPadding: 92,
      bottomPadding: 24,
      forceBottomDock: true,
      dockBottomPadding: 220,
      safeBottomInset: 36,
    });

    expect(layout.bottomPadding).toBe(256);
    expect(layout.boardBottom).toBeLessThanOrEqual(844 - 256);
  });

  test("getBattleViewportLayout lets the battle board breathe on narrow docked phones", () => {
    const layout = layoutModule.getBattleViewportLayout(createScene(390, 844), 720, 480, {
      topPadding: 92,
      bottomPadding: 24,
      forceBottomDock: true,
      dockBottomPadding: 220,
      compactDockBottomPadding: 220,
    });

    expect(layout.horizontalPadding).toBe(10);
    expect(layout.boardLeft).toBe(10);
    expect(layout.boardTop).toBe(76);
    expect(layout.boardWidth).toBe(370);
  });
  });
}
