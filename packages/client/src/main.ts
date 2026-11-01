import { Engine } from './core/Engine.js';
import { HUD } from './ui/HUD.js';
import { NetworkClient } from './network/NetworkClient.js';
import { InputManager } from './input/InputManager.js';
import { PlayerEntity } from './entities/PlayerEntity.js';
import { ObstacleRenderer } from './entities/ObstacleRenderer.js';
import { DEFAULT_CLIENT_PORT } from '@migame/common';

const engine = new Engine('canvas-container');
const hud = new HUD();
const obstacleRenderer = new ObstacleRenderer(engine.scene);
const network = new NetworkClient();

const inputManager = new InputManager((state) => {
  network.sendInput(state);
});

const playerEntities = new Map<string, PlayerEntity>();

network.onConnectionChange = (connected) => {
  hud.setConnected(connected);
};

network.onWelcome = (msg) => {
  hud.setPlayerId(msg.playerId);
  hud.setLanUrl(msg.hostIp, DEFAULT_CLIENT_PORT);

  // Renderizar obstáculos del mapa recibidos del servidor
  if (msg.obstacles && Array.isArray(msg.obstacles)) {
    obstacleRenderer.renderObstacles(msg.obstacles);
    console.log(`[Cliente] ${msg.obstacles.length} obstáculos generados en la escena.`);
  }
};

network.onWorldState = (msg) => {
  hud.updateStats(msg.players.length, network.lastPing);

  const activeIds = new Set<string>();

  for (const p of msg.players) {
    activeIds.add(p.id);
    let entity = playerEntities.get(p.id);

    if (!entity) {
      const isLocal = p.id === network.localPlayerId;
      entity = new PlayerEntity(engine.scene, p.id, p.color, isLocal);
      entity.group.position.set(p.x, 0, p.z);
      entity.group.rotation.y = p.rotation;
      playerEntities.set(p.id, entity);
    }

    entity.setTarget(p.x, p.z, p.rotation);
  }

  // Limpiar entidades desconectadas
  for (const [id, entity] of playerEntities.entries()) {
    if (!activeIds.has(id)) {
      entity.destroy(engine.scene);
      playerEntities.delete(id);
    }
  }
};

// Bucle de renderizado a 60 FPS con interpolación
function renderLoop(): void {
  requestAnimationFrame(renderLoop);

  // Actualizar interpolación de cada jugador
  for (const entity of playerEntities.values()) {
    entity.update(0.25, 0.3);
  }

  // Cámara suave siguiendo al jugador local
  if (network.localPlayerId && playerEntities.has(network.localPlayerId)) {
    const localEntity = playerEntities.get(network.localPlayerId)!;
    engine.followTarget(localEntity.group.position.x, localEntity.group.position.z, 0.08);
  }

  engine.render();
}

renderLoop();
