import test from "node:test";
import assert from "node:assert/strict";

import { buildAttackParticleBursts } from "../src/phaser/scenes/battle-particles.js";

test("attack and hunter bursts emphasize direction differently", () => {
  const attackBursts = buildAttackParticleBursts({
    type: "attack",
    from: { x: 120, y: 180 },
    to: { x: 210, y: 180 },
  }, (value) => value);
  const hunterBursts = buildAttackParticleBursts({
    type: "hunter",
    from: { x: 120, y: 180 },
    to: { x: 300, y: 180 },
  }, (value) => value);

  assert.equal(attackBursts.length, 2);
  assert.equal(hunterBursts.length, 2);
  assert.ok(hunterBursts[0].speed.min > attackBursts[0].speed.min);
  assert.ok(hunterBursts[1].quantity < attackBursts[1].quantity);
});

test("magic and cannon bursts include chain and splash cues", () => {
  const magicBursts = buildAttackParticleBursts({
    type: "magic",
    from: { x: 120, y: 120 },
    to: { x: 220, y: 170 },
  }, (value) => value);
  const cannonBursts = buildAttackParticleBursts({
    type: "cannon",
    from: { x: 120, y: 120 },
    to: { x: 220, y: 170 },
    radius: 64,
  }, (value) => value);

  assert.equal(magicBursts.length, 2);
  assert.equal(cannonBursts.length, 3);
  assert.ok(magicBursts.every((burst) => burst.tint.length >= 2));
  assert.ok(cannonBursts.some((burst) => burst.radial === true));
  assert.ok(cannonBursts.some((burst) => burst.maxRadius === 64));
});

test("slow bursts stay contact-heavy and readable at smaller scales", () => {
  const slowBursts = buildAttackParticleBursts({
    type: "slow",
    from: { x: 120, y: 180 },
    to: { x: 180, y: 210 },
  }, (value) => value * 0.5);

  assert.equal(slowBursts.length, 2);
  assert.ok(slowBursts.every((burst) => burst.lifespan <= 240));
  assert.ok(slowBursts.every((burst) => burst.quantity <= 16));
  assert.ok(slowBursts.every((burst) => burst.scale.start <= 0.24));
});
