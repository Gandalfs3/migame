import { WebSocket } from 'ws';
import { Player } from './Player.js';
import { MapManager } from './MapManager.js';
import {
  TICK_RATE,
  TICK_INTERVAL_MS,
  PLAYER_COLORS,
  PLAYER_RADIUS,
  MessageType,
  WorldStateMessage,
  ObstacleDTO
} from '@migame/common';

export class GameWorld {
  private players: Map<string, Player> = new Map();
  private nextPlayerId: number = 1;
  private tickCount: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private lastTickTime: number = performance.now();
  private onBroadcast?: (message: unknown) => void;
  public mapManager: MapManager;

  constructor(broadcastCallback?: (message: unknown) => void) {
    this.onBroadcast = broadcastCallback;
    this.mapManager = new MapManager();
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
    const spawnDist = 1.5 + Math.random() * 3;
    let spawnX = Math.cos(spawnAngle) * spawnDist;
    let spawnZ = Math.sin(spawnAngle) * spawnDist;

    // Asegurar que no aparezca dentro de un obstáculo
    const safePos = this.mapManager.resolveCollisions(spawnX, spawnZ, PLAYER_RADIUS * 1.5);

    const player = new Player(id, ws, color, safePos.x, safePos.z);
    this.players.set(id, player);
    return player;
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public start(): void {
    if (this.intervalId) return;

    this.lastTickTime = performance.now();
    this.intervalId = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);

    console.log(`[GameWorld] Loop autoritativo con colisiones iniciado a ${TICK_RATE} ticks/seg.`);
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

    // Actualizar movimiento y resolver colisiones en el servidor
    for (const player of this.players.values()) {
      player.update(dt, this.mapManager);
    }

    // Emitir WorldState consolidado
    if (this.onBroadcast) {
      const worldState: WorldStateMessage = {
        type: MessageType.WORLD_STATE,
        tick: this.tickCount,
        timestamp: Date.now(),
        players: Array.from(this.players.values()).map(p => p.toDTO())
      };
      this.onBroadcast(worldState);
    }
  }
}
