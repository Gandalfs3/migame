import { WebSocket } from 'ws';
import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { MapManager } from './MapManager.js';
import { CombatSystem } from './CombatSystem.js';
import { DatabaseManager } from '../db/DatabaseManager.js';
import {
  TICK_RATE,
  TICK_INTERVAL_MS,
  PLAYER_COLORS,
  PLAYER_RADIUS,
  MessageType,
  WorldStateMessage,
  ObstacleDTO,
  CombatFeedback,
  PlayerClass,
  LevelUpMessage
} from '@migame/common';

export class GameWorld {
  public players: Map<string, Player> = new Map();
  public monsters: Map<string, Monster> = new Map();
  public mapManager: MapManager;
  public combatSystem: CombatSystem;
  public db: DatabaseManager;

  private nextPlayerId: number = 1;
  private tickCount: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private autoSaveIntervalId: NodeJS.Timeout | null = null;
  private lastTickTime: number = performance.now();
  private onBroadcast?: (message: unknown) => void;

  constructor(broadcastCallback?: (message: unknown) => void) {
    this.onBroadcast = broadcastCallback;
    this.mapManager = new MapManager();
    this.combatSystem = new CombatSystem();
    this.db = new DatabaseManager('dev.db');
    this.spawnMonsters();
    this.startAutoSave();
  }

  private spawnMonsters(): void {
    const boss = new Monster('boss_1', 'Gólem Ancestral (Jefe)', 'BOSS_GOLEM', 0, 0);
    this.monsters.set(boss.id, boss);

    const goblins = [
      { id: 'goblin_1', name: 'Goblin Explorador', x: -11, z: -11 },
      { id: 'goblin_2', name: 'Goblin Cazador', x: 11, z: -11 },
      { id: 'goblin_3', name: 'Goblin Emboscador', x: -11, z: 11 },
      { id: 'goblin_4', name: 'Goblin Chamán', x: 11, z: 11 }
    ];

    for (const g of goblins) {
      const mon = new Monster(g.id, g.name, 'GOBLIN', g.x, g.z);
      this.monsters.set(mon.id, mon);
    }
  }

  private startAutoSave(): void {
    this.autoSaveIntervalId = setInterval(() => {
      this.saveAllPlayers();
    }, 30000); // Guardado automático cada 30 segundos
  }

  public saveAllPlayers(): void {
    for (const player of this.players.values()) {
      this.savePlayer(player);
    }
  }

  public savePlayer(player: Player): void {
    if (!player.name) return;
    this.db.saveProfile(
      player.name,
      player.classType,
      player.level,
      player.experience,
      player.health,
      player.maxHealth,
      player.gold
    );
  }

  public loginPlayer(player: Player, name: string, classType: PlayerClass): void {
    const profile = this.db.loadOrCreateProfile(name, classType);
    player.loadFromProfile(
      profile.name,
      profile.class_type,
      profile.level,
      profile.experience,
      profile.health,
      profile.max_health,
      profile.gold
    );
  }

  public setBroadcastCallback(cb: (message: unknown) => void): void {
    this.onBroadcast = cb;
  }

  public getObstacles(): ObstacleDTO[] {
    return this.mapManager.obstacles;
  }

  public createPlayer(ws: WebSocket): Player {
    const id = `player_${this.nextPlayerId++}`;
    const colorIndex = (this.nextPlayerId - 2) % PLAYER_COLORS.length;
    const color = PLAYER_COLORS[colorIndex];

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 14 + Math.random() * 3;
    let spawnX = Math.cos(spawnAngle) * spawnDist;
    let spawnZ = Math.sin(spawnAngle) * spawnDist;

    const safePos = this.mapManager.resolveCollisions(spawnX, spawnZ, PLAYER_RADIUS * 1.5);

    const player = new Player(id, ws, color, safePos.x, safePos.z);
    this.players.set(id, player);
    return player;
  }

  public removePlayer(id: string): void {
    const player = this.players.get(id);
    if (player) {
      this.savePlayer(player);
    }

    this.players.delete(id);
    for (const mon of this.monsters.values()) {
      mon.aggroTable.delete(id);
      if (mon.targetId === id) {
        mon.targetId = null;
        mon.state = 'IDLE';
      }
    }
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public castSpell(casterId: string, spellId: string, targetId?: string | null): CombatFeedback[] {
    const caster = this.players.get(casterId);
    if (!caster) return [];

    return this.combatSystem.executeSpell(
      caster,
      spellId,
      targetId,
      this.players,
      this.monsters,
      (monster, xp, gold, killer) => {
        // Otorgar experiencia y oro a todos los jugadores cercanos (cooperativo familiar)
        for (const p of this.players.values()) {
          if (p.health <= 0) continue;
          const d = Math.hypot(p.x - monster.x, p.z - monster.z);
          if (d <= 25.0) { // Radio de experiencia compartida
            p.addGold(gold);
            const leveledUp = p.addExperience(xp);

            if (leveledUp && this.onBroadcast) {
              const levelUpMsg: LevelUpMessage = {
                type: MessageType.LEVEL_UP,
                playerId: p.id,
                playerName: p.name,
                newLevel: p.level,
                x: p.x,
                z: p.z
              };
              this.onBroadcast(levelUpMsg);
              this.savePlayer(p);
            }
          }
        }
      }
    );
  }

  public start(): void {
    if (this.intervalId) return;

    this.lastTickTime = performance.now();
    this.intervalId = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);

    console.log(`[GameWorld] Loop autoritativo con Persistencia SQLite iniciado a ${TICK_RATE} ticks/seg.`);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
      this.autoSaveIntervalId = null;
    }
    this.saveAllPlayers();
    this.db.close();
  }

  private tick(): void {
    const now = performance.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    this.tickCount++;

    const monsterAttackFeedbacks: CombatFeedback[] = [];

    // 1. Actualizar jugadores
    for (const player of this.players.values()) {
      player.update(dt, this.mapManager);
    }

    // 2. Actualizar monstruos
    for (const monster of this.monsters.values()) {
      monster.update(dt, this.players, this.mapManager, (player, dmg) => {
        player.takeDamage(dmg);
        monsterAttackFeedbacks.push({
          targetId: player.id,
          amount: dmg,
          isHeal: false,
          x: player.x,
          z: player.z
        });
      });
    }

    // 3. Emitir feedbacks
    if (monsterAttackFeedbacks.length > 0 && this.onBroadcast) {
      this.onBroadcast({
        type: MessageType.COMBAT_FEEDBACK,
        feedbacks: monsterAttackFeedbacks
      });
    }

    // 4. Emitir WorldState
    if (this.onBroadcast) {
      const worldState: WorldStateMessage = {
        type: MessageType.WORLD_STATE,
        tick: this.tickCount,
        timestamp: Date.now(),
        players: Array.from(this.players.values()).map(p => p.toDTO()),
        monsters: Array.from(this.monsters.values()).map(m => m.toDTO())
      };
      this.onBroadcast(worldState);
    }
  }
}
