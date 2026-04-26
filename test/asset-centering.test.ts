import test from "node:test";
import assert from "node:assert/strict";

import { findOpaqueBounds, getCenteredPlacement } from "../src/assets/centering";

function createAlphaBuffer(width: number, height: number, points: Array<readonly [number, number]>): Uint8Array {
  const buffer = new Uint8Array(width * height * 4);

  for (const [x, y] of points) {
    const index = (y * width + x) * 4;
    buffer[index + 3] = 255;
  }

  return buffer;
}

test("findOpaqueBounds returns the tight alpha bounds", () => {
  const buffer = createAlphaBuffer(6, 5, [
    [1, 1],
    [4, 3],
    [2, 2],
  ]);

  assert.deepEqual(findOpaqueBounds(buffer, 6, 5), {
    left: 1,
    top: 1,
    width: 4,
    height: 3,
  });
});

test("getCenteredPlacement recenters an off-center sprite inside the original canvas", () => {
  const buffer = createAlphaBuffer(8, 8, [
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
  ]);

  assert.deepEqual(getCenteredPlacement(buffer, 8, 8), {
    extract: {
      left: 0,
      top: 2,
      width: 2,
      height: 2,
    },
    top: 3,
    left: 3,
  });
});

test("getCenteredPlacement keeps fully transparent images anchored at the origin", () => {
  const buffer = createAlphaBuffer(4, 4, []);

  assert.deepEqual(getCenteredPlacement(buffer, 4, 4), {
    extract: {
      left: 0,
      top: 0,
      width: 4,
      height: 4,
    },
    top: 0,
    left: 0,
  });
});
