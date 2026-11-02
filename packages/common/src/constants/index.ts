import { Spell, PlayerClass, ZoneThemeDTO, CharacterVisualProfile, MonsterVisualProfile, MonsterType } from '../types/index.js';

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

export function getSpellPowerMultiplier(level: number): number {
  const safeLevel = Math.max(1, level);
  return 1 + (safeLevel - 1) * 0.08; // +8% de poder por cada nivel sobre 1
}

export function getScaledSpellStats(spell: Spell, level: number): { damage?: number; heal?: number } {
  const mult = getSpellPowerMultiplier(level);
  return {
    damage: spell.damage !== undefined ? Math.round(spell.damage * mult) : undefined,
    heal: spell.heal !== undefined ? Math.round(spell.heal * mult) : undefined
  };
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

export const CLASS_DESCRIPTIONS: Record<PlayerClass, CharacterVisualProfile> = {
  WARRIOR: {
    classType: 'WARRIOR',
    title: 'Guardián de Acero',
    role: 'Tanque y Combate Cuerpo a Cuerpo',
    visualDescription: 'Un imponente guerrero forjado en batalla con armadura de placas reforzadas, hombreras pesadas con grabados rúnicos y una postura inquebrantable lista para absorber cualquier impacto.',
    texturePrompt: 'fantasy armored knight, weathered heavy steel plate, battle scars, gold inlaid runes, rough chainmail underlayer, matte iron highlights, 4k isometric game asset style',
    colorPalette: {
      primary: '#3b82f6',
      secondary: '#1e293b',
      accent: '#f59e0b'
    },
    armorStyle: 'Heavy Plate & Bulwark Crest',
    weaponStyle: 'Broadsword and Tower Shield'
  },
  CLERIC: {
    classType: 'CLERIC',
    title: 'Invocador de Luz',
    role: 'Sanador y Soporte Sagrado',
    visualDescription: 'Portador de la bendición sagrada ataviado con hábitos dorados y cotas de malla radiante. Su aura despide suaves pulsos luminosos de sanación y protección.',
    texturePrompt: 'holy paladin cleric robe and mail, pristine white silk vestments, glowing golden embroidery, sun emblem, gilded filigree edges, divine warm glow, isometric game asset style',
    colorPalette: {
      primary: '#10b981',
      secondary: '#fef08a',
      accent: '#ec4899'
    },
    armorStyle: 'Consecrated Robes with Gilded Mail',
    weaponStyle: 'Radiant Holy Mace and Scripture Focus'
  },
  MAGE: {
    classType: 'MAGE',
    title: 'Archimago Elemental',
    role: 'DPS Destructor a Distancia',
    visualDescription: 'Canalizador del caos arcano vestido con túnicas místicas oscuras ribeteadas con glifos energéticos que flotan sutilmente con la fuerza del fuego y el hielo.',
    texturePrompt: 'arcane elemental wizard robes, deep mystic violet velvet, glowing cyan fractal ley-lines, crackling embers, cosmic star dust pattern, isometric game asset style',
    colorPalette: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#ef4444'
    },
    armorStyle: 'Astral Silk & Crystal Mantle',
    weaponStyle: 'Infused Spire Staff and Orb of Power'
  }
};

