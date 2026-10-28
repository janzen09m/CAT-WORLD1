import React, { useState, useEffect } from 'react';
import { PlayerData, TradeListing, Theme, Rarity, CatSkin } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG, GET_CAT_BY_ID } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic, shareToTelegram, isTelegramWebApp } from '../utils/telegram';
import {
  X,
  Repeat,
  Coins,
  Sparkles,
  ShoppingBag,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Share2,
  Tag,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TradingMarketModalProps {
  player: PlayerData;
  onClose: () => void;
  onTradeSuccess: (updatedPlayer: PlayerData) => void;
  theme?: Theme;
}

export const TradingMarketModal: React.FC<TradingMarketModalProps> = ({
  player,
  onClose,
  onTradeSuccess,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'market' | 'trade-cat' | 'list'>('market');
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);
  const [selectedOfferCatId, setSelectedOfferCatId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current market listings
  const fetchListings = () => {
    setIsLoading(true);
    fetch('/api/market/listings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setListings(data.listings);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Buy with coins
  const handleBuyListing = async (listing: TradeListing) => {
    if (player.coins < listing.priceCoins) {
      soundManager.playError();
      triggerHaptic('error');
      setStatusMsg({ text: `Not enough coins! You need ${listing.priceCoins} Coins.`, type: 'error' });
      return;
    }

    soundManager.playClick();
    triggerHaptic('medium');
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': player.id,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to buy');
      }

      soundManager.playChestOpen();
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setStatusMsg({ text: `✓ Successfully adopted ${listing.cat.name}!`, type: 'success' });
      setListings(data.listings);
      onTradeSuccess(data.player);
      setSelectedListing(null);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error adopting cat', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trade cat-for-cat
  const handleExecuteTrade = async () => {
    if (!selectedListing || !selectedOfferCatId) return;

    soundManager.playClick();
    triggerHaptic('medium');
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/market/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': player.id,
        },
        body: JSON.stringify({
          listingId: selectedListing.id,
          offeredCatId: selectedOfferCatId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to trade');
      }

      soundManager.playWinFanfare();
      triggerHaptic('success');
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      setStatusMsg({
        text: `✓ Traded for ${selectedListing.cat.name}! Your trade is live on Telegram!`,
        type: 'success',
      });
      setListings(data.listings);
      onTradeSuccess(data.player);
      setSelectedListing(null);
      setSelectedOfferCatId('');
      setActiveTab('market');
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Trade failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Share trade request (Telegram or Web Share / Clipboard)
  const handleShareTrade = (cat: CatSkin) => {
    soundManager.playClick();
    triggerHaptic('light');
    const shareText = `🐾 Check out my Unique Cat for trade in CAT WORLD!\n⭐ ${cat.name} (Mint #${cat.mintNumber || 1})\n✨ Rarity: ${cat.rarity.toUpperCase()}\n🧸 Toy: ${cat.toy || 'none'}\nPlay & Trade with me here: ${window.location.href}`;
    if (isTelegramWebApp()) {
      shareToTelegram(shareText);
    } else if (navigator.share) {
      navigator.share({ title: 'CAT WORLD Trade', text: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText);
      setStatusMsg({ text: '✓ Trade details copied to clipboard!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  // Eligible cats the player can trade
  const tradeablePlayerCats = Object.keys(player.ownedCats)
    .filter(catId => catId !== player.activeCatId) // cannot trade active equipped cat
    .map(catId => {
      const info = player.ownedCats[catId];
      return (info.customSkin || GET_CAT_BY_ID(catId)) as CatSkin;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div
        className={`w-full max-w-md rounded-3xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border max-h-[92vh] flex flex-col ${
          isLight
            ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800'
            : 'bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/30 text-white'
        }`}
      >
        {/* Header Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${
            isLight ? 'bg-slate-100 text-slate-400 hover:text-slate-700' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20 shrink-0 text-lg">
            🔄
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Telegram Cat Trading Post
              </h3>
              <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded-full border border-purple-500/30 font-bold">
                P2P Market
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Trade 100% unique minted cats with other players!</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className={`rounded-xl p-1 grid grid-cols-2 gap-1 text-[11px] font-bold mb-3 border ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('market');
              setSelectedListing(null);
            }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'market'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : 'hover:text-slate-800'
            }`}
          >
            Browse Market ({listings.length})
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('trade-cat');
            }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'trade-cat'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : 'hover:text-slate-800'
            }`}
          >
            My Cats to Trade ({tradeablePlayerCats.length})
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center justify-between mb-3 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {/* TAB 1: BROWSE MARKET */}
          {activeTab === 'market' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading Telegram market listings...</div>
              ) : listings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No cats currently listed. Check back soon!</div>
              ) : (
                listings.map(item => {
                  const cat = item.cat;
                  const rarityMeta = RARITY_CONFIG[cat.rarity];
                  const canAfford = player.coins >= item.priceCoins;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">Seller:</span>
                          <span className="text-[11px] font-bold text-sky-400">@{item.sellerTelegram || item.sellerName}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Mint #{cat.mintNumber || 1000}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <CatIllustration cat={cat} size={88} isAnimated={false} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`font-black text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {cat.name}
                          </h4>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="text-[9px] font-black uppercase font-mono px-1.5 py-0.2 rounded"
                              style={{ color: rarityMeta.color, backgroundColor: `${rarityMeta.color}15` }}
                            >
                              {rarityMeta.name}
                            </span>
                            <span className="text-[10px] text-amber-500 font-mono">★ {cat.collectorValue}</span>
                          </div>

                          {/* Unique Traits Tags */}
                          <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-mono">
                            {cat.renderStyle === '3d-volumetric' && (
                              <span className="text-purple-400">🔮 3D Volumetric</span>
                            )}
                            {cat.renderStyle === 'fluffy-legendary' && (
                              <span className="text-pink-400">✨ Fluffy Fur</span>
                            )}
                            {cat.toy && cat.toy !== 'none' && (
                              <span className="text-emerald-400">🧸 Toy: {cat.toy.replace('-', ' ')}</span>
                            )}
                            {cat.backgroundType && cat.backgroundType !== 'none' && (
                              <span className="text-indigo-400">🌌 {cat.backgroundType.replace('-', ' ')}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <button
                              onClick={() => handleBuyListing(item)}
                              disabled={!canAfford || isSubmitting}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all active:scale-95 ${
                                canAfford
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Coins className="w-3 h-3 text-amber-200" />
                              <span>{item.priceCoins.toLocaleString('en-US')}</span>
                            </button>

                            <button
                              onClick={() => {
                                soundManager.playClick();
                                triggerHaptic('light');
                                setSelectedListing(item);
                                setActiveTab('trade-cat');
                              }}
                              className="py-1.5 px-2.5 rounded-xl text-[11px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Trade</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: TRADE A CAT (SWAP) */}
          {activeTab === 'trade-cat' && (
            <div className="space-y-3">
              {selectedListing ? (
                <div className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-purple-50/80 border-purple-200' : 'bg-purple-950/30 border-purple-800/50'
                }`}>
                  <div className="text-[11px] font-bold text-purple-400 mb-1">Target Cat to Receive:</div>
                  <div className="flex items-center gap-2">
                    <CatIllustration cat={selectedListing.cat} size={50} isAnimated={false} />
                    <div className="min-w-0">
                      <div className="font-black text-xs truncate">{selectedListing.cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Mint #{selectedListing.cat.mintNumber || 1000} · {selectedListing.cat.rarity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic text-center p-2">
                  Select a cat from the market above to initiate a Cat-for-Cat swap!
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400">Choose one of your cats to offer in trade:</div>

                {tradeablePlayerCats.length === 0 ? (
                  <div className="p-4 rounded-2xl border text-center text-xs text-slate-400 border-slate-800">
                    You only have your active cat. Open a chest or buy a cat to get more tradeable cats!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto no-scrollbar">
                    {tradeablePlayerCats.map(myCat => {
                      const isSelected = selectedOfferCatId === myCat.id;
                      return (
                        <div
                          key={myCat.id}
                          onClick={() => {
                            soundManager.playClick();
                            triggerHaptic('selection');
                            setSelectedOfferCatId(myCat.id);
                          }}
                          className={`p-2 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/50'
                              : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <CatIllustration cat={myCat as CatSkin} size={64} isAnimated={false} />
                          <div className="text-[11px] font-bold truncate max-w-full mt-1">{myCat.name}</div>
                          <div className="text-[9px] font-mono text-purple-400">Mint #{myCat.mintNumber || 1}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedListing && selectedOfferCatId && (
                <button
                  onClick={handleExecuteTrade}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Swapping Cats...' : 'Confirm Cat Swap Trade'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
