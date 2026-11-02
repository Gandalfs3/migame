import {
  MonsterDTO,
  MonsterState,
  MonsterType,
  MONSTER_REWARDS,
  calculateEffectiveDamage
} from '@migame/common';
import { MapManager } from './MapManager.js';
import { Player } from './Player.js';

export class Monster {
  public id: string;
  public name: string;
  public type: MonsterType;
  public zoneId: string;
  public level: number;
  public defense: number;
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
    type: MonsterType,
    spawnX: number,
    spawnZ: number,
    zoneId: string = 'zone_forest',
    level: number = 1
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.zoneId = zoneId;
    this.level = Math.max(1, level);
    this.spawnX = spawnX;
    this.spawnZ = spawnZ;
    this.x = spawnX;
    this.z = spawnZ;

    const lvlFactor = this.level - 1;
    const isBoss = type === 'BOSS_GOLEM' || type === 'BOSS_NECROMANCER' || type === 'BOSS_MAGMA_LORD' || type === 'BOSS_ASTRAL_TITAN';

    // Cálculo dinámico de defensa del monstruo (aumenta según nivel y si es jefe)
    this.defense = isBoss
      ? Math.round(18 + lvlFactor * 7)
      : Math.round(6 + lvlFactor * 3.5);

    if (type === 'BOSS_GOLEM') {
      this.maxHealth = Math.round(350 + lvlFactor * 80);
      this.speed = 3.2;
      this.damage = Math.round(25 + lvlFactor * 5);
      this.aggroRange = 12.0;
      this.attackRange = 2.4;
      this.attackCooldownMs = 2000;
      this.respawnDelaySeconds = 18;
    } else if (type === 'BOSS_NECROMANCER') {
      this.maxHealth = Math.round(600 + lvlFactor * 110);
      this.speed = 3.6;
      this.damage = Math.round(38 + lvlFactor * 6);
      this.aggroRange = 14.0;
      this.attackRange = 9.0;
      this.attackCooldownMs = 2200;
      this.respawnDelaySeconds = 25;
    } else if (type === 'BOSS_MAGMA_LORD') {
      this.maxHealth = Math.round(1100 + lvlFactor * 160);
      this.speed = 3.4;
      this.damage = Math.round(52 + lvlFactor * 8);
      this.aggroRange = 14.0;
      this.attackRange = 3.0;
      this.attackCooldownMs = 2000;
      this.respawnDelaySeconds = 30;
    } else if (type === 'BOSS_ASTRAL_TITAN') {
      this.maxHealth = Math.round(2200 + lvlFactor * 250);
      this.speed = 3.8;
      this.damage = Math.round(70 + lvlFactor * 10);
      this.aggroRange = 15.0;
      this.attackRange = 9.0;
      this.attackCooldownMs = 2200;
      this.respawnDelaySeconds = 35;
    } else if (type === 'SKELETON_WARRIOR') {
      this.maxHealth = Math.round(150 + lvlFactor * 25);
      this.speed = 4.8;
      this.damage = Math.round(20 + lvlFactor * 3.5);
      this.aggroRange = 10.0;
      this.attackRange = 2.0;
      this.attackCooldownMs = 1400;
      this.respawnDelaySeconds = 10;
    } else if (type === 'SKELETON_ARCHER') {
      this.maxHealth = Math.round(110 + lvlFactor * 20);
      this.speed = 4.0;
      this.damage = Math.round(24 + lvlFactor * 4);
      this.aggroRange = 12.0;
      this.attackRange = 8.5;
      this.attackCooldownMs = 1800;
      this.respawnDelaySeconds = 12;
    } else if (type === 'FIRE_DEMON') {
      this.maxHealth = Math.round(260 + lvlFactor * 35);
      this.speed = 4.6;
      this.damage = Math.round(32 + lvlFactor * 5);
      this.aggroRange = 11.0;
      this.attackRange = 2.2;
      this.attackCooldownMs = 1500;
      this.respawnDelaySeconds = 12;
    } else if (type === 'MAGMA_GARGOYLE') {
      this.maxHealth = Math.round(190 + lvlFactor * 28);
      this.speed = 4.4;
      this.damage = Math.round(36 + lvlFactor * 5.5);
      this.aggroRange = 12.0;
      this.attackRange = 8.0;
      this.attackCooldownMs = 1700;
      this.respawnDelaySeconds = 12;
    } else if (type === 'VOID_SPAWN') {
      this.maxHealth = Math.round(380 + lvlFactor * 50);
      this.speed = 4.9;
      this.damage = Math.round(45 + lvlFactor * 6.5);
      this.aggroRange = 11.5;
      this.attackRange = 2.4;
      this.attackCooldownMs = 1400;
      this.respawnDelaySeconds = 14;
    } else if (type === 'CHAOS_MAGE') {
      this.maxHealth = Math.round(280 + lvlFactor * 40);
      this.speed = 4.2;
      this.damage = Math.round(55 + lvlFactor * 7.5);
      this.aggroRange = 13.0;
      this.attackRange = 9.5;
      this.attackCooldownMs = 1900;
      this.respawnDelaySeconds = 14;
    } else {
      // GOBLIN
      this.maxHealth = Math.round(80 + lvlFactor * 18);
      this.speed = 4.5;
      this.damage = Math.round(12 + lvlFactor * 2.5);
      this.aggroRange = 9.0;
      this.attackRange = 1.8;
      this.attackCooldownMs = 1500;
      this.respawnDelaySeconds = 10;
    }

