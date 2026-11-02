import { Spell, PlayerClass, ZoneThemeDTO } from '../types/index.js';

export const TICK_RATE = 30; // 30 ticks por segundo
export const TICK_INTERVAL_MS = 1000 / TICK_RATE; // ~33.33ms
export const PLAYER_SPEED = 7.5; // unidades por segundo en el espacio 3D
export const PLAYER_RADIUS = 0.5; // radio de colisión del jugador
export const MAP_BOUND = 24; // límites del área jugable (-24 a 24)
export const DEFAULT_SERVER_PORT = 3001;
export const DEFAULT_CLIENT_PORT = 3000;
export const CLASS_SWITCH_COOLDOWN_MS = 6000; // 6 segundos de enfriamiento al cambiar de rol

export const PLAYER_COLORS = [
  '#3b82f6', // Azul (Jugador 1)
  '#ef4444', // Rojo
  '#10b981', // Esmeralda
  '#f59e0b', // Ámbar
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#06b6d4'  // Cian
];

export const CLASS_STATS: Record<PlayerClass, { maxHealth: number; speedBonus: number; baseDefense: number }> = {
  WARRIOR: { maxHealth: 180, speedBonus: 0, baseDefense: 22 },
  CLERIC: { maxHealth: 120, speedBonus: 0, baseDefense: 14 },
  MAGE: { maxHealth: 90, speedBonus: 0.2, baseDefense: 6 }
};

export function getXpForNextLevel(level: number): number {
  return level * 100;
}

export function calculateEffectiveDamage(rawDamage: number, targetDefense: number): number {
  const safeDef = Math.max(0, targetDefense);
  const reductionMultiplier = 100 / (100 + safeDef);
  return Math.max(1, Math.round(rawDamage * reductionMultiplier));
}

export const MONSTER_REWARDS = {
  GOBLIN: { xp: 35, gold: 8 },
  BOSS_GOLEM: { xp: 200, gold: 60 },
  SKELETON_WARRIOR: { xp: 60, gold: 16 },
  SKELETON_ARCHER: { xp: 75, gold: 22 },
  BOSS_NECROMANCER: { xp: 450, gold: 150 },
  FIRE_DEMON: { xp: 120, gold: 35 },
  MAGMA_GARGOYLE: { xp: 145, gold: 42 },
  BOSS_MAGMA_LORD: { xp: 850, gold: 320 },
  VOID_SPAWN: { xp: 220, gold: 65 },
  CHAOS_MAGE: { xp: 260, gold: 80 },
  BOSS_ASTRAL_TITAN: { xp: 1600, gold: 650 }
};

export const ZONE_THEMES: Record<string, ZoneThemeDTO> = {
  zone_forest: {
    id: 'zone_forest',
    name: 'Bosque de los Goblins',
    groundColor: '#17251d',
    gridColor1: '#22c55e',
    gridColor2: '#14532d',
    fogColor: '#09140e',
    fogDensity: 0.024,
    ambientLightColor: '#ffffff',
    dirLightColor: '#fffaed'
  },
  zone_crypt: {
    id: 'zone_crypt',
    name: 'Cripta Maldita',
    groundColor: '#1a1016',
    gridColor1: '#ef4444',
    gridColor2: '#7f1d1d',
    fogColor: '#16080b',
    fogDensity: 0.032,
    ambientLightColor: '#c4b5fd',
    dirLightColor: '#ff6644'
  },
  zone_volcano: {
    id: 'zone_volcano',
    name: 'Bastión Volcánico',
    groundColor: '#220e06',
    gridColor1: '#f97316',
    gridColor2: '#7c2d12',
    fogColor: '#1c0803',
    fogDensity: 0.034,
    ambientLightColor: '#fed7aa',
    dirLightColor: '#ff4500'
  },
  zone_void: {
    id: 'zone_void',
    name: 'Abismo del Vacío',
    groundColor: '#090514',
    gridColor1: '#8b5cf6',
    gridColor2: '#3b0764',
    fogColor: '#06020f',
    fogDensity: 0.036,
    ambientLightColor: '#c4b5fd',
    dirLightColor: '#a855f7'
  }
};

export const SPELLS: Record<string, Spell> = {
  // GUERRERO (Tanque)
  slash: {
    id: 'slash',
    name: 'Golpe Pesado',
    classType: 'WARRIOR',
    cooldownMs: 1000,
    range: 2.8,
    damage: 28,
    icon: '⚔️',
    description: 'Ataque cuerpo a cuerpo contundente.'
  },
  shield_slam: {
    id: 'shield_slam',
    name: 'Escudazo',
    classType: 'WARRIOR',
    cooldownMs: 4000,
    range: 2.8,
    damage: 42,
    icon: '🛡️',
    description: 'Golpea con el escudo infligiendo gran daño.'
  },
  taunt: {
    id: 'taunt',
    name: 'Provocación',
    classType: 'WARRIOR',
    cooldownMs: 6000,
    range: 10.0,
    isAoe: true,
    aoeRadius: 10.0,
    icon: '📢',
    description: 'Atrae la furia y aggro de todos los monstruos cercanos.'
  },

  // CLÉRIGO (Sanador)
  smite: {
    id: 'smite',
    name: 'Castigo Sagrado',
    classType: 'CLERIC',
    cooldownMs: 1200,
    range: 11.0,
    damage: 22,
    icon: '✨',
    description: 'Lanza energía radiante contra un enemigo a distancia.'
  },
  heal: {
    id: 'heal',
    name: 'Luz Sanadora',
    classType: 'CLERIC',
    cooldownMs: 3000,
    range: 12.0,
    heal: 50,
    icon: '💚',
    description: 'Cura a un aliado o a ti mismo si no hay objetivo.'
  },
  sanctuary: {
    id: 'sanctuary',
    name: 'Santuario',
    classType: 'CLERIC',
    cooldownMs: 8000,
    range: 0,
    isAoe: true,
    aoeRadius: 8.0,
    heal: 40,
    icon: '🌟',
    description: 'Cura en área a todos los aliados cercanos.'
  },

  // MAGO (DPS a Distancia)
  frostbolt: {
    id: 'frostbolt',
    name: 'Ráfaga Gélida',
    classType: 'MAGE',
    cooldownMs: 1000,
    range: 12.0,
    damage: 26,
    icon: '❄️',
    description: 'Disparo mágico veloz de hielo.'
  },
  fireball: {
    id: 'fireball',
    name: 'Bola de Fuego',
    classType: 'MAGE',
    cooldownMs: 2500,
    range: 13.0,
    damage: 55,
    icon: '🔥',
    description: 'Lanza una poderosa bola de fuego explosiva.'
  },
  meteor: {
    id: 'meteor',
    name: 'Meteoro Arcano',
    classType: 'MAGE',
    cooldownMs: 7000,
    range: 13.0,
    damage: 75,
    isAoe: true,
    aoeRadius: 4.5,
    icon: '☄️',
    description: 'Invoca un meteoro devastador que daña en área.'
  }
};