export const MONSTER_DESCRIPTIONS: Record<MonsterType, MonsterVisualProfile> = {
  GOBLIN: {
    type: 'GOBLIN',
    title: 'Pilluelo del Bosque',
    tier: 1,
    visualDescription: 'Pequeño humanoide verde, ojos amarillos astutos y orejas puntiagudas, armado con dagas oxidadas y harapos de cuero curtido.',
    texturePrompt: 'creepy forest goblin skin, mottled olive green hide, worn rough leather straps, jagged chipped rusty iron blade, stylized game texture',
    colorPalette: {
      primary: '#22c55e',
      secondary: '#78350f',
      glow: '#eab308'
    },
    imposingFeatures: ['Ojos amarillos brillantes', 'Ropajes de sigilo', 'Dagas dentadas']
  },
  BOSS_GOLEM: {
    type: 'BOSS_GOLEM',
    title: 'Coloso de Granito Musgoso',
    tier: 1,
    visualDescription: 'Enorme monolito bípedo de piedra ancestral cubierto de musgo y líquenes, con un núcleo brillante de energía silvestre que palpita rítmicamente.',
    texturePrompt: 'ancient overgrown stone titan, cracked granite monolith surface, deep green moss patches, pulsing cyan crystal core fissures, imposing dungeon boss texture',
    colorPalette: {
      primary: '#475569',
      secondary: '#15803d',
      glow: '#06b6d4'
    },
    imposingFeatures: ['Estatura colosal', 'Fisuras de cristal brillante', 'Placas de roca flotante', 'Aura de impacto terrestre']
  },
  SKELETON_WARRIOR: {
    type: 'SKELETON_WARRIOR',
    title: 'Guardia Óseo Maldito',
    tier: 2,
    visualDescription: 'Guerrero esqueleto con armadura antigua corrompida por la oscuridad, espada mellada y ojos con fuego carmesí infernal.',
    texturePrompt: 'undead skeleton warrior, bleached yellowed bone texture, tarnished dark iron armor plates, crimson necromantic eye fire, gothic crypt stylized',
    colorPalette: {
      primary: '#e2e8f0',
      secondary: '#334155',
      glow: '#ef4444'
    },
    imposingFeatures: ['Cuencas ardientes en rojo', 'Espada maldita tallada', 'Huesos expuestos reforzados']
  },
  SKELETON_ARCHER: {
    type: 'SKELETON_ARCHER',
    title: 'Tirador de Sombras',
    tier: 2,
    visualDescription: 'Esqueleto ágil con restos de capa rasgada, empuña un arco de hueso compuesto que dispara proyectiles espectrales silbantes.',
    texturePrompt: 'undead skeletal archer, aged bone, tattered midnight shroud, spectral bow of sinew and spine, ethereal faint mist',
    colorPalette: {
      primary: '#cbd5e1',
      secondary: '#475569',
      glow: '#f87171'
    },
    imposingFeatures: ['Carcaj de huesos tallados', 'Ojos espectrales', 'Silueta delgada y letal']
  },
  BOSS_NECROMANCER: {
    type: 'BOSS_NECROMANCER',
    title: 'Archiliche de la Cripta',
    tier: 2,
    visualDescription: 'Lich flotante con corona de calaveras y túnica ceremonial rasgada. Su báculo canaliza espirales de almas condenadas con fuego carmesí y negro.',
    texturePrompt: 'dread necromancer lich boss, black embroidered royal vestments, levitating bone crowns, dark soul miasma, eerie blood-ruby glowing eyes',
    colorPalette: {
      primary: '#7f1d1d',
      secondary: '#0f172a',
      glow: '#dc2626'
    },
    imposingFeatures: ['Levitación perenne', 'Corona de calaveras flotante', 'Aura de niebla de sangre', 'Báculo devorador de almas']
  },
  FIRE_DEMON: {
    type: 'FIRE_DEMON',
    title: 'Engendro Igneo',
    tier: 3,
    visualDescription: 'Demonio cornudo con piel de obsidiana agrietada de donde emana lava viva, cuernos llameantes y garras incandescentes.',
    texturePrompt: 'obsidian fire fiend, scorched volcanic rock skin, deep lava veins glowing orange-yellow, curling molten horns, blistering heat distortion',
    colorPalette: {
      primary: '#7c2d12',
      secondary: '#1c1917',
      glow: '#f97316'
    },
    imposingFeatures: ['Venas de lava incandescente', 'Cuernos de fuego', 'Cuerpo ardiente con humo']
  },
  MAGMA_GARGOYLE: {
    type: 'MAGMA_GARGOYLE',
    title: 'Gárgola de Escoria',
    tier: 3,
    visualDescription: 'Bestia alada hecha de basalto y fuego petrificado. Sus alas despliegan ascuas ardientes al batir sobre el aire hirviente.',
    texturePrompt: 'winged magma gargoyle, porous dark basalt stone, glowing molten wing membranes, glowing sulfur claws, vicious apex predator',
    colorPalette: {
      primary: '#292524',
      secondary: '#c2410c',
      glow: '#fbbf24'
    },
    imposingFeatures: ['Alas de fuego petrificado', 'Garras de azufre incandescente', 'Ojos de magma hirviente']
  },
  BOSS_MAGMA_LORD: {
    type: 'BOSS_MAGMA_LORD',
    title: 'Señor del Núcleo Volcánico',
    tier: 3,
    visualDescription: 'Monstruosidad titánica hecha de magma puro y placas tectónicas incandescentes. Provoca terremotos ardientes a cada paso.',
    texturePrompt: 'volcanic magma lord boss, molten core heart, floating tectonic obsidian armor slabs, roaring inferno aura, ultra-high emissive magma cracks',
    colorPalette: {
      primary: '#431407',
      secondary: '#ea580c',
      glow: '#facc15'
    },
    imposingFeatures: ['Placas tectónicas flotantes', 'Núcleo volcánico expuesto', 'Aura de calor infernal', 'Cráter de lava a sus pies']
  },
  VOID_SPAWN: {
    type: 'VOID_SPAWN',
    title: 'Engendro del Vacío',
    tier: 4,
    visualDescription: 'Aberración tentacular de materia oscura que devora la luz circundante. Múltiples ojos bioluminiscentes púrpuras observan en todas direcciones.',
    texturePrompt: 'cosmic void anomaly, nebulous pitch-black entity, bioluminescent violet eyes, shimmering dimensional rift skin, alien otherworldly horror',
    colorPalette: {
      primary: '#2e1065',
      secondary: '#090514',
      glow: '#c084fc'
    },
    imposingFeatures: ['Materia oscura ondulante', 'Ojos astrales múltiples', 'Distorsión del espacio a su alrededor']
  },
  CHAOS_MAGE: {
    type: 'CHAOS_MAGE',
    title: 'Cultista del Caos Profundo',
    tier: 4,
    visualDescription: 'Mago corrupto envuelto en vendas cósmicas y runas prohibidas. Proyecta ráfagas de energía que desgarran la realidad.',
    texturePrompt: 'eldritch chaos sorcerer, tattered void silk robes, orbiting arcane shards, glowing cosmic glyphs, sinister amethyst radiance',
    colorPalette: {
      primary: '#581c87',
      secondary: '#1e1b4b',
      glow: '#e879f9'
    },
    imposingFeatures: ['Fragmentos cósmicos en órbita', 'Runas flotantes del vacío', 'Mano canalizadora incorpórea']
  },
  BOSS_ASTRAL_TITAN: {
    type: 'BOSS_ASTRAL_TITAN',
    title: 'Titán Astral del Olvido',
    tier: 4,
    visualDescription: 'Deidad cósmica sellada hecha de constelaciones vivas y metal estelar. Domina la gravedad y desata singularidades destructivas.',
    texturePrompt: 'celestial astral titan apex boss, dark stellar metal chassis, animated interior galaxy starry void, pulsing singularity core, colossal god-like presence',
    colorPalette: {
      primary: '#3b0764',
      secondary: '#020617',
      glow: '#f43f5e'
    },
    imposingFeatures: ['Galaxia viviente en su interior', 'Anillos gravitacionales en rotación continua', 'Corona estelar cósmica', 'Aura de distorsión de la realidad']
  }
};

