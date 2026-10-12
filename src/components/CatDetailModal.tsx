import React from 'react';
import { CatSkin, PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG, getDuplicateCoinBonus } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { X, Star, Check, Sparkles, Coins, ShoppingBag } from 'lucide-react';

interface CatDetailModalProps {
  cat: CatSkin;
  player: PlayerData;
  onClose: () => void;
  onEquip: (catId: string) => Promise<void>;
  onToggleFavorite: (catId: string) => Promise<void>;
  onGoToShop?: () => void;
  theme?: Theme;
}

export const CatDetailModal: React.FC<CatDetailModalProps> = ({
  cat,
  player,
  onClose,
  onEquip,
  onToggleFavorite,
  onGoToShop,
  theme = 'dark',
}) => {
  const ownedInfo = player.ownedCats[cat.id];
  const isOwned = !!ownedInfo;
  const isActive = player.activeCatId === cat.id;
  const isFavorite = ownedInfo?.isFavorite ?? false;

  const rarityMeta = RARITY_CONFIG[cat.rarity];
  const isLight = theme === 'light';

  const handleEquip = async () => {
    soundManager.playClick();
    triggerHaptic('medium');
    await onEquip(cat.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border ${
        isLight
          ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/80 text-white'
      }`}>
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            isLight
              ? 'bg-slate-100 text-slate-400 hover:text-slate-700'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Favorite Button */}
        {isOwned && (
          <button
            onClick={async () => {
              soundManager.playClick();
              triggerHaptic('light');
              await onToggleFavorite(cat.id);
            }}
            className={`absolute top-4 left-4 p-1.5 rounded-full transition-colors ${
              isLight
                ? 'bg-slate-100 text-slate-400 hover:text-amber-500'
                : 'bg-slate-800 text-slate-400 hover:text-amber-400'
            }`}
            title="Favorite"
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : isLight ? 'text-slate-300' : 'text-slate-400'
              }`}
            />
          </button>
        )}

        {/* Cat Visual Hero */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-2"
               style={{ backgroundColor: `${rarityMeta.color}25`, border: `1.5px solid ${rarityMeta.color}`, color: rarityMeta.color }}>
            <Sparkles className="w-3 h-3" />
            <span>{rarityMeta.name}</span>
            <span>{'★'.repeat(rarityMeta.starCount)}</span>
          </div>

          <div className="flex justify-center -my-1">
            <CatIllustration cat={cat} size={150} />
          </div>

          <h3 className={`text-xl font-black mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{cat.name}</h3>
          <p className={`text-xs italic px-2 mt-1 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
            "{cat.description}"
          </p>
        </div>

        {/* Specs Table */}
        <div className="grid grid-cols-2 gap-2 my-4 text-xs">
          <div className={`p-2 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className="text-[10px] text-slate-400 block">Category</span>
            <span className="font-bold text-purple-400">{cat.category}</span>
          </div>

          <div className={`p-2 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className="text-[10px] text-slate-400 block">Collector Value</span>
            <span className="font-bold text-amber-400 font-mono">★ {cat.collectorValue}</span>
          </div>

          <div className={`p-2 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className="text-[10px] text-slate-400 block">Price</span>
            <span className="font-bold text-slate-400 font-mono">{cat.price.toLocaleString('en-US')} Coins</span>
          </div>

          <div className={`p-2 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className="text-[10px] text-slate-400 block">Duplicate Value</span>
            <span className="font-bold text-amber-500 font-mono">+{getDuplicateCoinBonus(cat)} Coins</span>
          </div>
        </div>

        {/* Ownership Status & CTA */}
        {isOwned ? (
          <div className="space-y-2">
            <div className={`text-center text-xs font-bold py-1.5 rounded-xl border ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
            }`}>
              Owned: {ownedInfo.count} cop{ownedInfo.count > 1 ? 'ies' : 'y'}
            </div>

            {isActive ? (
              <button
                disabled
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-default ${
                  isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Check className="w-4 h-4 text-pink-400" />
                <span>Currently Active Cat</span>
              </button>
            ) : (
              <button
                onClick={handleEquip}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-black rounded-xl text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Equip as Active Cat</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className={`text-center text-xs py-1.5 rounded-xl ${
              isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800/50 text-slate-400'
            }`}>
              Not Yet Unlocked
            </div>

            {onGoToShop ? (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onGoToShop();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-black rounded-xl text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>View in Shop ({cat.price.toLocaleString('en-US')} Coins)</span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
