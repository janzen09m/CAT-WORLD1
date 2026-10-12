import React, { useState } from 'react';
import { PlayerData, Theme } from '../../types/game';
import { TicTacToeGame } from '../games/TicTacToeGame';
import { TennisGame } from '../games/TennisGame';
import { ChessGame } from '../games/ChessGame';
import { MemoryGame } from '../games/MemoryGame';
import { CatCatchGame } from '../games/CatCatchGame';
import { soundManager } from '../../utils/audio';
import { Gamepad2, Trophy, Coins, Play, ArrowRight } from 'lucide-react';

interface GamesViewProps {
  player: PlayerData;
  onCompleteGame: (gameType: 'tictactoe' | 'tennis' | 'chess' | 'memory' | 'catcatch', outcome: 'win' | 'draw' | 'loss', score?: number) => Promise<{ coinsEarned: number }>;
  theme?: Theme;
}

type ActiveGame = 'hub' | 'tictactoe' | 'tennis' | 'chess' | 'memory' | 'catcatch';

export const GamesView: React.FC<GamesViewProps> = ({
  player,
  onCompleteGame,
  theme = 'dark',
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('hub');
  const isLight = theme === 'light';

  if (activeGame === 'tictactoe') {
    return (
      <div className="pb-20">
        <TicTacToeGame
          onBack={() => setActiveGame('hub')}
          onGameComplete={outcome => onCompleteGame('tictactoe', outcome)}
          theme={theme}
        />
      </div>
    );
  }

  if (activeGame === 'tennis') {
    return (
      <div className="pb-20">
        <TennisGame
          onBack={() => setActiveGame('hub')}
          onGameComplete={(outcome, score) => onCompleteGame('tennis', outcome, score)}
          theme={theme}
        />
      </div>
    );
  }

  if (activeGame === 'chess') {
    return (
      <div className="pb-20">
        <ChessGame
          onBack={() => setActiveGame('hub')}
          onGameComplete={outcome => onCompleteGame('chess', outcome)}
          theme={theme}
        />
      </div>
    );
  }

  if (activeGame === 'memory') {
    return (
      <div className="pb-20">
        <MemoryGame
          onBack={() => setActiveGame('hub')}
          onGameComplete={(outcome, moves) => onCompleteGame('memory', outcome, moves)}
          theme={theme}
        />
      </div>
    );
  }

  if (activeGame === 'catcatch') {
    return (
      <div className="pb-20">
        <CatCatchGame
          onBack={() => setActiveGame('hub')}
          onGameComplete={score => onCompleteGame('catcatch', 'win', score)}
          theme={theme}
        />
      </div>
    );
  }

  // Games Hub
  const gamesList: {
    id: ActiveGame;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    badge: string;
    stat: string;
  }[] = [
    {
      id: 'tennis',
      title: 'Cat Tennis',
      subtitle: '2D Arcade tennis with paddle deflection & ball physics',
      icon: '🎾',
      color: 'from-emerald-600 to-teal-800',
      badge: 'Up to 35 🪙',
      stat: `${player.stats.tennisWins || 0} Wins`,
    },
    {
      id: 'chess',
      title: 'Chess vs Meow',
      subtitle: 'Classic chess board vs Grandmaster Meow AI',
      icon: '♟️',
      color: 'from-amber-700 to-amber-950',
      badge: '50 🪙 + 5 ✨',
      stat: `${player.stats.chessWins || 0} Wins`,
    },
    {
      id: 'tictactoe',
      title: 'Tic-Tac-Toe',
      subtitle: '3 in a row against adaptive feline AI levels',
      icon: '🐾',
      color: 'from-pink-600 to-purple-800',
      badge: 'Up to 20 🪙',
      stat: `${player.stats.tictactoeWins || 0} Wins`,
    },
    {
      id: 'memory',
      title: 'Cat Memory',
      subtitle: 'Find 8 matching pairs of cute cat skins',
      icon: '🎴',
      color: 'from-indigo-600 to-purple-900',
      badge: '25 🪙',
      stat: `${player.stats.memoryWins || 0} Wins`,
    },
    {
      id: 'catcatch',
      title: 'Cat Catch',
      subtitle: 'Catch fish, milk bottles & stars with the cozy basket',
      icon: '🐟',
      color: 'from-blue-600 to-cyan-900',
      badge: 'Up to 45 🪙',
      stat: `Highscore: ${player.stats.catCatchHighScore || 0}`,
    },
  ];

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Header */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 to-purple-950/70 border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="w-5 h-5 text-pink-500" />
          <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Minigames Arcade</h2>
        </div>
        <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Play rewarding minigames to earn coins and star shards for legendary cats!
        </p>

        <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>Played: <strong className={isLight ? 'text-slate-800' : 'text-white'}>{player.stats.gamesPlayed || 0}</strong></span>
          <span>·</span>
          <span>Won: <strong className="text-emerald-500 font-bold">{player.stats.gamesWon || 0}</strong></span>
        </div>
      </div>

      {/* 2. Games Grid */}
      <div className="space-y-2.5">
        {gamesList.map(g => (
          <div
            key={g.id}
            onClick={() => {
              soundManager.playClick();
              setActiveGame(g.id);
            }}
            className={`rounded-3xl p-3.5 flex items-center justify-between gap-3 cursor-pointer shadow-lg active:scale-98 transition-all group border ${
              isLight
                ? 'bg-white border-slate-200 hover:border-slate-300'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${g.color} flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:scale-105 transition-transform text-white`}>
              {g.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{g.title}</h3>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                }`}>
                  {g.badge}
                </span>
              </div>
              <p className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {g.subtitle}
              </p>
              <div className="text-[10px] text-purple-500 font-mono mt-1 font-bold">
                {g.stat}
              </div>
            </div>

            <button className={`p-2.5 rounded-xl group-hover:bg-pink-600 text-slate-400 group-hover:text-white transition-colors shrink-0 ${
              isLight ? 'bg-slate-100' : 'bg-slate-800'
            }`}>
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
