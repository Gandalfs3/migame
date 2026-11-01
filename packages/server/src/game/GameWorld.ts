import { WebSocket } from 'ws';
import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { MapManager } from './MapManager.js';
import { CombatSystem } from './CombatSystem.js';
import {
  TICK_RATE,
  TICK_INTERVAL_MS,
  PLAYER_COLORS,
  PLAYER_RADIUS,
  MessageType,
  WorldStateMessage,
  ObstacleDTO,
  CombatFeedback
} from '@migame/common';

export class GameWorld {
  public players: Map<string, Player> = new Map();
  public monsters: Map<string, Monster> = new Map();
  public mapManager: MapManager;
  public combatSystem: CombatSystem;

  private nextPlayerId: number = 1;
  private tickCount: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private lastTickTime: number = performance.now();
  private onBroadcast?: (message: unknown) => void;

  constructor(broadcastCallback?: (message: unknown) => void) {
    this.onBroadcast = broadcastCallback;
    this.mapManager = new MapManager();
    this.combatSystem = new CombatSystem();
    this.spawnMonsters();
  }

  private spawnMonsters(): void {
    // 1 Jefe Central
    const boss = new Monster('boss_1', 'Gólem Ancestral (Jefe)', 'BOSS_GOLEM', 0, 0);
    this.monsters.set(boss.id, boss);

    // 4 Esbirros Goblins patrullando las 4 esquinas del claro
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
    const spawnDist = 14 + Math.random() * 3; // Aparecen cerca de los bordes seguros
    let spawnX = Math.cos(spawnAngle) * spawnDist;
    let spawnZ = Math.sin(spawnAngle) * spawnDist;

    const safePos = this.mapManager.resolveCollisions(spawnX, spawnZ, PLAYER_RADIUS * 1.5);

    const player = new Player(id, ws, color, safePos.x, safePos.z);
    this.players.set(id, player);
    return player;
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
    // Limpiar aggro de monstruos hacia este jugador
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

    return this.combatSystem.executeSpell(caster, spellId, targetId, this.players, this.monsters);
  }

  public start(): void {
    if (this.intervalId) return;

    this.lastTickTime = performance.now();
    this.intervalId = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);

    console.log(`[GameWorld] Loop autoritativo con PvE iniciado a ${TICK_RATE} ticks/seg.`);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    const now = performance.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    this.tickCount++;

    const monsterAttackFeedbacks: CombatFeedback[] = [];

    // 1. Actualizar movimiento de jugadores
    for (const player of this.players.values()) {
      player.update(dt, this.mapManager);
    }

    // 2. Actualizar IA de monstruos
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

    // 3. Emitir feedbacks de ataques de monstruos si los hay
    if (monsterAttackFeedbacks.length > 0 && this.onBroadcast) {
      this.onBroadcast({
        type: MessageType.COMBAT_FEEDBACK,
        feedbacks: monsterAttackFeedbacks
      });
    }

    // 4. Emitir WorldState consolidado con jugadores y monstruos
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