    this.health = this.maxHealth;
  }

  public takeDamage(amount: number, attackerId: string): { died: boolean; xp: number; gold: number; actualDamage: number } {
    if (this.state === 'DEAD') return { died: false, xp: 0, gold: 0, actualDamage: 0 };

    const actualDamage = calculateEffectiveDamage(amount, this.defense);
    this.health = Math.max(0, this.health - actualDamage);
    const currentThreat = this.aggroTable.get(attackerId) || 0;
    this.aggroTable.set(attackerId, currentThreat + actualDamage);

    if (this.health <= 0) {
      this.state = 'DEAD';
      this.targetId = null;
      this.aggroTable.clear();
      this.respawnTimer = this.respawnDelaySeconds;

      const baseReward = MONSTER_REWARDS[this.type];
      const levelMultiplier = 1 + (this.level - 1) * 0.25;
      const xp = Math.round(baseReward.xp * levelMultiplier);
      const gold = Math.round(baseReward.gold * levelMultiplier);

      return { died: true, xp, gold, actualDamage };
    }

    if (this.state === 'IDLE') {
      this.state = 'CHASE';
      this.targetId = attackerId;
    }

    return { died: false, xp: 0, gold: 0, actualDamage };
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
      const candidate = players.get(this.targetId)!;
      if (candidate.health > 0 && candidate.currentZone === this.zoneId) {
        targetPlayer = candidate;
      }
    }

    if (!targetPlayer) {
      let closestDist = this.aggroRange;
      let closestPlayer: Player | null = null;

      for (const p of players.values()) {
        if (p.health <= 0 || p.currentZone !== this.zoneId) continue;
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
        const resolved = mapManager.resolveCollisions(this.zoneId, proposedX, proposedZ, 0.7);
        this.x = resolved.x;
        this.z = resolved.z;
        this.rotation = Math.atan2(dirX, dirZ);
      }
      return;
    }

    if (targetPlayer && targetPlayer.health > 0 && targetPlayer.currentZone === this.zoneId) {
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
        const resolved = mapManager.resolveCollisions(this.zoneId, proposedX, proposedZ, 0.7);
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
      level: this.level,
      defense: this.defense,
      x: Number(this.x.toFixed(3)),
      z: Number(this.z.toFixed(3)),
      rotation: Number(this.rotation.toFixed(3)),
      health: this.health,
      maxHealth: this.maxHealth,
      state: this.state,
      targetId: this.targetId,
      zoneId: this.zoneId
    };
  }
}
