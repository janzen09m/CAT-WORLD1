import React, { useState, useEffect } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ArrowLeft, RefreshCw, Trophy, Flag } from 'lucide-react';
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
  theme = 'dark',
}) => {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('Your Turn (White)');
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
        // High priority capture (e.g. Queen > Rook > Bishop/Knight > Pawn)
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
      const isPlayerWinner = currentChess.turn() === 'b'; // If it's black's turn and checkmate, white (player) won!
      setGameStatus(isPlayerWinner ? 'Checkmate! You Won! 🏆' : 'Checkmate! Cat AI Won! 😿');

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
        setRewardMsg(
          isPlayerWinner
            ? `Chess Victory! Earned +${res.coinsEarned} Coins! ♟️`
            : `Defeat. +${res.coinsEarned} Consolation Coins ♟️`
        );
      } catch {
        // ignore
      }
    } else if (currentChess.isDraw() || currentChess.isStalemate()) {
      setIsGameOver(true);
      setGameStatus('Draw / Stalemate! 🤝');
      soundManager.playCoin();

      try {
        const res = await onGameComplete('draw');
        setRewardMsg(`Draw! +${res.coinsEarned} Coins ♟️`);
      } catch {
        // ignore
      }
    } else if (currentChess.isCheck()) {
      setGameStatus(currentChess.turn() === 'w' ? 'Check! You are in check!' : 'Check on Black King!');
    } else {
      setGameStatus(currentChess.turn() === 'w' ? 'Your Turn (White)' : 'Grandmaster Meow thinking...');
    }
  };

  const handleSquareClick = (square: Square) => {
    if (isGameOver || isAiThinking || game.turn() !== 'w') return;

    // If already selected, try to move or deselect
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if move is legal
      try {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // auto promote to queen for simplicity
        });

        if (move) {
          soundManager.playClick();
          triggerHaptic('light');
          setSelectedSquare(null);
          setLegalMoves([]);

          const newChess = new Chess(game.fen());
          setGame(newChess);

          if (!newChess.isGameOver()) {
            checkGameOutcome(newChess);
            makeAiMove(newChess);
          } else {
            checkGameOutcome(newChess);
          }
          return;
        }
      } catch {
        // Illegal move, see if clicking another own piece instead
      }
    }

    // Select piece
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
    soundManager.playClick();
    setIsGameOver(true);
    setGameStatus('Resigned. Game Over.');
    try {
      const res = await onGameComplete('loss');
      setRewardMsg(`Resigned. +${res.coinsEarned} Consolation Coins`);
    } catch {
      // ignore
    }
  };

  const resetGame = () => {
    soundManager.playClick();
    const fresh = new Chess();
    setGame(fresh);
    setSelectedSquare(null);
    setLegalMoves([]);
    setIsGameOver(false);
    setIsAiThinking(false);
    setGameStatus('Your Turn (White)');
    setRewardMsg(null);
  };

  const board = game.board();

  return (
    <div className="space-y-4 max-w-sm mx-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold border transition-colors ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Chess vs Meow</h3>

        <button
          onClick={resetGame}
          className={`p-2 rounded-xl border transition-colors ${
            isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Restart"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Opponent Info & Turn Status */}
      <div className={`rounded-2xl p-3 flex items-center justify-between border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-800/90 border-slate-700/80'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg text-white">
            🐱
          </div>
          <div>
            <div className={`text-xs font-bold flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Grandmaster Meow</span>
              <span className="text-[10px] text-purple-500 font-mono">(1450 Elo)</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {isAiThinking ? 'Calculating moves...' : 'Black Pieces'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-xs font-bold ${isGameOver ? 'text-pink-500' : 'text-emerald-500'}`}>
            {gameStatus}
          </div>
        </div>
      </div>

      {/* 8x8 Chessboard */}
      <div className={`p-2 rounded-2xl shadow-2xl border-2 ${
        isLight ? 'bg-amber-50 border-amber-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="grid grid-cols-8 rounded-lg overflow-hidden border border-amber-700/40">
          {board.map((row, rowIdx) =>
            row.map((piece, colIdx) => {
              const file = String.fromCharCode('a'.charCodeAt(0) + colIdx);
              const rank = 8 - rowIdx;
              const square = `${file}${rank}` as Square;

              const isDark = (rowIdx + colIdx) % 2 === 1;
              const isSelected = selectedSquare === square;
              const isLegalTarget = legalMoves.includes(square);

              let pieceSymbol = '';
              if (piece) {
                pieceSymbol = PIECE_SYMBOLS[`${piece.color}${piece.type}`] || '';
              }

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  disabled={isGameOver || isAiThinking}
                  className={`aspect-square relative flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-amber-400/80'
                      : isDark
                      ? 'bg-amber-800/60'
                      : 'bg-amber-100/90'
                  }`}
                >
                  {/* Legal move indicator dot */}
                  {isLegalTarget && (
                    <div
                      className={`absolute rounded-full z-10 ${
                        piece ? 'w-full h-full border-2 border-emerald-400' : 'w-3 h-3 bg-emerald-500 shadow-sm'
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
            Start New Chess Match
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center text-xs px-1">
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Tap a piece to view moves</span>
          <button
            onClick={handleSurrender}
            className="text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold underline"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Resign</span>
          </button>
        </div>
      )}
    </div>
  );
};
