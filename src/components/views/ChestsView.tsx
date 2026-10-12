import React, { useState } from 'react';
import { PlayerData, ChestConfig, CatSkin, Theme } from '../../types/game';
import { CHESTS_CONFIG } from '../../data/chestsData';
import { ChestOpenModal } from '../ChestOpenModal';
import { soundManager } from '../../utils/audio';
import { Key, Sparkles, Clock, History, ShoppingCart } from 'lucide-react';

interface ChestsViewProps {
  player: PlayerData;
  onOpenChest: (chestId: ChestConfig['id'], useCoins: boolean) => Promise<{ droppedCat: CatSkin; isDuplicate: boolean; coinsAwarded?: number }>;
  onOpenExchangeModal: () => void;
  theme?: Theme;
}

export const ChestsView: React.FC<ChestsViewProps> = ({
  player,
  onOpenChest,
  onOpenExchangeModal,
  theme = 'light',
}) => {
  const [selectedChest, setSelectedChest] = useState<ChestConfig | null>(null);
  const isLight = theme === 'light';

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Header Banner */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 text-slate-800'
          : 'bg-gradient-to-r from-amber-950/60 to-purple-950/60 border-amber-500/30 text-white'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className={`text-base font-black flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Treasure Chests</span>
              <span className="text-xs text-amber-500">✨</span>
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Use your keys or coins to draw mythical and legendary cats!
            </p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenExchangeModal();
            }}
            className="text-[10px] font-bold text-amber-800 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1"
          >
            <ShoppingCart className="w-3 h-3 text-amber-600" />
            <span>Buy Keys</span>
          </button>
        </div>

        {/* Key Balance quick strip */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-[10px] font-mono">
          <div className={`p-1.5 rounded-xl border ${
            isLight ? 'bg-white border-amber-200 text-amber-900 shadow-xs' : 'bg-slate-900/60 border-amber-900/40 text-white'
          }`}>
            <span className="text-amber-600 block font-sans font-bold">Wood</span>
            <span className="font-bold">{player.keys.wooden || 0}x</span>
          </div>
          <div className={`p-1.5 rounded-xl border ${
            isLight ? 'bg-white border-blue-200 text-blue-900 shadow-xs' : 'bg-slate-900/60 border-blue-900/40 text-white'
          }`}>
            <span className="text-blue-500 block font-sans font-bold">Blue</span>
            <span className="font-bold">{player.keys.blue || 0}x</span>
          </div>
          <div className={`p-1.5 rounded-xl border ${
            isLight ? 'bg-white border-purple-200 text-purple-900 shadow-xs' : 'bg-slate-900/60 border-purple-900/40 text-white'
          }`}>
            <span className="text-purple-500 block font-sans font-bold">Epic</span>
            <span className="font-bold">{player.keys.epic || 0}x</span>
          </div>
          <div className={`p-1.5 rounded-xl border ${
            isLight ? 'bg-white border-amber-300 text-amber-900 shadow-xs' : 'bg-slate-900/60 border-amber-700/40 text-white'
          }`}>
            <span className="text-amber-500 block font-sans font-bold">Legendary</span>
            <span className="font-bold">{player.keys.legendary || 0}x</span>
          </div>
        </div>
      </div>

      {/* 2. Four Chest Cards */}
      <div className="space-y-3">
        {CHESTS_CONFIG.map(chest => {
          const keysCount = player.keys[chest.keyRequired] || 0;
          const hasKey = keysCount > 0;

          return (
            <div
              key={chest.id}
              className={`rounded-3xl p-4 flex items-center justify-between gap-3 shadow-lg border transition-all ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Chest Icon / Graphic */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner"
                style={{ backgroundColor: `${chest.color}20`, border: `1.5px solid ${chest.color}` }}
              >
                {chest.id === 'wooden' ? '🪵' : chest.id === 'blue' ? '💎' : chest.id === 'epic' ? '🔮' : '👑'}
              </div>

              {/* Chest Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className={`font-black text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{chest.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">({chest.subtitle})</span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {chest.description}
                </p>

                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                  <span className={`font-bold flex items-center gap-1 ${hasKey ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <Key className="w-3 h-3" />
                    <span>{keysCount} in Stock</span>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-amber-500 font-bold">
                    {chest.coinPrice.toLocaleString('en-US')} Coins
                  </span>
                </div>
              </div>

              {/* Open Trigger Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedChest(chest);
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-black rounded-xl text-white text-xs shadow-md shadow-pink-500/20 active:scale-95 shrink-0"
              >
                Open
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Opening History Log */}
      <div className={`rounded-3xl p-4 border transition-colors ${
        isLight
          ? 'bg-white border-slate-200'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 mb-3">
          <History className="w-4 h-4 text-purple-500" />
          <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Recent Chest Openings</h3>
        </div>

        {player.chestHistory.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic text-center py-2">
            No chests opened yet. Open your first treasure chest today!
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {player.chestHistory.slice(0, 8).map(entry => {
              const dateStr = new Date(entry.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">🎁</span>
                    <div className="min-w-0">
                      <div className={`font-bold truncate flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        <span>{entry.catName}</span>
                        {entry.isDuplicate && (
                          <span className="text-[9px] text-amber-600 font-bold">
                            (+{entry.coinsAwarded || 100} Coins)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono capitalize">
                        {entry.rarity} · {entry.chestId} Chest
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Chest Modal */}
      {selectedChest && (
        <ChestOpenModal
          chest={selectedChest}
          player={player}
          onClose={() => setSelectedChest(null)}
          onOpenConfirm={onOpenChest}
          theme={theme}
        />
      )}
    </div>
  );
};
