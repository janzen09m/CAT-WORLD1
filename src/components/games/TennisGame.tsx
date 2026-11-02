import React, { useRef, useEffect, useState } from 'react';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ArrowLeft, Play, RefreshCw, Trophy } from 'lucide-react';
import { Theme } from '../../types/game';

interface TennisGameProps {
  onBack: () => void;
  onGameComplete: (outcome: 'win' | 'loss', score: number) => Promise<{ coinsEarned: number }>;
  theme?: Theme;
}

export const TennisGame: React.FC<TennisGameProps> = ({
  onBack,
  onGameComplete,
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [rallyCount, setRallyCount] = useState<number>(0);
  const [matchWinner, setMatchWinner] = useState<'player' | 'ai' | null>(null);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  // Mutable game physics refs
  const physicsRef = useRef({
    ballX: 150,
    ballY: 200,
    ballSpeedX: 3,
    ballSpeedY: -4,
    ballRadius: 7,
    playerX: 120,
    playerWidth: 64,
    aiX: 120,
    aiWidth: 64,
    paddleHeight: 12,
    canvasWidth: 320,
    canvasHeight: 440,
    rally: 0,
    targetScore: 3,
  });

  const animFrameId = useRef<number | null>(null);

  const resetBall = (direction: 'up' | 'down') => {
    const p = physicsRef.current;
    p.ballX = p.canvasWidth / 2;
    p.ballY = p.canvasHeight / 2;
    p.ballSpeedX = (Math.random() - 0.5) * 4;
    p.ballSpeedY = direction === 'up' ? -4 : 4;
  };

  const startGame = () => {
    soundManager.playClick();
    setPlayerScore(0);
    setAiScore(0);
    setRallyCount(0);
    setMatchWinner(null);
    setRewardMsg(null);
    resetBall('up');
    setGameState('playing');
  };

  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    const scaleX = physicsRef.current.canvasWidth / rect.width;
    const gameX = touchX * scaleX;

    const p = physicsRef.current;
    p.playerX = Math.max(0, Math.min(p.canvasWidth - p.playerWidth, gameX - p.playerWidth / 2));
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPlayerScore = playerScore;
    let localAiScore = aiScore;

    const gameLoop = () => {
      const p = physicsRef.current;

      // 1. Move AI Paddle
      const aiTarget = p.ballX - p.aiWidth / 2;
      const aiSpeed = 2.8 + Math.min(2, p.rally * 0.15);
      p.aiX += (aiTarget - p.aiX) * 0.08 * aiSpeed;
      p.aiX = Math.max(0, Math.min(p.canvasWidth - p.aiWidth, p.aiX));

      // 2. Move Ball
      p.ballX += p.ballSpeedX;
      p.ballY += p.ballSpeedY;

      // Wall bounce
      if (p.ballX - p.ballRadius <= 0) {
        p.ballX = p.ballRadius;
        p.ballSpeedX = Math.abs(p.ballSpeedX);
        soundManager.playPop();
      } else if (p.ballX + p.ballRadius >= p.canvasWidth) {
        p.ballX = p.canvasWidth - p.ballRadius;
        p.ballSpeedX = -Math.abs(p.ballSpeedX);
        soundManager.playPop();
      }

      // Paddle AI bounce (Top paddle)
      const aiPaddleY = 24;
      if (
        p.ballY - p.ballRadius <= aiPaddleY + p.paddleHeight &&
        p.ballY - p.ballRadius >= aiPaddleY &&
        p.ballX >= p.aiX &&
        p.ballX <= p.aiX + p.aiWidth &&
        p.ballSpeedY < 0
      ) {
        p.ballSpeedY = Math.abs(p.ballSpeedY) * 1.05; // speed up slightly
        const hitOffset = (p.ballX - (p.aiX + p.aiWidth / 2)) / (p.aiWidth / 2);
        p.ballSpeedX = hitOffset * 4.5;
        p.rally++;
        setRallyCount(p.rally);
        soundManager.playPop();
        triggerHaptic('light');
      }

      // Paddle Player bounce (Bottom paddle)
      const playerPaddleY = p.canvasHeight - 24 - p.paddleHeight;
      if (
        p.ballY + p.ballRadius >= playerPaddleY &&
        p.ballY + p.ballRadius <= playerPaddleY + p.paddleHeight &&
        p.ballX >= p.playerX &&
        p.ballX <= p.playerX + p.playerWidth &&
        p.ballSpeedY > 0
      ) {
        p.ballSpeedY = -Math.abs(p.ballSpeedY) * 1.05;
        const hitOffset = (p.ballX - (p.playerX + p.playerWidth / 2)) / (p.playerWidth / 2);
        p.ballSpeedX = hitOffset * 5;
        p.rally++;
        setRallyCount(p.rally);
        soundManager.playPop();
        triggerHaptic('medium');
      }

      // Check Scored: Player scores (Ball goes past top)
      if (p.ballY - p.ballRadius <= 0) {
        localPlayerScore++;
        setPlayerScore(localPlayerScore);
        p.rally = 0;
        setRallyCount(0);
        soundManager.playCoin();
        triggerHaptic('success');

        if (localPlayerScore >= p.targetScore) {
          endGame('player', localPlayerScore);
          return;
        } else {
          resetBall('down');
        }
      }

      // AI scores (Ball goes past bottom)
      if (p.ballY + p.ballRadius >= p.canvasHeight) {
        localAiScore++;
        setAiScore(localAiScore);
        p.rally = 0;
        setRallyCount(0);
        soundManager.playError();
        triggerHaptic('warning');

        if (localAiScore >= p.targetScore) {
          endGame('ai', localPlayerScore);
          return;
        } else {
          resetBall('up');
        }
      }

      // Draw Everything
      drawCourt(ctx, p);

      animFrameId.current = requestAnimationFrame(gameLoop);
    };

    animFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState]);

  const endGame = async (winner: 'player' | 'ai', finalScore: number) => {
    setGameState('gameover');
    setMatchWinner(winner);

    if (winner === 'player') {
      soundManager.playWinFanfare();
      triggerHaptic('success');
    } else {
      soundManager.playError();
    }

    try {
      const res = await onGameComplete(winner === 'player' ? 'win' : 'loss', finalScore);
      if (res?.coinsEarned) {
        setRewardMsg(`+${res.coinsEarned} Münzen verdient! 🪙`);
      }
    } catch {
      // ignore
    }
  };

  const drawCourt = (ctx: CanvasRenderingContext2D, p: typeof physicsRef.current) => {
    // Background Court
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, p.canvasWidth, p.canvasHeight);

    // Court Lines
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, p.canvasWidth - 24, p.canvasHeight - 24);

    // Center Net Line
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(12, p.canvasHeight / 2);
    ctx.lineTo(p.canvasWidth - 12, p.canvasHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // AI Paddle (Cat face icon representation)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(p.aiX, 24, p.aiWidth, p.paddleHeight, 6);
    ctx.fill();

    // AI Cat Ears
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(p.aiX + 8, 24);
    ctx.lineTo(p.aiX + 16, 14);
    ctx.lineTo(p.aiX + 24, 24);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.aiX + p.aiWidth - 24, 24);
    ctx.lineTo(p.aiX + p.aiWidth - 16, 14);
    ctx.lineTo(p.aiX + p.aiWidth - 8, 24);
    ctx.fill();

    // Player Paddle
    const playerPaddleY = p.canvasHeight - 24 - p.paddleHeight;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(p.playerX, playerPaddleY, p.playerWidth, p.paddleHeight, 6);
    ctx.fill();

    // Player Cat Ears
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(p.playerX + 8, playerPaddleY + p.paddleHeight);
    ctx.lineTo(p.playerX + 16, playerPaddleY + p.paddleHeight + 10);
    ctx.lineTo(p.playerX + 24, playerPaddleY + p.paddleHeight);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.playerX + p.playerWidth - 24, playerPaddleY + p.paddleHeight);
    ctx.lineTo(p.playerX + p.playerWidth - 16, playerPaddleY + p.paddleHeight + 10);
    ctx.lineTo(p.playerX + p.playerWidth - 8, playerPaddleY + p.paddleHeight);
    ctx.fill();

    // Tennis Ball (Neon Yellow Cat Yarn)
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.ballX, p.ballY, p.ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  return (
    <div className="space-y-3 max-w-sm mx-auto select-none">
      {/* Header Bar */}
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
          Katzen-Tennis Arcade
        </h3>

        <div className="w-8" />
      </div>

      {/* Score HUD */}
      <div className={`p-2.5 rounded-2xl flex items-center justify-around text-center border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div>
          <span className="text-[10px] text-rose-500 font-bold block">Katzen-KI (Rot)</span>
          <span className={`text-2xl font-black font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>{aiScore}</span>
        </div>
        <div className={`px-3 border-x ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <span className="text-[10px] text-amber-500 font-bold block">Ballwechsel</span>
          <span className={`text-sm font-bold font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{rallyCount}</span>
        </div>
        <div>
          <span className="text-[10px] text-sky-500 font-bold block">Du (Blau)</span>
          <span className={`text-2xl font-black font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>{playerScore}</span>
        </div>
      </div>

      {/* Interactive Canvas Court Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-900 bg-emerald-950 flex justify-center">
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
            <div className="text-5xl mb-2">🎾</div>
            <h4 className="text-xl font-black text-white">Katzen-Tennis</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-[220px]">
              Bewege deinen Schläger mit dem Finger nach links und rechts. Wer zuerst 3 Punkte hat, gewinnt!
            </p>
            <button
              onClick={startGame}
              className="mt-5 py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 text-xs"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Match starten</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="text-4xl mb-1">
              {matchWinner === 'player' ? '🏆' : '😿'}
            </div>
            <h4 className="text-xl font-black text-white">
              {matchWinner === 'player' ? 'Match-Sieg!' : 'Match-Niederlage!'}
            </h4>
            <p className="text-sm font-bold text-slate-300 font-mono mt-1">
              Endergebnis: {playerScore} - {aiScore}
            </p>

            {rewardMsg && (
              <div className="mt-3 text-xs font-bold text-amber-300 bg-amber-950/50 p-2 rounded-xl border border-amber-800/40">
                {rewardMsg}
              </div>
            )}

            <button
              onClick={startGame}
              className="mt-4 py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-xl shadow-lg transition-all text-xs"
            >
              Revanche spielen
            </button>
          </div>
        )}
      </div>

      <div className={`text-center text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        Tipp: Triff den Ball am Schlägerrand für scharfe Winkel!
      </div>
    </div>
  );
};
