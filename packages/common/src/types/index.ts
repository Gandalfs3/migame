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
