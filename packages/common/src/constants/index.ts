import { Spell, PlayerClass } from '../types/index.js';

export const TICK_RATE = 30; // 30 ticks por segundo
export const TICK_INTERVAL_MS = 1000 / TICK_RATE; // ~33.33ms
export const PLAYER_SPEED = 7.5; // unidades por segundo en el espacio 3D
export const PLAYER_RADIUS = 0.5; // radio de colisión del jugador
export const MAP_BOUND = 24; // límites del área jugable (-24 a 24)
export const DEFAULT_SERVER_PORT = 3001;
export const DEFAULT_CLIENT_PORT = 3000;

export const PLAYER_COLORS = [
  '#3b82f6', // Azul (Jugador 1)
  '#ef4444', // Rojo
  '#10b981', // Esmeralda
  '#f59e0b', // Ámbar
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#06b6d4'  // Cian
];

export const CLASS_STATS: Record<PlayerClass, { maxHealth: number; speedBonus: number }> = {
  WARRIOR: { maxHealth: 180, speedBonus: 0 },
  CLERIC: { maxHealth: 120, speedBonus: 0 },
  MAGE: { maxHealth: 90, speedBonus: 0.2 }
};

export function getXpForNextLevel(level: number): number {
  return level * 100;
}

export const MONSTER_REWARDS = {
  GOBLIN: { xp: 35, gold: 8 },
  BOSS_GOLEM: { xp: 200, gold: 60 }
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
