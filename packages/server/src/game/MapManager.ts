import { ObstacleDTO, PortalDTO, ZoneThemeDTO, MAP_BOUND, ZONE_THEMES } from '@migame/common';

export interface ZoneData {
  id: string;
  name: string;
  minLevel: number;
  theme: ZoneThemeDTO;
  obstacles: ObstacleDTO[];
  portals: PortalDTO[];
  spawnPoint: { x: number; z: number };
}

export class MapManager {
  public zones: Map<string, ZoneData> = new Map();

  constructor() {
    this.generateZones();
  }

  private generateZones(): void {
    // ----------------------------------------------------
    // ZONA 1: BOSQUE DE LOS GOBLINS (Nivel 1+)
    // ----------------------------------------------------
    const forestObstacles: ObstacleDTO[] = [
      // 1. Ruinas centrales
      { id: 'pillar_c1', type: 'box', x: -5, z: -5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c2', type: 'box', x: 5, z: -5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c3', type: 'box', x: -5, z: 5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c4', type: 'box', x: 5, z: 5, width: 2, depth: 2, height: 4, kind: 'pillar' },

      // 2. Muros de ruinas
      { id: 'wall_north', type: 'box', x: 0, z: -16, width: 8, depth: 1.5, height: 2.5, kind: 'wall' },
      { id: 'wall_south', type: 'box', x: 0, z: 16, width: 8, depth: 1.5, height: 2.5, kind: 'wall' },

      // Pilares del portal norte
      { id: 'portal_pillar_l', type: 'box', x: -3.5, z: -20, width: 1.5, depth: 1.5, height: 5, kind: 'pillar' },
      { id: 'portal_pillar_r', type: 'box', x: 3.5, z: -20, width: 1.5, depth: 1.5, height: 5, kind: 'pillar' },

      // 3. Rocas dispersas
      { id: 'rock_1', type: 'circle', x: -12, z: -8, radius: 1.8, height: 2.2, kind: 'rock' },
      { id: 'rock_2', type: 'circle', x: 14, z: -10, radius: 2.2, height: 2.6, kind: 'rock' },
      { id: 'rock_3', type: 'circle', x: -15, z: 12, radius: 2.0, height: 2.4, kind: 'rock' },
      { id: 'rock_4', type: 'circle', x: 12, z: 14, radius: 1.6, height: 1.8, kind: 'rock' },

      // 4. Árboles en el perímetro
      { id: 'tree_1', type: 'circle', x: -18, z: -18, radius: 1.4, height: 6.0, kind: 'tree' },
      { id: 'tree_2', type: 'circle', x: -18, z: 0, radius: 1.3, height: 5.5, kind: 'tree' },
      { id: 'tree_3', type: 'circle', x: 18, z: -18, radius: 1.5, height: 6.2, kind: 'tree' },
      { id: 'tree_4', type: 'circle', x: 18, z: 0, radius: 1.3, height: 5.8, kind: 'tree' },
      { id: 'tree_5', type: 'circle', x: -8, z: -18, radius: 1.2, height: 5.2, kind: 'tree' },
      { id: 'tree_6', type: 'circle', x: 8, z: 18, radius: 1.4, height: 6.0, kind: 'tree' },
      { id: 'tree_7', type: 'circle', x: 18, z: 18, radius: 1.5, height: 6.5, kind: 'tree' }
    ];

    const forestPortals: PortalDTO[] = [
      {
        id: 'portal_forest_to_crypt',
        name: 'Portal a la Cripta Maldita',
        fromZone: 'zone_forest',
        toZone: 'zone_crypt',
        x: 0,
        z: -20,
        radius: 2.4,
        minLevel: 2,
        targetSpawn: { x: 0, z: 17 },
        color: '#a855f7'
      }
    ];

    this.zones.set('zone_forest', {
      id: 'zone_forest',
      name: 'Bosque de los Goblins',
      minLevel: 1,
      theme: ZONE_THEMES.zone_forest,
      obstacles: forestObstacles,
      portals: forestPortals,
      spawnPoint: { x: 0, z: 14 }
    });

    // ----------------------------------------------------
    // ZONA 2: CRIPTA MALDITA (Nivel 2+)
    // ----------------------------------------------------
    const cryptObstacles: ObstacleDTO[] = [
      // Muro de altar al norte
      { id: 'crypt_wall_n', type: 'box', x: 0, z: -16, width: 14, depth: 2, height: 4, kind: 'wall' },
      // Muros laterales de la cripta
      { id: 'crypt_wall_w', type: 'box', x: -16, z: 0, width: 2, depth: 18, height: 4, kind: 'wall' },
      { id: 'crypt_wall_e', type: 'box', x: 16, z: 0, width: 2, depth: 18, height: 4, kind: 'wall' },
      // Muros del portal de retorno (sur)
      { id: 'crypt_wall_s1', type: 'box', x: -8, z: 18, width: 6, depth: 2, height: 3.5, kind: 'wall' },
      { id: 'crypt_wall_s2', type: 'box', x: 8, z: 18, width: 6, depth: 2, height: 3.5, kind: 'wall' },

      // Pilares de piedra volcánica
      { id: 'crypt_p1', type: 'box', x: -6, z: -6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },
      { id: 'crypt_p2', type: 'box', x: 6, z: -6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },
      { id: 'crypt_p3', type: 'box', x: -6, z: 6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },
      { id: 'crypt_p4', type: 'box', x: 6, z: 6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },

      // Pilares del portal de retorno
      { id: 'crypt_portal_p1', type: 'box', x: -3.5, z: 20, width: 1.6, depth: 1.6, height: 5.5, kind: 'pillar' },
      { id: 'crypt_portal_p2', type: 'box', x: 3.5, z: 20, width: 1.6, depth: 1.6, height: 5.5, kind: 'pillar' },

      // Monolitos y sarcófagos de piedra
      { id: 'crypt_rock_1', type: 'circle', x: -11, z: 8, radius: 2.0, height: 2.6, kind: 'rock' },
      { id: 'crypt_rock_2', type: 'circle', x: 11, z: 8, radius: 2.0, height: 2.6, kind: 'rock' },
      { id: 'crypt_rock_3', type: 'circle', x: -11, z: -8, radius: 2.2, height: 3.0, kind: 'rock' },
      { id: 'crypt_rock_4', type: 'circle', x: 11, z: -8, radius: 2.2, height: 3.0, kind: 'rock' }
    ];

    const cryptPortals: PortalDTO[] = [
      {
        id: 'portal_crypt_to_forest',
        name: 'Portal de Regreso al Bosque',
        fromZone: 'zone_crypt',
        toZone: 'zone_forest',
        x: 0,
        z: 20,
        radius: 2.4,
        minLevel: 1,
        targetSpawn: { x: 0, z: -16 },
        color: '#3b82f6'
      }
    ];

    this.zones.set('zone_crypt', {
      id: 'zone_crypt',
      name: 'Cripta Maldita',
      minLevel: 2,
      theme: ZONE_THEMES.zone_crypt,
      obstacles: cryptObstacles,
      portals: cryptPortals,
      spawnPoint: { x: 0, z: 17 }
    });
  }

  public getZone(zoneId: string): ZoneData {
    return this.zones.get(zoneId) || this.zones.get('zone_forest')!;
  }

  public getObstacles(zoneId: string = 'zone_forest'): ObstacleDTO[] {
    const zone = this.getZone(zoneId);
    return zone.obstacles;
  }

  public getPortals(zoneId: string = 'zone_forest'): PortalDTO[] {
    const zone = this.getZone(zoneId);
    return zone.portals;
  }

  public resolveCollisions(zoneId: string, px: number, pz: number, playerRadius: number): { x: number; z: number } {
    let resolvedX = px;
    let resolvedZ = pz;
    const obstacles = this.getObstacles(zoneId);

    // Resolver colisión contra cada obstáculo (soporta deslizamiento)
    for (const obs of obstacles) {
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
