export const BATTLE_PARTICLE_TEXTURE_KEY = "battle-particle";

const FULL_CIRCLE = { min: 0, max: 360 };

function getAngle(from, to) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function ranged(min, max, scaleLength) {
  return {
    min: scaleLength(min),
    max: scaleLength(max),
  };
}

function scaledNumber(value, scaleLength) {
  return Number(scaleLength(value).toFixed(3));
}

export function ensureBattleParticleTexture(scene) {
  if (scene.textures.exists(BATTLE_PARTICLE_TEXTURE_KEY)) {
    return BATTLE_PARTICLE_TEXTURE_KEY;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(16, 16, 16);
  graphics.generateTexture(BATTLE_PARTICLE_TEXTURE_KEY, 32, 32);
  graphics.destroy();
  return BATTLE_PARTICLE_TEXTURE_KEY;
}

export function buildAttackParticleBursts(effect, scaleLength) {
  const direction = getAngle(effect.from, effect.to);

  switch (effect.type) {
    case "slow":
      return [
        {
          emitterKey: "slow",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 18, max: direction + 18 },
          speed: ranged(100, 180, scaleLength),
          quantity: 12,
          lifespan: 220,
          scale: { start: scaledNumber(0.22, scaleLength), end: 0 },
          tint: [0xaefcff, 0x6bd8ff],
        },
        {
          emitterKey: "slow",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(20, 60, scaleLength),
          quantity: 10,
          lifespan: 240,
          scale: { start: scaledNumber(0.18, scaleLength), end: 0 },
          tint: [0xd5ffff, 0x89efff],
        },
      ];
    case "magic":
      return [
        {
          emitterKey: "magic",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 10, max: direction + 10 },
          speed: ranged(140, 240, scaleLength),
          quantity: 14,
          lifespan: 220,
          scale: { start: scaledNumber(0.2, scaleLength), end: 0 },
          tint: [0xf7b6ff, 0xb980ff],
        },
        {
          emitterKey: "magic",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(60, 130, scaleLength),
          quantity: 12,
          lifespan: 200,
          scale: { start: scaledNumber(0.18, scaleLength), end: 0 },
          tint: [0xffffff, 0xde9dff],
        },
      ];
    case "cannon":
      return [
        {
          emitterKey: "cannon",
          x: effect.from.x,
          y: effect.from.y,
          angle: { min: direction - 12, max: direction + 12 },
          speed: ranged(90, 160, scaleLength),
          quantity: 14,
          lifespan: 180,
          scale: { start: scaledNumber(0.24, scaleLength), end: 0 },
          tint: [0xfff0b0, 0xffb35c],
        },
        {
          emitterKey: "cannon",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(120, 260, scaleLength),
          quantity: 24,
          lifespan: 260,
          scale: { start: scaledNumber(0.26, scaleLength), end: 0 },
          tint: [0xfff0a6, 0xff8a3d, 0x7a4b24],
        },
        {
          emitterKey: "cannon",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(40, 80, scaleLength),
          quantity: 18,
          lifespan: 220,
          maxRadius: effect.radius ?? 0,
          radial: true,
          scale: { start: scaledNumber(0.18, scaleLength), end: 0 },
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
          speed: ranged(220, 320, scaleLength),
          quantity: 8,
          lifespan: 160,
          scale: { start: scaledNumber(0.18, scaleLength), end: 0 },
          tint: [0xfff6bd, 0xffdf7a],
        },
        {
          emitterKey: "hunter",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(70, 140, scaleLength),
          quantity: 6,
          lifespan: 140,
          scale: { start: scaledNumber(0.12, scaleLength), end: 0 },
          tint: [0xffffff, 0xffe7a8],
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
          speed: ranged(120, 210, scaleLength),
          quantity: 10,
          lifespan: 170,
          scale: { start: scaledNumber(0.18, scaleLength), end: 0 },
          tint: [0xffffff, 0xffe3a3],
        },
        {
          emitterKey: "attack",
          x: effect.to.x,
          y: effect.to.y,
          angle: FULL_CIRCLE,
          speed: ranged(50, 110, scaleLength),
          quantity: 8,
          lifespan: 150,
          scale: { start: scaledNumber(0.14, scaleLength), end: 0 },
          tint: [0xffffff, 0xffecbf],
        },
      ];
  }
}
