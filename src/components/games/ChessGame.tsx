import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ArrowLeft, RefreshCw, Flag } from 'lucide-react';
import { Theme } from '../../types/game';

interface ChessGameProps {
  onBack: () => void;
  onGameComplete: (outcome: 'win' | 'draw' | 'loss') => Promise<{ coinsEarned: number }>;
  theme?: Theme;
}

const PIECE_SYMBOLS: Record<string, string> = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
};

export const ChessGame: React.FC<ChessGameProps> = ({
  onBack,
  onGameComplete,
  theme = 'light',
}) => {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Du bist am Zug (Weiß)');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  // Evaluate simple AI move
  const makeAiMove = (currentChess: Chess) => {
    if (currentChess.isGameOver()) return;

    setIsAiThinking(true);
    setTimeout(() => {
      const moves = currentChess.moves({ verbose: true });
      if (moves.length === 0) return;

      // Smart simple evaluation: Prefer captures, checks, then random
      const captureMoves = moves.filter(m => m.captured);
      let chosenMove = moves[Math.floor(Math.random() * moves.length)];

      if (captureMoves.length > 0) {
        const pieceValues: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 };
        captureMoves.sort((a, b) => {
          const valA = a.captured ? pieceValues[a.captured] || 1 : 0;
          const valB = b.captured ? pieceValues[b.captured] || 1 : 0;
          return valB - valA;
        });
        chosenMove = captureMoves[0];
      }

      currentChess.move(chosenMove);
      soundManager.playTennisHit();
      setGame(new Chess(currentChess.fen()));
      setIsAiThinking(false);

      checkGameOutcome(currentChess);
    }, 600);
  };

  const checkGameOutcome = async (currentChess: Chess) => {
    if (currentChess.isCheckmate()) {
      setIsGameOver(true);
      const isPlayerWinner = currentChess.turn() === 'b';
      setGameStatus(isPlayerWinner ? 'Schachmatt! Du hast gewonnen! 🏆' : 'Schachmatt! Katzen-KI hat gewonnen! 😿');

      const outcome = isPlayerWinner ? 'win' : 'loss';
      if (isPlayerWinner) {
        soundManager.playWinFanfare();
        triggerHaptic('success');
      } else {
        soundManager.playError();
        triggerHaptic('warning');
      }

      try {
        const res = await onGameComplete(outcome);
        if (res?.coinsEarned) {
          setRewardMsg(`+${res.coinsEarned} Münzen verdient! 🪙`);
        }
      } catch {
        // ignore
      }
    } else if (currentChess.isDraw()) {
      setIsGameOver(true);
      setGameStatus('Remis! Unentschieden! 🤝');
      soundManager.playCoin();

      try {
        const res = await onGameComplete('draw');
        if (res?.coinsEarned) {
          setRewardMsg(`+${res.coinsEarned} Münzen verdient! 🪙`);
        }
      } catch {
        // ignore
      }
    } else if (currentChess.inCheck()) {
      setGameStatus('Schach! ⚠️');
      soundManager.playPop();
    } else {
      setGameStatus(currentChess.turn() === 'w' ? 'Du bist am Zug (Weiß)' : 'Katzen-KI überlegt...');
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || isAiThinking || game.turn() !== 'w') return;

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          soundManager.playTennisHit();
          triggerHaptic('light');
          setSelectedSquare(null);
          setLegalMoves([]);
          const nextGame = new Chess(game.fen());
          setGame(nextGame);

          checkGameOutcome(nextGame);

          if (!nextGame.isGameOver()) {
            setGameStatus('Katzen-KI überlegt (Schwarz)...');
            makeAiMove(nextGame);
          }
          return;
        }
      } catch {
        // invalid move
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === 'w') {
      soundManager.playClick();
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }).map(m => m.to as Square);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleSurrender = async () => {
    if (isGameOver) return;
    setIsGameOver(true);
    setGameStatus('Aufgegeben. Katzen-KI gewinnt!');
    soundManager.playError();
    await onGameComplete('loss');
  };

  const resetGame = () => {
    soundManager.playClick();
    const newG = new Chess();
    setGame(newG);
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameStatus('Du bist am Zug (Weiß)');
    setIsAiThinking(false);
    setIsGameOver(false);
    setRewardMsg(null);
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

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
          Katzen-Schach ♟️
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

      {/* Game Status HUD */}
      <div className={`p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isAiThinking ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
          <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{gameStatus}</span>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          Weiß: Du vs Schwarz: KI
        </div>
      </div>

      {/* 8x8 Chessboard */}
      <div className={`rounded-2xl p-2.5 shadow-2xl border ${
        isLight ? 'bg-amber-900/10 border-amber-800/30' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <div className="grid grid-cols-8 gap-0 border-2 border-amber-900/40 rounded-xl overflow-hidden aspect-square">
          {ranks.map(rank =>
            files.map((file, colIdx) => {
              const square = `${file}${rank}` as Square;
              const isDark = (colIdx + rank) % 2 === 1;
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isLegal = legalMoves.includes(square);
              const pieceKey = piece ? `${piece.color}${piece.type}` : null;
              const pieceSymbol = pieceKey ? PIECE_SYMBOLS[pieceKey] : null;

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  disabled={isGameOver || isAiThinking}
                  className={`aspect-square flex items-center justify-center relative transition-all ${
                    isSelected
                      ? 'bg-amber-400 ring-2 ring-amber-500 z-10'
                      : isDark
                      ? 'bg-amber-800 text-amber-100'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {/* Legal move indicator */}
                  {isLegal && (
                    <div
                      className={`absolute rounded-full z-10 ${
                        piece ? 'w-full h-full border-4 border-emerald-400/80 bg-emerald-500/20' : 'w-3 h-3 bg-emerald-500/80'
                      }`}
                    />
                  )}

                  {/* Piece text */}
                  {pieceSymbol && (
                    <span
                      className={`text-2xl sm:text-3xl font-serif select-none z-0 ${
                        piece?.color === 'w'
                          ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                          : 'text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                      }`}
                    >
                      {pieceSymbol}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Result Card or Surrender CTA */}
      {isGameOver ? (
        <div className={`rounded-2xl p-4 text-center space-y-3 animate-in fade-in duration-200 border ${
          isLight ? 'bg-white border-purple-200 shadow-md text-slate-800' : 'bg-slate-800/95 border-purple-500/30 text-white'
        }`}>
          <div className="text-sm font-bold">{gameStatus}</div>
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
            Neue Schachpartie starten
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center text-xs px-1">
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Figur antippen für Züge</span>
          <button
            onClick={handleSurrender}
            className="text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold underline"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Aufgeben</span>
          </button>
        </div>
      )}
    </div>
  );
};
