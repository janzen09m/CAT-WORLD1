import React, { useState } from 'react';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import { Theme } from '../../types/game';

interface TicTacToeProps {
  onBack: () => void;
  onGameComplete: (outcome: 'win' | 'draw' | 'loss') => Promise<{ coinsEarned: number }>;
  theme?: Theme;
}

type SquareValue = 'P' | 'B' | null; // P = Player (Paw), B = Bot (Fish)
type Difficulty = 'easy' | 'medium' | 'hard';

export const TicTacToeGame: React.FC<TicTacToeProps> = ({
  onBack,
  onGameComplete,
  theme = 'light',
}) => {
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<SquareValue | 'draw' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  const checkWinner = (squares: SquareValue[]): { winner: SquareValue | 'draw' | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }

    if (squares.every(s => s !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  };

  const getBotMove = (squares: SquareValue[], diff: Difficulty): number => {
    const emptyIndices = squares.map((val, idx) => (val === null ? idx : null)).filter((v): v is number => v !== null);
    if (emptyIndices.length === 0) return -1;

    // Easy: random
    if (diff === 'easy') {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // Medium or Hard: Check if bot can win immediately
    for (const idx of emptyIndices) {
      const copy = [...squares];
      copy[idx] = 'B';
      if (checkWinner(copy).winner === 'B') return idx;
    }

    // Block player win
    for (const idx of emptyIndices) {
      const copy = [...squares];
      copy[idx] = 'P';
      if (checkWinner(copy).winner === 'P') return idx;
    }

    if (diff === 'hard') {
      if (squares[4] === null) return 4;
      const corners = [0, 2, 6, 8].filter(i => squares[i] === null);
      if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    }

    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  };

  const handleSquareClick = async (index: number) => {
    if (board[index] || !isPlayerTurn || winner || isSubmitting) return;

    soundManager.playPop();
    triggerHaptic('light');

    const nextBoard = [...board];
    nextBoard[index] = 'P';
    setBoard(nextBoard);

    const res = checkWinner(nextBoard);
    if (res.winner) {
      handleGameOver(res.winner, res.line);
      return;
    }

    // Bot's Turn
    setIsPlayerTurn(false);
    setTimeout(() => {
      const botIdx = getBotMove(nextBoard, difficulty);
      if (botIdx !== -1) {
        nextBoard[botIdx] = 'B';
        setBoard([...nextBoard]);
        soundManager.playPop();

        const botRes = checkWinner(nextBoard);
        if (botRes.winner) {
          handleGameOver(botRes.winner, botRes.line);
        } else {
          setIsPlayerTurn(true);
        }
      }
    }, 450);
  };

  const handleGameOver = async (gameWinner: SquareValue | 'draw', line: number[] | null) => {
    setWinner(gameWinner);
    setWinningLine(line);
    setIsSubmitting(true);

    if (gameWinner === 'P') {
      soundManager.playWinFanfare();
      triggerHaptic('success');
    } else if (gameWinner === 'B') {
      soundManager.playError();
      triggerHaptic('warning');
    } else {
      soundManager.playCoin();
    }

    try {
      const outcome = gameWinner === 'P' ? 'win' : gameWinner === 'B' ? 'loss' : 'draw';
      const result = await onGameComplete(outcome);
      if (result?.coinsEarned) {
        setRewardMsg(`+${result.coinsEarned} Münzen verdient! 🪙`);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetGame = () => {
    soundManager.playClick();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine(null);
    setRewardMsg(null);
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`p-2 rounded-xl transition-colors ${
            isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h3 className={`font-black text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>
          Tic-Tac-Toe Pfoten
        </h3>

        <button
          onClick={resetGame}
          className={`p-2 rounded-xl transition-colors ${
            isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Neu starten"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Schwierigkeitsgrad */}
      <div className={`p-1 rounded-xl flex items-center justify-between text-xs font-bold border ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700/60'
      }`}>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button
            key={d}
            onClick={() => {
              setDifficulty(d);
              resetGame();
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors capitalize text-xs ${
              difficulty === d
                ? 'bg-pink-600 text-white shadow-xs'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
            }`}
          >
            {d === 'easy' ? 'Leicht' : d === 'medium' ? 'Mittel' : 'Meister'}
          </button>
        ))}
      </div>

      {/* Zug-Anzeige */}
      <div className="text-center text-xs font-bold py-1">
        {winner ? (
          <span className="text-pink-500 font-black">Runde beendet</span>
        ) : isPlayerTurn ? (
          <span className="text-emerald-500">Du bist am Zug (Pfote 🐾)</span>
        ) : (
          <span className="text-blue-500 animate-pulse">Katzen-KI überlegt (Fisch 🐟)...</span>
        )}
      </div>

      {/* 3x3 Spielfeld */}
      <div className={`grid grid-cols-3 gap-2.5 p-3 rounded-2xl shadow-xl border ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-700/80'
      }`}>
        {board.map((val, idx) => {
          const isWinningSquare = winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleSquareClick(idx)}
              disabled={val !== null || !isPlayerTurn || !!winner}
              className={`h-24 rounded-xl flex items-center justify-center text-4xl font-black transition-all select-none ${
                isWinningSquare
                  ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white scale-105 shadow-lg'
                  : val
                  ? isLight ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-slate-800 border border-slate-700 text-slate-100'
                  : isLight ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200' : 'bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/40'
              }`}
            >
              {val === 'P' ? '🐾' : val === 'B' ? '🐟' : ''}
            </button>
          );
        })}
      </div>

      {/* Ergebnis-Nachricht */}
      {winner && (
        <div className={`rounded-2xl p-4 text-center space-y-3 animate-in fade-in duration-200 border ${
          isLight ? 'bg-white border-purple-200 shadow-md text-slate-800' : 'bg-slate-800/95 border-purple-500/30 text-white'
        }`}>
          <div className="text-2xl">
            {winner === 'P' ? '🎉' : winner === 'draw' ? '🤝' : '😿'}
          </div>
          <div className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {winner === 'P'
              ? 'Glückwunsch! Du hast gewonnen!'
              : winner === 'draw'
              ? 'Unentschieden!'
              : 'Katzen-KI hat diese Runde gewonnen!'}
          </div>
          {rewardMsg && (
            <div className={`text-xs font-bold p-2 rounded-xl border ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
            }`}>
              {rewardMsg}
            </div>
          )}
          <button
            onClick={resetGame}
            className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-bold text-xs rounded-xl text-white shadow-lg transition-all"
          >
            Noch eine Runde spielen
          </button>
        </div>
      )}
    </div>
  );
};
