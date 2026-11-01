export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type PlayerClass = 'WARRIOR' | 'CLERIC' | 'MAGE';

export interface PlayerDTO {
  id: string;
  x: number;
  z: number;
  rotation: number;
  color: string;
  classType: PlayerClass;
  health: number;
  maxHealth: number;
  targetId: string | null;
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

export interface MonsterDTO {
  id: string;
  name: string;
  type: 'GOBLIN' | 'BOSS_GOLEM';
  x: number;
  z: number;
  rotation: number;
  health: number;
  maxHealth: number;
  state: MonsterState;
  targetId: string | null;
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
