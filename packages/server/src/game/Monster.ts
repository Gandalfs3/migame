import { MonsterDTO, MonsterState, MONSTER_REWARDS } from '@migame/common';
import { MapManager } from './MapManager.js';
import { Player } from './Player.js';

export class Monster {
  public id: string;
  public name: string;
  public type: 'GOBLIN' | 'BOSS_GOLEM';
  public x: number;
  public z: number;
  public rotation: number = 0;
  public spawnX: number;
  public spawnZ: number;

  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public aggroRange: number;
  public attackRange: number;
  public attackCooldownMs: number;
  public lastAttackTime: number = 0;

  public state: MonsterState = 'IDLE';
  public targetId: string | null = null;
  public aggroTable: Map<string, number> = new Map();

  public respawnTimer: number = 0;
  public respawnDelaySeconds: number;

  constructor(
    id: string,
    name: string,
    type: 'GOBLIN' | 'BOSS_GOLEM',
    spawnX: number,
    spawnZ: number
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.spawnX = spawnX;
    this.spawnZ = spawnZ;
    this.x = spawnX;
    this.z = spawnZ;

    if (type === 'BOSS_GOLEM') {
      this.maxHealth = 350;
      this.speed = 3.2;
      this.damage = 25;
      this.aggroRange = 12.0;
      this.attackRange = 2.4;
      this.attackCooldownMs = 2000;
      this.respawnDelaySeconds = 18;
    } else {
      this.maxHealth = 80;
      this.speed = 4.5;
      this.damage = 12;
      this.aggroRange = 9.0;
      this.attackRange = 1.8;
      this.attackCooldownMs = 1500;
      this.respawnDelaySeconds = 10;
    }

    this.health = this.maxHealth;
  }

  public takeDamage(amount: number, attackerId: string): { died: boolean; xp: number; gold: number } {
    if (this.state === 'DEAD') return { died: false, xp: 0, gold: 0 };

    this.health = Math.max(0, this.health - amount);
    const currentThreat = this.aggroTable.get(attackerId) || 0;
    this.aggroTable.set(attackerId, currentThreat + amount);

    if (this.health <= 0) {
      this.state = 'DEAD';
      this.targetId = null;
      this.aggroTable.clear();
      this.respawnTimer = this.respawnDelaySeconds;

      const reward = MONSTER_REWARDS[this.type];
      return { died: true, xp: reward.xp, gold: reward.gold };
    }

    if (this.state === 'IDLE') {
      this.state = 'CHASE';
      this.targetId = attackerId;
    }

    return { died: false, xp: 0, gold: 0 };
  }

  public addThreat(playerId: string, threatBonus: number): void {
    if (this.state === 'DEAD') return;
    const current = this.aggroTable.get(playerId) || 0;
    this.aggroTable.set(playerId, current + threatBonus);
    this.targetId = playerId;
    this.state = 'CHASE';
  }

  public update(dt: number, players: Map<string, Player>, mapManager: MapManager, onAttackPlayer: (player: Player, damage: number) => void): void {
    if (this.state === 'DEAD') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.health = this.maxHealth;
        this.x = this.spawnX;
        this.z = this.spawnZ;
        this.state = 'IDLE';
        this.targetId = null;
        this.aggroTable.clear();
      }
      return;
    }

    let targetPlayer: Player | null = null;
    if (this.targetId && players.has(this.targetId)) {
      targetPlayer = players.get(this.targetId)!;
    } else {
      let closestDist = this.aggroRange;
      let closestPlayer: Player | null = null;

      for (const p of players.values()) {
        if (p.health <= 0) continue;
        const d = Math.hypot(p.x - this.x, p.z - this.z);
        if (d < closestDist) {
          closestDist = d;
          closestPlayer = p;
        }
      }

      if (closestPlayer) {
        this.targetId = closestPlayer.id;
        targetPlayer = closestPlayer;
        this.state = 'CHASE';
      } else {
        this.targetId = null;
        this.state = 'IDLE';
      }
    }

    if (this.state === 'IDLE') {
      const distToSpawn = Math.hypot(this.spawnX - this.x, this.spawnZ - this.z);
      if (distToSpawn > 1.0) {
        const dirX = (this.spawnX - this.x) / distToSpawn;
        const dirZ = (this.spawnZ - this.z) / distToSpawn;
        const proposedX = this.x + dirX * (this.speed * 0.5) * dt;
        const proposedZ = this.z + dirZ * (this.speed * 0.5) * dt;
        const resolved = mapManager.resolveCollisions(proposedX, proposedZ, 0.7);
        this.x = resolved.x;
        this.z = resolved.z;
        this.rotation = Math.atan2(dirX, dirZ);
      }
      return;
    }

    if (targetPlayer && targetPlayer.health > 0) {
      const dx = targetPlayer.x - this.x;
      const dz = targetPlayer.z - this.z;
      const dist = Math.hypot(dx, dz);

      if (dist > this.aggroRange * 1.8) {
        this.targetId = null;
        this.aggroTable.clear();
        this.state = 'IDLE';
        return;
      }

      this.rotation = Math.atan2(dx, dz);

      if (dist <= this.attackRange) {
        this.state = 'ATTACK';
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackCooldownMs) {
          this.lastAttackTime = now;
          onAttackPlayer(targetPlayer, this.damage);
        }
      } else {
        this.state = 'CHASE';
        const dirX = dx / dist;
        const dirZ = dz / dist;
        const proposedX = this.x + dirX * this.speed * dt;
        const proposedZ = this.z + dirZ * this.speed * dt;
        const resolved = mapManager.resolveCollisions(proposedX, proposedZ, 0.7);
        this.x = resolved.x;
        this.z = resolved.z;
      }
    } else {
      this.targetId = null;
      this.state = 'IDLE';
    }
  }

  public toDTO(): MonsterDTO {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      x: Number(this.x.toFixed(3)),
      z: Number(this.z.toFixed(3)),
      rotation: Number(this.rotation.toFixed(3)),
      health: this.health,
      maxHealth: this.maxHealth,
      state: this.state,
      targetId: this.targetId
    };
  }
}
