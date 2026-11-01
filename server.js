import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const TICK_RATE = 30; // 30 ticks por segundo
const TICK_INTERVAL = 1000 / TICK_RATE;
const PLAYER_SPEED = 7.5; // unidades por segundo en el plano 3D
const MAP_BOUND = 24; // límites del área jugable (-24 a 24 en X y Z)

// Helper para detectar la IP local de la máquina anfitriona en la red Wi-Fi
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIpAddress();

// Configuración Express
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/info', (req, res) => {
  res.json({
    localIp: LOCAL_IP,
    port: PORT,
    playersOnline: players.size,
    tickRate: TICK_RATE
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Estado autoritativo del juego
const players = new Map();
let nextPlayerId = 1;
let tickCount = 0;

// Paleta de colores atractivos para diferenciar a los jugadores de la familia
const PLAYER_COLORS = [
  '#3b82f6', // Azul (Jugador 1 / Local por defecto)
  '#ef4444', // Rojo
  '#10b981', // Verde esmeralda
  '#f59e0b', // Ámbar / Dorado
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#06b6d4'  // Cian
];

wss.on('connection', (ws, req) => {
  const id = `player_${nextPlayerId++}`;
  const colorIndex = (nextPlayerId - 2) % PLAYER_COLORS.length;
  
  // Posición de aparición aleatoria cercana al centro
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnDist = 2 + Math.random() * 4;
  
  const player = {
    id,
    ws,
    x: Math.cos(spawnAngle) * spawnDist,
    z: Math.sin(spawnAngle) * spawnDist,
    rotation: 0,
    color: PLAYER_COLORS[colorIndex],
    input: { up: false, down: false, left: false, right: false },
    ping: 0
  };

  players.set(id, player);
  console.log(`[Servidor] Jugador conectado: ${id} (${req.socket.remoteAddress}). Total online: ${players.size}`);

  // Enviar mensaje de bienvenida con el ID asignado y la IP del host
  ws.send(JSON.stringify({
    type: 'welcome',
    playerId: id,
    hostIp: LOCAL_IP,
    port: PORT,
    color: player.color,
    mapBound: MAP_BOUND
  }));

  // Notificar a todos sobre el nuevo jugador
  broadcast({
    type: 'player_joined',
    player: {
      id: player.id,
      x: player.x,
      z: player.z,
      rotation: player.rotation,
      color: player.color
    }
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'input') {
        player.input = {
          up: Boolean(message.up),
          down: Boolean(message.down),
          left: Boolean(message.left),
          right: Boolean(message.right)
        };
      } else if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', clientTime: message.clientTime }));
      }
    } catch (err) {
      // Ignorar payloads maliciosos o corruptos
    }
  });

  ws.on('close', () => {
    players.delete(id);
    console.log(`[Servidor] Jugador desconectado: ${id}. Total online: ${players.size}`);
    broadcast({
      type: 'player_left',
      playerId: id
    });
  });

  ws.on('error', (err) => {
    console.error(`[Servidor WS Error] ${id}:`, err.message);
  });
});

function broadcast(obj) {
  const json = JSON.stringify(obj);
  for (const player of players.values()) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(json);
    }
  }
}

// Bucle de simulación autoritativo a tasa fija con delta time compensado
let lastTime = performance.now();

setInterval(() => {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  tickCount++;

  // Actualizar posiciones de forma 100% autoritativa
  for (const player of players.values()) {
    let moveX = 0;
    let moveZ = 0;

    // En vista isométrica:
    // UP (W) mueve en -Z y -X (hacia arriba en diagonal de cámara)
    // DOWN (S) mueve en +Z y +X
    // LEFT (A) mueve en -X y +Z
    // RIGHT (D) mueve en +X y -Z
    if (player.input.up) moveZ -= 1;
    if (player.input.down) moveZ += 1;
    if (player.input.left) moveX -= 1;
    if (player.input.right) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      // Normalizar vector para evitar velocidad doble en diagonales
      const length = Math.hypot(moveX, moveZ);
      const normX = moveX / length;
      const normZ = moveZ / length;

      // Calcular nueva posición con velocidad fija por deltaTime
      let newX = player.x + normX * PLAYER_SPEED * dt;
      let newZ = player.z + normZ * PLAYER_SPEED * dt;

      // Colisión contra límites del mapa
      newX = Math.max(-MAP_BOUND, Math.min(MAP_BOUND, newX));
      newZ = Math.max(-MAP_BOUND, Math.min(MAP_BOUND, newZ));

      player.x = newX;
      player.z = newZ;
      // Rotación hacia la dirección del movimiento
      player.rotation = Math.atan2(normX, normZ);
    }
  }

  // Empaquetar y emitir el WorldState
  const worldState = {
    type: 'world_state',
    tick: tickCount,
    timestamp: Date.now(),
    players: Array.from(players.values()).map(p => ({
      id: p.id,
      x: Number(p.x.toFixed(3)),
      z: Number(p.z.toFixed(3)),
      rotation: Number(p.rotation.toFixed(3)),
      color: p.color
    }))
  };

  broadcast(worldState);
}, TICK_INTERVAL);

server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(' RPG COOPERATIVO WLAN - DEMO AUTORITATIVA JUGABLE (FASE CERO)   ');
  console.log('================================================================');
  console.log(` Servidor local escuchando en: http://localhost:${PORT}`);
  console.log(` Para jugar con tu familia en la misma red Wi-Fi:`);
  console.log(` 👉 http://${LOCAL_IP}:${PORT}`);
  console.log('================================================================');
});
