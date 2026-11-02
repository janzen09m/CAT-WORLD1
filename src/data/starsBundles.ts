export interface StarsBundle {
  id: string;
  stars: number;
  coins: number;
  title: string;
  bonusText?: string;
  badge?: string;
  popular?: boolean;
  bestValue?: boolean;
  icon: string;
}

export const TELEGRAM_STARS_BUNDLES: StarsBundle[] = [
  {
    id: 'stars_pack_50',
    stars: 50,
    coins: 2000,
    title: 'Kätzchen-Vorrat',
    bonusText: 'Perfekt für 3x Holzkisten oder 3x Saphirschlüssel',
    icon: '🐱',
  },
  {
    id: 'stars_pack_150',
    stars: 150,
    coins: 6500,
    title: 'Sammler-Beutel',
    bonusText: '+15% Extra Münzen geschenkt!',
    badge: 'Beliebt',
    popular: true,
    icon: '🎒',
  },
  {
    id: 'stars_pack_350',
    stars: 350,
    coins: 16500,
    title: 'Truhen-Schatz',
    bonusText: '+30% Bonus-Münzen für Amethyst-Kisten!',
    badge: 'Bestseller',
    icon: '💎',
  },
  {
    id: 'stars_pack_750',
    stars: 750,
    coins: 40000,
    title: 'Königlicher Tresor',
    bonusText: '+50% Mega-Bonus! Reicht für mehrere Legendäre Schlüssel!',
    badge: 'Bester Wert',
    bestValue: true,
    icon: '👑',
  },
  {
    id: 'stars_pack_1500',
    stars: 1500,
    coins: 90000,
    title: 'Kaiserliche Schatzkammer',
    bonusText: '+75% Ultimativer VIP-Whale-Bonus!',
    badge: 'VIP Elite',
    icon: '🏛️',
  },
];
