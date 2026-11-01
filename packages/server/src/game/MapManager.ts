import { ObstacleDTO, MAP_BOUND } from '@migame/common';

export class MapManager {
  public obstacles: ObstacleDTO[] = [];

  constructor() {
    this.generateMap();
  }

  private generateMap(): void {
    // 1. Ruinas centrales: 4 pilares de piedra formando un templo o plaza
    this.obstacles.push(
      { id: 'pillar_c1', type: 'box', x: -5, z: -5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c2', type: 'box', x: 5, z: -5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c3', type: 'box', x: -5, z: 5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c4', type: 'box', x: 5, z: 5, width: 2, depth: 2, height: 4, kind: 'pillar' }
    );

    // 2. Muros / Barreras de ruinas
    this.obstacles.push(
      { id: 'wall_north', type: 'box', x: 0, z: -16, width: 8, depth: 1.5, height: 2.5, kind: 'wall' },
      { id: 'wall_south', type: 'box', x: 0, z: 16, width: 8, depth: 1.5, height: 2.5, kind: 'wall' }
    );

    // 3. Rocas dispersas
    this.obstacles.push(
      { id: 'rock_1', type: 'circle', x: -12, z: -8, radius: 1.8, height: 2.2, kind: 'rock' },
      { id: 'rock_2', type: 'circle', x: 14, z: -10, radius: 2.2, height: 2.6, kind: 'rock' },
      { id: 'rock_3', type: 'circle', x: -15, z: 12, radius: 2.0, height: 2.4, kind: 'rock' },
      { id: 'rock_4', type: 'circle', x: 12, z: 14, radius: 1.6, height: 1.8, kind: 'rock' }
    );

    // 4. Árboles en el perímetro y claros
    this.obstacles.push(
      { id: 'tree_1', type: 'circle', x: -18, z: -18, radius: 1.4, height: 6.0, kind: 'tree' },
      { id: 'tree_2', type: 'circle', x: -18, z: 0, radius: 1.3, height: 5.5, kind: 'tree' },
      { id: 'tree_3', type: 'circle', x: 18, z: -18, radius: 1.5, height: 6.2, kind: 'tree' },
      { id: 'tree_4', type: 'circle', x: 18, z: 0, radius: 1.3, height: 5.8, kind: 'tree' },
      { id: 'tree_5', type: 'circle', x: -8, z: -18, radius: 1.2, height: 5.2, kind: 'tree' },
      { id: 'tree_6', type: 'circle', x: 8, z: 18, radius: 1.4, height: 6.0, kind: 'tree' },
      { id: 'tree_7', type: 'circle', x: 18, z: 18, radius: 1.5, height: 6.5, kind: 'tree' }
    );
  }

  public resolveCollisions(px: number, pz: number, playerRadius: number): { x: number; z: number } {
    let resolvedX = px;
    let resolvedZ = pz;

    // Resolver colisión contra cada obstáculo (soporta deslizamiento de esquinas)
    for (const obs of this.obstacles) {
      if (obs.type === 'circle') {
        const dx = resolvedX - obs.x;
        const dz = resolvedZ - obs.z;
        const dist = Math.hypot(dx, dz);
        const minDist = playerRadius + obs.radius;

        if (dist < minDist && dist > 0.0001) {
          const overlap = minDist - dist;
          resolvedX += (dx / dist) * overlap;
          resolvedZ += (dz / dist) * overlap;
        }
      } else if (obs.type === 'box') {
        const halfW = obs.width / 2;
        const halfD = obs.depth / 2;

        // Punto más cercano dentro de la caja AABB
        const closestX = Math.max(obs.x - halfW, Math.min(obs.x + halfW, resolvedX));
        const closestZ = Math.max(obs.z - halfD, Math.min(obs.z + halfD, resolvedZ));

        const dx = resolvedX - closestX;
        const dz = resolvedZ - closestZ;
        const dist = Math.hypot(dx, dz);

        if (dist < playerRadius) {
          if (dist > 0.0001) {
            const overlap = playerRadius - dist;
            resolvedX += (dx / dist) * overlap;
            resolvedZ += (dz / dist) * overlap;
          } else {
            // Si el jugador está exactamente dentro del centro de la caja, empujar hacia el eje más cercano
            const overlapLeft = Math.abs((obs.x - halfW) - resolvedX);
            const overlapRight = Math.abs((obs.x + halfW) - resolvedX);
            const overlapTop = Math.abs((obs.z - halfD) - resolvedZ);
            const overlapBottom = Math.abs((obs.z + halfD) - resolvedZ);
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft) resolvedX = obs.x - halfW - playerRadius;
            else if (minOverlap === overlapRight) resolvedX = obs.x + halfW + playerRadius;
            else if (minOverlap === overlapTop) resolvedZ = obs.z - halfD - playerRadius;
            else resolvedZ = obs.z + halfD + playerRadius;
          }
        }
      }
    }

    // Límites del mapa
    resolvedX = Math.max(-MAP_BOUND + playerRadius, Math.min(MAP_BOUND - playerRadius, resolvedX));
    resolvedZ = Math.max(-MAP_BOUND + playerRadius, Math.min(MAP_BOUND - playerRadius, resolvedZ));

    return { x: resolvedX, z: resolvedZ };
  }
}
