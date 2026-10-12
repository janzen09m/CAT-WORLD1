import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { PlayerData, CatSkin, Rarity, KeyType, Theme } from '../../types/game';
import { CAT_SKINS, RARITY_CONFIG, getDuplicateCoinBonus } from '../../data/catsData';
import { KEY_EXCHANGE_RATES } from '../../data/chestsData';
import { CatIllustration } from '../CatIllustration';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ShoppingBag, Search, Sparkles, Coins, Key, Check, AlertCircle, Crown, ShoppingCart } from 'lucide-react';

interface ShopViewProps {
  player: PlayerData;
  onBuyCat: (catId: string) => Promise<{ skin: CatSkin; isDuplicate: boolean; duplicateCoinsGained?: number }>;
  onBuyKey: (keyType: KeyType, amount?: number) => Promise<void>;
  onOpenExchangeModal: () => void;
  theme?: Theme;
}

export const ShopView: React.FC<ShopViewProps> = ({
  player,
  onBuyCat,
  onBuyKey,
  onOpenExchangeModal,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'cats' | 'keys'>('cats');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatToBuy, setSelectedCatToBuy] = useState<CatSkin | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  // Filter purchasable cats
  const filteredCats = useMemo(() => {
    return CAT_SKINS.filter(cat => {
      if (selectedRarity !== 'all' && cat.rarity !== selectedRarity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!cat.name.toLowerCase().includes(q) && !cat.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedRarity, searchQuery]);

  const handlePurchaseCat = async (cat: CatSkin) => {
    if (player.coins < cat.price) {
      soundManager.playError();
      setErrorMsg('Not enough coins to purchase this cat!');
      return;
    }

    soundManager.playClick();
    triggerHaptic('heavy');
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await onBuyCat(cat.id);
      soundManager.playCoin();
      triggerHaptic('success');
      setPurchaseSuccess(
        res.isDuplicate
          ? `${cat.name} purchased! Duplicate bonus awarded: +${res.duplicateCoinsGained || getDuplicateCoinBonus(cat)} Coins! 🪙🎉`
          : `${cat.name} successfully unlocked! 🐱🎉`
      );

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSelectedCatToBuy(null);
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err.message || 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseKey = async (keyType: KeyType, amount: number = 1) => {
    const rate = KEY_EXCHANGE_RATES[keyType];
    const totalCost = rate.coinPrice * amount;

    if (player.coins < totalCost) {
      soundManager.playError();
      setErrorMsg(`Not enough coins for ${amount}x ${rate.name}!`);
      return;
    }

    soundManager.playClick();
    triggerHaptic('medium');
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      await onBuyKey(keyType, amount);
      soundManager.playCoin();
      triggerHaptic('success');
      setPurchaseSuccess(`Purchased ${amount}x ${rate.name} for ${totalCost.toLocaleString('en-US')} Coins! 🗝️`);

      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err.message || 'Key purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Header Banner */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-pink-50 border-amber-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 to-amber-950/60 border-amber-500/30 text-white'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Cat & Key Shop</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Spend your coins on exotic skins or stocking up on chest keys.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Your Coins</span>
            <span className="text-sm font-black text-amber-500 font-mono">
              {player.coins.toLocaleString('en-US')} 🪙
            </span>
          </div>
        </div>

        {/* Tab switch: Cats vs Keys */}
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl text-xs font-bold mt-2 ${
          isLight ? 'bg-white/80 border border-slate-200' : 'bg-slate-900/80'
        }`}>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('cats');
              setPurchaseSuccess(null);
            }}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'cats'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cat Skins
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('keys');
              setPurchaseSuccess(null);
            }}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'keys'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            Buy Keys with Coins
          </button>
        </div>
      </div>

      {/* Notifications */}
      {purchaseSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{purchaseSuccess}</span>
          </div>
          <button onClick={() => setPurchaseSuccess(null)} className="text-slate-400 hover:text-slate-700 text-xs">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* --- TAB 1: CATS CATALOG --- */}
      {activeTab === 'cats' && (
        <div className="space-y-3">
          {/* Search & Filter pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search skins in shop..."
                className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-pink-500 border transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px] font-bold">
              <button
                onClick={() => setSelectedRarity('all')}
                className={`px-3 py-1 rounded-full shrink-0 border transition-all ${
                  selectedRarity === 'all'
                    ? isLight
                      ? 'bg-slate-900 text-white border-slate-900 font-black'
                      : 'bg-white text-slate-900 border-white font-black'
                    : isLight
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                All
              </button>
              {(Object.keys(RARITY_CONFIG) as Rarity[]).map(r => {
                const meta = RARITY_CONFIG[r];
                const isSelected = selectedRarity === r;
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(r)}
                    className={`px-3 py-1 rounded-full shrink-0 border transition-all font-mono ${
                      isSelected
                        ? 'border-white text-white font-black shadow-sm'
                        : isLight
                        ? 'bg-white text-slate-600 border-slate-200'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                    style={{
                      backgroundColor: isSelected ? meta.color : undefined,
                      borderColor: isSelected ? meta.color : undefined,
                    }}
                  >
                    {meta.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skins Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredCats.map(cat => {
              const isOwned = !!player.ownedCats[cat.id];
              const rarityMeta = RARITY_CONFIG[cat.rarity];
              const canAfford = player.coins >= cat.price;
              const isPureGold = cat.specialTrait === 'pure-gold';

              return (
                <div
                  key={cat.id}
                  className={`rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg relative group border transition-all ${
                    isPureGold
                      ? 'border-amber-400 ring-2 ring-amber-400/50 bg-gradient-to-b from-amber-100/50 via-yellow-50 to-white'
                      : isLight
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPureGold && (
                    <span className="absolute -top-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[8px] uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 tracking-wider">
                      <Crown className="w-2.5 h-2.5" />
                      <span>Pure Solid Gold</span>
                    </span>
                  )}

                  {isOwned && (
                    <span className={`absolute top-2.5 right-2.5 border text-emerald-600 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-800 border-slate-700'
                    }`}>
                      Owned ({player.ownedCats[cat.id].count}x)
                    </span>
                  )}

                  <div className="py-2">
                    <CatIllustration cat={cat} size={90} />
                  </div>

                  <div className="w-full">
                    <h4 className={`font-bold text-xs truncate max-w-full ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      {cat.name}
                    </h4>
                    <span
                      className="text-[9px] font-black uppercase font-mono block mt-0.5"
                      style={{ color: rarityMeta.color }}
                    >
                      {rarityMeta.name}
                    </span>

                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      ★ {cat.collectorValue} Rating
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedCatToBuy(cat);
                      }}
                      className={`w-full mt-3 py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md active:scale-95'
                          : isLight
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-300" />
                      <span>{cat.price.toLocaleString('en-US')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: KEYS CATALOG & PURCHASE --- */}
      {activeTab === 'keys' && (
        <div className="space-y-3">
          <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/30 border-amber-700/50 text-amber-200'
          }`}>
            <span>Buy keys directly with coins to open chests anytime!</span>
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenExchangeModal();
              }}
              className="py-1 px-2.5 bg-amber-500 text-white font-bold rounded-xl text-[10px] shadow-xs shrink-0"
            >
              Bulk Shop
            </button>
          </div>

          <div className="space-y-2.5">
            {(Object.keys(KEY_EXCHANGE_RATES) as KeyType[]).map(kType => {
              const rate = KEY_EXCHANGE_RATES[kType];
              const owned = player.keys[kType] || 0;
              const canAffordSingle = player.coins >= rate.coinPrice;
              const canAffordFive = player.coins >= rate.coinPrice * 5;

              return (
                <div
                  key={kType}
                  className={`rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border transition-all ${
                    isLight
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl p-2.5 rounded-2xl border shrink-0 ${
                      isLight ? 'bg-amber-50 border-amber-200' : 'bg-slate-800/80 border-slate-700'
                    }`}>
                      🗝️
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-black text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{rate.name}</h3>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full font-bold">
                          Stock: {owned}x
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {rate.description}
                      </p>
                      <div className="text-xs font-mono font-black text-amber-500 mt-1">
                        {rate.coinPrice.toLocaleString('en-US')} Coins each
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handlePurchaseKey(kType, 1)}
                      disabled={!canAffordSingle || isProcessing}
                      className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                        canAffordSingle
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95'
                          : isLight
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3 h-3" />
                      <span>Buy 1x</span>
                    </button>

                    <button
                      onClick={() => handlePurchaseKey(kType, 5)}
                      disabled={!canAffordFive || isProcessing}
                      className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                        canAffordFive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md active:scale-95'
                          : isLight
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title={`Buy 5 keys for ${(rate.coinPrice * 5).toLocaleString('en-US')} Coins`}
                    >
                      <span>Buy 5x</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {selectedCatToBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-center space-y-4 border ${
            isLight
              ? 'bg-white border-amber-300 text-slate-800'
              : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/40 text-white'
          }`}>
            <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Purchase</h3>

            <div className="flex justify-center -my-2">
              <CatIllustration cat={selectedCatToBuy} size={130} />
            </div>

            <div>
              <div className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedCatToBuy.name}</div>
              <p className={`text-xs mt-1 italic ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                "{selectedCatToBuy.description}"
              </p>
            </div>

            <div className={`rounded-xl p-3 text-xs space-y-1.5 text-left border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400">Price:</span>
                <span className="font-mono font-bold text-amber-500">{selectedCatToBuy.price.toLocaleString('en-US')} Coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Balance after purchase:</span>
                <span className={`font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  {(player.coins - selectedCatToBuy.price).toLocaleString('en-US')} Coins
                </span>
              </div>
              {player.ownedCats[selectedCatToBuy.id] && (
                <div className="text-[10px] text-amber-600 pt-1 border-t border-slate-200 font-bold">
                  You already own this skin. As a duplicate you will receive +{getDuplicateCoinBonus(selectedCatToBuy)} Bonus Coins!
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setSelectedCatToBuy(null)}
                className={`py-2.5 rounded-xl font-bold text-xs ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchaseCat(selectedCatToBuy)}
                disabled={isProcessing}
                className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-black text-xs text-white shadow-md active:scale-95"
              >
                {isProcessing ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
