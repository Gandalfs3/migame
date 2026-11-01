export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerDTO {
  id: string;
  x: number;
  z: number;
  rotation: number;
  color: string;
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
