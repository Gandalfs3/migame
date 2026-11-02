export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type PlayerClass = 'WARRIOR' | 'CLERIC' | 'MAGE';

export interface PortalDTO {
  id: string;
  name: string;
  fromZone: string;
  toZone: string;
  x: number;
  z: number;
  radius: number;
  minLevel: number;
  targetSpawn: { x: number; z: number };
  color: string;
}

export interface ZoneThemeDTO {
  id: string;
  name: string;
  groundColor: string;
  gridColor1: string;
  gridColor2: string;
  fogColor: string;
  fogDensity: number;
  ambientLightColor: string;
  dirLightColor: string;
}

export interface CharacterVisualProfile {
  classType: PlayerClass;
  title: string;
  role: string;
  visualDescription: string;
  texturePrompt: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  armorStyle: string;
  weaponStyle: string;
}

export interface MonsterVisualProfile {
  type: MonsterType;
  title: string;
  tier: number;
  visualDescription: string;
  texturePrompt: string;
  colorPalette: {
    primary: string;
    secondary: string;
    glow: string;
  };
  imposingFeatures: string[];
}

export interface PlayerDTO {
  id: string;
  name: string;
  x: number;
  z: number;
  rotation: number;
  color: string;
  classType: PlayerClass;
  level: number;
  experience: number;
  gold: number;
  health: number;
  maxHealth: number;
  defense: number;
  spellPowerPct: number;
  targetId: string | null;
  zoneId: string;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type ObstacleType = 'circle' | 'box';

export interface CircleObstacleDTO {
  id: string;
  type: 'circle';
  x: number;
  z: number;
  radius: number;
  height: number;
  kind: 'tree' | 'rock';
}

export interface BoxObstacleDTO {
  id: string;
  type: 'box';
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  rotation?: number;
  kind: 'pillar' | 'wall';
}

export type ObstacleDTO = CircleObstacleDTO | BoxObstacleDTO;

export type MonsterState = 'IDLE' | 'CHASE' | 'ATTACK' | 'DEAD';

export type MonsterType =
  | 'GOBLIN'
  | 'BOSS_GOLEM'
  | 'SKELETON_WARRIOR'
  | 'SKELETON_ARCHER'
  | 'BOSS_NECROMANCER'
  | 'FIRE_DEMON'
  | 'MAGMA_GARGOYLE'
  | 'BOSS_MAGMA_LORD'
  | 'VOID_SPAWN'
  | 'CHAOS_MAGE'
  | 'BOSS_ASTRAL_TITAN';

export interface MonsterDTO {
  id: string;
  name: string;
  type: MonsterType;
  level: number;
  defense: number;
  x: number;
  z: number;
  rotation: number;
  health: number;
  maxHealth: number;
  state: MonsterState;
  targetId: string | null;
  zoneId: string;
}

export interface Spell {
  id: string;
  name: string;
  classType: PlayerClass;
  cooldownMs: number;
  range: number;
  damage?: number;
  heal?: number;
  isAoe?: boolean;
  aoeRadius?: number;
  icon: string;
  description: string;
}

export interface CombatFeedback {
  targetId: string;
  amount: number;
  isHeal: boolean;
  x: number;
  z: number;
}

export interface LevelUpFeedback {
  playerId: string;
  playerName: string;
  newLevel: number;
  x: number;
  z: number;
}
