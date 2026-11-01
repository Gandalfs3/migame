import { WebSocket } from 'ws';
import {
  PlayerDTO,
  InputState,
  PlayerClass,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  CLASS_STATS
} from '@migame/common';
import { MapManager } from './MapManager.js';

export class Player {
  public id: string;
  public ws: WebSocket;
  public x: number;
  public z: number;
  public rotation: number;
  public color: string;
  public input: InputState;
  public lastInputTime: number;

  public classType: PlayerClass = 'WARRIOR';
  public health: number;
  public maxHealth: number;
  public targetId: string | null = null;
  public cooldowns: Map<string, number> = new Map(); // spellId -> timestamp available
  public respawnTimer: number = 0;

  constructor(id: string, ws: WebSocket, color: string, initialX: number = 0, initialZ: number = 0) {
    this.id = id;
    this.ws = ws;
    this.color = color;
    this.x = initialX;
    this.z = initialZ;
    this.rotation = 0;
    this.input = { up: false, down: false, left: false, right: false };
    this.lastInputTime = Date.now();

    this.maxHealth = CLASS_STATS[this.classType].maxHealth;
    this.health = this.maxHealth;
  }

  public setClass(newClass: PlayerClass): void {
    this.classType = newClass;
    const oldMax = this.maxHealth;
    this.maxHealth = CLASS_STATS[newClass].maxHealth;
    // Escalar la vida proporcionalmente
    this.health = Math.min(this.maxHealth, Math.max(1, Math.round((this.health / oldMax) * this.maxHealth)));
  }

  public takeDamage(amount: number): boolean {
    if (this.health <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.respawnTimer = 5; // Reaparece en 5 segundos
      return true;
    }
    return false;
  }

  public heal(amount: number): number {
    if (this.health <= 0) return 0;
    const actualHeal = Math.min(this.maxHealth - this.health, amount);
    this.health += actualHeal;
    return actualHeal;
  }

  public isSpellOnCooldown(spellId: string): boolean {
    const availableAt = this.cooldowns.get(spellId) || 0;
    return Date.now() < availableAt;
  }

  public setSpellCooldown(spellId: string, durationMs: number): void {
    this.cooldowns.set(spellId, Date.now() + durationMs);
  }

  public update(dt: number, mapManager: MapManager): void {
    // Si está muerto, esperar respawn
    if (this.health <= 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.health = this.maxHealth;
        this.x = 0;
        this.z = 0;
      }
      return;
    }

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

      const speed = PLAYER_SPEED + CLASS_STATS[this.classType].speedBonus;
      const proposedX = this.x + normX * speed * dt;
      const proposedZ = this.z + normZ * speed * dt;

      // Resolver colisiones con obstáculos y límites de mapa
      const resolved = mapManager.resolveCollisions(proposedX, proposedZ, PLAYER_RADIUS);
      this.x = resolved.x;
      this.z = resolved.z;
      this.rotation = Math.atan2(normX, normZ);
    }
  }

  public toDTO(): PlayerDTO {
    return {
      id: this.id,
      x: Number(this.x.toFixed(3)),
      z: Number(this.z.toFixed(3)),
      rotation: Number(this.rotation.toFixed(3)),
      color: this.color,
      classType: this.classType,
      health: this.health,
      maxHealth: this.maxHealth,
      targetId: this.targetId
    };
  }
}
