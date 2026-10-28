import React from 'react';
import { CatSkin, PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { Star, Check, Lock, Sparkles } from 'lucide-react';

interface CatCardProps {
  cat: CatSkin;
  player: PlayerData;
  onSelect: (cat: CatSkin) => void;
  onToggleFavorite?: (catId: string) => void;
  theme?: Theme;
}

export const CatCard: React.FC<CatCardProps> = ({
  cat,
  player,
  onSelect,
  onToggleFavorite,
  theme = 'dark',
}) => {
  const ownedInfo = player.ownedCats[cat.id];
  const isOwned = !!ownedInfo;
  const displayCat = ownedInfo?.customSkin || cat;
  const isActive = player.activeCatId === displayCat.id || player.activeCatId === cat.id;
  const isFavorite = ownedInfo?.isFavorite ?? false;

  const rarityMeta = RARITY_CONFIG[displayCat.rarity];
  const isLight = theme === 'light';

  return (
    <div
      onClick={() => {
        soundManager.playClick();
        onSelect(displayCat);
      }}
      className={`relative rounded-2xl p-2.5 flex flex-col items-center cursor-pointer transition-all duration-200 border select-none group ${
        isActive
          ? isLight
            ? 'bg-pink-50/90 border-pink-500 ring-2 ring-pink-400 shadow-md'
            : 'bg-slate-800/90 border-pink-500 ring-2 ring-pink-500/50 shadow-lg shadow-pink-500/20'
          : isOwned
          ? isLight
            ? 'bg-white border-slate-200 shadow-xs hover:border-pink-300 hover:shadow-md'
            : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
          : isLight
          ? 'bg-slate-100/70 border-slate-200/80 opacity-70 hover:opacity-95'
          : 'bg-slate-900/60 border-slate-800/80 opacity-70 hover:opacity-90'
      }`}
    >
      {/* Top Bar on Card: Favorite & Owned Count / Mint */}
      <div className="w-full flex items-center justify-between z-10 -mb-1">
        {/* Favorite Button */}
        {isOwned ? (
          <button
            onClick={e => {
              e.stopPropagation();
              soundManager.playClick();
              triggerHaptic('light');
              onToggleFavorite?.(cat.id);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : isLight ? 'text-slate-300' : 'text-slate-500'
              }`}
            />
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Mint Number & Owned Tag */}
        {isOwned ? (
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
            isLight
              ? 'bg-purple-50 text-purple-800 border-purple-200'
              : 'bg-purple-950/80 text-amber-300 border-purple-800'
          }`}>
            <span className="text-amber-500 font-black">#{displayCat.mintNumber || 1}</span>
            {displayCat.toy && displayCat.toy !== 'none' && <span title={displayCat.toy}>🧸</span>}
          </span>
        ) : (
          <span className={`text-[10px] p-1 rounded-full ${
            isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-950/80 text-slate-500'
          }`}>
            <Lock className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Cat Illustration with pixelBlur if not owned */}
      <div className="py-1">
        <CatIllustration
          cat={displayCat}
          size={84}
          isAnimated={false}
          pixelBlur={!isOwned}
        />
      </div>

      {/* Cat Name & Rarity */}
      <div className="w-full text-center mt-1">
        <h4 className={`text-xs font-bold truncate max-w-full ${
          isLight ? 'text-slate-800' : 'text-white'
        }`}>
          {isOwned ? displayCat.name : 'Mystery Cat'}
        </h4>

        <div className="flex items-center justify-center gap-1 mt-0.5">
          <span
            className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono"
            style={{ color: isOwned ? rarityMeta.color : '#94a3b8' }}
          >
            {isOwned ? rarityMeta.name : `${rarityMeta.name} ?`}
          </span>
        </div>

        {/* Collector Value */}
        <div className={`text-[10px] font-mono mt-1 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {isOwned ? `★ ${displayCat.collectorValue}` : '★ ???'}
        </div>
      </div>

      {/* Active Equipped Badge */}
      {isActive && (
        <div className="absolute -bottom-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
          <Check className="w-2.5 h-2.5" />
          <span>Active</span>
        </div>
      )}
    </div>
  );
};
