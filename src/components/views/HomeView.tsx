import React from 'react';
import { PlayerData, CatSkin, DailyTask, Theme } from '../../types/game';
import { PetCatRoom } from '../PetCatRoom';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { Sparkles, Calendar, Check, ArrowRight, Play, Trophy, Gift } from 'lucide-react';
import { TabType } from '../BottomNav';

interface HomeViewProps {
  player: PlayerData;
  activeCat: CatSkin;
  collectorValue: number;
  onPetCat: () => Promise<void>;
  onChangeBackground: (bg: PlayerData['roomBackground']) => Promise<void>;
  onClaimDailyLogin: () => Promise<void>;
  onNavigateTab: (tab: TabType) => void;
  onOpenExchangeModal: () => void;
  theme?: Theme;
}

export const HomeView: React.FC<HomeViewProps> = ({
  player,
  activeCat,
  collectorValue,
  onPetCat,
  onChangeBackground,
  onClaimDailyLogin,
  onNavigateTab,
  onOpenExchangeModal,
  theme = 'dark',
}) => {
  const streak = player.loginStreak || 1;
  const isClaimedToday = player.dailyLoginClaimedToday;
  const isLight = theme === 'light';

  const handleClaimLogin = async () => {
    if (isClaimedToday) return;
    soundManager.playCoin();
    triggerHaptic('success');
    await onClaimDailyLogin();
  };

  const pendingTasksCount = player.dailyTasks.filter(t => !t.claimed && t.current >= t.goal).length;
  const totalKeys = (player.keys.wooden || 0) + (player.keys.blue || 0) + (player.keys.epic || 0) + (player.keys.legendary || 0);

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Cat Room Banner */}
      <PetCatRoom
        player={player}
        activeCat={activeCat}
        onPetCat={onPetCat}
        onChangeBackground={onChangeBackground}
        collectorValue={collectorValue}
        theme={theme}
      />

      {/* 2. Daily Login Streak Banner */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-purple-950/60 to-slate-900 border-purple-500/30 text-white'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Daily Login Reward</h3>
              <p className={`text-[10px] ${isLight ? 'text-purple-600' : 'text-purple-300'}`}>
                Streak: <strong className={`font-mono ${isLight ? 'text-purple-800' : 'text-white'}`}>{streak} Days</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimLogin}
            disabled={isClaimedToday}
            className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              isClaimedToday
                ? isLight
                  ? 'bg-slate-200 text-slate-500 cursor-default'
                  : 'bg-slate-800 text-slate-500 cursor-default'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-lg shadow-pink-500/25 active:scale-95'
            }`}
          >
            {isClaimedToday ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Claimed</span>
              </>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5" />
                <span>Claim!</span>
              </>
            )}
          </button>
        </div>

        {/* 7-Day Streak Tracker */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {Array.from({ length: 7 }).map((_, idx) => {
            const dayNum = idx + 1;
            const isCompleted = dayNum < streak || (dayNum === streak && isClaimedToday);
            const isToday = dayNum === streak && !isClaimedToday;

            return (
              <div
                key={dayNum}
                className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? isLight
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : isToday
                    ? 'bg-pink-500/20 border-pink-500 text-pink-500 ring-2 ring-pink-500/30 animate-pulse font-bold'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-400'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[8px] font-bold">Day {dayNum}</span>
                <span className="text-xs my-0.5">{isCompleted ? '✓' : '🪙'}</span>
                <span className="text-[8px] font-mono font-bold">+{60 + dayNum * 20}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quick Action Hubs */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Open Chests Quick Button */}
        <div
          onClick={() => {
            soundManager.playClick();
            onNavigateTab('chests');
          }}
          className={`p-3.5 rounded-2xl cursor-pointer transition-all active:scale-98 group flex flex-col justify-between border ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              isLight
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
            }`}>
              {totalKeys} Keys
            </span>
          </div>
          <div>
            <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Open Chests</h4>
            <p className={`text-[10px] mt-0.5 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Draw rare skins</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </p>
          </div>
        </div>

        {/* Play Minigames Quick Button */}
        <div
          onClick={() => {
            soundManager.playClick();
            onNavigateTab('games');
          }}
          className={`p-3.5 rounded-2xl cursor-pointer transition-all active:scale-98 group flex flex-col justify-between border ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl group-hover:scale-110 transition-transform">🎮</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              isLight
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
            }`}>
              5 Games
            </span>
          </div>
          <div>
            <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Play & Earn</h4>
            <p className={`text-[10px] mt-0.5 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Tennis, Chess & more</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </p>
          </div>
        </div>
      </div>

      {/* 4. Daily Tasks Preview */}
      <div className={`rounded-3xl p-4 border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Daily Tasks</h3>
            {pendingTasksCount > 0 && (
              <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {pendingTasksCount} ready
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="text-[10px] font-bold text-pink-500 hover:text-pink-600 flex items-center gap-0.5"
          >
            <span>All Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {player.dailyTasks.slice(0, 3).map(task => {
            return (
              <div
                key={task.id}
                className={`rounded-xl p-2.5 flex items-center justify-between text-xs border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className={`font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{task.title}</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{task.description}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-mono text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {Math.min(task.current, task.goal)} / {task.goal}
                  </div>
                  <div className="text-[10px] font-bold text-amber-500 font-mono">
                    +{task.rewardCoins} 🪙
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
