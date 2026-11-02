import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';
import { GameWorld } from '../game/GameWorld.js';
import {
  MessageType,
  WelcomeMessage,
  PlayerJoinedMessage,
  PlayerLeftMessage,
  CombatFeedbackMessage,
  MAP_BOUND,
  TICK_RATE
} from '@migame/common';

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
}

export class NetworkServer {
  private app: Express;
  private httpServer: HttpServer;
  private wss: WebSocketServer;
  private gameWorld: GameWorld;
  private port: number;
  private localIp: string;

  constructor(gameWorld: GameWorld, port: number = 3001) {
    this.gameWorld = gameWorld;
    this.port = port;
    this.localIp = getLocalIpAddress();

    this.app = express();
    this.setupRoutes();

    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.setupWebSocket();
    this.gameWorld.setBroadcastCallback((msg) => this.broadcast(msg));
  }

  private setupRoutes(): void {
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    this.app.get('/api/info', (req, res) => {
      res.json({
        localIp: this.localIp,
        port: this.port,
        playersOnline: this.gameWorld.getPlayerCount(),
        tickRate: TICK_RATE,
        obstaclesCount: this.gameWorld.getObstacles().length,
        monstersCount: this.gameWorld.monsters.size,
        persistence: 'SQLite (dev.db)'
      });
    });

    // Endpoint para listar todos los perfiles de personajes guardados
    this.app.get('/api/profiles', (req, res) => {
      try {
        const profiles = this.gameWorld.db.getAllProfiles();
        res.json({ profiles });
      } catch (err: any) {
        res.status(500).json({ error: err.message, profiles: [] });
      }
    });

    // Endpoint para eliminar un perfil
    this.app.delete('/api/profiles/:name', (req, res) => {
      try {
        const targetName = decodeURIComponent(req.params.name);
        const success = this.gameWorld.db.deleteProfile(targetName);
        res.json({ success, name: targetName });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const player = this.gameWorld.createPlayer(ws);
      console.log(`[NetworkServer] Conexión de ${player.id} (${req.socket.remoteAddress}). Online: ${this.gameWorld.getPlayerCount()}`);

      const zone = this.gameWorld.mapManager.getZone(player.currentZone);
      const welcome: WelcomeMessage = {
        type: MessageType.WELCOME,
        playerId: player.id,
        hostIp: this.localIp,
        port: this.port,
        color: player.color,
        mapBound: MAP_BOUND,
        zoneId: zone.id,
        theme: zone.theme,
        obstacles: zone.obstacles,
        portals: zone.portals
      };
      ws.send(JSON.stringify(welcome));

      const joined: PlayerJoinedMessage = {
        type: MessageType.PLAYER_JOINED,
        player: player.toDTO()
      };
      this.broadcast(joined);

      ws.on('message', (data: Buffer | string) => {
        try {
          const msg = JSON.parse(data.toString());

          if (msg.type === MessageType.LOGIN) {
            this.gameWorld.loginPlayer(player, msg.name, msg.classType);
            console.log(`[NetworkServer] Login exitoso: ${player.name} (${player.classType}, Nivel ${player.level}) para socket ${player.id}`);
          } else if (msg.type === MessageType.INPUT) {
            player.input = {
              up: Boolean(msg.up),
              down: Boolean(msg.down),
              left: Boolean(msg.left),
              right: Boolean(msg.right)
            };
            player.lastInputTime = Date.now();
          } else if (msg.type === MessageType.SELECT_CLASS) {
            if (msg.classType === 'WARRIOR' || msg.classType === 'CLERIC' || msg.classType === 'MAGE') {
              const changed = player.setClass(msg.classType);
              if (changed) {
                this.gameWorld.savePlayer(player);
                console.log(`[NetworkServer] ${player.name} cambió su clase a ${msg.classType}`);
              }
            }
          } else if (msg.type === MessageType.SELECT_TARGET) {
            player.targetId = msg.targetId || null;
          } else if (msg.type === MessageType.CAST_SPELL) {
            const feedbacks = this.gameWorld.castSpell(player.id, msg.spellId, msg.targetId || player.targetId);
            if (feedbacks.length > 0) {
              const feedbackMsg: CombatFeedbackMessage = {
                type: MessageType.COMBAT_FEEDBACK,
                feedbacks
              };
              this.broadcast(feedbackMsg);
            }
          } else if (msg.type === MessageType.PING) {
            ws.send(JSON.stringify({ type: MessageType.PONG, clientTime: msg.clientTime }));
          }
        } catch (err) {
          // Ignorar paquetes corruptos
        }
      });

      ws.on('close', () => {
        this.gameWorld.removePlayer(player.id);
        console.log(`[NetworkServer] Desconexión de ${player.name} (${player.id}). Guardado en SQLite. Online: ${this.gameWorld.getPlayerCount()}`);
        const left: PlayerLeftMessage = {
          type: MessageType.PLAYER_LEFT,
          playerId: player.id
        };
        this.broadcast(left);
      });

      ws.on('error', (err) => {
        console.error(`[NetworkServer Error] ${player.id}:`, err.message);
      });
    });
  }

  public broadcast(message: unknown): void {
    const payload = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, '0.0.0.0', () => {
        console.log('================================================================');
        console.log(' RPG COOPERATIVO WLAN - SERVIDOR CON PERSISTENCIA SQLITE (FASE 4)');
        console.log('================================================================');
        console.log(` Servidor local escuchando en: http://localhost:${this.port}`);
        console.log(` Para jugar con tu familia en la misma red Wi-Fi:`);
        console.log(` 👉 http://${this.localIp}:${this.port}`);
        console.log('================================================================');
        this.gameWorld.start();
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.gameWorld.stop();
      this.wss.close(() => {
        this.httpServer.close(() => resolve());
      });
    });
  }
}
