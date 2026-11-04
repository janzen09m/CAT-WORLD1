import React, { useState } from 'react';
import { CatSkin, PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG } from '../data/catsData';
import { TOY_TRAIT_CONFIG, BACKGROUND_TRAIT_CONFIG, getRarityStarLevel } from '../utils/catGenerator';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { X, Star, Check, Tag, Coins, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CatDetailModalProps {
  cat: CatSkin;
  player: PlayerData;
  onClose: () => void;
  onEquip: (catId: string) => Promise<void>;
  onToggleFavorite: (catId: string) => Promise<void>;
  onGoToShop?: () => void;
  onCatListed?: (updatedPlayer: PlayerData) => void;
  sessionToken?: string;
  theme?: Theme;
}

export const CatDetailModal: React.FC<CatDetailModalProps> = ({
  cat,
  player,
  onClose,
  onEquip,
  onToggleFavorite,
  onCatListed,
  sessionToken,
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

  // Market listing state
  const [showListForm, setShowListForm] = useState(false);
  const [marketPrice, setMarketPrice] = useState(String(Math.max(100, cat.price || 500)));
  const [isListing, setIsListing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleEquip = async () => {
    soundManager.playClick();
    triggerHaptic('medium');
    await onEquip(cat.id);
  };

  const handleListOnMarket = async () => {
    const price = parseInt(marketPrice, 10);
    if (!price || price < 50) {
      soundManager.playError();
      setMarketStatus({ text: 'Mindestpreis beträgt 50 Münzen.', type: 'error' });
      return;
    }

    soundManager.playClick();
    triggerHaptic('heavy');
    setIsListing(true);
    setMarketStatus(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-player-id': player.id,
        'x-telegram-user-id': String(player.telegramUserId || ''),
      };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        headers['x-session-token'] = sessionToken;
      }

      const res = await fetch('/api/market/list', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          catId: cat.id,
          priceCoins: price,
        }),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server antwortete mit Status ${res.status}.`);
      }

      if (!res.ok || !data?.success) {
        const errMsg =
          typeof data?.error === 'object'
            ? data?.error?.message || JSON.stringify(data.error)
            : data?.error || 'Fehler beim Anbieten auf dem Markt';
        throw new Error(errMsg);
      }

      soundManager.playCoin();
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

      setMarketStatus({
        text: `✓ Erfolgreich für ${price.toLocaleString('de-DE')} Münzen auf dem P2P-Markt eingestellt!`,
        type: 'success',
      });

      if (onCatListed && data.player) {
        onCatListed(data.player);
      }

      // Close modal after brief success confirmation
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      soundManager.playError();
      const errMsg = typeof err?.message === 'string' ? err.message : 'Fehler beim Anbieten';
      setMarketStatus({ text: errMsg, type: 'error' });
    } finally {
      setIsListing(false);
    }
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

        {/* 5. BUTTONS: EQUIP & MARKET OFFER */}
        <div className="pt-2 space-y-2">
          {/* Equip as Active Cat */}
          {isActive ? (
            <button
              disabled
              className={`w-full py-2.5 font-black rounded-xl flex items-center justify-center gap-1.5 cursor-default text-xs ${
                isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Check className="w-4 h-4 text-pink-400" />
              <span>Aktuell ausgerüstet</span>
            </button>
          ) : (
            <button
              onClick={handleEquip}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-black rounded-xl text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Als aktive Katze ausrüsten</span>
            </button>
          )}

          {/* List on P2P Marketplace Button / Form */}
          {isOwned && (
            <div className="pt-1">
              {!showListForm ? (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowListForm(true);
                  }}
                  disabled={isActive}
                  className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition-all ${
                    isActive
                      ? isLight
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    {isActive ? 'Ausgerüstete Katze kann nicht angeboten werden' : 'Im P2P-Markt anbieten'}
                  </span>
                </button>
              ) : (
                <div className={`p-3 rounded-2xl border animate-in fade-in ${
                  isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-900 border-amber-500/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Verkaufspreis festlegen:
                    </span>
                    <button
                      onClick={() => setShowListForm(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      Abbrechen
                    </button>
                  </div>

                  {/* Price input */}
                  <div className="relative mb-2">
                    <input
                      type="number"
                      min={50}
                      max={1000000}
                      value={marketPrice}
                      onChange={e => setMarketPrice(e.target.value)}
                      placeholder="Preis in Münzen..."
                      className={`w-full pl-3 pr-10 py-1.5 rounded-xl border text-xs font-mono font-bold outline-hidden ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">🪙</span>
                  </div>

                  {/* Quick price presets */}
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[250, 500, 1500, 5000].map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          soundManager.playClick();
                          setMarketPrice(String(p));
                        }}
                        className={`py-1 rounded-lg text-[10px] font-bold border ${
                          marketPrice === String(p)
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {p.toLocaleString('de-DE')} 🪙
                      </button>
                    ))}
                  </div>

                  {/* Submit listing */}
                  <button
                    onClick={handleListOnMarket}
                    disabled={isListing}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{isListing ? 'Wird eingestellt...' : `Jetzt für ${parseInt(marketPrice, 10) || 0} 🪙 anbieten`}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Market Status Notification */}
          {marketStatus && (
            <div className={`p-2 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in ${
              marketStatus.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}>
              {marketStatus.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="text-[11px]">{marketStatus.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
