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
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });

    this.app.get('/api/info', (req, res) => {
      res.json({
        localIp: this.localIp,
        port: this.port,
        playersOnline: this.gameWorld.getPlayerCount(),
        tickRate: TICK_RATE,
        obstaclesCount: this.gameWorld.getObstacles().length
      });
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const player = this.gameWorld.createPlayer(ws);
      console.log(`[NetworkServer] Conexión de ${player.id} (${req.socket.remoteAddress}). Online: ${this.gameWorld.getPlayerCount()}`);

      // Enviar bienvenida con la lista de obstáculos autoritativos
      const welcome: WelcomeMessage = {
        type: MessageType.WELCOME,
        playerId: player.id,
        hostIp: this.localIp,
        port: this.port,
        color: player.color,
        mapBound: MAP_BOUND,
        obstacles: this.gameWorld.getObstacles()
      };
      ws.send(JSON.stringify(welcome));

      // Notificar a todos sobre la nueva incorporación
      const joined: PlayerJoinedMessage = {
        type: MessageType.PLAYER_JOINED,
        player: player.toDTO()
      };
      this.broadcast(joined);

      ws.on('message', (data: Buffer | string) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === MessageType.INPUT) {
            player.input = {
              up: Boolean(msg.up),
              down: Boolean(msg.down),
              left: Boolean(msg.left),
              right: Boolean(msg.right)
            };
            player.lastInputTime = Date.now();
          } else if (msg.type === MessageType.PING) {
            ws.send(JSON.stringify({ type: MessageType.PONG, clientTime: msg.clientTime }));
          }
        } catch (err) {
          // Ignorar paquetes inválidos
        }
      });

      ws.on('close', () => {
        this.gameWorld.removePlayer(player.id);
        console.log(`[NetworkServer] Desconexión de ${player.id}. Online: ${this.gameWorld.getPlayerCount()}`);
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
        console.log(' RPG COOPERATIVO WLAN - SERVIDOR CON COLISIONES (FASE 2)       ');
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
