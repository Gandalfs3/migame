import * as THREE from 'three';
import { MonsterType, PlayerClass } from '@migame/common';

export interface TextureRecipeConfig {
  basePattern:
    | 'scales'
    | 'skin'
    | 'fur'
    | 'plate_armor'
    | 'stone'
    | 'bark'
    | 'runic'
    | 'lava_cracks'
    | 'cobblestone'
    | 'chitin'
    | 'bone'
    | 'ground_forest'
    | 'ground_crypt'
    | 'ground_volcano'
    | 'ground_void';
  secondaryPattern?: 'none' | 'scales' | 'plate_armor' | 'runic' | 'veins' | 'stripes';
  patternBlend?: number;
  patternScale?: number;
  repeat?: number;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    shadow: string;
    highlight: string;
    emissive?: string;
  };
  pbr: {
    roughness: number;
    metalness: number;
    normalStrength: number;
    emissionIntensity?: number;
  };
}

export class ProceduralTextureFactory {
  private static materialCache: Map<string, THREE.MeshStandardMaterial> = new Map();

  // Helper: Hex string to [r, g, b] 0..255
  private static hexToRgb(hex: string): [number, number, number] {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return [128, 128, 128];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  private static lerpColor(
    c1: [number, number, number],
    c2: [number, number, number],
    t: number
  ): [number, number, number] {
    const clampT = Math.max(0, Math.min(1, t));
    return [
      c1[0] + (c2[0] - c1[0]) * clampT,
      c1[1] + (c2[1] - c1[1]) * clampT,
      c1[2] + (c2[2] - c1[2]) * clampT,
    ];
  }

  // Genera o recupera del caché un MeshStandardMaterial con mapas de Albedo y Normal
  public static createMaterial(cacheKey: string, config: TextureRecipeConfig, resolution: number = 256): THREE.MeshStandardMaterial {
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!;
    }

    const albedoCanvas = document.createElement('canvas');
    const normalCanvas = document.createElement('canvas');
    albedoCanvas.width = resolution;
    albedoCanvas.height = resolution;
    normalCanvas.width = resolution;
    normalCanvas.height = resolution;

    const albedoCtx = albedoCanvas.getContext('2d')!;
    const normalCtx = normalCanvas.getContext('2d')!;

    const albedoImg = albedoCtx.createImageData(resolution, resolution);
    const normalImg = normalCtx.createImageData(resolution, resolution);

    const colPrimary = this.hexToRgb(config.palette.primary);
    const colSecondary = this.hexToRgb(config.palette.secondary);
    const colAccent = this.hexToRgb(config.palette.accent);
    const colShadow = this.hexToRgb(config.palette.shadow);
    const colHighlight = this.hexToRgb(config.palette.highlight);
    const colEmissive = config.palette.emissive ? this.hexToRgb(config.palette.emissive) : colAccent;

    const heightBuffer = new Float32Array(resolution * resolution);
    const maskBuffer = new Float32Array(resolution * resolution);
    const scale = config.patternScale || 8;

    // Síntesis analítica del patrón
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const u = x / resolution;
        const v = y / resolution;

        let h = 0.5;
        let m = 0;

        if (config.basePattern === 'scales') {
          const cells = Math.max(4, Math.round(scale));
          const cx = (u * cells) % 1;
          const cy = (v * cells) % 1;
          const dist = Math.sqrt((cx - 0.5) * (cx - 0.5) + (cy - 0.5) * (cy - 0.5));
          h = Math.sin(Math.min(1, dist * 2) * Math.PI * 0.5);
          m = dist < 0.25 ? 1 : 0;
        } else if (config.basePattern === 'plate_armor') {
          const cells = Math.max(2, Math.round(scale * 0.5));
          const px = (u * cells) % 1;
          const py = (v * cells) % 1;
          const edge = Math.min(Math.min(px, 1 - px), Math.min(py, 1 - py));
          h = Math.min(1, edge * 6);
          const isCorner = (px < 0.18 || px > 0.82) && (py < 0.18 || py > 0.82);
          m = isCorner ? 1 : (edge < 0.08 ? 0.8 : 0);
        } else if (config.basePattern === 'lava_cracks') {
          const n1 = Math.sin(u * scale * 3.14 + Math.cos(v * scale * 2.5));
          const n2 = Math.cos(v * scale * 3.14 + Math.sin(u * scale * 2.5));
          const crack = Math.abs(n1 + n2);
          h = Math.min(1, crack * 1.4);
          m = crack < 0.4 ? (0.4 - crack) * 2.5 : 0;
        } else if (config.basePattern === 'stone') {
          const n1 = Math.sin(u * scale * 2.5 + Math.sin(v * scale * 3.0));
          const n2 = Math.cos(v * scale * 2.5 + Math.cos(u * scale * 3.0));
          const micro = Math.sin(u * scale * 8) * Math.cos(v * scale * 8) * 0.15;
          h = (n1 + n2) * 0.25 + 0.5 + micro;
          m = h < 0.3 ? 0.8 : 0;
        } else if (config.basePattern === 'bark') {
          const wave = Math.sin(v * scale * 0.8 + Math.cos(u * scale * 2)) * 0.2;
          const streak = Math.sin((u + wave) * scale * 5.0);
          h = streak * 0.4 + 0.5;
          m = Math.abs(streak) < 0.25 ? 1 : 0;
        } else if (config.basePattern === 'cobblestone') {
          const cellsX = Math.max(3, Math.round(scale));
          const cellsY = Math.max(3, Math.round(scale * 0.8));
          const row = Math.floor(v * cellsY);
          const uShift = row % 2 === 0 ? 0 : 0.5;
          const px = ((u + uShift) * cellsX) % 1;
          const py = (v * cellsY) % 1;
          const edge = Math.min(Math.min(px, 1 - px), Math.min(py, 1 - py));
          h = Math.min(1, Math.sin(edge * Math.PI) * 1.3);
          m = edge < 0.12 ? 1 : 0;
        } else if (config.basePattern === 'runic') {
          const gridU = (u * scale) % 1;
          const gridV = (v * scale) % 1;
          const lineX = Math.abs(gridU - 0.5) < 0.09;
          const lineY = Math.abs(gridV - 0.5) < 0.09;
          const diag = Math.abs(gridU - gridV) < 0.09;
          const circle = Math.abs(Math.hypot(gridU - 0.5, gridV - 0.5) - 0.3) < 0.09;
          const isRune = lineX || lineY || diag || circle;
          h = isRune ? 0.9 : 0.35;
          m = isRune ? 1.0 : 0;
        } else if (config.basePattern === 'skin') {
          const cell = Math.sin(u * scale * 3.5) * Math.sin(v * scale * 3.5);
          const pore = Math.sin(u * scale * 10) * Math.cos(v * scale * 10) * 0.12;
          h = cell * 0.35 + 0.5 + pore;
          m = cell > 0.35 ? 0.9 : 0;
        } else if (config.basePattern === 'bone' || config.basePattern === 'chitin') {
          const f1 = Math.sin(u * scale * 2.0 + v * scale * 1.5);
          const f2 = Math.cos(u * scale * 1.5 - v * scale * 2.0);
          h = (f1 + f2) * 0.25 + 0.6;
          const crack = Math.abs(Math.sin(u * scale * 4 + Math.cos(v * scale * 4)));
          m = crack < 0.15 ? 1 : 0;
        } else if (config.basePattern === 'ground_forest') {
          const patch = Math.sin(u * scale * 2) * Math.cos(v * scale * 2);
          const blades = Math.sin(u * scale * 12 + v * scale * 8) * 0.2;
          h = patch * 0.35 + 0.5 + blades;
          m = patch > 0.1 ? 0.9 : 0;
        } else if (config.basePattern === 'ground_crypt') {
          const px = (u * scale) % 1;
          const py = (v * scale) % 1;
          const edge = Math.min(Math.min(px, 1 - px), Math.min(py, 1 - py));
          h = Math.min(1, edge * 8);
          m = edge < 0.1 ? 1 : 0;
        } else if (config.basePattern === 'ground_volcano') {
          const lava = Math.sin(u * scale * 2 + Math.cos(v * scale * 1.5));
          h = Math.abs(lava);
          m = h < 0.35 ? (0.35 - h) * 3 : 0;
        } else if (config.basePattern === 'ground_void') {
          const vortex = Math.sin(Math.hypot(u - 0.5, v - 0.5) * scale * 4);
          h = vortex * 0.4 + 0.5;
          m = Math.abs(vortex) > 0.5 ? 1 : 0;
        } else {
          h = Math.sin(u * scale * 2) * Math.cos(v * scale * 2) * 0.3 + 0.5;
        }

        const idx = y * resolution + x;
        heightBuffer[idx] = h;
        maskBuffer[idx] = m;
      }
    }

    // Color y Normales Sobel
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const idx = y * resolution + x;
        const pIdx = idx * 4;
        const h = heightBuffer[idx];
        const m = maskBuffer[idx];

        let baseCol: [number, number, number];
        if (h < 0.4) {
          baseCol = this.lerpColor(colShadow, colPrimary, h / 0.4);
        } else if (h < 0.75) {
          baseCol = this.lerpColor(colPrimary, colSecondary, (h - 0.4) / 0.35);
        } else {
          baseCol = this.lerpColor(colSecondary, colHighlight, (h - 0.75) / 0.25);
        }

        if (m > 0.1) {
          const isLavaOrRune =
            config.basePattern === 'lava_cracks' ||
            config.basePattern === 'runic' ||
            config.basePattern === 'ground_volcano' ||
            config.basePattern === 'ground_void';
          baseCol = this.lerpColor(baseCol, isLavaOrRune ? colEmissive : colAccent, Math.min(1, m * 1.5));
        }

        albedoImg.data[pIdx] = Math.round(baseCol[0]);
        albedoImg.data[pIdx + 1] = Math.round(baseCol[1]);
        albedoImg.data[pIdx + 2] = Math.round(baseCol[2]);
        albedoImg.data[pIdx + 3] = 255;

        // Sobel
        const xL = (x - 1 + resolution) % resolution;
        const xR = (x + 1) % resolution;
        const yT = (y - 1 + resolution) % resolution;
        const yB = (y + 1) % resolution;

        const tl = heightBuffer[yT * resolution + xL];
        const t = heightBuffer[yT * resolution + x];
        const tr = heightBuffer[yT * resolution + xR];
        const l = heightBuffer[y * resolution + xL];
        const r = heightBuffer[y * resolution + xR];
        const bl = heightBuffer[yB * resolution + xL];
        const b = heightBuffer[yB * resolution + x];
        const br = heightBuffer[yB * resolution + xR];

        const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
        const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

        const strength = (config.pbr.normalStrength || 1.2) * 2;
        const nx = -dX * strength;
        const ny = -dY * strength;
        const nz = 1;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

        normalImg.data[pIdx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
        normalImg.data[pIdx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
        normalImg.data[pIdx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
        normalImg.data[pIdx + 3] = 255;
      }
    }

    albedoCtx.putImageData(albedoImg, 0, 0);
    normalCtx.putImageData(normalImg, 0, 0);

    const albedoTex = new THREE.CanvasTexture(albedoCanvas);
    albedoTex.wrapS = THREE.RepeatWrapping;
    albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.colorSpace = THREE.SRGBColorSpace;
    albedoTex.needsUpdate = true;

    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.needsUpdate = true;

    if (config.repeat) {
      albedoTex.repeat.set(config.repeat, config.repeat);
      normalTex.repeat.set(config.repeat, config.repeat);
    }

    const mat = new THREE.MeshStandardMaterial({
      map: albedoTex,
      normalMap: normalTex,
      roughness: config.pbr.roughness,
      metalness: config.pbr.metalness,
      emissive: config.palette.emissive ? new THREE.Color(config.palette.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: config.pbr.emissionIntensity || 0,
    });

    this.materialCache.set(cacheKey, mat);
    return mat;
  }

  // Preajustes específicos para cada monstruo de migame
  public static getMaterialForMonster(type: MonsterType, isBoss: boolean): THREE.MeshStandardMaterial {
    const key = `monster_${type}_${isBoss ? 'boss' : 'minion'}`;

    switch (type) {
      case 'BOSS_GOLEM':
        return this.createMaterial(key, {
          basePattern: 'stone',
          secondaryPattern: 'runic',
          patternScale: 7,
          palette: {
            primary: '#334155',
            secondary: '#475569',
            accent: '#38bdf8',
            shadow: '#0f172a',
            highlight: '#94a3b8',
            emissive: '#06b6d4',
          },
          pbr: { roughness: 0.75, metalness: 0.15, normalStrength: 1.6, emissionIntensity: 1.2 },
        });

      case 'BOSS_MAGMA_LORD':
      case 'FIRE_DEMON':
      case 'MAGMA_GARGOYLE':
        return this.createMaterial(key, {
          basePattern: 'lava_cracks',
          secondaryPattern: 'scales',
          patternScale: 8,
          palette: {
            primary: '#1c1917',
            secondary: '#451a03',
            accent: '#ef4444',
            shadow: '#0c0a09',
            highlight: '#78716c',
            emissive: '#ff4500',
          },
          pbr: { roughness: 0.5, metalness: 0.2, normalStrength: 1.8, emissionIntensity: 2.0 },
        });

      case 'BOSS_NECROMANCER':
        return this.createMaterial(key, {
          basePattern: 'stone',
          secondaryPattern: 'runic',
          patternScale: 8,
          palette: {
            primary: '#2e1065',
            secondary: '#3b0764',
            accent: '#c084fc',
            shadow: '#0f051d',
            highlight: '#818cf8',
            emissive: '#a855f7',
          },
          pbr: { roughness: 0.65, metalness: 0.2, normalStrength: 1.3, emissionIntensity: 1.4 },
        });

      case 'BOSS_ASTRAL_TITAN':
      case 'VOID_SPAWN':
      case 'CHAOS_MAGE':
        return this.createMaterial(key, {
          basePattern: 'runic',
          secondaryPattern: 'veins',
          patternScale: 6,
          palette: {
            primary: '#1e1b4b',
            secondary: '#312e81',
            accent: '#67e8f9',
            shadow: '#09090b',
            highlight: '#c084fc',
            emissive: '#38bdf8',
          },
          pbr: { roughness: 0.3, metalness: 0.6, normalStrength: 1.4, emissionIntensity: 1.6 },
        });

      case 'GOBLIN':
        return this.createMaterial(key, {
          basePattern: 'skin',
          patternScale: 10,
          palette: {
            primary: '#3f6212',
            secondary: '#4d7c0f',
            accent: '#a3e635',
            shadow: '#1a2e05',
            highlight: '#84cc16',
          },
          pbr: { roughness: 0.6, metalness: 0.05, normalStrength: 1.2 },
        });

      case 'SKELETON_WARRIOR':
      case 'SKELETON_ARCHER':
        return this.createMaterial(key, {
          basePattern: 'plate_armor',
          patternScale: 9,
          palette: {
            primary: '#e2e8f0',
            secondary: '#cbd5e1',
            accent: '#71717a',
            shadow: '#334155',
            highlight: '#ffffff',
          },
          pbr: { roughness: 0.7, metalness: 0.4, normalStrength: 1.2 },
        });

      default:
        return this.createMaterial(key, {
          basePattern: 'scales',
          patternScale: 8,
          palette: {
            primary: '#334155',
            secondary: '#1e293b',
            accent: '#ef4444',
            shadow: '#0f172a',
            highlight: '#94a3b8',
          },
          pbr: { roughness: 0.5, metalness: 0.2, normalStrength: 1.2 },
        });
    }
  }

  // Preajustes para el Jugador de migame según su clase
  public static getMaterialForPlayer(classType: PlayerClass, customHex?: string): THREE.MeshStandardMaterial {
    const key = `player_${classType}_${customHex || 'def'}`;

    if (classType === 'WARRIOR') {
      return this.createMaterial(key, {
        basePattern: 'plate_armor',
        secondaryPattern: 'scales',
        patternScale: 6,
        palette: {
          primary: customHex || '#3b82f6',
          secondary: '#1e40af',
          accent: '#eab308',
          shadow: '#0f172a',
          highlight: '#93c5fd',
          emissive: '#60a5fa',
        },
        pbr: { roughness: 0.35, metalness: 0.75, normalStrength: 1.4, emissionIntensity: 0.4 },
      });
    } else if (classType === 'CLERIC') {
      return this.createMaterial(key, {
        basePattern: 'plate_armor',
        patternScale: 5,
        palette: {
          primary: customHex || '#f59e0b',
          secondary: '#d97706',
          accent: '#ffffff',
          shadow: '#451a03',
          highlight: '#fde68a',
          emissive: '#fbbf24',
        },
        pbr: { roughness: 0.3, metalness: 0.85, normalStrength: 1.3, emissionIntensity: 0.6 },
      });
    } else {
      // MAGE
      return this.createMaterial(key, {
        basePattern: 'runic',
        patternScale: 6,
        palette: {
          primary: customHex || '#8b5cf6',
          secondary: '#4c1d95',
          accent: '#38bdf8',
          shadow: '#2e1065',
          highlight: '#c4b5fd',
          emissive: '#06b6d4',
        },
        pbr: { roughness: 0.45, metalness: 0.25, normalStrength: 1.5, emissionIntensity: 1.5 },
      });
    }
  }

  // Preajustes para obstáculos de entorno (pilares, muros, rocas, árboles)
  public static getMaterialForObstacle(kind: 'pillar' | 'wall' | 'rock' | 'tree'): THREE.MeshStandardMaterial {
    const key = `obstacle_${kind}`;

    if (kind === 'tree') {
      return this.createMaterial(key, {
        basePattern: 'bark',
        patternScale: 7,
        palette: {
          primary: '#3f2212',
          secondary: '#5a351d',
          accent: '#854d0e',
          shadow: '#1e0f06',
          highlight: '#a16207',
        },
        pbr: { roughness: 0.85, metalness: 0.0, normalStrength: 1.5 },
      });
    }

    if (kind === 'rock') {
      return this.createMaterial(key, {
        basePattern: 'stone',
        patternScale: 6,
        palette: {
          primary: '#475569',
          secondary: '#64748b',
          accent: '#94a3b8',
          shadow: '#1e293b',
          highlight: '#cbd5e1',
        },
        pbr: { roughness: 0.8, metalness: 0.1, normalStrength: 1.6 },
      });
    }

    // Pillar or wall
    return this.createMaterial(key, {
      basePattern: 'cobblestone',
      patternScale: 5,
      palette: {
        primary: '#334155',
        secondary: '#475569',
        accent: '#64748b',
        shadow: '#0f172a',
        highlight: '#94a3b8',
      },
      pbr: { roughness: 0.75, metalness: 0.05, normalStrength: 1.5 },
    });
  }

  // Texturas de Suelo procedimentales por Zona
  public static getMaterialForGround(zoneId: string): THREE.MeshStandardMaterial {
    const key = `ground_${zoneId}`;

    if (zoneId === 'zone_crypt') {
      return this.createMaterial(key, {
        basePattern: 'ground_crypt',
        patternScale: 6,
        repeat: 10,
        palette: {
          primary: '#231b27',
          secondary: '#17111a',
          accent: '#b91c1c',
          shadow: '#0d0810',
          highlight: '#4b3f52',
          emissive: '#7f1d1d'
        },
        pbr: { roughness: 0.8, metalness: 0.1, normalStrength: 1.7, emissionIntensity: 0.5 }
      });
    }

    if (zoneId === 'zone_volcano') {
      return this.createMaterial(key, {
        basePattern: 'ground_volcano',
        patternScale: 7,
        repeat: 10,
        palette: {
          primary: '#1c1917',
          secondary: '#431407',
          accent: '#ea580c',
          shadow: '#0c0a09',
          highlight: '#78716c',
          emissive: '#f97316'
        },
        pbr: { roughness: 0.7, metalness: 0.15, normalStrength: 2.0, emissionIntensity: 1.4 }
      });
    }

    if (zoneId === 'zone_void') {
      return this.createMaterial(key, {
        basePattern: 'ground_void',
        patternScale: 6,
        repeat: 8,
        palette: {
          primary: '#140c24',
          secondary: '#07030d',
          accent: '#c084fc',
          shadow: '#020005',
          highlight: '#7c3aed',
          emissive: '#a855f7'
        },
        pbr: { roughness: 0.5, metalness: 0.35, normalStrength: 1.6, emissionIntensity: 1.3 }
      });
    }

    // Por defecto: Bosque (zone_forest)
    return this.createMaterial(key, {
      basePattern: 'ground_forest',
      patternScale: 8,
      repeat: 12,
      palette: {
        primary: '#1b3b22',
        secondary: '#142e1b',
        accent: '#65a30d',
        shadow: '#0e1d11',
        highlight: '#22c55e'
      },
      pbr: { roughness: 0.9, metalness: 0.0, normalStrength: 1.5 }
    });
  }
}
