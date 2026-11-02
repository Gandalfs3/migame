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
  LevelUpMessage,
  ZoneChangeMessage
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
    // ----------------------------------------------------
    // MONSTRUOS - ZONA 1: BOSQUE DE LOS GOBLINS
    // ----------------------------------------------------
    const bossGolem = new Monster('boss_1', 'Gólem Ancestral (Jefe)', 'BOSS_GOLEM', 0, 0, 'zone_forest');
    this.monsters.set(bossGolem.id, bossGolem);

    const goblins = [
      { id: 'goblin_1', name: 'Goblin Explorador', x: -11, z: -11 },
      { id: 'goblin_2', name: 'Goblin Cazador', x: 11, z: -11 },
      { id: 'goblin_3', name: 'Goblin Emboscador', x: -11, z: 11 },
      { id: 'goblin_4', name: 'Goblin Chamán', x: 11, z: 11 }
    ];

    for (const g of goblins) {
      const mon = new Monster(g.id, g.name, 'GOBLIN', g.x, g.z, 'zone_forest');
      this.monsters.set(mon.id, mon);
    }

    // ----------------------------------------------------
    // MONSTRUOS - ZONA 2: CRIPTA MALDITA (Nivel 2+)
    // ----------------------------------------------------
    const bossNecro = new Monster('boss_necro', 'Nigromante de las Cenizas (Jefe)', 'BOSS_NECROMANCER', 0, 0, 'zone_crypt');
    this.monsters.set(bossNecro.id, bossNecro);

    const cryptMinions = [
      { id: 'skel_w1', name: 'Guerrero Esqueleto', type: 'SKELETON_WARRIOR' as const, x: -8, z: -7 },
      { id: 'skel_w2', name: 'Guerrero Esqueleto', type: 'SKELETON_WARRIOR' as const, x: 8, z: -7 },
      { id: 'skel_w3', name: 'Guardia de la Cripta', type: 'SKELETON_WARRIOR' as const, x: -8, z: 7 },
      { id: 'skel_w4', name: 'Guardia de la Cripta', type: 'SKELETON_WARRIOR' as const, x: 8, z: 7 },
      { id: 'skel_a1', name: 'Arquero Maldito', type: 'SKELETON_ARCHER' as const, x: -12, z: 0 },
      { id: 'skel_a2', name: 'Arquero Maldito', type: 'SKELETON_ARCHER' as const, x: 12, z: 0 }
    ];

    for (const m of cryptMinions) {
      const mon = new Monster(m.id, m.name, m.type, m.x, m.z, 'zone_crypt');
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
      player.gold,
      player.currentZone
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
      profile.gold,
      profile.current_zone || 'zone_forest'
    );

    // Si el jugador guardó su partida en la Cripta, posicionar y sincronizar zona
    if (player.currentZone && player.currentZone !== 'zone_forest') {
      const zone = this.mapManager.getZone(player.currentZone);
      if (player.ws.readyState === WebSocket.OPEN) {
        const zoneMsg: ZoneChangeMessage = {
          type: MessageType.ZONE_CHANGE,
          zoneId: zone.id,
          zoneName: zone.name,
          theme: zone.theme,
          obstacles: zone.obstacles,
          portals: zone.portals,
          spawnX: player.x,
          spawnZ: player.z
        };
        player.ws.send(JSON.stringify(zoneMsg));
      }
    }
  }

  public setBroadcastCallback(cb: (message: unknown) => void): void {
    this.onBroadcast = cb;
  }

  public getObstacles(zoneId: string = 'zone_forest'): ObstacleDTO[] {
    return this.mapManager.getObstacles(zoneId);
  }

  public createPlayer(ws: WebSocket): Player {
    const id = `player_${this.nextPlayerId++}`;
    const colorIndex = (this.nextPlayerId - 2) % PLAYER_COLORS.length;
    const color = PLAYER_COLORS[colorIndex];

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 13 + Math.random() * 2;
    let spawnX = Math.cos(spawnAngle) * spawnDist;
    let spawnZ = Math.sin(spawnAngle) * spawnDist;

    const safePos = this.mapManager.resolveCollisions('zone_forest', spawnX, spawnZ, PLAYER_RADIUS * 1.5);

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
        // Otorgar experiencia y oro a todos los jugadores cercanos en la MISMA zona (cooperativo familiar)
        for (const p of this.players.values()) {
          if (p.health <= 0 || p.currentZone !== monster.zoneId) continue;
          const d = Math.hypot(p.x - monster.x, p.z - monster.z);
          if (d <= 30.0) { // Radio de experiencia compartida
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

    console.log(`[GameWorld] Loop autoritativo Multi-Zona iniciado a ${TICK_RATE} ticks/seg.`);
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

    // 2. Comprobar colisiones con Portales de Nivel (Autoritativo en el servidor)
    const currentTimeMs = Date.now();
    for (const player of this.players.values()) {
      if (player.health <= 0) continue;
      const portals = this.mapManager.getPortals(player.currentZone);

      for (const portal of portals) {
        const dist = Math.hypot(player.x - portal.x, player.z - portal.z);
        if (dist <= portal.radius) {
          if (player.level < portal.minLevel) {
            if (currentTimeMs - player.lastZoneAlertTime > 2500) {
              player.lastZoneAlertTime = currentTimeMs;
              if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                  type: MessageType.ZONE_ALERT,
                  message: `⛔ ¡Nivel ${portal.minLevel} requerido para entrar a ${portal.name}!`,
                  isWarning: true
                }));
              }
            }
          } else {
            // Teletransporte de zona
            const previousZone = player.currentZone;
            player.currentZone = portal.toZone;
            player.x = portal.targetSpawn.x;
            player.z = portal.targetSpawn.z;
            const targetZone = this.mapManager.getZone(portal.toZone);
            this.savePlayer(player);

            console.log(`[GameWorld] ${player.name} (${player.id}) cruzó el portal hacia '${targetZone.name}'`);

            if (player.ws.readyState === WebSocket.OPEN) {
              const zoneChangeMsg: ZoneChangeMessage = {
                type: MessageType.ZONE_CHANGE,
                zoneId: targetZone.id,
                zoneName: targetZone.name,
                theme: targetZone.theme,
                obstacles: targetZone.obstacles,
                portals: targetZone.portals,
                spawnX: player.x,
                spawnZ: player.z
              };
              player.ws.send(JSON.stringify(zoneChangeMsg));
            }

            if (this.onBroadcast) {
              this.onBroadcast({
                type: MessageType.ZONE_ALERT,
                message: `🌀 ${player.name} ha cruzado a: ${targetZone.name}`,
                isWarning: false
              });
            }
            break;
          }
        }
      }
    }

    // 3. Actualizar monstruos
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

    // 4. Emitir feedbacks de combate
    if (monsterAttackFeedbacks.length > 0 && this.onBroadcast) {
      this.onBroadcast({
        type: MessageType.COMBAT_FEEDBACK,
        feedbacks: monsterAttackFeedbacks
      });
    }

    // 5. Emitir WorldState filtrado por zona a cada jugador (MMO Phase 5 Scalable)
    for (const player of this.players.values()) {
      if (player.ws.readyState === WebSocket.OPEN) {
        const zonePlayers = Array.from(this.players.values())
          .filter(p => p.currentZone === player.currentZone)
          .map(p => p.toDTO());

        const zoneMonsters = Array.from(this.monsters.values())
          .filter(m => m.zoneId === player.currentZone)
          .map(m => m.toDTO());

        const worldState: WorldStateMessage = {
          type: MessageType.WORLD_STATE,
          tick: this.tickCount,
          timestamp: currentTimeMs,
          players: zonePlayers,
          monsters: zoneMonsters
        };

        player.ws.send(JSON.stringify(worldState));
      }
    }
  }
}
