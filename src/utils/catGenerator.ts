import { CatSkin, Rarity, EarType, EyeType, CatToy, CatBackground, RenderStyle } from '../types/game';

// Global counter for minting serial numbers across session
let currentGlobalMint = 1000 + Math.floor(Math.random() * 500);

export function getNextMintNumber(): number {
  currentGlobalMint += 1;
  return currentGlobalMint;
}

// Helper to generate a realistic cryptographic DNA string
export function generateCatDNA(): string {
  const chars = '0123456789ABCDEF';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg()}-${seg()}-${seg()}`;
}

// Random pick from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random int between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// -------------------------------------------------------------
// PALETTES & ATTRIBUTES BY RARITY TIER
// -------------------------------------------------------------

// 1. COMMON: 2D Flat, clashing/quirky/funny colors allowed ("muss nicht unbedingt schön aussehen")
const COMMON_FUR_COLORS = [
  '#78716C', '#A8A29E', '#57534E', '#B45309', '#92400E',
  '#64748B', '#475569', '#854D0E', '#713F12', '#9A3412',
  '#4B5563', '#374151', '#A3A3A3', '#737373', '#6B7280',
];
const COMMON_QUIRKY_BELLIES = [
  '#D6D3D1', '#E7E5E4', '#F5F5F4', '#FEF08A', '#84CC16', // quirky lime belly
  '#F472B6', '#E2E8F0', '#FED7AA', '#CBD5E1', '#E5E7EB',
];
const COMMON_NAMES_PREFIX = ['Rusty', 'Patchy', 'Socks', 'Waffles', 'Dusty', 'Bandit', 'Scrappy', 'Muffin', 'Biscuit', 'Barnaby', 'Smudge', 'Gizmo'];
const COMMON_NAMES_SUFFIX = ['the Stray', 'Paws', 'Whiskers', 'Beans', 'Nugget', 'Scratch', 'Truffle', 'Chonk', 'Spot'];

// 2. UNCOMMON: 2D Harmonious designer palettes ("sollem die farben dann mehr oder weniger zu einander passen")
const UNCOMMON_HARMONIOUS_PALETTES = [
  { fur: '#FED7AA', belly: '#FFF7ED', earInner: '#FBCFE8', eyes: '#0284C7', pattern: '#FB923C' }, // Peach & Cream
  { fur: '#475569', belly: '#F1F5F9', earInner: '#E2E8F0', eyes: '#10B981', pattern: '#334155' }, // Charcoal & Lavender Mist
  { fur: '#D97706', belly: '#FEF3C7', earInner: '#FDE68A', eyes: '#059669', pattern: '#B45309' }, // Warm Autumn Ginger
  { fur: '#A855F7', belly: '#FAF5FF', earInner: '#F3E8FF', eyes: '#38BDF8', pattern: '#7E22CE' }, // Soft Lilac Bloom
  { fur: '#64748B', belly: '#F8FAFC', earInner: '#CBD5E1', eyes: '#F59E0B', pattern: '#334155' }, // Slate Blue & Amber
  { fur: '#E2E8F0', belly: '#FFFFFF', earInner: '#FDA4AF', eyes: '#06B6D4', pattern: '#94A3B8' }, // Cloud White & Rose
  { fur: '#78350F', belly: '#FEF3C7', earInner: '#FDE68A', eyes: '#14B8A6', pattern: '#451A03' }, // Chocolate Latte
];
const UNCOMMON_NAMES_PREFIX = ['Caramel', 'Velvet', 'Mocha', 'Hazel', 'Oliver', 'Bella', 'Jasper', 'Milo', 'Cleo', 'Breeze', 'Peaches', 'Simba'];
const UNCOMMON_NAMES_SUFFIX = ['Softtail', 'Dreamer', 'Puff', 'Buttercup', 'Song', 'Clover', 'Whisper', 'Blossom'];

// 3. RARE: Beautiful expressive eyes + nicer ears (tufted, scottish fold, silky) + CUTE TOY next to cat!
const RARE_PALETTES = [
  { fur: '#38BDF8', belly: '#F0F9FF', earInner: '#BAE6FD', eyes: '#6366F1', pattern: '#0284C7' }, // Azure Star
  { fur: '#EC4899', belly: '#FDF2F8', earInner: '#FBCFE8', eyes: '#8B5CF6', pattern: '#BE185D' }, // Sakura Rose
  { fur: '#10B981', belly: '#ECFDF5', earInner: '#A7F3D0', eyes: '#F59E0B', pattern: '#047857' }, // Jade Forest
  { fur: '#F59E0B', belly: '#FFFBEB', earInner: '#FDE68A', eyes: '#3B82F6', pattern: '#D97706' }, // Golden Honey
  { fur: '#8B5CF6', belly: '#F5F3FF', earInner: '#DDD6FE', eyes: '#EC4899', pattern: '#6D28D9' }, // Royal Amethyst
  { fur: '#06B6D4', belly: '#ECFEFF', earInner: '#A5F3FC', eyes: '#F97316', pattern: '#0891B2' }, // Turquoise Gem
];
const RARE_TOYS: CatToy[] = ['yarn-ball', 'rubber-duck', 'fish-bone', 'mouse-toy', 'catnip-bell'];
const RARE_EARS: EarType[] = ['tufted-lynx', 'folded-scottish', 'fluffy-plush', 'pointed'];
const RARE_EYES: EyeType[] = ['anime-sparkle', 'mystic-gem', 'glossy-boba', 'sleepy-chic'];
const RARE_NAMES_PREFIX = ['Starlight', 'Sapphire', 'Emerald', 'Ruby', 'Zephyr', 'Orion', 'Luna', 'Kitsune', 'Moonglade', 'Topaz'];
const RARE_NAMES_SUFFIX = ['Sparkle', 'Whiskers', 'Gembound', 'Mirage', 'Sprout', 'Echo', 'Frost', 'Charm'];

// 4. EPIC: 3D Volumetric sculpted look! Shaded mesh, glossy specular glass finish, ambient occlusion!
const EPIC_PALETTES = [
  { fur: '#6366F1', belly: '#EEF2FF', earInner: '#C7D2FE', eyes: '#F43F5E', pattern: '#4338CA' }, // Cyber Indigo 3D
  { fur: '#D946EF', belly: '#FDF4FF', earInner: '#F5D0FE', eyes: '#06B6D4', pattern: '#A21CAF' }, // Neon Fuchsia 3D
  { fur: '#0EA5E9', belly: '#F0F9FF', earInner: '#BAE6FD', eyes: '#FACC15', pattern: '#0369A1' }, // Electric Blue 3D
  { fur: '#F97316', belly: '#FFF7ED', earInner: '#FED7AA', eyes: '#8B5CF6', pattern: '#C2410C' }, // Solar Flare 3D
  { fur: '#14B8A6', belly: '#F0FDFA', earInner: '#99F6E4', eyes: '#E11D48', pattern: '#0F766E' }, // Mystic Teal 3D
  { fur: '#3B82F6', belly: '#EFF6FF', earInner: '#BFDBFE', eyes: '#10B981', pattern: '#1D4ED8' }, // Hyper Metallic 3D
];
const EPIC_NAMES_PREFIX = ['Lord', 'Lady', 'Quantum', 'Nebula', 'Glitch', 'Chrono', 'Hyper', 'Obsidian', 'Astral', 'Apex', 'Phantom'];
const EPIC_NAMES_SUFFIX = ['Prime', 'the Sculptor', '3D Model', 'Dimension', 'Vanguard', 'Genesis', 'Titan', 'Apex'];

// 5. LEGENDARY: Fluffy fur texture (multi-layered cheek fluff, fur tufts) + UNIQUE PROCEDURAL BACKGROUND!
const LEGENDARY_PALETTES = [
  { fur: '#FBBF24', belly: '#FFFBEB', earInner: '#FEF08A', eyes: '#EC4899', pattern: '#D97706', bg: 'golden-throne' as CatBackground },
  { fur: '#C084FC', belly: '#FAF5FF', earInner: '#E9D5FF', eyes: '#38BDF8', pattern: '#9333EA', bg: 'cosmic-nebula' as CatBackground },
  { fur: '#34D399', belly: '#ECFDF5', earInner: '#A7F3D0', eyes: '#F59E0B', pattern: '#059669', bg: 'sunset-aurora' as CatBackground },
  { fur: '#F472B6', belly: '#FDF2F8', earInner: '#FBCFE8', eyes: '#60A5FA', pattern: '#DB2777', bg: 'sakura-drift' as CatBackground },
  { fur: '#22D3EE', belly: '#ECFEFF', earInner: '#A5F3FC', eyes: '#F43F5E', pattern: '#0891B2', bg: 'cyber-matrix' as CatBackground },
  { fur: '#A78BFA', belly: '#F5F3FF', earInner: '#DDD6FE', eyes: '#34D399', pattern: '#7C3AED', bg: 'crystal-cavern' as CatBackground },
];
const LEGENDARY_NAMES_PREFIX = ['Archduke', 'Emperor', 'Celestial', 'Supernova', 'Eternal', 'Valiant', 'Solaria', 'Ragnar', 'Kaiser'];
const LEGENDARY_NAMES_SUFFIX = ['the Fluffy Deity', 'Sunbringer', 'of the Void', 'Starborn', 'the Magnificent', 'Aurora King'];

// -------------------------------------------------------------
// TRAITS, PROBABILITIES & PRICING INFLUENCES
// -------------------------------------------------------------
export interface TraitInfo {
  id: string;
  label: string;
  emoji: string;
  dropChancePercent: number; // e.g. 2% for ultra rare
  priceBonus: number; // Extra coins added to price
  collectorBonus: number; // Extra collector rating added
  isUltraRare?: boolean;
}

export const TOY_TRAIT_CONFIG: Record<CatToy, TraitInfo> = {
  'none': {
    id: 'none',
    label: 'Kein Spielzeug',
    emoji: '⚪',
    dropChancePercent: 65,
    priceBonus: 0,
    collectorBonus: 0,
  },
  'yarn-ball': {
    id: 'yarn-ball',
    label: 'Wollknäuel',
    emoji: '🧶',
    dropChancePercent: 35,
    priceBonus: 500,
    collectorBonus: 20,
  },
  'mouse-toy': {
    id: 'mouse-toy',
    label: 'Plüsch-Maus',
    emoji: '🐭',
    dropChancePercent: 25,
    priceBonus: 750,
    collectorBonus: 30,
  },
  'catnip-bell': {
    id: 'catnip-bell',
    label: 'Katzenminze-Glocke',
    emoji: '🔔',
    dropChancePercent: 18,
    priceBonus: 1100,
    collectorBonus: 45,
  },
  'rubber-duck': {
    id: 'rubber-duck',
    label: 'Quietscheente',
    emoji: '🦆',
    dropChancePercent: 12,
    priceBonus: 1600,
    collectorBonus: 65,
  },
  'fish-bone': {
    id: 'fish-bone',
    label: 'Fischgräte',
    emoji: '🦴',
    dropChancePercent: 6,
    priceBonus: 2400,
    collectorBonus: 100,
  },
  'golden-trophy': {
    id: 'golden-trophy',
    label: 'Goldener Katzen-Pokal',
    emoji: '🏆',
    dropChancePercent: 2,
    priceBonus: 7500,
    collectorBonus: 300,
    isUltraRare: true,
  },
};

export const BACKGROUND_TRAIT_CONFIG: Record<CatBackground, TraitInfo> = {
  'none': {
    id: 'none',
    label: 'Standard Raum',
    emoji: '🏠',
    dropChancePercent: 75,
    priceBonus: 0,
    collectorBonus: 0,
  },
  'sakura-drift': {
    id: 'sakura-drift',
    label: 'Sakura-Blütenregen',
    emoji: '🌸',
    dropChancePercent: 28,
    priceBonus: 2500,
    collectorBonus: 80,
  },
  'crystal-cavern': {
    id: 'crystal-cavern',
    label: 'Kristallhöhle',
    emoji: '💎',
    dropChancePercent: 24,
    priceBonus: 3500,
    collectorBonus: 120,
  },
  'sunset-aurora': {
    id: 'sunset-aurora',
    label: 'Sonnenuntergangs-Aurora',
    emoji: '🌅',
    dropChancePercent: 20,
    priceBonus: 5000,
    collectorBonus: 180,
  },
  'cyber-matrix': {
    id: 'cyber-matrix',
    label: 'Cyber-Matrix Neon',
    emoji: '⚡',
    dropChancePercent: 15,
    priceBonus: 7500,
    collectorBonus: 250,
  },
  'cosmic-nebula': {
    id: 'cosmic-nebula',
    label: 'Kosmischer Nebel',
    emoji: '🌌',
    dropChancePercent: 10,
    priceBonus: 12000,
    collectorBonus: 400,
    isUltraRare: true,
  },
  'golden-throne': {
    id: 'golden-throne',
    label: 'Königlicher Gold-Thron',
    emoji: '👑',
    dropChancePercent: 3,
    priceBonus: 25000,
    collectorBonus: 800,
    isUltraRare: true,
  },
};

// Niveau (Star level 1 - 5)
export function getRarityStarLevel(rarity: Rarity): number {
  switch (rarity) {
    case 'common': return 1;
    case 'uncommon': return 2;
    case 'rare': return 3;
    case 'epic': return 4;
    case 'legendary':
    case 'mythic': return 5;
    default: return 1;
  }
}

// Personalities
export const PERSONALITIES: string[] = [
  'Playful & Energetic',
  'Royal & Majestic',
  'Sleepy & Cuddly',
  'Curious Explorer',
  'Mischievous Trickster',
  'Wise & Serene',
  'Feisty Adventurer',
  'Dreamy Stargazer',
  'Chonky Gourmand',
  'Sweet Purr-fection',
];

/**
 * Procedural generation engine that creates completely unique cats conforming to:
 * - Common: 2D flat, quirky/wild colors
 * - Uncommon: 2D cohesive harmonized colors
 * - Rare: Expressive eyes, prettier ears, cute toy beside cat
 * - Epic: 3D volumetric appearance (shaded specular depth)
 * - Legendary: Fluffy fur texture + unique procedural background!
 * - Mythic: Midas gold / divine royal energy
 */
export function generateUniqueCat(rarity: Rarity, serialOverride?: number): CatSkin {
  const mintNumber = serialOverride || getNextMintNumber();
  const dna = generateCatDNA();
  const personality = pick(PERSONALITIES);
  const id = `ucat-${Date.now()}-${randInt(100, 999)}`;

  // Default initial fields
  let name = '';
  let furColor = '#94A3B8';
  let bellyColor = '#F1F5F9';
  let earInnerColor = '#FDA4AF';
  let eyeColor = '#3B82F6';
  let patternColor = '#475569';
  let patternType: CatSkin['patternType'] = 'solid';
  let earType: EarType = 'pointed';
  let eyeType: EyeType = 'round';
  let renderStyle: RenderStyle = '2d-flat';
  let toy: CatToy = 'none';
  let backgroundType: CatBackground = 'none';
  let visualEffect: CatSkin['visualEffect'] = 'none';
  let accessory: CatSkin['accessory'] = 'none';
  let collectorValue = 10;
  let price = 500;
  let category: CatSkin['category'] = 'Standard';
  let description = '';

  if (rarity === 'common') {
    // 1. COMMON
    renderStyle = '2d-flat';
    furColor = pick(COMMON_FUR_COLORS);
    bellyColor = pick(COMMON_QUIRKY_BELLIES);
    earInnerColor = pick(['#FDA4AF', '#FBCFE8', '#CBD5E1', '#FDE047']);
    eyeColor = pick(['#0284C7', '#16A34A', '#CA8A04', '#EA580C', '#475569']);
    earType = pick(['basic', 'small', 'crooked']);
    eyeType = 'round';
    toy = 'none';
    backgroundType = 'none';
    patternType = pick(['solid', 'stripes', 'spots', 'tuxedo']);
    patternColor = pick(['#1E293B', '#334155', '#78350F', '#0F172A']);
    name = `${pick(COMMON_NAMES_PREFIX)} ${pick(COMMON_NAMES_SUFFIX)} #${mintNumber}`;
    collectorValue = randInt(10, 25);
    price = randInt(400, 800);
    category = 'Standard';
    description = `A one-of-a-kind quirky common cat. Unique Mint #${mintNumber}. Flat 2D style with playful spirit!`;
  } else if (rarity === 'uncommon') {
    // 2. UNCOMMON
    renderStyle = '2d-harmonious';
    const pal = pick(UNCOMMON_HARMONIOUS_PALETTES);
    furColor = pal.fur;
    bellyColor = pal.belly;
    earInnerColor = pal.earInner;
    eyeColor = pal.eyes;
    patternColor = pal.pattern;
    patternType = pick(['solid', 'stripes', 'spots', 'calico', 'tuxedo']);
    earType = pick(['pointed', 'rounded']);
    eyeType = 'round';
    toy = 'none';
    backgroundType = 'none';
    name = `${pick(UNCOMMON_NAMES_PREFIX)} ${pick(UNCOMMON_NAMES_SUFFIX)} #${mintNumber}`;
    collectorValue = randInt(35, 65);
    price = randInt(1200, 2200);
    category = pick(['Standard', 'Nature']);
    description = `Harmonious 2D feline with perfectly matching palette. Unique Mint #${mintNumber}.`;
  } else if (rarity === 'rare') {
    // 3. RARE
    renderStyle = '2d-expressive';
    const pal = pick(RARE_PALETTES);
    furColor = pal.fur;
    bellyColor = pal.belly;
    earInnerColor = pal.earInner;
    eyeColor = pal.eyes;
    patternColor = pal.pattern;
    patternType = pick(['stripes', 'spots', 'calico', 'sparkle']);
    earType = pick(RARE_EARS);
    eyeType = pick(RARE_EYES);
    toy = pick(RARE_TOYS); // CUTE TOY NEXT TO CAT!
    backgroundType = 'none';
    visualEffect = pick(['bubble-aura', 'crystal-flare', 'subtle-dust']);
    accessory = pick(['none', 'bow', 'glasses', 'headphones']);
    name = `${pick(RARE_NAMES_PREFIX)} ${pick(RARE_NAMES_SUFFIX)} #${mintNumber}`;
    collectorValue = randInt(85, 140);
    price = randInt(3500, 5500);
    category = pick(['Magic', 'Nature', 'Elemental']);
    description = `Rare cat featuring expressive ${eyeType} eyes, stylized ${earType} ears, and a beloved ${toy} toy!`;
  } else if (rarity === 'epic') {
    // 4. EPIC (3D Volumetric appearance)
    renderStyle = '3d-volumetric';
    const pal = pick(EPIC_PALETTES);
    furColor = pal.fur;
    bellyColor = pal.belly;
    earInnerColor = pal.earInner;
    eyeColor = pal.eyes;
    patternColor = pal.pattern;
    patternType = pick(['cosmic', 'robot', 'elemental', 'sparkle', 'stripes']);
    earType = pick(['tufted-lynx', 'folded-scottish', 'fluffy-plush', 'pointed']);
    eyeType = pick(['anime-sparkle', 'mystic-gem', 'glossy-boba']);
    toy = pick(RARE_TOYS);
    backgroundType = 'none';
    visualEffect = pick(['neon-glow', 'crystal-flare', 'fire-ember']);
    accessory = pick(['wizard-hat', 'glasses', 'headphones', 'bow', 'knight-helm', 'cape']);
    name = `${pick(EPIC_NAMES_PREFIX)} ${pick(EPIC_NAMES_SUFFIX)} #${mintNumber}`;
    collectorValue = randInt(180, 290);
    price = randInt(8000, 15000);
    category = pick(['Cyber', 'Careers', 'Magic', 'Elemental']);
    description = `An incredible 3D volumetric sculpted cat with deep depth shading, specular highlights, and gloss finish!`;
  } else if (rarity === 'legendary') {
    // 5. LEGENDARY (Fluffy fur texture + Unique procedural background)
    renderStyle = 'fluffy-legendary';
    const pal = pick(LEGENDARY_PALETTES);
    furColor = pal.fur;
    bellyColor = pal.belly;
    earInnerColor = pal.earInner;
    eyeColor = pal.eyes;
    patternColor = pal.pattern;
    patternType = pick(['cosmic', 'sparkle', 'elemental', 'calico']);
    earType = 'fluffy-plush';
    eyeType = pick(['anime-sparkle', 'mystic-gem']);
    toy = pick(['golden-trophy', 'catnip-bell', 'rubber-duck', 'yarn-ball']);
    backgroundType = pal.bg; // UNIQUE BACKGROUND!
    visualEffect = pick(['celestial-orbit', 'golden-crown', 'fire-ember']);
    accessory = pick(['crown', 'halo', 'cape', 'wizard-hat']);
    name = `${pick(LEGENDARY_NAMES_PREFIX)} ${pick(LEGENDARY_NAMES_SUFFIX)} #${mintNumber}`;
    collectorValue = randInt(400, 650);
    price = randInt(25000, 45000);
    category = pick(['Royal', 'Cosmic', 'Magic']);
    description = `Legendary cat with ultra-soft fluffy fur texture, royal crown, and a unique ${backgroundType} background!`;
  } else {
    // 6. MYTHIC (Pure Gold / Divine)
    renderStyle = 'mythic-divine';
    furColor = '#FFD700';
    bellyColor = '#FEF08A';
    earInnerColor = '#FEF08A';
    eyeColor = '#B45309';
    patternColor = '#D97706';
    patternType = 'sparkle';
    earType = 'fluffy-plush';
    eyeType = 'mystic-gem';
    toy = 'golden-trophy';
    backgroundType = 'golden-throne';
    visualEffect = 'golden-crown';
    accessory = 'crown';
    name = `Pure Solid Gold Cat Midas #${mintNumber}`;
    collectorValue = 1000;
    price = 250000;
    category = 'Royal';
    description = `Mythic god of cats, forged of 24K solid metallic gold with ultra-fluffy royal fur and golden palace background!`;
  }

  // Calculate price and collector value dynamically influenced by Toy and Background rarities!
  const toyPriceBonus = TOY_TRAIT_CONFIG[toy]?.priceBonus || 0;
  const toyCollectorBonus = TOY_TRAIT_CONFIG[toy]?.collectorBonus || 0;

  const bgPriceBonus = BACKGROUND_TRAIT_CONFIG[backgroundType]?.priceBonus || 0;
  const bgCollectorBonus = BACKGROUND_TRAIT_CONFIG[backgroundType]?.collectorBonus || 0;

  const finalPrice = price + toyPriceBonus + bgPriceBonus;
  const finalCollectorValue = collectorValue + toyCollectorBonus + bgCollectorBonus;

  return {
    id,
    name,
    rarity,
    price: finalPrice,
    collectorValue: finalCollectorValue,
    resaleValue: Math.round(finalPrice * 0.4),
    duplicateCoinBonus: Math.round(finalPrice * 0.2),
    description,
    category,
    visualEffect,
    furColor,
    bellyColor,
    eyeColor,
    earInnerColor,
    noseColor: '#FDA4AF',
    patternType,
    patternColor,
    accessory,
    mintNumber,
    dna,
    generation: 1,
    personality,
    earType,
    eyeType,
    renderStyle,
    toy,
    backgroundType,
    isProcedural: true,
  };
}
