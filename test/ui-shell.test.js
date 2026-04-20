import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

test("ui shell exposes only the phaser mount and battle controls", () => {
  assert.match(html, /id="game-root"/);
  assert.match(html, /id="battle-controls"/);
  assert.match(html, /id="pause-button"/);
  assert.match(html, /id="tower-buttons"/);
  assert.match(html, /id="tower-buttons-dock"/);

  assert.doesNotMatch(html, /id="title-screen"/);
  assert.doesNotMatch(html, /id="campaign-menu-screen"/);
  assert.doesNotMatch(html, /id="theme-screen"/);
  assert.doesNotMatch(html, /id="stage-detail-card"/);
});

test("battle controls hydrate tower icon images from imported assets", () => {
  assert.match(mainSource, /data-tower-icon/);
  assert.match(mainSource, /querySelectorAll\("\[data-tower-icon\]"\)/);
  assert.match(mainSource, /img\.src\s*=/);
});
