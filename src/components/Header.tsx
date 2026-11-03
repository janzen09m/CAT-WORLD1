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
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  onOpenExchangeModal,
  collectorValue,
  theme,
  onToggleTheme,
  onOpenTelegramBotModal,
  onOpenProfile,
  isAdmin,
  onOpenAdminPanel,
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
    <header className={`sticky top-0 z-40 px-3 pb-2.5 border-b select-none backdrop-blur-md transition-all duration-200 ${
      // Ample top padding in Telegram so native 'X Close' & '...' menu buttons never overlap
      isInsideTelegram ? 'pt-14' : 'pt-3'
    } ${
      isLight
        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
        : 'bg-slate-900/90 border-slate-800 text-white shadow-sm'
    }`}>
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
          className="flex items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
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

        {/* Right: Coins, Keys & Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Admin Crown Button (Exclusive for Telegram ID 8979248747) */}
          {isAdmin && (
            <button
              onClick={() => {
                soundManager.playClick();
                triggerHaptic('medium');
                onOpenAdminPanel?.();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-300 hover:brightness-105 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Admin-Konsole öffnen (ID: 8979248747)"
            >
              <span>👑</span>
              <span className="text-[10px] uppercase font-black tracking-wider">Admin</span>
            </button>
          )}

          {/* Coins Balance */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
            isLight
              ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{player.coins.toLocaleString('de-DE')}</span>
          </div>

          {/* Keys Dropdown / Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowKeysDropdown(!showKeysDropdown);
                soundManager.playClick();
                triggerHaptic('light');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
              }`}
              title="Schlüssel-Inventar"
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
                  <span className="text-xs font-bold">Kistenschlüssel</span>
                  <button
                    onClick={() => {
                      setShowKeysDropdown(false);
                      onOpenExchangeModal();
                    }}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Shop</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      <span>🪵</span> Holzschlüssel:
                    </span>
                    <span className="font-bold">{player.keys.wooden || 0}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span>💎</span> Saphirschlüssel:
                    </span>
                    <span className="font-bold">{player.keys.blue || 0}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <span>🔮</span> Epischer Schlüssel:
                    </span>
                    <span className="font-bold">{player.keys.epic || 0}x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-bold">
                      <span>👑</span> Legendärer Schlüssel:
                    </span>
                    <span className="font-bold text-amber-500">{player.keys.legendary || 0}x</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowKeysDropdown(false);
                    onOpenExchangeModal();
                  }}
                  className="w-full mt-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[11px] shadow-sm hover:brightness-105 active:scale-95 transition-all text-center block"
                >
                  Schlüssel mit Münzen kaufen
                </button>
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            title={muted ? 'Ton einschalten' : 'Ton stummschalten'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              triggerHaptic('light');
              onToggleTheme();
            }}
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                : 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/60'
            }`}
            title={isLight ? 'Dunkle Ansicht' : 'Helle Ansicht'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
