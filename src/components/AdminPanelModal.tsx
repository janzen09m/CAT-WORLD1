import React, { useState, useEffect } from 'react';
import { PlayerData, Theme } from '../types/game';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import {
  X,
  Crown,
  Users,
  Coins,
  Search,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminPlayerEntry {
  id: string;
  telegramUserId?: number;
  telegramUsername?: string;
  playerName: string;
  coins: number;
  keys: {
    wooden: number;
    blue: number;
    epic: number;
    legendary: number;
  };
  catsCount: number;
  loginStreak: number;
  createdAt: string;
}

interface AdminPanelModalProps {
  player: PlayerData;
  onClose: () => void;
  onCoinsUpdated: (updatedPlayer: PlayerData) => void;
  sessionToken?: string;
  theme?: Theme;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  player,
  onClose,
  onCoinsUpdated,
  sessionToken,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const [players, setPlayers] = useState<AdminPlayerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe admin API helper that prevents Safari/WebKit "string didn't match expected pattern" error
  const safeAdminFetch = async (url: string, body?: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-player-id': player.id || 'CW-TG-8979248747',
      'x-telegram-user-id': String(player.telegramUserId || 8979248747),
    };
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
      headers['x-session-token'] = sessionToken;
    }

    const payload = JSON.stringify({
      ...(body || {}),
      adminId: 8979248747,
      telegramUserId: player.telegramUserId || 8979248747,
      playerId: player.id || 'CW-TG-8979248747',
    });

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: payload,
    });

    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Server antwortete mit Code ${res.status}. Kein gültiges JSON.`);
    }

    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `Admin-Anfrage fehlgeschlagen (${res.status})`);
    }

    return data;
  };

  // Fetch admin players overview
  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await safeAdminFetch('/api/admin/overview');
      if (data.success && Array.isArray(data.players)) {
        setPlayers(data.players);
      } else {
        setStatusMsg({ text: data.error || 'Fehler beim Laden der Admin-Daten', type: 'error' });
      }
    } catch (err: any) {
      console.warn('Admin overview warning:', err);
      // Ensure the admin player is at least listed locally so UI is never stuck
      setPlayers(prev => {
        if (prev.length > 0) return prev;
        return [
          {
            id: player.id,
            telegramUserId: player.telegramUserId || 8979248747,
            telegramUsername: player.telegramUsername || 'Admin',
            playerName: player.playerName || 'Admin',
            coins: player.coins || 0,
            keys: player.keys || { wooden: 0, blue: 0, epic: 0, legendary: 0 },
            catsCount: Object.keys(player.ownedCats || {}).length,
            loginStreak: player.loginStreak || 1,
            createdAt: player.createdAt || new Date().toISOString(),
          },
        ];
      });
      setStatusMsg({ text: err.message || 'Verbindung zum Server fehlgeschlagen', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Grant coins
  const handleGrantCoins = async (targetPlayerId: string, amount: number) => {
    if (!amount || isNaN(amount)) return;
    soundManager.playClick();
    triggerHaptic('heavy');
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const data = await safeAdminFetch('/api/admin/grant-coins', {
        targetPlayerId,
        amount,
      });

      soundManager.playCoin();
      triggerHaptic('success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });

      setStatusMsg({
        text: data.message || `+${amount.toLocaleString('de-DE')} Münzen erfolgreich vergeben!`,
        type: 'success',
      });

      // Update local state if admin granted to themselves
      if (data.targetPlayer && (data.targetPlayer.id === player.id || targetPlayerId === player.id)) {
        onCoinsUpdated(data.targetPlayer);
      }

      // Refresh list
      fetchOverview();
    } catch (err: any) {
      soundManager.playError();
      setStatusMsg({ text: err.message || 'Fehler bei der Münzvergabe', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered players list
  const filteredPlayers = players.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.playerName && p.playerName.toLowerCase().includes(q)) ||
      (p.telegramUsername && p.telegramUsername.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.telegramUserId && String(p.telegramUserId).includes(q))
    );
  });

  const totalEconomyCoins = players.reduce((sum, p) => sum + (p.coins || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div
        className={`w-full max-w-xl rounded-3xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border max-h-[92vh] flex flex-col ${
          isLight
            ? 'bg-gradient-to-b from-white to-slate-50 border-amber-300 text-slate-800'
            : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/40 text-white'
        }`}
      >
        {/* Close Button */}
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

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/30 shrink-0 text-xl">
            👑
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Admin-Konsole
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold font-mono">
                ID: 8979248747
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Vollzugriff: Spielerübersicht & Münzverwaltung</p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className={`p-2 rounded-2xl border ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-amber-500" /> Spieler
            </div>
            <div className="font-black text-sm text-amber-500">{players.length}</div>
          </div>

          <div className={`p-2 rounded-2xl border ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
              <Coins className="w-3 h-3 text-amber-500" /> Münzen gesamt
            </div>
            <div className="font-black text-sm text-amber-500 font-mono">
              {totalEconomyCoins.toLocaleString('de-DE')}
            </div>
          </div>

          <div className={`p-2 rounded-2xl border ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Status
            </div>
            <div className="font-black text-xs text-emerald-400">Admin Aktiv</div>
          </div>
        </div>

        {/* Self Grant Card */}
        <div className={`p-3 rounded-2xl border mb-3 ${
          isLight ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-500 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Dir selbst Münzen geben:
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Aktuell: {player.coins.toLocaleString('de-DE')} 🪙
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1000, 10000, 50000, 250000].map(amt => (
              <button
                key={amt}
                onClick={() => handleGrantCoins(player.id, amt)}
                disabled={isSubmitting}
                className="py-1.5 px-1 rounded-xl text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs hover:brightness-105 active:scale-95 transition-all text-center"
              >
                +{amt.toLocaleString('de-DE')} 🪙
              </button>
            ))}
          </div>
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

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Spieler suchen (Name, @Username, ID)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              fetchOverview();
            }}
            disabled={isLoading}
            className={`p-2 rounded-xl border text-xs transition-colors shrink-0 ${
              isLight ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
            title="Aktualisieren"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Players List Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          {isLoading && players.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Lade Spieler...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Keine Spieler gefunden.</div>
          ) : (
            filteredPlayers.map(p => {
              const isSelf = p.id === player.id || p.telegramUserId === 8979248747;
              const customVal = customAmounts[p.id] || '';

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelf
                      ? isLight ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' : 'bg-amber-950/20 border-amber-500/40'
                      : isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelf
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-purple-600 text-white'
                      }`}>
                        {isSelf ? '👑' : p.playerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">{p.playerName}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-amber-400/20 text-amber-500 px-1 rounded font-black">
                              DU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {p.telegramUsername ? `@${p.telegramUsername}` : p.id}
                          {p.telegramUserId ? ` (TG ID: ${p.telegramUserId})` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-xs text-amber-500 font-mono">
                        {p.coins.toLocaleString('de-DE')} 🪙
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {p.catsCount} Katzen · {p.keys.wooden + p.keys.blue + p.keys.epic + p.keys.legendary} Keys
                      </div>
                    </div>
                  </div>

                  {/* Actions for this player */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/60">
                    <button
                      onClick={() => handleGrantCoins(p.id, 1000)}
                      disabled={isSubmitting}
                      className="py-1 px-2 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all"
                    >
                      +1.000
                    </button>
                    <button
                      onClick={() => handleGrantCoins(p.id, 10000)}
                      disabled={isSubmitting}
                      className="py-1 px-2 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all"
                    >
                      +10.000
                    </button>
                    <button
                      onClick={() => handleGrantCoins(p.id, 50000)}
                      disabled={isSubmitting}
                      className="py-1 px-2 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all"
                    >
                      +50.000
                    </button>

                    {/* Custom Amount Input */}
                    <div className="flex-1 flex items-center gap-1 min-w-[100px]">
                      <input
                        type="number"
                        placeholder="Menge..."
                        value={customVal}
                        onChange={e =>
                          setCustomAmounts({ ...customAmounts, [p.id]: e.target.value })
                        }
                        className={`w-full py-1 px-1.5 rounded-lg border text-[10px] font-mono outline-none ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const amt = parseInt(customVal, 10);
                          if (amt) {
                            handleGrantCoins(p.id, amt);
                            setCustomAmounts({ ...customAmounts, [p.id]: '' });
                          }
                        }}
                        disabled={isSubmitting || !customVal}
                        className="py-1 px-2 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 active:scale-95 transition-all disabled:opacity-40"
                      >
                        Senden
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
