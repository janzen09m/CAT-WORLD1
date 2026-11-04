import React, { useState, useEffect } from 'react';
import { PlayerData, TradeListing, Theme, CatSkin } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { RARITY_CONFIG, GET_CAT_BY_ID } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic, shareToTelegram, isTelegramWebApp } from '../utils/telegram';
import {
  X,
  Coins,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Tag,
  PlusCircle,
  Bell,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TradingMarketModalProps {
  player: PlayerData;
  onClose: () => void;
  onTradeSuccess: (updatedPlayer: PlayerData) => void;
  sessionToken?: string;
  theme?: Theme;
}

export const TradingMarketModal: React.FC<TradingMarketModalProps> = ({
  player,
  onClose,
  onTradeSuccess,
  sessionToken,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'market' | 'list-cat' | 'trade-cat'>('market');
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);
  const [selectedOfferCatId, setSelectedOfferCatId] = useState<string>('');
  
  // Listing form state
  const [catToListId, setCatToListId] = useState<string>('');
  const [listPrice, setListPrice] = useState<string>('2500');

  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe market fetch helper to prevent Safari/WebKit pattern error
  const safeMarketApiCall = async (url: string, body?: any) => {
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

    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
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
          : data?.error || `Anfrage fehlgeschlagen (${res.status})`;
      throw new Error(errMsg);
    }

    return data;
  };

  // Fetch current market listings
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const data = await safeMarketApiCall('/api/market/listings');
      if (data && Array.isArray(data.listings)) {
        setListings(data.listings);
      }
    } catch (e) {
      console.warn('Failed to fetch market listings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Buy a listing with coins
  const handleBuyListing = async (listing: TradeListing) => {
    if (listing.sellerPlayerId === player.id) {
      soundManager.playError();
      setStatusMsg({ text: 'Du kannst dein eigenes Angebot nicht kaufen!', type: 'error' });
      return;
    }

    if (player.coins < listing.priceCoins) {
      soundManager.playError();
      triggerHaptic('error');
      setStatusMsg({
        text: `Nicht genügend Münzen! Du hast ${player.coins.toLocaleString('de-DE')} 🪙, benötigst aber ${listing.priceCoins.toLocaleString('de-DE')} 🪙.`,
        type: 'error',
      });
      return;
    }

    soundManager.playClick();
    triggerHaptic('medium');
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const data = await safeMarketApiCall('/api/market/buy', { listingId: listing.id });

      soundManager.playChestOpen();
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setStatusMsg({
        text: `✓ Glückwunsch! ${listing.cat.name} gehört jetzt dir. Verkäufer wurde im Bot benachrichtigt! 📬`,
        type: 'success',
      });
      setListings(data.listings);
      onTradeSuccess(data.player);
      setSelectedListing(null);
    } catch (err: any) {
      const errMsg = typeof err?.message === 'string' ? err.message : 'Fehler beim Kauf der Katze';
      setStatusMsg({ text: errMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Put a cat on the marketplace
  const handleListCat = async () => {
    if (!catToListId) {
      soundManager.playError();
      setStatusMsg({ text: 'Bitte wähle zuerst eine Katze zum Anbieten aus!', type: 'error' });
      return;
    }

    const price = parseInt(listPrice, 10);
    if (!price || price < 50) {
      soundManager.playError();
      setStatusMsg({ text: 'Mindestpreis auf dem Markt beträgt 50 Münzen.', type: 'error' });
      return;
    }

    soundManager.playClick();
    triggerHaptic('heavy');
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const data = await safeMarketApiCall('/api/market/list', {
        catId: catToListId,
        priceCoins: price,
      });

      soundManager.playCoin();
      triggerHaptic('success');
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.5 } });

      setStatusMsg({
        text: `✓ Katze erfolgreich für ${price.toLocaleString('de-DE')} Münzen angeboten! Du wirst im Bot benachrichtigt, sobald jemand kauft. 📬`,
        type: 'success',
      });

      setListings(data.listings);
      onTradeSuccess(data.player);
      setCatToListId('');
      setActiveTab('market');
    } catch (err: any) {
      const errMsg = typeof err?.message === 'string' ? err.message : 'Fehler beim Anbieten';
      setStatusMsg({ text: errMsg, type: 'error' });
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
      const data = await safeMarketApiCall('/api/market/trade', {
        listingId: selectedListing.id,
        offeredCatId: selectedOfferCatId,
      });

      soundManager.playWinFanfare();
      triggerHaptic('success');
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      setStatusMsg({
        text: `✓ Tausch für ${selectedListing.cat.name} erfolgreich! Der Tauschpartner wurde im Bot benachrichtigt. 📬`,
        type: 'success',
      });
      setListings(data.listings);
      onTradeSuccess(data.player);
      setSelectedListing(null);
      setSelectedOfferCatId('');
      setActiveTab('market');
    } catch (err: any) {
      const errMsg = typeof err?.message === 'string' ? err.message : 'Tausch fehlgeschlagen';
      setStatusMsg({ text: errMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eligible cats the player can trade or list (cannot be active equipped cat)
  const tradeablePlayerCats = Object.keys(player.ownedCats || {})
    .filter(catId => catId !== player.activeCatId)
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
                Katzen-Marktplatz
              </h3>
              <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded-full border border-purple-500/30 font-bold font-mono">
                P2P Handel
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Tausche & verkaufe einzigartige Katzen mit echten Spielern!</p>
          </div>
        </div>

        {/* Telegram Bot Notification Banner */}
        <div className={`p-2 rounded-xl text-[10px] flex items-center gap-2 mb-3 border ${
          isLight ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-sky-950/40 border-sky-800/60 text-sky-300'
        }`}>
          <Bell className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>
            <b>Live Telegram-Benachrichtigung:</b> Wenn jemand deine Katze kauft oder tauscht, sendet dir der Bot sofort eine Nachricht!
          </span>
        </div>

        {/* Sub-Tabs */}
        <div className={`rounded-xl p-1 grid grid-cols-3 gap-1 text-[11px] font-bold mb-3 border ${
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
            Markt ({listings.length})
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('list-cat');
            }}
            className={`py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'list-cat'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : 'hover:text-slate-800'
            }`}
          >
            Anbieten 🏷️
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
            Tauschen 🔄
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
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {/* TAB 1: BROWSE MARKET */}
          {activeTab === 'market' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">Verfügbare Katzen im Markt:</span>
                <button
                  onClick={fetchListings}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Aktualisieren
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Lade Marktplatz-Angebote...</div>
              ) : listings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Aktuell keine Katzen im Markt. Biete als Erster eine an!
                </div>
              ) : (
                listings.map(item => {
                  const cat = item.cat;
                  const rarityMeta = RARITY_CONFIG[cat.rarity];
                  const isOwnListing = item.sellerPlayerId === player.id;
                  const canAfford = player.coins >= item.priceCoins;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isOwnListing
                          ? isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-950/20 border-amber-500/40'
                          : isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">Verkäufer:</span>
                          <span className="text-[11px] font-bold text-sky-400">
                            {item.sellerTelegram ? `@${item.sellerTelegram}` : item.sellerName}
                            {isOwnListing && ' (Du)'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Mint #{cat.mintNumber || 1000}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <CatIllustration cat={cat} size={80} isAnimated={false} />
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

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            {!isOwnListing ? (
                              <>
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
                                  <span>{item.priceCoins.toLocaleString('de-DE')} Münzen</span>
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
                                  <span>Tauschen</span>
                                </button>
                              </>
                            ) : (
                              <div className="text-[10px] text-amber-500 font-bold italic py-1">
                                Dein aktives Marktangebot ({item.priceCoins.toLocaleString('de-DE')} 🪙)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: LIST A CAT ON THE MARKET */}
          {activeTab === 'list-cat' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl border text-xs bg-purple-500/10 border-purple-500/30">
                <div className="font-bold text-purple-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Katze für Münzen verkaufen
                </div>
                <div className="text-[11px] text-slate-400">
                  Wähle eine deiner Katzen und bestimme den Preis. Wenn ein anderer Spieler sie kauft, erhältst du die Münzen gutgeschrieben und der Telegram-Bot benachrichtigt dich!
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  1. Wähle eine Katze aus deiner Sammlung:
                </label>

                {tradeablePlayerCats.length === 0 ? (
                  <div className="p-4 rounded-2xl border text-center text-xs text-slate-400 border-slate-800">
                    Du hast aktuell nur deine ausgerüstete Katze. Öffne Kisten, um weitere Katzen zu erhalten!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {tradeablePlayerCats.map(myCat => {
                      const isSelected = catToListId === myCat.id;
                      return (
                        <div
                          key={myCat.id}
                          onClick={() => {
                            soundManager.playClick();
                            triggerHaptic('selection');
                            setCatToListId(myCat.id);
                          }}
                          className={`p-2 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/50'
                              : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <CatIllustration cat={myCat} size={60} isAnimated={false} />
                          <div className="text-[11px] font-bold truncate max-w-full mt-1">{myCat.name}</div>
                          <div className="text-[9px] font-mono text-purple-400">Mint #{myCat.mintNumber || 1}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {catToListId && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    2. Festpreis in Münzen (🪙):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="50"
                      step="100"
                      value={listPrice}
                      onChange={e => setListPrice(e.target.value)}
                      placeholder="z.B. 2500"
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono outline-none ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                    <div className="flex gap-1">
                      {[1000, 2500, 5000].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setListPrice(String(p))}
                          className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700"
                        >
                          {p.toLocaleString('de-DE')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleListCat}
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-purple-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isSubmitting ? 'Wird eingestellt...' : 'Jetzt im Markt anbieten'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRADE A CAT (SWAP) */}
          {activeTab === 'trade-cat' && (
            <div className="space-y-3">
              {selectedListing ? (
                <div className={`p-3 rounded-2xl border ${
                  isLight ? 'bg-purple-50/80 border-purple-200' : 'bg-purple-950/30 border-purple-800/50'
                }`}>
                  <div className="text-[11px] font-bold text-purple-400 mb-1">Ausgewählte Ziel-Katze:</div>
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
                  Wähle zuerst im Reiter „Markt“ ein Angebot aus, um einen direkten Tausch zu starten!
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400">Deine Katze, die du zum Tausch anbietest:</div>

                {tradeablePlayerCats.length === 0 ? (
                  <div className="p-4 rounded-2xl border text-center text-xs text-slate-400 border-slate-800">
                    Du hast aktuell nur deine ausgerüstete Katze. Öffne Kisten, um weitere Katzen zu erhalten!
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
                          <CatIllustration cat={myCat} size={64} isAnimated={false} />
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
                  <span>{isSubmitting ? 'Tausche Katzen...' : 'Tausch jetzt bestätigen'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
