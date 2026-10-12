import React, { useRef, useEffect, useState } from 'react';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ArrowLeft, Play, RefreshCw, Trophy, Heart } from 'lucide-react';
import { Theme } from '../../types/game';

interface CatCatchGameProps {
  onBack: () => void;
  onGameComplete: (score: number) => Promise<{ coinsEarned: number }>;
  theme?: Theme;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'fish' | 'milk' | 'star' | 'water' | 'clock';
}

export const CatCatchGame: React.FC<CatCatchGameProps> = ({
  onBack,
  onGameComplete,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  const stateRef = useRef({
    basketX: 130,
    basketWidth: 60,
    basketHeight: 20,
    canvasWidth: 320,
    canvasHeight: 440,
    items: [] as FallingItem[],
    score: 0,
    lives: 3,
    lastSpawn: 0,
    spawnInterval: 65, // frames
    frame: 0,
  });

  const animRef = useRef<number | null>(null);

  const startGame = () => {
    soundManager.playClick();
    setScore(0);
    setLives(3);
    setRewardMsg(null);

    const s = stateRef.current;
    s.basketX = 130;
    s.items = [];
    s.score = 0;
    s.lives = 3;
    s.frame = 0;
    s.lastSpawn = 0;

    setGameState('playing');
  };

  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const scaleX = stateRef.current.canvasWidth / rect.width;
    const gameX = touchX * scaleX;

    const s = stateRef.current;
    s.basketX = Math.max(0, Math.min(s.canvasWidth - s.basketWidth, gameX - s.basketWidth / 2));
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const itemEmoji: Record<string, string> = {
      fish: '🐟',
      milk: '🥛',
      star: '⭐',
      water: '💧',
      clock: '⏰',
    };

    const loop = () => {
      const s = stateRef.current;
      s.frame += 1;

      // 1. Spawn items
      if (s.frame - s.lastSpawn > Math.max(30, s.spawnInterval - Math.floor(s.score / 50))) {
        s.lastSpawn = s.frame;
        const types: ('fish' | 'milk' | 'star' | 'water' | 'clock')[] = [
          'fish',
          'fish',
          'milk',
          'star',
          'water',
          'clock',
        ];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const newItem: FallingItem = {
          id: Math.random(),
          x: 20 + Math.random() * (s.canvasWidth - 40),
          y: -10,
          speed: 2 + Math.random() * 2 + Math.min(3, s.score * 0.015),
          type: randomType,
        };
        s.items.push(newItem);
      }

      // 2. Clear Court
      ctx.fillStyle = isLight ? '#EFF6FF' : '#0F172A';
      ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

      // 3. Update & Draw Items
      const basketY = s.canvasHeight - 40;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y += item.speed;

        // Collision check with basket
        if (
          item.y >= basketY - 10 &&
          item.y <= basketY + s.basketHeight &&
          item.x >= s.basketX &&
          item.x <= s.basketX + s.basketWidth
        ) {
          // Caught!
          if (item.type === 'fish') {
            s.score += 10;
            soundManager.playCoin();
            triggerHaptic('light');
          } else if (item.type === 'milk') {
            s.score += 15;
            soundManager.playCoin();
            triggerHaptic('light');
          } else if (item.type === 'star') {
            s.score += 30;
            soundManager.playCoin();
            triggerHaptic('medium');
          } else {
            // Hazard (water or clock)
            s.lives -= 1;
            soundManager.playError();
            triggerHaptic('warning');
            setLives(s.lives);

            if (s.lives <= 0) {
              setScore(s.score);
              finishGame(s.score);
              return;
            }
          }
          setScore(s.score);
          s.items.splice(i, 1);
          continue;
        }

        // Missed bottom boundary
        if (item.y > s.canvasHeight + 20) {
          if (item.type === 'fish' || item.type === 'milk') {
            s.lives -= 1;
            soundManager.playError();
            triggerHaptic('warning');
            setLives(s.lives);

            if (s.lives <= 0) {
              setScore(s.score);
              finishGame(s.score);
              return;
            }
          }
          s.items.splice(i, 1);
          continue;
        }

        // Draw item
        ctx.fillText(itemEmoji[item.type], item.x, item.y);
      }

      // Draw Player Basket (Cozy Cat Bed)
      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.roundRect(s.basketX, basketY, s.basketWidth, s.basketHeight, 10);
      ctx.fill();

      // Basket inner cushion
      ctx.fillStyle = '#FDF2F8';
      ctx.beginPath();
      ctx.roundRect(s.basketX + 4, basketY + 3, s.basketWidth - 8, s.basketHeight - 6, 6);
      ctx.fill();

      // Tiny cat ears on basket
      ctx.font = '16px sans-serif';
      ctx.fillText('🧺', s.basketX + s.basketWidth / 2, basketY + 16);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, isLight]);

  const finishGame = async (finalScore: number) => {
    setGameState('gameover');
    soundManager.playWinFanfare();
    triggerHaptic('medium');

    try {
      const res = await onGameComplete(finalScore);
      setRewardMsg(`Great Round! Earned +${res.coinsEarned} Coins! 🐟`);
    } catch {
      // ignore
    }
  };

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

        <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Cat Catch</h3>

        <button
          onClick={startGame}
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

      {/* Score & Lives bar */}
      <div className={`rounded-2xl p-2.5 flex items-center justify-between border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-800/90 border-slate-700/80'
      }`}>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 ${
                i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
          ))}
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold block text-right">Score</span>
          <span className="text-xl font-black text-amber-500 font-mono">{score}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-2 flex justify-center ${
        isLight ? 'border-indigo-200 bg-indigo-50' : 'border-indigo-900 bg-indigo-950'
      }`}>
        <canvas
          ref={canvasRef}
          width={320}
          height={440}
          className="w-full max-w-[320px] touch-none cursor-pointer"
          onPointerDown={e => handlePointerMove(e.clientX)}
          onPointerMove={e => {
            if (e.buttons > 0 || gameState === 'playing') {
              handlePointerMove(e.clientX);
            }
          }}
          onTouchMove={e => {
            if (e.touches[0]) {
              handlePointerMove(e.touches[0].clientX);
            }
          }}
        />

        {/* Start Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="text-5xl mb-2">🐟🧺</div>
            <h4 className="text-xl font-black text-white">Cat Catch</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
              Catch falling fish, milk bottles, and stars with the basket. Dodge water drops and alarm clocks!
            </p>
            <button
              onClick={startGame}
              className="mt-5 py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black rounded-xl shadow-lg shadow-pink-500/25 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Game</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="text-4xl mb-1">⭐</div>
            <h4 className="text-xl font-black text-white">Game Over!</h4>
            <p className="text-sm font-bold text-amber-300 font-mono mt-1">
              Final Score: {score}
            </p>

            {rewardMsg && (
              <div className="mt-3 text-xs font-bold text-amber-300 bg-amber-950/50 p-2 rounded-xl border border-amber-800/40">
                {rewardMsg}
              </div>
            )}

            <button
              onClick={startGame}
              className="mt-4 py-2.5 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black rounded-xl shadow-lg transition-all"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className={`text-center text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        Drag the cat basket left and right!
      </div>
    </div>
  );
};
