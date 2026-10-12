import { ChestConfig, KeyType } from '../types/game';

export const CHESTS_CONFIG: ChestConfig[] = [
  {
    id: 'wooden',
    name: 'Wooden Chest',
    subtitle: 'Starter Chest',
    color: '#B45309',
    borderColor: 'border-amber-700',
    keyRequired: 'wooden',
    coinPrice: 150,
    dropRates: {
      common: 60,
      uncommon: 32,
      rare: 8,
      epic: 0,
      legendary: 0,
      mythic: 0,
    },
    description: 'A sturdy oak treasure chest. Perfect for kicking off your feline collection!',
  },
  {
    id: 'blue',
    name: 'Sapphire Chest',
    subtitle: 'Magic Sapphire Chest',
    color: '#2563EB',
    borderColor: 'border-blue-600',
    keyRequired: 'blue',
    coinPrice: 600,
    dropRates: {
      common: 10,
      uncommon: 45,
      rare: 35,
      epic: 10,
      legendary: 0,
      mythic: 0,
    },
    description: 'Radiates with deep blue magic. Holds rare nature cats and epic surprises!',
  },
  {
    id: 'epic',
    name: 'Epic Chest',
    subtitle: 'Arcane Amethyst Chest',
    color: '#7C3AED',
    borderColor: 'border-purple-600',
    keyRequired: 'epic',
    coinPrice: 2500,
    dropRates: {
      common: 0,
      uncommon: 15,
      rare: 45,
      epic: 33,
      legendary: 7,
      mythic: 0,
    },
    description: 'Vibrating with arcane energy. High chances for powerful elemental and cyber cats!',
  },
  {
    id: 'legendary',
    name: 'Legendary Chest',
    subtitle: 'Golden Dragon Chest',
    color: '#D97706',
    borderColor: 'border-amber-500',
    keyRequired: 'legendary',
    coinPrice: 8000,
    dropRates: {
      common: 0,
      uncommon: 0,
      rare: 20,
      epic: 45,
      legendary: 30,
      mythic: 5,
    },
    description: 'The pinnacle of all chests! Pure gold and jewels. Your chance to pull Mythic cats!',
  },
];

export const KEY_EXCHANGE_RATES: Record<KeyType, {
  name: string;
  color: string;
  coinPrice: number;
  iconName: string;
  description: string;
}> = {
  wooden: {
    name: 'Wooden Key',
    color: '#B45309',
    coinPrice: 150,
    iconName: 'wooden',
    description: 'Opens standard Wooden Chests with common & uncommon cats',
  },
  blue: {
    name: 'Blue Key',
    color: '#2563EB',
    coinPrice: 550,
    iconName: 'blue',
    description: 'Opens Sapphire Chests with high rare & epic cat chances',
  },
  epic: {
    name: 'Epic Key',
    color: '#7C3AED',
    coinPrice: 2200,
    iconName: 'epic',
    description: 'Opens Arcane Amethyst Chests with legendary chances',
  },
  legendary: {
    name: 'Legendary Key',
    color: '#F59E0B',
    coinPrice: 7000,
    iconName: 'legendary',
    description: 'Opens Golden Dragon Chests with high Mythic and Legendary odds',
  },
};
