import React from 'react';
import { CatSkin, PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG } from '../data/catsData';
import { TOY_TRAIT_CONFIG, BACKGROUND_TRAIT_CONFIG, getRarityStarLevel } from '../utils/catGenerator';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { X, Star, Check } from 'lucide-react';

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
  theme = 'dark',
}) => {
  const ownedInfo = player.ownedCats[cat.id];
  const isOwned = !!ownedInfo;
  const isActive = player.activeCatId === cat.id;
  const isFavorite = ownedInfo?.isFavorite ?? false;

  const rarityMeta = RARITY_CONFIG[cat.rarity];
  const isLight = theme === 'light';
  const starCount = getRarityStarLevel(cat.rarity);

  const toyKey = cat.toy || 'none';
  const toyInfo = TOY_TRAIT_CONFIG[toyKey] || TOY_TRAIT_CONFIG.none;

  const bgKey = cat.backgroundType || 'none';
  const bgInfo = BACKGROUND_TRAIT_CONFIG[bgKey] || BACKGROUND_TRAIT_CONFIG.none;

  const cleanCatName = (cat.name || 'Katze').replace(/\s*#\d+/, '').trim();
  const mintNumber = cat.mintNumber || 1;

  const handleEquip = async () => {
    soundManager.playClick();
    triggerHaptic('medium');
    await onEquip(cat.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border ${
        isLight
          ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/80 text-white'
      }`}>
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${
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
            className={`absolute top-4 left-4 p-1.5 rounded-full transition-colors z-10 ${
              isLight
                ? 'bg-slate-100 text-slate-400 hover:text-amber-500'
                : 'bg-slate-800 text-slate-400 hover:text-amber-400'
            }`}
            title="Favorit"
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : isLight ? 'text-slate-300' : 'text-slate-400'
              }`}
            />
          </button>
        )}

        {/* 1. STERNE & SELTENHEIT KASTEN */}
        <div
          className="my-2 px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: `${rarityMeta.color}15`,
            borderColor: `${rarityMeta.color}45`,
          }}
        >
          {/* 1 bis 5 Sterne */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => {
              const isFilled = idx < starCount;
              return (
                <span
                  key={idx}
                  className={`text-base font-black leading-none ${
                    isFilled ? 'text-amber-400 drop-shadow-xs' : isLight ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  ★
                </span>
              );
            })}
          </div>

          {/* Was es bedeutet: Common / Uncommon / Rare / Epic / Legendary / Mythic */}
          <div className="flex items-center gap-1.5 font-mono">
            <span
              className="text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg text-white"
              style={{ backgroundColor: rarityMeta.color }}
            >
              {rarityMeta.name}
            </span>
            <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {cat.rarity === 'common' && '• Gewöhnlich'}
              {cat.rarity === 'uncommon' && '• Ungewöhnlich'}
              {cat.rarity === 'rare' && '• Selten'}
              {cat.rarity === 'epic' && '• Episch 3D'}
              {cat.rarity === 'legendary' && '• Legendär Flauschig'}
              {cat.rarity === 'mythic' && '• Mythisch 24K'}
            </span>
          </div>
        </div>

        {/* 2. KATZEN STICKER */}
        <div className="flex justify-center my-1 relative">
          <CatIllustration cat={cat} size={150} />
        </div>

        {/* 3. IN EINER ZEILE: KATZEN NUMMER DANEBEN DER NAME */}
        <div className="text-center my-3">
          <div className="inline-flex items-center justify-center gap-2 max-w-full px-2">
            <span className="shrink-0 text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              #{mintNumber}
            </span>
            <h3 className={`text-lg font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {cleanCatName}
            </h3>
          </div>
        </div>

        {/* 4. DETAILS: KATEGORIE, PREIS, SPIELZEUG & HINTERGRUND */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
          {/* Kategorie */}
          <div className={`p-2.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
              Kategorie
            </span>
            <span className="font-black text-purple-400 text-xs">
              {cat.category || 'Standard'}
            </span>
          </div>

          {/* Preis */}
          <div className={`p-2.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
              Wert / Preis
            </span>
            <span className="font-black text-amber-500 font-mono text-xs">
              {cat.price.toLocaleString('de-DE')} 🪙
            </span>
          </div>

          {/* Spielzeug */}
          <div className={`p-2.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
              Spielzeug
            </span>
            <div className="flex items-center gap-1 font-bold text-xs truncate mt-0.5">
              <span>{toyInfo.emoji}</span>
              <span className={toyInfo.priceBonus > 0 ? 'text-emerald-400' : isLight ? 'text-slate-500' : 'text-slate-400'}>
                {toyInfo.label}
              </span>
            </div>
            {toyInfo.priceBonus > 0 && (
              <span className="text-[9px] font-mono text-emerald-500 block">
                +{toyInfo.priceBonus} 🪙 Bonus
              </span>
            )}
          </div>

          {/* Hintergrund */}
          <div className={`p-2.5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
          }`}>
            <span className={`text-[10px] block font-medium ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
              Hintergrund
            </span>
            <div className="flex items-center gap-1 font-bold text-xs truncate mt-0.5">
              <span>{bgInfo.emoji}</span>
              <span className={bgInfo.priceBonus > 0 ? 'text-indigo-400' : isLight ? 'text-slate-500' : 'text-slate-400'}>
                {bgInfo.label}
              </span>
            </div>
            {bgInfo.priceBonus > 0 && (
              <span className="text-[9px] font-mono text-indigo-400 block">
                +{bgInfo.priceBonus} 🪙 Bonus
              </span>
            )}
          </div>
        </div>

        {/* 5. BUTTON: EQUIP AS ACTIVE CAT DARUNTER */}
        <div className="pt-1">
          {isActive ? (
            <button
              disabled
              className={`w-full py-3 font-black rounded-xl flex items-center justify-center gap-1.5 cursor-default text-xs ${
                isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Check className="w-4 h-4 text-pink-400" />
              <span>Aktuell ausgerüstet</span>
            </button>
          ) : (
            <button
              onClick={handleEquip}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-black rounded-xl text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Als aktive Katze ausrüsten</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
