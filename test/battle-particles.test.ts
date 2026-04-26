import { describe, expect, test } from "vitest";

import { buildAttackParticleBursts } from "../src/phaser/scenes/battle-particles.js";
import type { AttackEffect, TowerType } from "../src/game/logic.js";

const identity = (value: number): number => value;
const createEffect = (
  type: TowerType,
  from: AttackEffect["from"],
  to: AttackEffect["to"],
  extra: Partial<AttackEffect> = {},
): AttackEffect => ({
  id: 1,
  ttl: 1,
  type,
  from,
  to,
  ...extra,
});

if (process.env.VITEST) {
  describe("battle-particles", () => {
    test("attack and hunter bursts emphasize direction differently", () => {
      const attackBursts = buildAttackParticleBursts(createEffect("attack", { x: 120, y: 180 }, { x: 210, y: 180 }), identity);
      const hunterBursts = buildAttackParticleBursts(createEffect("hunter", { x: 120, y: 180 }, { x: 300, y: 180 }), identity);

      expect(attackBursts).toHaveLength(2);
      expect(hunterBursts).toHaveLength(2);
      expect(hunterBursts[0]!.speed.min).toBeGreaterThan(attackBursts[0]!.speed.min);
      expect(hunterBursts[1]!.quantity).toBeLessThan(attackBursts[1]!.quantity);
    });

    test("magic and cannon bursts include chain and splash cues", () => {
      const magicBursts = buildAttackParticleBursts(createEffect("magic", { x: 120, y: 120 }, { x: 220, y: 170 }), identity);
      const cannonBursts = buildAttackParticleBursts(
        createEffect("cannon", { x: 120, y: 120 }, { x: 220, y: 170 }, { radius: 64 }),
        identity,
      );

      expect(magicBursts).toHaveLength(2);
      expect(cannonBursts).toHaveLength(3);
      expect(magicBursts.every((burst) => burst.tint.length >= 2)).toBe(true);
      expect(cannonBursts.some((burst) => burst.radial === true)).toBe(true);
      expect(cannonBursts.some((burst) => burst.maxRadius === 64)).toBe(true);
    });

    test("slow bursts stay contact-heavy and readable at smaller scales", () => {
      const slowBursts = buildAttackParticleBursts(
        createEffect("slow", { x: 120, y: 180 }, { x: 180, y: 210 }),
        (value: number) => value * 0.5,
      );

      expect(slowBursts).toHaveLength(2);
      expect(slowBursts.every((burst) => burst.lifespan <= 240)).toBe(true);
      expect(slowBursts.every((burst) => burst.quantity <= 16)).toBe(true);
      expect(slowBursts.every((burst) => burst.scale.start <= 0.24)).toBe(true);
    });

    test("attack bursts are large and long-lived enough to read during live play", () => {
      const [launchBurst, impactBurst] = buildAttackParticleBursts(
        createEffect("attack", { x: 120, y: 180 }, { x: 210, y: 180 }),
        identity,
      ) as [ReturnType<typeof buildAttackParticleBursts>[number], ReturnType<typeof buildAttackParticleBursts>[number]];

      expect(launchBurst.quantity).toBeGreaterThanOrEqual(14);
      expect(launchBurst.lifespan).toBeGreaterThanOrEqual(240);
      expect(launchBurst.scale.start).toBeGreaterThanOrEqual(0.28);
      expect(impactBurst.quantity).toBeGreaterThanOrEqual(10);
      expect(impactBurst.lifespan).toBeGreaterThanOrEqual(200);
      expect(impactBurst.scale.start).toBeGreaterThanOrEqual(0.2);
    });
  });
}
