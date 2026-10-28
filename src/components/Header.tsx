import React, { useState } from 'react';
import { PlayerData, Theme } from '../types/game';
import { soundManager } from '../utils/audio';
import { triggerHaptic, isTelegramWebApp } from '../utils/telegram';
import { Volume2, VolumeX, Key, Coins, Sun, Moon, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  player: PlayerData;
  onOpenExchangeModal: () => void;
  collectorValue: number;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenTelegramBotModal?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  onOpenExchangeModal,
  collectorValue,
  theme,
  onToggleTheme,
  onOpenTelegramBotModal,
  onOpenProfile,
}) => {
  const [muted, setMuted] = useState(soundManager.getIsMuted());
  const [showKeysDropdown, setShowKeysDropdown] = useState(false);
  const isInsideTelegram = isTelegramWebApp();

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
  };

  const totalKeys =
    (player.keys.wooden || 0) +
    (player.keys.blue || 0) +
    (player.keys.epic || 0) +
    (player.keys.legendary || 0);

  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 z-40 px-3 py-2 border-b select-none backdrop-blur-md transition-colors duration-200 ${
      isLight
        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
        : 'bg-slate-900/90 border-slate-800 text-white shadow-sm'
    }`}>
      {/* Telegram Mini App Top Status Bar - ONLY shown when inside Telegram */}
      {isInsideTelegram && (
        <div className="max-w-md mx-auto flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/20 text-[10px]">
          <button
            onClick={() => {
              soundManager.playClick();
              triggerHaptic('light');
              onOpenTelegramBotModal?.();
            }}
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-bold transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">Telegram Mini App</span>
            <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded-full border border-sky-500/30">
              ✓ Bot
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              triggerHaptic('light');
              onOpenTelegramBotModal?.();
            }}
            className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 hover:bg-emerald-500/20 transition-all font-mono"
          >
            <span>⚡ TG Cloud Sync</span>
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: Player Mini Badge */}
        <button
          onClick={() => {
            soundManager.playClick();
            triggerHaptic('light');
            if (isInsideTelegram) {
              onOpenTelegramBotModal?.();
            } else {
              onOpenProfile?.();
            }
          }}
          className="flex items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-inner shrink-0">
            {player.telegramUsername ? player.telegramUsername.charAt(0).toUpperCase() : '🐱'}
          </div>
          <div className="min-w-0">
            <div className={`text-xs font-bold truncate flex items-center gap-1 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <span>{player.telegramUsername ? `@${player.telegramUsername}` : player.playerName}</span>
            </div>
            <div className="text-[10px] text-purple-400 flex items-center gap-1 font-mono">
              <span>★ {collectorValue} Pts</span>
            </div>
          </div>
        </button>

        {/* Right: Coins, Keys & Controls (NO Star Shards!) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Coins Balance */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{player.coins.toLocaleString('en-US')}</span>
          </div>

          {/* Keys Dropdown / Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowKeysDropdown(!showKeysDropdown);
                soundManager.playClick();
                triggerHaptic('light');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono border transition-colors ${
                isLight
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
              }`}
              title="Keys Inventory"
            >
              <Key className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{totalKeys}</span>
            </button>

            {/* Keys Drawer Popover */}
            {showKeysDropdown && (
              <div
                className={`absolute right-0 top-full mt-2 w-56 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                  isLight ? 'border-slate-100' : 'border-slate-700/60'
                }`}>
                  <span className="text-xs font-bold">Chest Keys</span>
                  <button
                    onClick={() => {
                      setShowKeysDropdown(false);
                      onOpenExchangeModal();
                    }}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5"
                  >
                    <span>+ Buy Keys</span>
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className={`flex items-center justify-between px-2 py-1 rounded ${
                    isLight ? 'bg-amber-50 text-amber-800' : 'bg-amber-950/30 text-amber-400'
                  }`}>
                    <span>Wooden Key:</span>
                    <span className="font-mono font-bold">{player.keys.wooden || 0}</span>
                  </div>
                  <div className={`flex items-center justify-between px-2 py-1 rounded ${
                    isLight ? 'bg-blue-50 text-blue-800' : 'bg-blue-950/30 text-blue-400'
                  }`}>
                    <span>Blue Key:</span>
                    <span className="font-mono font-bold">{player.keys.blue || 0}</span>
                  </div>
                  <div className={`flex items-center justify-between px-2 py-1 rounded ${
                    isLight ? 'bg-purple-50 text-purple-800' : 'bg-purple-950/30 text-purple-400'
                  }`}>
                    <span>Epic Key:</span>
                    <span className="font-mono font-bold">{player.keys.epic || 0}</span>
                  </div>
                  <div className={`flex items-center justify-between px-2 py-1 rounded ${
                    isLight ? 'bg-amber-100/60 text-amber-900' : 'bg-amber-900/30 text-amber-300'
                  }`}>
                    <span>Legendary Key:</span>
                    <span className="font-mono font-bold">{player.keys.legendary || 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowKeysDropdown(false);
                    onOpenExchangeModal();
                  }}
                  className="w-full mt-2.5 py-1.5 text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Coins className="w-3 h-3" />
                  <span>Buy Keys with Coins</span>
                </button>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              triggerHaptic('light');
              onToggleTheme();
            }}
            className={`p-1.5 rounded-full transition-colors shrink-0 ${
              isLight
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-full transition-colors shrink-0 ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
