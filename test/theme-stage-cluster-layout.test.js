import test from "node:test";
import assert from "node:assert/strict";

import { getRoadCurvePoints, getThemeClusterLayout } from "../src/phaser/scenes/theme-cluster-layout.js";

test("getThemeClusterLayout scatters stage nodes across the route field", () => {
  const cluster = getThemeClusterLayout({
    width: 920,
    height: 360,
    stageNumbers: [4, 5, 6],
    selectedStage: 5,
    clearedStages: [1, 2, 3, 4],
    themeIndex: 1,
    themeCount: 3,
    isMobile: false,
  });

  assert.equal(cluster.nodes.length, 3);
  assert.deepEqual(
    cluster.nodes.map((node) => node.stageNumber),
    [4, 5, 6],
  );
  assert.equal(new Set(cluster.nodes.map((node) => Math.round(node.x))).size, 3);
  assert.ok(Math.max(...cluster.nodes.map((node) => node.y)) - Math.min(...cluster.nodes.map((node) => node.y)) >= 100);
  assert.equal(cluster.nodes.find((node) => node.stageNumber === 5)?.state, "selected");
});

test("getThemeClusterLayout builds curved roads and a next-theme exit from the last stage", () => {
  const cluster = getThemeClusterLayout({
    width: 920,
    height: 360,
    stageNumbers: [1, 2, 3],
    selectedStage: 3,
    clearedStages: [1, 2],
    themeIndex: 0,
    themeCount: 3,
    isMobile: false,
  });

  assert.equal(cluster.roads.length, 3);
  assert.deepEqual(
    cluster.roads.map((road) => road.kind),
    ["link", "link", "exit"],
  );

  const exitRoad = cluster.roads[2];
  assert.equal(exitRoad.fromStage, 3);
  assert.ok(exitRoad.end.x > 920 || exitRoad.end.y < 0 || exitRoad.end.y > 360);
  assert.notDeepEqual(exitRoad.controlA, exitRoad.start);
  assert.notDeepEqual(exitRoad.controlB, exitRoad.end);
});

test("getThemeClusterLayout marks completed and future roads around the selected stage", () => {
  const cluster = getThemeClusterLayout({
    width: 920,
    height: 360,
    stageNumbers: [1, 2, 3],
    selectedStage: 2,
    clearedStages: [1],
    themeIndex: 0,
    themeCount: 3,
    isMobile: false,
  });

  assert.equal(cluster.roads[0].tone, "active");
  assert.equal(cluster.roads[1].tone, "future");
  assert.equal(cluster.roads[2].tone, "future");
});

test("getRoadCurvePoints samples cubic curve points for Phaser 4 graphics rendering", () => {
  const points = getRoadCurvePoints({
    kind: "link",
    start: { x: 40, y: 120 },
    controlA: { x: 140, y: 40 },
    controlB: { x: 220, y: 220 },
    end: { x: 320, y: 140 },
  }, 18);

  assert.ok(points.length > 10);
  assert.deepEqual(
    { x: Math.round(points[0].x), y: Math.round(points[0].y) },
    { x: 40, y: 120 },
  );
  assert.deepEqual(
    { x: Math.round(points.at(-1).x), y: Math.round(points.at(-1).y) },
    { x: 320, y: 140 },
  );
});
