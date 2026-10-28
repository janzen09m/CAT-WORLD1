import React, { useState } from 'react';
import { PlayerData, CatSkin, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { Heart, Sparkles, Image, Trophy } from 'lucide-react';

interface PetCatRoomProps {
  player: PlayerData;
  activeCat?: CatSkin | null;
  onPetCat: () => Promise<void>;
  onChangeBackground: (bg: PlayerData['roomBackground']) => Promise<void>;
  collectorValue: number;
  onOpenChests?: () => void;
  theme?: Theme;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

export const PetCatRoom: React.FC<PetCatRoomProps> = ({
  player,
  activeCat,
  onPetCat,
  onChangeBackground,
  collectorValue,
  onOpenChests,
  theme = 'dark',
}) => {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [isPurring, setIsPurring] = useState(false);

  const isLight = theme === 'light';

  if (!activeCat) {
    return (
      <div className={`rounded-3xl p-6 shadow-xl border text-center transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 to-purple-950/70 border-purple-500/30 text-white'
      }`}>
        <div className="text-5xl mb-2 animate-bounce">📦</div>
        <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Willkommen in CAT WORLD!
        </h2>
        <p className={`text-xs mt-1 mb-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Öffne deine erste Kiste mit deinen Schlüsseln, um die erste Katze weltweit zu ziehen!
        </p>
        {onOpenChests && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenChests();
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <span>📦 Erste Kiste öffnen ({player.keys.wooden || 0} Holz-Schlüssel)</span>
          </button>
        )}
      </div>
    );
  }

  const rarityMeta = RARITY_CONFIG[activeCat.rarity];

  const handlePet = async (e: React.MouseEvent) => {
    soundManager.playPurr();
    triggerHaptic('medium');
    setIsPurring(true);
    setTimeout(() => setIsPurring(false), 800);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: x + (Math.random() * 40 - 20),
      y: y - 20,
    };
    setHearts(prev => [...prev.slice(-8), newHeart]);

    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);

    await onPetCat();
  };

  const getBackgroundStyles = () => {
    if (isLight) {
      switch (player.roomBackground) {
        case 'sakura_garden':
          return 'from-rose-100 via-pink-50 to-slate-100 border-rose-200 text-slate-800';
        case 'cosmic_dream':
          return 'from-indigo-100 via-purple-50 to-slate-100 border-indigo-200 text-slate-800';
        case 'royal_castle':
          return 'from-amber-100 via-yellow-50 to-slate-100 border-amber-200 text-slate-800';
        case 'beach_sunset':
          return 'from-orange-100 via-amber-50 to-sky-100 border-orange-200 text-slate-800';
        default: // cozy_living
          return 'from-amber-50 via-stone-50 to-slate-100 border-amber-200 text-slate-800';
      }
    }

    switch (player.roomBackground) {
      case 'sakura_garden':
        return 'from-rose-950/70 via-pink-900/40 to-slate-900 border-pink-500/30 text-white';
      case 'cosmic_dream':
        return 'from-indigo-950/80 via-purple-950/50 to-slate-950 border-purple-500/30 text-white';
      case 'royal_castle':
        return 'from-amber-950/70 via-red-950/40 to-slate-900 border-amber-500/30 text-white';
      case 'beach_sunset':
        return 'from-orange-950/70 via-amber-900/40 to-cyan-950/40 border-orange-500/30 text-white';
      default: // cozy_living
        return 'from-amber-950/40 via-slate-800/60 to-slate-900 border-amber-600/30 text-white';
    }
  };

  const backgroundsList: { id: PlayerData['roomBackground']; label: string; icon: string }[] = [
    { id: 'cozy_living', label: 'Living Room', icon: '🛋️' },
    { id: 'sakura_garden', label: 'Sakura Garden', icon: '🌸' },
    { id: 'cosmic_dream', label: 'Cosmic Dream', icon: '🌌' },
    { id: 'royal_castle', label: 'Royal Castle', icon: '👑' },
    { id: 'beach_sunset', label: 'Sunset Beach', icon: '🌅' },
  ];

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b ${getBackgroundStyles()} border p-5 shadow-xl transition-all duration-300`}>
      {/* Top Details & Background Switcher */}
      <div className="flex items-center justify-between mb-3 z-10 relative">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${rarityMeta.badgeBg} ${rarityMeta.badgeText}`}>
            {rarityMeta.name}
          </span>
          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            ★ {activeCat.collectorValue} Rating
          </span>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            setShowBgPicker(!showBgPicker);
          }}
          className={`p-1.5 rounded-xl text-xs flex items-center gap-1 border transition-colors ${
            isLight
              ? 'bg-white/80 hover:bg-white text-slate-700 border-slate-300 shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Change Room Background"
        >
          <Image className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Room</span>
        </button>
      </div>

      {/* Room Background Theme Selector */}
      {showBgPicker && (
        <div className={`mb-4 p-3 rounded-2xl animate-in fade-in zoom-in-95 duration-150 z-20 relative border ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xl'
            : 'bg-slate-900/95 border-slate-700 text-white'
        }`}>
          <div className="text-[11px] font-bold mb-2 flex items-center justify-between">
            <span>Select Cat Room Theme:</span>
            <button onClick={() => setShowBgPicker(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {backgroundsList.map(bg => (
              <button
                key={bg.id}
                onClick={async () => {
                  soundManager.playClick();
                  await onChangeBackground(bg.id);
                  setShowBgPicker(false);
                }}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                  player.roomBackground === bg.id
                    ? 'border-pink-500 bg-pink-500/15 text-pink-600 font-bold'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xl">{bg.icon}</span>
                <span className="text-[9px] font-bold mt-1 truncate w-full">{bg.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Cat Stage */}
      <div
        onClick={handlePet}
        className="relative flex flex-col items-center justify-center py-4 cursor-pointer select-none group"
      >
        {/* Cozy Rug Graphic */}
        <div className={`absolute bottom-6 w-48 h-16 rounded-[100%] blur-[1px] border shadow-inner group-hover:scale-105 transition-transform ${
          isLight ? 'bg-amber-100/60 border-amber-200/80' : 'bg-white/10 border-white/20'
        }`} />

        {/* Floating Heart Particles */}
        {hearts.map(heart => (
          <div
            key={heart.id}
            className="absolute pointer-events-none text-pink-500 font-bold flex items-center gap-1 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]"
            style={{ left: heart.x, top: heart.y }}
          >
            <Heart className="w-5 h-5 fill-pink-500 stroke-pink-300 drop-shadow-[0_0_8px_#ec4899]" />
            <span className="text-xs text-pink-500 font-black">+Purr!</span>
          </div>
        ))}

        {/* The Cat Illustration */}
        <div className={`transition-all duration-300 ${isPurring ? 'scale-110' : 'group-hover:scale-105'}`}>
          <CatIllustration cat={activeCat} size={170} />
        </div>

        {/* Pet me tooltip prompt */}
        <div className="mt-2 text-center">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors shadow-md border ${
            isLight
              ? 'bg-white/90 text-pink-600 border-pink-200 group-hover:border-pink-300'
              : 'bg-slate-900/80 text-pink-300 border-pink-500/30 group-hover:border-pink-400'
          }`}>
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
            <span>Click to pet! ({player.stats.petCount || 0})</span>
          </div>
        </div>
      </div>

      {/* Cat Details Banner */}
      <div className={`mt-2 pt-3 border-t flex items-center justify-between text-xs ${
        isLight ? 'border-slate-200/80' : 'border-white/10'
      }`}>
        <div>
          <div className={`font-black text-base flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <span>{player.catCustomName}</span>
            <span className="text-slate-400 font-normal text-xs">({activeCat.name})</span>
          </div>
          <p className={`text-[11px] max-w-[240px] line-clamp-1 italic ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            "{activeCat.description}"
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Category</div>
          <div className="font-bold text-purple-500 flex items-center gap-1 justify-end">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{activeCat.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
