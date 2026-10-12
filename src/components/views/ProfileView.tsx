import React, { useState, useEffect } from 'react';
import { PlayerData, LeaderboardEntry, DailyTask, Achievement, Theme } from '../../types/game';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import {
  User,
  Trophy,
  CheckCircle2,
  Calendar,
  Settings,
  Edit2,
  Medal,
  Sparkles,
  Flame,
  Check,
  Shield,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ProfileViewProps {
  player: PlayerData;
  collectorValue: number;
  onUpdateNames: (playerName: string, catCustomName: string) => Promise<void>;
  onClaimTask: (taskId: string) => Promise<void>;
  onClaimAchievement: (achievementId: string) => Promise<void>;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  player,
  collectorValue,
  onUpdateNames,
  onClaimTask,
  onClaimAchievement,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'tasks' | 'achievements' | 'leaderboard' | 'settings'>('stats');
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState(player.playerName);
  const [catNameInput, setCatNameInput] = useState(player.catCustomName);
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());

  const isLight = theme === 'light';

  const [leaderboards, setLeaderboards] = useState<{
    topCollectors: LeaderboardEntry[];
    topWinners: LeaderboardEntry[];
    topChess: LeaderboardEntry[];
    topStreaks: LeaderboardEntry[];
  } | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeaderboards(data.leaderboards);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const handleSaveNames = async () => {
    soundManager.playClick();
    triggerHaptic('medium');
    await onUpdateNames(playerNameInput.trim(), catNameInput.trim());
    setIsEditingNames(false);
  };

  const handleClaimTaskClick = async (task: DailyTask) => {
    if (task.claimed || task.current < task.goal) return;
    soundManager.playCoin();
    triggerHaptic('success');
    await onClaimTask(task.id);
  };

  const handleClaimAchievementClick = async (ach: Achievement) => {
    if (ach.claimed || ach.current < ach.goal) return;
    soundManager.playWinFanfare();
    triggerHaptic('success');
    await onClaimAchievement(ach.id);
  };

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Profile Hero Card */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border-purple-500/30 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shrink-0 text-white">
              🐱
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{player.playerName}</h2>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setIsEditingNames(true);
                  }}
                  className={`p-1 transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
                  title="Edit Names"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={`text-[10px] font-mono flex items-center gap-2 ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                <span>Cat: <strong>{player.catCustomName}</strong></span>
                <span>·</span>
                <span>{player.id}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Rating</span>
            <span className="text-sm font-black text-amber-500 font-mono">
              ★ {collectorValue}
            </span>
          </div>
        </div>

        {/* Telegram Verification Tag */}
        {player.telegramUserId && (
          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}>
            <span className="flex items-center gap-1 text-sky-500 font-bold">
              <Shield className="w-3.5 h-3.5" />
              Verified: @{player.telegramUsername || player.telegramUserId}
            </span>
            <span className="font-mono text-[10px]">ID: {player.telegramUserId}</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className={`rounded-2xl p-1 grid grid-cols-5 gap-1 text-[11px] font-bold border ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        {(
          [
            { id: 'stats', label: 'Stats' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'achievements', label: 'Badges' },
            { id: 'leaderboard', label: 'Ranks' },
            { id: 'settings', label: 'Theme' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              setActiveTab(tab.id);
            }}
            className={`py-2 rounded-xl transition-all text-center ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : 'hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB 1: DETAILED STATS --- */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 block">Cat Skins Owned</span>
              <span className={`text-base font-black font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {Object.keys(player.ownedCats).length} Skins
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 block">Chests Opened</span>
              <span className="text-base font-black text-amber-500 font-mono">
                {player.stats.chestsOpened || 0} Chests
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 block">Minigame Victories</span>
              <span className="text-base font-black text-emerald-500 font-mono">
                {player.stats.gamesWon || 0} / {player.stats.gamesPlayed || 0}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 block">Chess Checkmates</span>
              <span className="text-base font-black text-sky-500 font-mono">
                {player.stats.chessWins || 0} Wins
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 block">Tennis Matches Won</span>
              <span className="text-base font-black text-purple-500 font-mono">
                {player.stats.tennisWins || 0} Matches
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'}`}>
              <span className="text-[10px] text-slate-400 block">Daily Login Streak</span>
              <span className="text-base font-black text-pink-500 font-mono flex items-center gap-1">
                <Flame className="w-4 h-4 fill-pink-500" />
                <span>{player.loginStreak || 1} Days</span>
              </span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl text-[11px] flex items-center justify-between border ${
            isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900/90 border-slate-800 text-slate-400'
          }`}>
            <span>Cloud Database Sync:</span>
            <span className="text-emerald-500 font-bold">Active (Postgres / Persistent)</span>
          </div>
        </div>
      )}

      {/* --- TAB 2: DAILY TASKS --- */}
      {activeTab === 'tasks' && (
        <div className="space-y-2">
          {player.dailyTasks.map(task => {
            const isDone = task.current >= task.goal;

            return (
              <div
                key={task.id}
                className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 border ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`font-bold text-xs truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{task.title}</h4>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">
                      +{task.rewardCoins} 🪙
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{task.description}</p>
                  {/* Progress bar */}
                  <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (task.current / task.goal) * 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleClaimTaskClick(task)}
                  disabled={task.claimed || !isDone}
                  className={`py-2 px-3 rounded-xl text-xs font-black shrink-0 transition-all ${
                    task.claimed
                      ? isLight ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-slate-800 text-slate-500 cursor-default'
                      : isDone
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md active:scale-95'
                      : isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed font-mono text-[10px]' : 'bg-slate-800 text-slate-400 cursor-not-allowed font-mono text-[10px]'
                  }`}
                >
                  {task.claimed ? (
                    'Claimed'
                  ) : isDone ? (
                    'Claim'
                  ) : (
                    `${task.current} / ${task.goal}`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 3: ACHIEVEMENTS --- */}
      {activeTab === 'achievements' && (
        <div className="space-y-2">
          {player.achievements.map(ach => {
            const isDone = ach.current >= ach.goal;

            return (
              <div
                key={ach.id}
                className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 border ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Medal className="w-4 h-4 text-purple-500 shrink-0" />
                    <h4 className={`font-bold text-xs truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{ach.title}</h4>
                  </div>
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{ach.description}</p>

                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                    <span className="text-amber-500 font-bold">+{ach.rewardCoins} 🪙</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-400">
                      {Math.min(ach.current, ach.goal)} / {ach.goal}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleClaimAchievementClick(ach)}
                  disabled={ach.claimed || !isDone}
                  className={`py-2 px-3 rounded-xl text-xs font-black shrink-0 transition-all ${
                    ach.claimed
                      ? isLight ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-slate-800 text-slate-500 cursor-default'
                      : isDone
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md active:scale-95'
                      : isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {ach.claimed ? 'Claimed' : isDone ? 'Reward!' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB 4: GLOBAL LEADERBOARDS --- */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <div className={`rounded-2xl p-3 border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
            <h4 className="text-xs font-black text-amber-500 flex items-center gap-1 mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>Top Collectors (Rating Ranking)</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              {leaderboards?.topCollectors.slice(0, 7).map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2 rounded-xl ${
                    entry.id === player.id
                      ? isLight ? 'bg-pink-100 text-slate-900 font-bold border border-pink-300' : 'bg-pink-950/40 border border-pink-500/50 text-white font-bold'
                      : isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-black text-slate-400 text-[11px] w-4">
                      #{idx + 1}
                    </span>
                    <span className="truncate">{entry.playerName}</span>
                    <span className="text-[10px] text-purple-500 font-mono">
                      ({entry.activeCatName})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-500 shrink-0">
                    ★ {entry.collectorValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: SETTINGS & THEME TOGGLE --- */}
      {activeTab === 'settings' && (
        <div className="space-y-3">
          <div className={`rounded-2xl p-4 border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>App Appearance</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle between Day Light View and Dark Night View</p>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  triggerHaptic('medium');
                  onToggleTheme?.();
                }}
                className={`py-2 px-3.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  isLight
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
              >
                {isLight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{isLight ? 'Light View (Active)' : 'Dark View (Active)'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div>
                <h4 className={`text-xs font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Audio Effects</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Retro Web Audio synthesizer sound effects</p>
              </div>
              <button
                onClick={handleToggleSound}
                className={`p-2 rounded-xl border transition-colors ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Names Modal */}
      {isEditingNames && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-3xl p-5 space-y-4 border ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
          }`}>
            <h3 className="text-base font-black">Edit Names</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Player Name:</label>
              <input
                type="text"
                value={playerNameInput}
                onChange={e => setPlayerNameInput(e.target.value)}
                maxLength={20}
                className={`w-full rounded-lg p-2 text-sm focus:outline-none focus:border-pink-500 border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Cat Custom Name:</label>
              <input
                type="text"
                value={catNameInput}
                onChange={e => setCatNameInput(e.target.value)}
                maxLength={20}
                className={`w-full rounded-lg p-2 text-sm focus:outline-none focus:border-pink-500 border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setIsEditingNames(false)}
                className={`py-2.5 rounded-xl font-bold text-xs ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNames}
                className="py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
