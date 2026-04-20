import test from "node:test";
import assert from "node:assert/strict";

import * as layoutModule from "../src/phaser/ui/layout.js";

function createScene(width, height) {
  return {
    scale: { width, height },
  };
}

test("getSceneLayout returns header, focus, and command zones for desktop", () => {
  const layout = layoutModule.getSceneLayout(createScene(1280, 720));

  assert.equal(layout.isMobile, false);
  assert.ok(layout.header.height > 0);
  assert.ok(layout.focus.height > 0);
  assert.ok(layout.command.height > 0);
  assert.ok(layout.focus.top >= layout.header.bottom);
  assert.ok(layout.command.top >= layout.focus.top);
  assert.ok(layout.command.bottom <= layout.height - layout.margin);
});

test("getSceneLayout compacts safely on short mobile viewports", () => {
  const layout = layoutModule.getSceneLayout(createScene(390, 720));

  assert.equal(layout.isMobile, true);
  assert.equal(layout.isShort, true);
  assert.ok(layout.focus.height >= 180);
  assert.ok(layout.command.height >= 88);
  assert.ok(layout.command.bottom <= layout.height - layout.margin);
});

test("getSceneLayout keeps action row width inside the viewport", () => {
  const layout = layoutModule.getSceneLayout(createScene(430, 932));
  const row = layout.getCommandRow(2, 156);

  assert.equal(row.positions.length, 2);
  assert.ok(row.buttonWidth <= layout.contentWidth);
  assert.ok(row.left >= layout.margin);
  assert.ok(row.right <= layout.width - layout.margin);
});

test("layout module preserves compatibility exports and avoids overlap on short viewports", () => {
  assert.equal(typeof layoutModule.getViewportFrame, "function");
  assert.equal(typeof layoutModule.getActionLayout, "function");

  const scene = createScene(390, 400);
  const layout = layoutModule.getSceneLayout(scene);
  const frame = layoutModule.getViewportFrame(scene);
  const action = layoutModule.getActionLayout(frame, 3, 156);

  assert.ok(layout.focus.bottom <= layout.command.top);
  assert.ok(frame.panelHeight > 0);
  assert.ok(action.positions.length > 0);
  assert.ok(action.buttonWidth > 0);
  assert.ok(action.buttonHeight > 0);
});

test("getSceneLayout stays ordered on extremely short viewports", () => {
  const layout = layoutModule.getSceneLayout(createScene(390, 240));

  assert.ok(layout.header.bottom <= layout.focus.top);
  assert.ok(layout.focus.bottom <= layout.command.top);
  assert.ok(layout.command.top <= layout.command.bottom);
  assert.ok(layout.focus.height >= 0);
});

test("getSceneLayout clamps tiny viewport geometry", () => {
  const layout = layoutModule.getSceneLayout(createScene(20, 20));
  const row = layout.getCommandRow(3, 18);

  assert.ok(layout.contentWidth >= 0);
  assert.ok(layout.contentHeight >= 0);
  assert.ok(row.buttonHeight <= layout.command.height);
  assert.ok(row.buttonWidth >= 0);
  assert.ok(row.left <= row.right);
  assert.ok(row.positions[0] <= row.positions[1]);
  assert.ok(row.positions[1] <= row.positions[2]);
});
