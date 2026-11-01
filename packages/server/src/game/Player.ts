import { WebSocket } from 'ws';
import {
  PlayerDTO,
  InputState,
  PlayerClass,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  CLASS_STATS,
  getXpForNextLevel
} from '@migame/common';
import { MapManager } from './MapManager.js';

export class Player {
  public id: string;
  public ws: WebSocket;
  public name: string;
  public x: number;
  public z: number;
  public rotation: number;
  public color: string;
  public input: InputState;
  public lastInputTime: number;

  public classType: PlayerClass = 'WARRIOR';
  public level: number = 1;
  public experience: number = 0;
  public gold: number = 0;
  public health: number;
  public maxHealth: number;
  public targetId: string | null = null;
  public cooldowns: Map<string, number> = new Map();
  public respawnTimer: number = 0;
  public lastClassSwitchTime: number = 0;

  constructor(
    id: string,
    ws: WebSocket,
    color: string,
    initialX: number = 0,
    initialZ: number = 0,
    name: string = 'Aventurero'
  ) {
    this.id = id;
    this.ws = ws;
    this.name = name;
    this.color = color;
    this.x = initialX;
    this.z = initialZ;
    this.rotation = 0;
    this.input = { up: false, down: false, left: false, right: false };
    this.lastInputTime = Date.now();

    this.maxHealth = CLASS_STATS[this.classType].maxHealth;
    this.health = this.maxHealth;
  }

  public loadFromProfile(
    name: string,
    classType: PlayerClass,
    level: number,
    experience: number,
    health: number,
    maxHealth: number,
    gold: number
  ): void {
    this.name = name;
    this.classType = classType;
    this.level = level;
    this.experience = experience;
    this.gold = gold;

    // Calcular vida según nivel (+15 de vida por nivel)
    const baseClassHealth = CLASS_STATS[classType].maxHealth;
    this.maxHealth = baseClassHealth + (this.level - 1) * 15;
    this.health = Math.min(this.maxHealth, health > 0 ? health : this.maxHealth);
  }

  public canSwitchClass(): boolean {
    if (this.lastClassSwitchTime === 0) return true;
    return Date.now() - this.lastClassSwitchTime >= 6000;
  }

  public setClass(newClass: PlayerClass, bypassCooldown: boolean = false): boolean {
    if (!bypassCooldown && !this.canSwitchClass()) {
      return false;
    }

    this.classType = newClass;
    this.lastClassSwitchTime = Date.now();
    const baseClassHealth = CLASS_STATS[newClass].maxHealth;
    this.maxHealth = baseClassHealth + (this.level - 1) * 15;
    this.health = Math.min(this.maxHealth, this.health);
    return true;
  }

  public addExperience(amount: number): boolean {
    this.experience += amount;
    let leveledUp = false;

    while (true) {
      const requiredXp = getXpForNextLevel(this.level);
      if (this.experience >= requiredXp) {
        this.experience -= requiredXp;
        this.level++;
        this.maxHealth += 15;
        this.health = this.maxHealth; // Curación completa por subir de nivel
        leveledUp = true;
      } else {
        break;
      }
    }

    return leveledUp;
  }

  public addGold(amount: number): void {
    this.gold += amount;
  }

  public takeDamage(amount: number): boolean {
    if (this.health <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.respawnTimer = 5;
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

      const resolved = mapManager.resolveCollisions(proposedX, proposedZ, PLAYER_RADIUS);
      this.x = resolved.x;
      this.z = resolved.z;
      this.rotation = Math.atan2(normX, normZ);
    }
  }

  public toDTO(): PlayerDTO {
    return {
      id: this.id,
      name: this.name,
      x: Number(this.x.toFixed(3)),
      z: Number(this.z.toFixed(3)),
      rotation: Number(this.rotation.toFixed(3)),
      color: this.color,
      classType: this.classType,
      level: this.level,
      experience: this.experience,
      gold: this.gold,
      health: this.health,
      maxHealth: this.maxHealth,
      targetId: this.targetId
    };
  }
}
