import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerData, KeyType, Theme } from '../../types/game';
import { KEY_EXCHANGE_RATES } from '../../data/chestsData';
import { TELEGRAM_STARS_BUNDLES, StarsBundle } from '../../data/starsBundles';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ShoppingBag, Key, Check, AlertCircle, Sparkles, Coins, Zap, ShieldCheck } from 'lucide-react';

interface ShopViewProps {
  player: PlayerData;
  onBuyCoinsWithStars: (bundleId: string) => Promise<any>;
  onBuyKey: (keyType: KeyType, amount?: number) => Promise<void>;
  onOpenExchangeModal?: () => void;
  onNavigateToChests?: () => void;
  theme?: Theme;
}

export const ShopView: React.FC<ShopViewProps> = ({
  player,
  onBuyCoinsWithStars,
  onBuyKey,
  onNavigateToChests,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'stars' | 'keys'>('stars');
  const [selectedBundle, setSelectedBundle] = useState<StarsBundle | null>(null);
  const [keyQuantities, setKeyQuantities] = useState<Record<KeyType, number>>({
    wooden: 1,
    blue: 1,
    epic: 1,
    legendary: 1,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  const handlePurchaseStarsBundle = async (bundle: StarsBundle) => {
    soundManager.playClick();
    triggerHaptic('heavy');
    setIsProcessing(true);
    setErrorMsg(null);
    setPurchaseSuccess(null);

    try {
      await onBuyCoinsWithStars(bundle.id);
      soundManager.playCoin();
      triggerHaptic('success');
      setPurchaseSuccess(`Erfolg! +${bundle.coins.toLocaleString('de-DE')} Münzen für ${bundle.stars} ⭐ erhalten! 🎉`);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
      setSelectedBundle(null);
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err?.message || 'Zahlung abgebrochen oder fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseKey = async (keyType: KeyType) => {
    const amount = keyQuantities[keyType] || 1;
    const rate = KEY_EXCHANGE_RATES[keyType];
    const totalCost = rate.coinPrice * amount;

    if (player.coins < totalCost) {
      soundManager.playError();
      setErrorMsg(`Nicht genügend Münzen für ${amount}x ${rate.name}! Du hast ${player.coins.toLocaleString('de-DE')} 🪙, benötigst aber ${totalCost.toLocaleString('de-DE')} 🪙.`);
      return;
    }

    soundManager.playClick();
    triggerHaptic('medium');
    setIsProcessing(true);
    setErrorMsg(null);
    setPurchaseSuccess(null);

    try {
      await onBuyKey(keyType, amount);
      soundManager.playCoin();
      triggerHaptic('success');
      setPurchaseSuccess(`${amount}x ${rate.name} für ${totalCost.toLocaleString('de-DE')} Münzen gekauft! 🗝️`);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err.message || 'Schlüsselkauf fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const keyList: KeyType[] = ['wooden', 'blue', 'epic', 'legendary'];

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Shop Header Banner */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-amber-500/30 text-white'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-2xl ${isLight ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-amber-500/20 text-amber-400'}`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>CatWorld Shop</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Telegram Stars & Kistenschlüssel
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Dein Guthaben</span>
            <span className="text-sm font-black text-amber-500 font-mono">
              {player.coins.toLocaleString('de-DE')} 🪙
            </span>
          </div>
        </div>

        {/* Tab-Wechsel: Stars Münzen-Shop vs Schlüssel */}
        <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl text-xs font-bold ${
          isLight ? 'bg-white/80 border border-slate-200' : 'bg-slate-900/80 border border-slate-800'
        }`}>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('stars');
              setPurchaseSuccess(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'stars'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-md font-black'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⭐</span>
            <span>Münzen (Telegram Stars)</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('keys');
              setPurchaseSuccess(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'keys'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-black'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Schlüssel kaufen</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {purchaseSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{purchaseSuccess}</span>
          </div>
          <button onClick={() => setPurchaseSuccess(null)} className="text-slate-400 hover:text-slate-700 text-xs px-1">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3.5 text-xs text-rose-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs px-1">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: TELEGRAM STARS COINS SHOP */}
      {activeTab === 'stars' && (
        <div className="space-y-3">
          {/* Info Banner */}
          <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
            isLight
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
          }`}>
            <div className="text-2xl shrink-0">⭐</div>
            <div className="flex-1">
              <p className="font-bold">Offizieller Telegram Stars (XTR) Shop</p>
              <p className={`text-[11px] ${isLight ? 'text-amber-800' : 'text-amber-400/90'}`}>
                Katzen können nicht direkt gekauft werden, sondern werden aus Kisten gezogen. Hole dir Münzen mit Stars für Schlüssel & Truhen!
              </p>
            </div>
          </div>

          {/* Stars Bundles Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {TELEGRAM_STARS_BUNDLES.map(bundle => {
              const isPopular = bundle.popular;
              const isBest = bundle.bestValue;

              return (
                <div
                  key={bundle.id}
                  className={`relative p-3.5 rounded-2xl border transition-all duration-200 ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 hover:shadow-md'
                  } ${isBest ? 'ring-2 ring-amber-400/60' : ''}`}
                >
                  {/* Badge */}
                  {bundle.badge && (
                    <span className={`absolute -top-2.5 right-4 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${
                      isBest
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : isPopular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {bundle.badge}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    {/* Icon & Details */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${
                        isLight ? 'bg-amber-50 border border-amber-100' : 'bg-slate-800 border border-slate-700'
                      }`}>
                        {bundle.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {bundle.coins.toLocaleString('de-DE')}
                          </span>
                          <span className="text-amber-500 font-bold text-xs">🪙 Münzen</span>
                        </div>
                        <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {bundle.title}
                        </h4>
                        {bundle.bonusText && (
                          <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {bundle.bonusText}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      onClick={() => handlePurchaseStarsBundle(bundle)}
                      disabled={isProcessing}
                      className={`shrink-0 px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                        isBest
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white hover:brightness-105'
                          : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 hover:brightness-105'
                      }`}
                    >
                      <span className="text-sm">⭐</span>
                      <span>{bundle.stars} Stars</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sichere Telegram Stars Transaktionen • Sofortige Gutschrift</span>
          </div>
        </div>
      )}

      {/* TAB 2: KEYS SHOP */}
      {activeTab === 'keys' && (
        <div className="space-y-3">
          <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
            isLight ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-blue-950/30 border-blue-500/20 text-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Verwende deine gesammelten Münzen, um Kistenschlüssel zu kaufen!</span>
            </div>
            {onNavigateToChests && (
              <button
                onClick={onNavigateToChests}
                className="font-bold underline shrink-0 hover:text-blue-600"
              >
                Zu den Kisten
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {keyList.map(keyType => {
              const rate = KEY_EXCHANGE_RATES[keyType];
              const qty = keyQuantities[keyType] || 1;
              const totalCost = rate.coinPrice * qty;
              const canAfford = player.coins >= totalCost;
              const currentOwned = player.keys[keyType] || 0;

              return (
                <div
                  key={keyType}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLight
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: rate.color }}
                      >
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {rate.name}
                        </h4>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Im Inventar: <strong className="text-amber-500">{currentOwned}x</strong> vorhanden
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-500">
                        {rate.coinPrice.toLocaleString('de-DE')} 🪙
                      </div>
                      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        pro Schlüssel
                      </span>
                    </div>
                  </div>

                  <p className={`text-[11px] mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {rate.description}
                  </p>

                  {/* Quantity selector & Buy Button */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Menge:</span>
                      {[1, 3, 5, 10].map(n => (
                        <button
                          key={n}
                          onClick={() => {
                            soundManager.playClick();
                            setKeyQuantities(prev => ({ ...prev, [keyType]: n }));
                          }}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                            qty === n
                              ? 'bg-blue-600 text-white shadow-xs'
                              : isLight
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePurchaseKey(keyType)}
                      disabled={!canAfford || isProcessing}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                        canAfford
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-105 active:scale-95 cursor-pointer'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{qty}x kaufen ({totalCost.toLocaleString('de-DE')} 🪙)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
