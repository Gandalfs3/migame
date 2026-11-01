import { WebSocket } from 'ws';
import { PlayerDTO, InputState, PLAYER_SPEED, MAP_BOUND } from '@migame/common';

export class Player {
  public id: string;
  public ws: WebSocket;
  public x: number;
  public z: number;
  public rotation: number;
  public color: string;
  public input: InputState;
  public lastInputTime: number;

  constructor(id: string, ws: WebSocket, color: string, initialX: number = 0, initialZ: number = 0) {
    this.id = id;
    this.ws = ws;
    this.color = color;
    this.x = initialX;
    this.z = initialZ;
    this.rotation = 0;
    this.input = { up: false, down: false, left: false, right: false };
    this.lastInputTime = Date.now();
  }

  public update(dt: number): void {
    let moveX = 0;
    let moveZ = 0;

    if (this.input.up) moveZ -= 1;
    if (this.input.down) moveZ += 1;
    if (this.input.left) moveX -= 1;
    if (this.input.right) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.hypot(moveX, moveZ);
      const normX = moveX / length;
      const normZ = moveZ / length;

      let newX = this.x + normX * PLAYER_SPEED * dt;
      let newZ = this.z + normZ * PLAYER_SPEED * dt;

      // Colisión contra límites del mapa
      this.x = Math.max(-MAP_BOUND, Math.min(MAP_BOUND, newX));
      this.z = Math.max(-MAP_BOUND, Math.min(MAP_BOUND, newZ));
      this.rotation = Math.atan2(normX, normZ);
    }
  }

  public toDTO(): PlayerDTO {
    return {
      id: this.id,
      x: Number(this.x.toFixed(3)),
      z: Number(this.z.toFixed(3)),
      rotation: Number(this.rotation.toFixed(3)),
      color: this.color
    };
  }
}
