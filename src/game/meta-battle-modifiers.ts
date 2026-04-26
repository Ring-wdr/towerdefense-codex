import { normalizeMetaProgress } from "./meta-progress";
import type { MetaProgress, MetaUpgradeId } from "./meta-progress";

const META_BATTLE_BONUS_VALUES: Record<MetaUpgradeId, readonly number[]> = {
  attackTowerDamage: [0, 0.08, 0.16, 0.24],
  attackTowerSpeed: [0, 0.04, 0.08, 0.12],
  cannonTowerDamage: [0, 0.08, 0.16, 0.24],
  globalDamageBoost: [0, 0.05, 0.1, 0.15],
  globalMaxLives: [0, 1, 2, 3],
  globalStartGold: [0, 10, 20, 30],
  hunterTowerSpeed: [0, 0.05, 0.1, 0.15],
  magicTowerDamage: [0, 0.08, 0.16, 0.24],
  slowTowerEffect: [0, 0.05, 0.1, 0.15],
};

export interface MetaBattleModifiers {
  startGold: number;
  maxLives: number;
  globalDamageMultiplier: number;
  attackDamageMultiplier: number;
  attackSpeedBonus: number;
  attackSpeedBonusStep: number;
  slowEffectBonus: number;
  magicDamageMultiplier: number;
  cannonDamageMultiplier: number;
  hunterSpeedBonus: number;
  hunterSpeedBonusStep: number;
}

function getUpgradeBonus(level: number, bonusValues: readonly number[]): number {
  if (!Number.isFinite(level)) {
    return bonusValues[0] ?? 0;
  }

  const boundedLevel = Math.min(Math.max(Math.trunc(level), 0), bonusValues.length - 1);

  return bonusValues[boundedLevel] ?? bonusValues[0] ?? 0;
}

function getPositiveBonusStep(bonusValues: readonly number[]): number {
  return bonusValues.find((value) => value > 0) ?? 0;
}

export function getMetaBattleModifiers(metaProgress: unknown): MetaBattleModifiers {
  const normalized = normalizeMetaProgress(metaProgress);
  const upgrades = normalized.upgrades;

  return {
    startGold: getUpgradeBonus(upgrades.globalStartGold, META_BATTLE_BONUS_VALUES.globalStartGold),
    maxLives: getUpgradeBonus(upgrades.globalMaxLives, META_BATTLE_BONUS_VALUES.globalMaxLives),
    globalDamageMultiplier: getUpgradeBonus(
      upgrades.globalDamageBoost,
      META_BATTLE_BONUS_VALUES.globalDamageBoost,
    ),
    attackDamageMultiplier: getUpgradeBonus(
      upgrades.attackTowerDamage,
      META_BATTLE_BONUS_VALUES.attackTowerDamage,
    ),
    attackSpeedBonus: getUpgradeBonus(
      upgrades.attackTowerSpeed,
      META_BATTLE_BONUS_VALUES.attackTowerSpeed,
    ),
    attackSpeedBonusStep: getPositiveBonusStep(META_BATTLE_BONUS_VALUES.attackTowerSpeed),
    slowEffectBonus: getUpgradeBonus(
      upgrades.slowTowerEffect,
      META_BATTLE_BONUS_VALUES.slowTowerEffect,
    ),
    magicDamageMultiplier: getUpgradeBonus(
      upgrades.magicTowerDamage,
      META_BATTLE_BONUS_VALUES.magicTowerDamage,
    ),
    cannonDamageMultiplier: getUpgradeBonus(
      upgrades.cannonTowerDamage,
      META_BATTLE_BONUS_VALUES.cannonTowerDamage,
    ),
    hunterSpeedBonus: getUpgradeBonus(
      upgrades.hunterTowerSpeed,
      META_BATTLE_BONUS_VALUES.hunterTowerSpeed,
    ),
    hunterSpeedBonusStep: getPositiveBonusStep(META_BATTLE_BONUS_VALUES.hunterTowerSpeed),
  };
}
