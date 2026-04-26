import type { ComponentType } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import attackTowerIconUrl from "../../assets/towers/attack-v2.png";
import cannonTowerIconUrl from "../../assets/towers/cannon-v2.png";
import hunterTowerIconUrl from "../../assets/towers/hunter-v2.png";
import magicTowerIconUrl from "../../assets/towers/magic-v2.png";
import slowTowerIconUrl from "../../assets/towers/slow-v2.png";

export type TowerChoice = {
  type: string;
  key: string;
  name: string;
  iconUrl: string;
};

export type MoveButton = {
  move: "up" | "left" | "right" | "down";
  Icon: ComponentType<{ "aria-hidden": boolean; size: number; strokeWidth: number }>;
  label: string;
  className: string;
};

export const TOWER_CHOICES: TowerChoice[] = [
  { type: "attack", key: "1", name: "Attack", iconUrl: attackTowerIconUrl },
  { type: "slow", key: "2", name: "Slow", iconUrl: slowTowerIconUrl },
  { type: "magic", key: "3", name: "Magic", iconUrl: magicTowerIconUrl },
  { type: "cannon", key: "4", name: "Cannon", iconUrl: cannonTowerIconUrl },
  { type: "hunter", key: "5", name: "Hunter", iconUrl: hunterTowerIconUrl },
];

export const MOVE_BUTTONS: MoveButton[] = [
  { move: "up", Icon: ArrowUp, label: "Up", className: "dock-pad__up" },
  { move: "left", Icon: ArrowLeft, label: "Left", className: "dock-pad__left" },
  { move: "right", Icon: ArrowRight, label: "Right", className: "dock-pad__right" },
  { move: "down", Icon: ArrowDown, label: "Down", className: "dock-pad__down" },
];
