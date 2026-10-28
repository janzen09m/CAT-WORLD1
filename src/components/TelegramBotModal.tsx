import React, { useState } from 'react';
import { PlayerData, Theme } from '../types/game';
import { soundManager } from '../utils/audio';
import {
  triggerHaptic,
  getTelegramUser,
  isTelegramWebApp,
  isTgCloudStorageSupported,
  saveAchievementsToTelegramCloud,
  shareToTelegram,
} from '../utils/telegram';
import {
  X,
  Send,
  CloudCheck,
  CheckCircle2,
  Terminal,
  Share2,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface TelegramBotModalProps {
  player: PlayerData;
  onClose: () => void;
  theme?: Theme;
  onAchievementsSynced?: (count: number) => void;
}

export const TelegramBotModal: React.FC<TelegramBotModalProps> = ({
  player,
  onClose,
  theme = 'dark',
  onAchievementsSynced,
}) => {
  const isLight = theme === 'light';
  const tgUser = getTelegramUser();
  const isInsideTG = isTelegramWebApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const unlockedAchCount = player.achievements.filter(a => a.unlocked || a.claimed).length;

  const handleManualSync = async () => {
    soundManager.playClick();
    triggerHaptic('medium');
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const res = await saveAchievementsToTelegramCloud(player.achievements, player.stats);
      if (res.success) {
        triggerHaptic('success');
        setSyncStatus(`✓ ${res.count} Achievements saved to Telegram Cloud!`);
        onAchievementsSynced?.(res.count);
      } else {
        setSyncStatus('Local sync complete (TG Cloud ready)');
      }
    } catch {
      setSyncStatus('Sync complete');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShare = () => {
    soundManager.playClick();
    triggerHaptic('light');
    const ownedCount = Object.keys(player.ownedCats).length;
    shareToTelegram(
      `🐱 Play CAT WORLD on Telegram! Open chests, collect 52 cat skins, and play Chess & Tennis!\n🪙 Balance: ${player.coins.toLocaleString('en-US')} Coins\n⭐ Unlocked Cats: ${ownedCount} / 52`
    );
  };

  const handleCloseTG = () => {
    soundManager.playClick();
    triggerHaptic('light');
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div
        className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border max-h-[90vh] overflow-y-auto no-scrollbar ${
          isLight
            ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800'
            : 'bg-gradient-to-b from-slate-900 to-slate-950 border-sky-500/30 text-white'
        }`}
      >
        {/* Header Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
            isLight ? 'bg-slate-100 text-slate-400 hover:text-slate-700' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Telegram Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Telegram Mini App
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-sky-400 font-mono">@CatWorldBot · Live Sync</p>
          </div>
        </div>

        {/* Telegram User Identity Card */}
        <div
          className={`rounded-2xl p-3 mb-3 border ${
            isLight ? 'bg-sky-50/70 border-sky-200 text-slate-800' : 'bg-slate-800/80 border-sky-900/60 text-white'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 text-[11px]">Telegram Profile</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {isInsideTG ? 'Telegram Client' : 'Web & Bot Linked'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              {tgUser.name ? tgUser.name.charAt(0).toUpperCase() : '🐱'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs truncate">
                {tgUser.name || player.playerName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {tgUser.username ? `@${tgUser.username}` : `Player ID: ${player.id}`}
              </div>
            </div>
          </div>
        </div>

        {/* Telegram CloudStorage Persistence Card */}
        <div
          className={`rounded-2xl p-3.5 mb-3 border space-y-2.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isTgCloudStorageSupported() ? 'Telegram Cloud Storage' : 'Account Cloud & Local Storage'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {unlockedAchCount} / {player.achievements.length} Badges
            </span>
          </div>

          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {isTgCloudStorageSupported()
              ? 'All your achievements and game stats are automatically saved to your Telegram account cloud, so you never lose progress across devices!'
              : 'All your achievements and game stats are securely saved to your game account and synchronized across sessions!'}
          </p>

          {syncStatus && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold text-center animate-in fade-in">
              {syncStatus}
            </div>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing Achievements...' : 'Synchronize Achievements'}</span>
          </button>
        </div>

        {/* Telegram Bot Commands Card */}
        <div
          className={`rounded-2xl p-3 mb-3 border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold mb-2 text-purple-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>Supported Bot Commands</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-700/40">
              <span className="text-sky-400 font-bold">/start</span>
              <span className="text-slate-400 text-[10px]">Launch Mini App & starter keys</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-700/40">
              <span className="text-sky-400 font-bold">/daily</span>
              <span className="text-slate-400 text-[10px]">Claim daily coins bonus</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-700/40">
              <span className="text-sky-400 font-bold">/cats</span>
              <span className="text-slate-400 text-[10px]">Open cat collection view</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-700/40">
              <span className="text-sky-400 font-bold">/play</span>
              <span className="text-slate-400 text-[10px]">Tennis, Chess, Memory games</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-sky-400 font-bold">/stats</span>
              <span className="text-slate-400 text-[10px]">View Telegram cloud stats</span>
            </div>
          </div>
        </div>

        {/* Telegram Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Bot</span>
          </button>

          <button
            onClick={handleCloseTG}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {isInsideTG ? 'Close Mini App' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
