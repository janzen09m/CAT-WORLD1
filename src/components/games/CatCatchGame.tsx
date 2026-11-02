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
  theme = 'light',
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
    spawnInterval: 65,
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
    s.spawnInterval = 65;

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

    const loop = () => {
      const s = stateRef.current;
      s.frame++;

      // Spawn items
      if (s.frame % s.spawnInterval === 0) {
        const types: ('fish' | 'milk' | 'star' | 'water' | 'clock')[] = [
          'fish', 'fish', 'milk', 'star', 'water', 'clock'
        ];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const itemSpeed = 2.4 + Math.random() * 2 + Math.min(3, s.score / 150);

        s.items.push({
          id: s.frame,
          x: 20 + Math.random() * (s.canvasWidth - 40),
          y: -20,
          speed: itemSpeed,
          type: chosenType,
        });

        // Speed up spawn interval slightly
        if (s.spawnInterval > 35 && s.frame % 300 === 0) {
          s.spawnInterval -= 3;
        }
      }

      // Move items and check collisions
      const basketY = s.canvasHeight - 40;
      const remainingItems: FallingItem[] = [];

      for (const item of s.items) {
        item.y += item.speed;

        // Collision with basket
        if (
          item.y >= basketY - 10 &&
          item.y <= basketY + s.basketHeight &&
          item.x >= s.basketX - 10 &&
          item.x <= s.basketX + s.basketWidth + 10
        ) {
          if (item.type === 'fish') {
            s.score += 15;
            soundManager.playPop();
            triggerHaptic('light');
          } else if (item.type === 'milk') {
            s.score += 25;
            soundManager.playCoin();
            triggerHaptic('light');
          } else if (item.type === 'star') {
            s.score += 50;
            soundManager.playCoin();
            triggerHaptic('medium');
          } else if (item.type === 'water') {
            s.lives--;
            soundManager.playError();
            triggerHaptic('heavy');
            setLives(s.lives);
            if (s.lives <= 0) {
              endGame(s.score);
              return;
            }
          } else if (item.type === 'clock') {
            s.lives--;
            soundManager.playError();
            triggerHaptic('heavy');
            setLives(s.lives);
            if (s.lives <= 0) {
              endGame(s.score);
              return;
            }
          }
          setScore(s.score);
          continue;
        }

        // Off screen
        if (item.y > s.canvasHeight + 20) {
          if (item.type === 'fish' || item.type === 'milk') {
            // missed good item
          }
          continue;
        }

        remainingItems.push(item);
      }

      s.items = remainingItems;

      // Draw canvas
      drawGame(ctx, s);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState]);

  const endGame = async (finalScore: number) => {
    setGameState('gameover');
    soundManager.playWinFanfare();
    triggerHaptic('success');

    try {
      const res = await onGameComplete(finalScore);
      if (res?.coinsEarned) {
        setRewardMsg(`+${res.coinsEarned} Münzen verdient! 🪙`);
      }
    } catch {
      // ignore
    }
  };

  const drawGame = (ctx: CanvasRenderingContext2D, s: typeof stateRef.current) => {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, s.canvasHeight);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

    // Stars in background
    ctx.fillStyle = '#f8fafc';
    for (let i = 0; i < 20; i++) {
      const sx = (i * 47) % s.canvasWidth;
      const sy = (i * 31) % (s.canvasHeight - 80);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Falling items
    for (const item of s.items) {
      let emoji = '🐟';
      if (item.type === 'milk') emoji = '🥛';
      if (item.type === 'star') emoji = '⭐';
      if (item.type === 'water') emoji = '💧';
      if (item.type === 'clock') emoji = '⏰';

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, item.x, item.y);
    }

    // Cat Basket
    const basketY = s.canvasHeight - 40;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(s.basketX, basketY, s.basketWidth, s.basketHeight, 8);
    ctx.fill();

    // Basket Weave Lines
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.basketX + 15, basketY);
    ctx.lineTo(s.basketX + 15, basketY + s.basketHeight);
    ctx.moveTo(s.basketX + 30, basketY);
    ctx.lineTo(s.basketX + 30, basketY + s.basketHeight);
    ctx.moveTo(s.basketX + 45, basketY);
    ctx.lineTo(s.basketX + 45, basketY + s.basketHeight);
    ctx.stroke();

    // Cat paw on basket
    ctx.font = '16px sans-serif';
    ctx.fillText('🐾', s.basketX + s.basketWidth / 2, basketY + 15);
  };

  return (
    <div className="space-y-3 max-w-sm mx-auto select-none">
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
          Katzen-Fangspiel
        </h3>

        <div className="w-8" />
      </div>

      {/* HUD Score & Lives */}
      <div className={`p-2.5 rounded-2xl flex items-center justify-between text-xs font-mono border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Leben:</span>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Heart
              key={idx}
              className={`w-4 h-4 ${
                idx < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          ))}
        </div>

        <div>
          <span className="text-slate-400">Punkte: </span>
          <span className="text-base font-black text-amber-500">{score}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950 flex justify-center">
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
            <h4 className="text-xl font-black text-white">Katzen-Fangspiel</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
              Fange fallende Fische, Milchflaschen und Sterne mit dem Korb. Weiche Wassertropfen und Weckern aus!
            </p>
            <button
              onClick={startGame}
              className="mt-5 py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black rounded-xl shadow-lg shadow-pink-500/25 flex items-center gap-2 text-xs"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Spiel starten</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="text-4xl mb-1">⭐</div>
            <h4 className="text-xl font-black text-white">Spiel vorbei!</h4>
            <p className="text-sm font-bold text-amber-300 font-mono mt-1">
              Endergebnis: {score} Punkte
            </p>

            {rewardMsg && (
              <div className="mt-3 text-xs font-bold text-amber-300 bg-amber-950/50 p-2 rounded-xl border border-amber-800/40">
                {rewardMsg}
              </div>
            )}

            <button
              onClick={startGame}
              className="mt-4 py-2.5 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black rounded-xl shadow-lg transition-all text-xs"
            >
              Erneut spielen
            </button>
          </div>
        )}
      </div>

      <div className={`text-center text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        Ziehe den Katzenkorb nach links und rechts!
      </div>
    </div>
  );
};
