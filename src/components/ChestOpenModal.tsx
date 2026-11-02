import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ChestConfig, CatSkin, PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG } from '../data/catsData';
import { KEY_EXCHANGE_RATES } from '../data/chestsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { Sparkles, X, Key, Check } from 'lucide-react';

interface ChestOpenModalProps {
  chest: ChestConfig;
  player: PlayerData;
  onClose: () => void;
  onOpenConfirm: (chestId: ChestConfig['id'], useCoins: boolean) => Promise<{ droppedCat: CatSkin; isDuplicate: boolean; coinsAwarded?: number; shardsAwarded?: number }>;
  onEquipCat?: (catId: string) => Promise<void>;
  onOpenExchangeModal?: () => void;
  theme?: Theme;
}

export const ChestOpenModal: React.FC<ChestOpenModalProps> = ({
  chest,
  player,
  onClose,
  onOpenConfirm,
  onEquipCat,
  onOpenExchangeModal,
  theme = 'light',
}) => {
  const [openingState, setOpeningState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [reward, setReward] = useState<{ cat: CatSkin; isDuplicate: boolean; coinsAwarded?: number } | null>(null);
  const [isEquipped, setIsEquipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLight = theme === 'light';
  const hasKey = (player.keys[chest.keyRequired] || 0) >= 1;

  const handleStartOpen = async (useCoins: boolean) => {
    soundManager.playClick();
    triggerHaptic('heavy');
    setErrorMsg(null);
    setOpeningState('opening');

    try {
      const soundTimer = setTimeout(() => {
        soundManager.playChestOpen();
      }, 500);

      const result = await onOpenConfirm(chest.id, useCoins);
      clearTimeout(soundTimer);

      setReward({
        cat: result.droppedCat,
        isDuplicate: result.isDuplicate,
        coinsAwarded: result.coinsAwarded,
      });

      setTimeout(() => {
        setOpeningState('revealed');
        triggerHaptic('success');

        const isHighTier = ['rare', 'epic', 'legendary', 'mythic'].includes(result.droppedCat.rarity);
        if (isHighTier) {
          confetti({
            particleCount: result.droppedCat.rarity === 'mythic' ? 120 : 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#EC4899', '#8B5CF6', '#F59E0B', '#3B82F6', '#10B981'],
          });
        }
      }, 900);
    } catch (err: any) {
      soundManager.playError();
      triggerHaptic('error');
      setErrorMsg(err.message || 'Fehler beim Öffnen der Kiste');
      setOpeningState('idle');
    }
  };

  const handleEquipDirectly = async () => {
    if (!reward || !onEquipCat) return;
    soundManager.playClick();
    triggerHaptic('medium');
    try {
      await onEquipCat(reward.cat.id);
      setIsEquipped(true);
    } catch {
      // ignore
    }
  };

  const rarityMeta = reward ? RARITY_CONFIG[reward.cat.rarity] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${
        isLight
          ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/80 text-white'
      }`}>
        {/* Close Button */}
        {openingState !== 'opening' && (
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
              isLight
                ? 'bg-slate-100 text-slate-500 hover:text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* --- STATE 1: IDLE / PREVIEW --- */}
        {openingState === 'idle' && (
          <div className="space-y-4 text-center">
            {/* Chest Graphic */}
            <div className="relative inline-block py-2">
              <div
                className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center text-5xl shadow-xl transition-transform hover:scale-105"
                style={{ backgroundColor: `${chest.color}25`, border: `2px solid ${chest.color}` }}
              >
                📦
              </div>
              <span className="absolute -top-1 -right-1 text-amber-400 animate-spin text-sm">✦</span>
            </div>

            <div>
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{chest.name}</h2>
              <p className="text-xs text-purple-500 font-bold">{chest.subtitle}</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{chest.description}</p>
            </div>

            {/* Transparent Drop Rates Table */}
            <div className={`rounded-2xl p-3 text-left border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/80 border-slate-700/60'
            }`}>
              <div className="text-[11px] font-bold mb-2 flex items-center justify-between">
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Drop-Chancen:</span>
                <span className="text-[10px] text-emerald-500 font-mono font-bold">100% Transparent</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                {chest.dropRates.common > 0 && (
                  <div className={`p-1.5 rounded-lg border ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-700/50 text-slate-200'
                  }`}>
                    <span className="text-slate-400 block text-[9px]">Gewöhnlich</span>
                    <span className="font-bold">{chest.dropRates.common}%</span>
                  </div>
                )}
                {chest.dropRates.uncommon > 0 && (
                  <div className={`p-1.5 rounded-lg border ${
                    isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                  }`}>
                    <span className="text-emerald-500 block text-[9px]">Ungewöhnlich</span>
                    <span className="font-bold">{chest.dropRates.uncommon}%</span>
                  </div>
                )}
                {chest.dropRates.rare > 0 && (
                  <div className={`p-1.5 rounded-lg border ${
                    isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-950/40 border-blue-800/50 text-blue-300'
                  }`}>
                    <span className="text-blue-500 block text-[9px]">Selten</span>
                    <span className="font-bold">{chest.dropRates.rare}%</span>
                  </div>
                )}
                {chest.dropRates.epic > 0 && (
                  <div className={`p-1.5 rounded-lg border ${
                    isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-950/40 border-purple-800/50 text-purple-300'
                  }`}>
                    <span className="text-purple-500 block text-[9px]">Episch (3D)</span>
                    <span className="font-bold">{chest.dropRates.epic}%</span>
                  </div>
                )}
                {chest.dropRates.legendary > 0 && (
                  <div className={`p-1.5 rounded-lg border ${
                    isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                  }`}>
                    <span className="text-amber-500 block text-[9px]">Legendär</span>
                    <span className="font-bold">{chest.dropRates.legendary}%</span>
                  </div>
                )}
                {chest.dropRates.mythic > 0 && (
                  <div className={`p-1.5 rounded-lg border animate-pulse ${
                    isLight ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-pink-950/40 border-pink-800/50 text-pink-300'
                  }`}>
                    <span className="text-pink-500 block text-[9px]">Mythisch</span>
                    <span className="font-bold">{chest.dropRates.mythic}%</span>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons: Strictly with Key */}
            <div className="space-y-2 pt-1">
              {hasKey ? (
                <button
                  onClick={() => handleStartOpen(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-black rounded-xl text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                >
                  <Key className="w-4 h-4 text-blue-200" />
                  <span>Kiste öffnen mit 1x {KEY_EXCHANGE_RATES[chest.keyRequired]?.name || 'Schlüssel'} ({player.keys[chest.keyRequired]}x da)</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className={`p-2.5 rounded-xl border text-xs text-center font-bold ${
                    isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                  }`}>
                    🔒 Kisten können nur mit Schlüsseln geöffnet werden!
                  </div>

                  {onOpenExchangeModal && (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onClose();
                        onOpenExchangeModal();
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-black rounded-xl text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                    >
                      <Key className="w-4 h-4 text-amber-200" />
                      <span>{KEY_EXCHANGE_RATES[chest.keyRequired]?.name} für {KEY_EXCHANGE_RATES[chest.keyRequired]?.coinPrice} 🪙 holen</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- STATE 2: OPENING ANIMATION --- */}
        {openingState === 'opening' && (
          <div className="py-12 text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 blur-2xl opacity-75 animate-ping" />
              <div className="text-7xl animate-bounce select-none">
                ✨📦✨
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 animate-pulse">
                Kiste öffnet sich...
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ein strahlendes Licht bricht hervor!
              </p>
            </div>
          </div>
        )}

        {/* --- STATE 3: REVEAL SCREEN --- */}
        {openingState === 'revealed' && reward && rarityMeta && (
          <div className="space-y-4 text-center animate-in fade-in zoom-in duration-300">
            {/* Rarity & Mint Serial Banner */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md"
                   style={{ backgroundColor: `${rarityMeta.color}25`, border: `1.5px solid ${rarityMeta.color}` }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: rarityMeta.color }} />
                <span style={{ color: rarityMeta.color }}>{rarityMeta.name}</span>
              </div>

              {reward.cat.mintNumber && (
                <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Global #{reward.cat.mintNumber}
                </span>
              )}
            </div>

            {/* Dropped Cat Presentation */}
            <div className="flex justify-center -my-2 relative">
              <CatIllustration cat={reward.cat} size={160} />
            </div>

            <div>
              <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{reward.cat.name}</h2>
              <p className={`text-xs italic px-4 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                "{reward.cat.description}"
              </p>
            </div>

            {/* Unique Procedural Trait Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold font-mono">
              {reward.cat.renderStyle === '3d-volumetric' && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  🔮 3D Volumetrisch
                </span>
              )}
              {reward.cat.renderStyle === 'fluffy-legendary' && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  ✨ Flauschig
                </span>
              )}
              {reward.cat.backgroundType && reward.cat.backgroundType !== 'none' && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  🌌 Hintergrund
                </span>
              )}
              {reward.cat.toy && reward.cat.toy !== 'none' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  🧸 Spielzeug dabei
                </span>
              )}
              {reward.cat.personality && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  💖 {reward.cat.personality}
                </span>
              )}
            </div>

            {/* Success Unlocked Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-xs text-emerald-700 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="font-bold">100% Einzigartige Katze zur Sammlung hinzugefügt!</span>
            </div>

            {/* Direct Equip & Continue Buttons */}
            <div className="space-y-2 pt-2">
              {onEquipCat && (
                <button
                  onClick={handleEquipDirectly}
                  disabled={isEquipped}
                  className={`w-full py-2.5 px-4 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isEquipped
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md active:scale-95'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isEquipped ? '✓ Als aktive Katze ausgerüstet!' : 'Direkt als aktive Katze ausrüsten'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-black rounded-xl text-white shadow-lg shadow-pink-500/25 transition-all text-xs"
              >
                Super! Weiter sammeln
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
