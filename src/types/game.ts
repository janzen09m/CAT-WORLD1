export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type Theme = 'dark' | 'light';

export type EarType = 'basic' | 'small' | 'crooked' | 'pointed' | 'rounded' | 'tufted-lynx' | 'folded-scottish' | 'fluffy-plush';
export type EyeType = 'round' | 'anime-sparkle' | 'mystic-gem' | 'sleepy-chic' | 'glossy-boba';
export type CatToy = 'none' | 'yarn-ball' | 'rubber-duck' | 'fish-bone' | 'mouse-toy' | 'catnip-bell' | 'golden-trophy';
export type CatBackground = 'none' | 'cosmic-nebula' | 'sunset-aurora' | 'golden-throne' | 'sakura-drift' | 'cyber-matrix' | 'crystal-cavern';
export type RenderStyle = '2d-flat' | '2d-harmonious' | '2d-expressive' | '3d-volumetric' | 'fluffy-legendary' | 'mythic-divine';

export interface CatSkin {
  id: string;
  name: string;
  rarity: Rarity;
  price: number; // in coins
  collectorValue: number; // points for leaderboard and collector rating
  resaleValue: number;
  duplicateCoinBonus?: number; // bonus coins given if duplicate drawn
  starShardValue?: number; // legacy optional compatibility
  description: string;
  category: 'Standard' | 'Nature' | 'Magic' | 'Cosmic' | 'Elemental' | 'Careers' | 'Cyber' | 'Royal';
  visualEffect: 'none' | 'subtle-dust' | 'bubble-aura' | 'neon-glow' | 'celestial-orbit' | 'rainbow-sparkles' | 'golden-crown' | 'crystal-flare' | 'fire-ember' | 'ice-frost';
  
  // Unique Procedural & Trading Attributes
  mintNumber?: number;
  dna?: string;
  generation?: number;
  personality?: string;
  earType?: EarType;
  eyeType?: EyeType;
  renderStyle?: RenderStyle;
  toy?: CatToy;
  backgroundType?: CatBackground;
  isProcedural?: boolean;

  // Visual traits for procedural SVG rendering
  furColor: string;
  furColorSecondary?: string;
  bellyColor: string;
  eyeColor: string;
  earInnerColor: string;
  noseColor: string;
  patternType: 'solid' | 'stripes' | 'spots' | 'tuxedo' | 'calico' | 'cosmic' | 'robot' | 'elemental' | 'sparkle';
  patternColor?: string;
  accessory?: 'none' | 'crown' | 'wizard-hat' | 'astronaut-helmet' | 'pirate-hat' | 'ninja-headband' | 'knight-helm' | 'glasses' | 'bow' | 'halo' | 'headphones' | 'cape';
  specialTrait?: string;
}

export interface TradeListing {
  id: string;
  sellerName: string;
  sellerTelegram?: string;
  cat: CatSkin;
  priceCoins: number;
  wantsRarity?: Rarity;
  createdAt: number;
}

export type KeyType = 'wooden' | 'blue' | 'epic' | 'legendary';

export interface ChestConfig {
  id: 'wooden' | 'blue' | 'epic' | 'legendary';
  name: string;
  subtitle: string;
  color: string;
  borderColor: string;
  keyRequired: KeyType;
  coinPrice: number;
  dropRates: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
  description: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  tictactoeWins: number;
  tennisWins: number;
  chessWins: number;
  memoryWins: number;
  catCatchHighScore: number;
  chestsOpened: number;
  catsBought: number;
  keysBought: number;
  keysConverted?: number;
  totalCoinsEarned: number;
  petCount: number;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  rewardCoins: number;
  rewardShards?: number;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'collection' | 'games' | 'chests' | 'wealth';
  goal: number;
  current: number;
  rewardCoins: number;
  rewardShards?: number;
  unlocked: boolean;
  claimed: boolean;
}

export interface ChestHistoryEntry {
  id: string;
  timestamp: number;
  chestId: string;
  catId: string;
  catName: string;
  rarity: Rarity;
  isDuplicate: boolean;
  coinsAwarded?: number;
  shardsAwarded?: number;
}

export interface PlayerData {
  id: string;
  telegramUserId?: number;
  telegramUsername?: string;
  playerName: string;
  catCustomName: string;
  activeCatId: string;
  createdAt: string;
  coins: number;
  starShards?: number; // legacy optional
  keys: {
    wooden: number;
    blue: number;
    epic: number;
    legendary: number;
  };
  ownedCats: Record<string, {
    count: number;
    unlockedAt: string;
    isFavorite: boolean;
    customSkin?: CatSkin;
  }>;
  roomBackground: 'cozy_living' | 'sakura_garden' | 'cosmic_dream' | 'royal_castle' | 'beach_sunset';
  stats: PlayerStats;
  dailyTasks: DailyTask[];
  achievements: Achievement[];
  loginStreak: number;
  lastLoginDate: string;
  dailyLoginClaimedToday: boolean;
  chestHistory: ChestHistoryEntry[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  catCustomName: string;
  activeCatId: string;
  activeCatName: string;
  activeCatRarity: Rarity;
  collectorValue: number;
  catsCount: number;
  gamesWon: number;
  chessWins: number;
  loginStreak: number;
}
