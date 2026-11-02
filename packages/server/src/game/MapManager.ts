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
      { id: 'pillar_c1', type: 'box', x: -5, z: -5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c2', type: 'box', x: 5, z: -5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c3', type: 'box', x: -5, z: 5, width: 2, depth: 2, height: 4, kind: 'pillar' },
      { id: 'pillar_c4', type: 'box', x: 5, z: 5, width: 2, depth: 2, height: 4, kind: 'pillar' },

      { id: 'wall_north', type: 'box', x: 0, z: -16, width: 8, depth: 1.5, height: 2.5, kind: 'wall' },
      { id: 'wall_south', type: 'box', x: 0, z: 16, width: 8, depth: 1.5, height: 2.5, kind: 'wall' },

      { id: 'portal_pillar_l', type: 'box', x: -3.5, z: -20, width: 1.5, depth: 1.5, height: 5, kind: 'pillar' },
      { id: 'portal_pillar_r', type: 'box', x: 3.5, z: -20, width: 1.5, depth: 1.5, height: 5, kind: 'pillar' },

      { id: 'rock_1', type: 'circle', x: -12, z: -8, radius: 1.8, height: 2.2, kind: 'rock' },
      { id: 'rock_2', type: 'circle', x: 14, z: -10, radius: 2.2, height: 2.6, kind: 'rock' },
      { id: 'rock_3', type: 'circle', x: -15, z: 12, radius: 2.0, height: 2.4, kind: 'rock' },
      { id: 'rock_4', type: 'circle', x: 12, z: 14, radius: 1.6, height: 1.8, kind: 'rock' },

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
        minLevel: 3,
        targetSpawn: { x: 0, z: 14 },
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
    // ZONA 2: CRIPTA MALDITA (Nivel 3+)
    // ----------------------------------------------------
    const cryptObstacles: ObstacleDTO[] = [
      { id: 'crypt_wall_n', type: 'box', x: 0, z: -16, width: 8, depth: 2, height: 4, kind: 'wall' },
      { id: 'crypt_wall_w', type: 'box', x: -16, z: 0, width: 2, depth: 18, height: 4, kind: 'wall' },
      { id: 'crypt_wall_e', type: 'box', x: 16, z: 0, width: 2, depth: 18, height: 4, kind: 'wall' },
      { id: 'crypt_wall_s1', type: 'box', x: -8, z: 18, width: 6, depth: 2, height: 3.5, kind: 'wall' },
      { id: 'crypt_wall_s2', type: 'box', x: 8, z: 18, width: 6, depth: 2, height: 3.5, kind: 'wall' },

      // Pilares de soporte
      { id: 'crypt_p1', type: 'box', x: -6, z: -6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },
      { id: 'crypt_p2', type: 'box', x: 6, z: -6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },
      { id: 'crypt_p3', type: 'box', x: -6, z: 6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },
      { id: 'crypt_p4', type: 'box', x: 6, z: 6, width: 2.2, depth: 2.2, height: 5, kind: 'pillar' },

      // Pilares del portal norte
      { id: 'crypt_portal_n1', type: 'box', x: -3.5, z: -20, width: 1.6, depth: 1.6, height: 5.5, kind: 'pillar' },
      { id: 'crypt_portal_n2', type: 'box', x: 3.5, z: -20, width: 1.6, depth: 1.6, height: 5.5, kind: 'pillar' },

      // Pilares del portal sur (retorno)
      { id: 'crypt_portal_p1', type: 'box', x: -3.5, z: 20, width: 1.6, depth: 1.6, height: 5.5, kind: 'pillar' },
      { id: 'crypt_portal_p2', type: 'box', x: 3.5, z: 20, width: 1.6, depth: 1.6, height: 5.5, kind: 'pillar' },

      { id: 'crypt_rock_1', type: 'circle', x: -11, z: 8, radius: 2.0, height: 2.6, kind: 'rock' },
      { id: 'crypt_rock_2', type: 'circle', x: 11, z: 8, radius: 2.0, height: 2.6, kind: 'rock' },
      { id: 'crypt_rock_3', type: 'circle', x: -11, z: -8, radius: 2.2, height: 3.0, kind: 'rock' },
      { id: 'crypt_rock_4', type: 'circle', x: 11, z: -8, radius: 2.2, height: 3.0, kind: 'rock' }
    ];

    const cryptPortals: PortalDTO[] = [
      {
        id: 'portal_crypt_to_forest',
        name: 'Portal al Bosque',
        fromZone: 'zone_crypt',
        toZone: 'zone_forest',
        x: 0,
        z: 20,
        radius: 2.4,
        minLevel: 1,
        targetSpawn: { x: 0, z: -14 },
        color: '#3b82f6'
      },
      {
        id: 'portal_crypt_to_volcano',
        name: 'Portal al Bastión Volcánico',
        fromZone: 'zone_crypt',
        toZone: 'zone_volcano',
        x: 0,
        z: -20,
        radius: 2.4,
        minLevel: 6,
        targetSpawn: { x: 0, z: 14 },
        color: '#f97316'
      }
    ];

    this.zones.set('zone_crypt', {
      id: 'zone_crypt',
      name: 'Cripta Maldita',
      minLevel: 3,
      theme: ZONE_THEMES.zone_crypt,
      obstacles: cryptObstacles,
      portals: cryptPortals,
      spawnPoint: { x: 0, z: 14 }
    });

    // ----------------------------------------------------
    // ZONA 3: BASTIÓN VOLCÁNICO (Nivel 6+)
    // ----------------------------------------------------
    const volcanoObstacles: ObstacleDTO[] = [
      { id: 'volc_wall_w', type: 'box', x: -17, z: 0, width: 2, depth: 22, height: 4.5, kind: 'wall' },
      { id: 'volc_wall_e', type: 'box', x: 17, z: 0, width: 2, depth: 22, height: 4.5, kind: 'wall' },
      { id: 'volc_wall_n', type: 'box', x: 0, z: -17, width: 8, depth: 2, height: 4.5, kind: 'wall' },

      // Pilares de magma central
      { id: 'volc_p1', type: 'box', x: -7, z: -7, width: 2.5, depth: 2.5, height: 6, kind: 'pillar' },
      { id: 'volc_p2', type: 'box', x: 7, z: -7, width: 2.5, depth: 2.5, height: 6, kind: 'pillar' },
      { id: 'volc_p3', type: 'box', x: -7, z: 7, width: 2.5, depth: 2.5, height: 6, kind: 'pillar' },
      { id: 'volc_p4', type: 'box', x: 7, z: 7, width: 2.5, depth: 2.5, height: 6, kind: 'pillar' },

      // Pilares del portal sur (retorno a cripta)
      { id: 'volc_portal_s1', type: 'box', x: -3.5, z: 20, width: 1.8, depth: 1.8, height: 5.5, kind: 'pillar' },
      { id: 'volc_portal_s2', type: 'box', x: 3.5, z: 20, width: 1.8, depth: 1.8, height: 5.5, kind: 'pillar' },

      // Pilares del portal norte (al vacío)
      { id: 'volc_portal_n1', type: 'box', x: -3.5, z: -20, width: 1.8, depth: 1.8, height: 5.5, kind: 'pillar' },
      { id: 'volc_portal_n2', type: 'box', x: 3.5, z: -20, width: 1.8, depth: 1.8, height: 5.5, kind: 'pillar' },

      // Rocas de obsidiana ardiente
      { id: 'volc_rock_1', type: 'circle', x: -12, z: 0, radius: 2.4, height: 3.2, kind: 'rock' },
      { id: 'volc_rock_2', type: 'circle', x: 12, z: 0, radius: 2.4, height: 3.2, kind: 'rock' },
      { id: 'volc_rock_3', type: 'circle', x: 0, z: -8, radius: 1.8, height: 2.2, kind: 'rock' }
    ];

    const volcanoPortals: PortalDTO[] = [
      {
        id: 'portal_volcano_to_crypt',
        name: 'Portal a la Cripta',
        fromZone: 'zone_volcano',
        toZone: 'zone_crypt',
        x: 0,
        z: 20,
        radius: 2.4,
        minLevel: 3,
        targetSpawn: { x: 0, z: -14 },
        color: '#a855f7'
      },
      {
        id: 'portal_volcano_to_void',
        name: 'Portal al Abismo del Vacío',
        fromZone: 'zone_volcano',
        toZone: 'zone_void',
        x: 0,
        z: -20,
        radius: 2.4,
        minLevel: 9,
        targetSpawn: { x: 0, z: 14 },
        color: '#8b5cf6'
      }
    ];

    this.zones.set('zone_volcano', {
      id: 'zone_volcano',
      name: 'Bastión Volcánico',
      minLevel: 6,
      theme: ZONE_THEMES.zone_volcano,
      obstacles: volcanoObstacles,
      portals: volcanoPortals,
      spawnPoint: { x: 0, z: 14 }
    });

    // ----------------------------------------------------
    // ZONA 4: ABISMO DEL VACÍO (Nivel 9+)
    // ----------------------------------------------------
    const voidObstacles: ObstacleDTO[] = [
      { id: 'void_p1', type: 'box', x: -8, z: -8, width: 2.2, depth: 2.2, height: 6.5, kind: 'pillar' },
      { id: 'void_p2', type: 'box', x: 8, z: -8, width: 2.2, depth: 2.2, height: 6.5, kind: 'pillar' },
      { id: 'void_p3', type: 'box', x: -8, z: 8, width: 2.2, depth: 2.2, height: 6.5, kind: 'pillar' },
      { id: 'void_p4', type: 'box', x: 8, z: 8, width: 2.2, depth: 2.2, height: 6.5, kind: 'pillar' },

      { id: 'void_wall_w', type: 'box', x: -16, z: 0, width: 2, depth: 16, height: 4, kind: 'wall' },
      { id: 'void_wall_e', type: 'box', x: 16, z: 0, width: 2, depth: 16, height: 4, kind: 'wall' },

      { id: 'void_portal_s1', type: 'box', x: -3.5, z: 20, width: 1.8, depth: 1.8, height: 6, kind: 'pillar' },
      { id: 'void_portal_s2', type: 'box', x: 3.5, z: 20, width: 1.8, depth: 1.8, height: 6, kind: 'pillar' },

      { id: 'void_crystal_1', type: 'circle', x: -12, z: -10, radius: 2.2, height: 3.5, kind: 'rock' },
      { id: 'void_crystal_2', type: 'circle', x: 12, z: -10, radius: 2.2, height: 3.5, kind: 'rock' },
      { id: 'void_crystal_3', type: 'circle', x: -12, z: 10, radius: 2.2, height: 3.5, kind: 'rock' },
      { id: 'void_crystal_4', type: 'circle', x: 12, z: 10, radius: 2.2, height: 3.5, kind: 'rock' }
    ];

    const voidPortals: PortalDTO[] = [
      {
        id: 'portal_void_to_volcano',
        name: 'Portal al Bastión Volcánico',
        fromZone: 'zone_void',
        toZone: 'zone_volcano',
        x: 0,
        z: 20,
        radius: 2.4,
        minLevel: 6,
        targetSpawn: { x: 0, z: -14 },
        color: '#f97316'
      }
    ];

    this.zones.set('zone_void', {
      id: 'zone_void',
      name: 'Abismo del Vacío',
      minLevel: 9,
      theme: ZONE_THEMES.zone_void,
      obstacles: voidObstacles,
      portals: voidPortals,
      spawnPoint: { x: 0, z: 14 }
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

    // Resolver colisión contra cada obstáculo (soporta deslizamiento de esquinas)
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
