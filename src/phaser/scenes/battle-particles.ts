import type { BattleParticleEffect, AttackParticleBurst, AngleRange, ScaleLength } from "../runtime-types.js";

export const BATTLE_PARTICLE_TEXTURE_KEY = "battle-particle";

const FULL_CIRCLE: AngleRange = { min: 0, max: 360 };

function getAngle(from: BattleParticleEffect["from"], to: BattleParticleEffect["to"]): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function ranged(min: number, max: number, scaleLength: ScaleLength): AngleRange {
  return {
    min: scaleLength(min),
    max: scaleLength(max),
  };
}

function scaledNumber(value: number, scaleLength: ScaleLength): number {
  return Number(scaleLength(value).toFixed(3));
}

export function ensureBattleParticleTexture(scene: { textures: { exists(key: string): boolean }; make: { graphics(config: { x: number; y: number; add: boolean }): { fillStyle(color: number, alpha: number): void; fillCircle(x: number, y: number, radius: number): void; generateTexture(key: string, width: number, height: number): void; destroy(): void; } } }): string {
  if (scene.textures.exists(BATTLE_PARTICLE_TEXTURE_KEY)) {
    return BATTLE_PARTICLE_TEXTURE_KEY;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(0xffffff, 0.18);
  graphics.fillCircle(24, 24, 24);
  graphics.fillStyle(0xffffff, 0.36);
  graphics.fillCircle(24, 24, 16);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(24, 24, 8);
  graphics.generateTexture(BATTLE_PARTICLE_TEXTURE_KEY, 48, 48);
  graphics.destroy();
  return BATTLE_PARTICLE_TEXTURE_KEY;
}

export function buildAttackParticleBursts(
  effect: BattleParticleEffect,
  scaleLength: ScaleLength,
): AttackParticleBurst[] {
  const direction = getAngle(effect.from, effect.to);

  switch (effect.type) {
    case "slow":
      return [
        {
          emitterKey: "slow",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 18, max: direction + 18 },
          speed: ranged(110, 190, scaleLength),
          quantity: 14,
          lifespan: 240,
          scale: { start: scaledNumber(0.24, scaleLength), end: 0 },
          tint: [0x8defff, 0x48cfff],
        },
        {
          emitterKey: "slow",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(24, 72, scaleLength),
          quantity: 12,
          lifespan: 240,
          scale: { start: scaledNumber(0.2, scaleLength), end: 0 },
          tint: [0xe8ffff, 0x7ce4ff],
        },
      ];
    case "magic":
      return [
        {
          emitterKey: "magic",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 10, max: direction + 10 },
          speed: ranged(150, 250, scaleLength),
          quantity: 16,
          lifespan: 240,
          scale: { start: scaledNumber(0.24, scaleLength), end: 0 },
          tint: [0xffcbff, 0xc56dff],
        },
        {
          emitterKey: "magic",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(70, 150, scaleLength),
          quantity: 14,
          lifespan: 220,
          scale: { start: scaledNumber(0.22, scaleLength), end: 0 },
          tint: [0xfff0ff, 0xe08dff],
        },
      ];
    case "cannon":
      return [
        {
          emitterKey: "cannon",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 12, max: direction + 12 },
          speed: ranged(100, 170, scaleLength),
          quantity: 18,
          lifespan: 210,
          scale: { start: scaledNumber(0.3, scaleLength), end: 0 },
          tint: [0xfff0b0, 0xffbf6c],
        },
        {
          emitterKey: "cannon",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(130, 280, scaleLength),
          quantity: 30,
          lifespan: 300,
          scale: { start: scaledNumber(0.34, scaleLength), end: 0 },
          tint: [0xfff0a6, 0xff9448, 0x7a4b24],
        },
        {
          emitterKey: "cannon",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(50, 90, scaleLength),
          quantity: 22,
          lifespan: 240,
          maxRadius: effect.radius ?? 0,
          radial: true,
          scale: { start: scaledNumber(0.24, scaleLength), end: 0 },
          tint: [0xffcf73, 0xffa23a],
        },
      ];
    case "hunter":
      return [
        {
          emitterKey: "hunter",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 6, max: direction + 6 },
          speed: ranged(240, 340, scaleLength),
          quantity: 10,
          lifespan: 190,
          scale: { start: scaledNumber(0.24, scaleLength), end: 0 },
          tint: [0xfff2a3, 0xffd24d],
        },
        {
          emitterKey: "hunter",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(90, 160, scaleLength),
          quantity: 8,
          lifespan: 170,
          scale: { start: scaledNumber(0.18, scaleLength), end: 0 },
          tint: [0xfff6d1, 0xffd875],
        },
      ];
    case "attack":
    default:
      return [
        {
          emitterKey: "attack",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 14, max: direction + 14 },
          speed: ranged(140, 230, scaleLength),
          quantity: 14,
          lifespan: 260,
          scale: { start: scaledNumber(0.32, scaleLength), end: 0 },
          tint: [0xffefb2, 0xffc24a],
        },
        {
          emitterKey: "attack",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(70, 130, scaleLength),
          quantity: 10,
          lifespan: 220,
          scale: { start: scaledNumber(0.22, scaleLength), end: 0 },
          tint: [0xfff3c9, 0xffd173],
        },
      ];
  }
}
