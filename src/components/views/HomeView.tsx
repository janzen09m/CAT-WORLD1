import React from 'react';
import { PlayerData, CatSkin, DailyTask, Theme } from '../../types/game';
import { PetCatRoom } from '../PetCatRoom';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { Sparkles, Calendar, Check, ArrowRight, Play, Trophy, Gift, Compass, Key } from 'lucide-react';
import { TabType } from '../BottomNav';
import { KEY_EXCHANGE_RATES } from '../../data/chestsData';

interface HomeViewProps {
  player: PlayerData;
  activeCat?: CatSkin | null;
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
  theme = 'light',
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
  const ownedCatsCount = Object.keys(player.ownedCats || {}).length;
  const collectionGoal = 50;
  const collectionPercent = Math.min(100, Math.round((ownedCatsCount / collectionGoal) * 100));

  // Smart dynamic next mission recommendation
  const getNextMission = () => {
    if (totalKeys > 0) {
      return {
        title: 'Öffne deine Schatztruhe',
        text: `Du besitzt ${totalKeys} Schlüssel! Ziehe jetzt eine neue, einzigartige Katze mit Seriennummer.`,
        actionLabel: 'Jetzt Kiste öffnen',
        icon: '📦',
        onAction: () => onNavigateTab('chests'),
      };
    }
    if (pendingTasksCount > 0) {
      return {
        title: 'Belohnungen abholen',
        text: `Du hast ${pendingTasksCount} abgeschlossene Aufgabe(n) bereit. Hole jetzt deine Bonus-Münzen!`,
        actionLabel: 'Belohnungen anzeigen',
        icon: '🎁',
        onAction: () => onNavigateTab('profile'),
      };
    }
    const woodenKeyCost = KEY_EXCHANGE_RATES.wooden?.coinPrice || 150;
    if (player.coins >= woodenKeyCost) {
      return {
        title: 'Neuen Schlüssel sichern',
        text: `Du hast ${player.coins} Münzen gespart! Kaufe einen Holz- oder Edel-Schlüssel im Shop.`,
        actionLabel: 'Zum Schlüssel-Shop',
        icon: '🗝️',
        onAction: () => onOpenExchangeModal(),
      };
    }
    const needed = woodenKeyCost - player.coins;
    return {
      title: 'Spiele eine Runde Cat Tennis',
      text: `Verdiene bis zu 40 Münzen im Match – dir fehlen nur noch ${needed} Münzen für deine nächste Holzkiste!`,
      actionLabel: 'Cat Tennis spielen',
      icon: '🎾',
      onAction: () => onNavigateTab('games'),
    };
  };

  const nextMission = getNextMission();

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Cat Room Banner */}
      <PetCatRoom
        player={player}
        activeCat={activeCat}
        onPetCat={onPetCat}
        onChangeBackground={onChangeBackground}
        collectorValue={collectorValue}
        onOpenChests={() => onNavigateTab('chests')}
        theme={theme}
      />

      {/* 2. Empfohlene Nächste Aktion & Spielerführung */}
      <div className={`rounded-3xl p-4 shadow-xl border relative overflow-hidden transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-pink-50 border-blue-200 text-slate-800'
          : 'bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900 border-indigo-500/30 text-white'
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md shrink-0">
            {nextMission.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-500 flex items-center gap-1 font-mono">
                <Compass className="w-3 h-3" />
                Nächste empfohlene Aktion
              </span>
            </div>
            <h3 className={`text-sm font-black mt-0.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {nextMission.title}
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {nextMission.text}
            </p>

            <button
              onClick={() => {
                soundManager.playClick();
                nextMission.onAction();
              }}
              className="mt-2.5 py-1.5 px-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-black rounded-xl shadow-md shadow-pink-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{nextMission.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sammlungsfortschritt-Balken */}
        <div className={`mt-3.5 pt-3 border-t ${isLight ? 'border-blue-100' : 'border-indigo-900/50'}`}>
          <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
            <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
              Sammlungs-Fortschritt:
            </span>
            <span className="font-mono text-pink-500">
              {ownedCatsCount} / {collectionGoal}+ Katzen ({collectionPercent}%)
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.max(4, collectionPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Daily Login Streak Banner */}
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
              <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Täglicher Login-Bonus</h3>
              <p className={`text-[10px] ${isLight ? 'text-purple-600' : 'text-purple-300'}`}>
                Serie: <strong className={`font-mono ${isLight ? 'text-purple-800' : 'text-white'}`}>{streak} Tage</strong>
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
                <span>Eingelöst</span>
              </>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5" />
                <span>Abholen!</span>
              </>
            )}
          </button>
        </div>

        {/* 7-Tage Tracker */}
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
                <span className="text-[8px] font-bold">Tag {dayNum}</span>
                <span className="text-xs my-0.5">{isCompleted ? '✓' : '🪙'}</span>
                <span className="text-[8px] font-mono font-bold">+{60 + dayNum * 20}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Action Hubs */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Kisten öffnen */}
        <div
          onClick={() => {
            soundManager.playClick();
            onNavigateTab('chests');
          }}
          className={`p-3.5 rounded-2xl cursor-pointer transition-all active:scale-98 group flex flex-col justify-between border ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs hover:shadow-md'
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
              {totalKeys} Schlüssel
            </span>
          </div>
          <div>
            <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Kisten öffnen</h4>
            <p className={`text-[10px] mt-0.5 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Seltene Katzen ziehen</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </p>
          </div>
        </div>

        {/* Minispiele */}
        <div
          onClick={() => {
            soundManager.playClick();
            onNavigateTab('games');
          }}
          className={`p-3.5 rounded-2xl cursor-pointer transition-all active:scale-98 group flex flex-col justify-between border ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs hover:shadow-md'
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
              5 Spiele
            </span>
          </div>
          <div>
            <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Spielen & Verdienen</h4>
            <p className={`text-[10px] mt-0.5 flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Tennis, Schach & mehr</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-pink-500 transition-colors" />
            </p>
          </div>
        </div>
      </div>

      {/* 5. Tägliche Aufgaben Vorschau */}
      <div className={`rounded-3xl p-4 border transition-colors ${
        isLight
          ? 'bg-white border-slate-200 shadow-xs'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Tägliche Aufgaben</h3>
            {pendingTasksCount > 0 && (
              <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {pendingTasksCount} bereit
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="text-[10px] font-bold text-pink-500 hover:text-pink-600 flex items-center gap-0.5"
          >
            <span>Alle Aufgaben</span>
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
