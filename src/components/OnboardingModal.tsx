import React, { useState } from 'react';
import { PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { GET_CAT_BY_ID } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

interface OnboardingModalProps {
  player: PlayerData;
  onComplete: (playerName: string, catCustomName: string) => Promise<void>;
  theme?: Theme;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  player,
  onComplete,
  theme = 'dark',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [playerNameInput, setPlayerNameInput] = useState(player.playerName || 'Cat Lover');
  const [catNameInput, setCatNameInput] = useState(player.catCustomName || 'Snowflake');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whiteCat = GET_CAT_BY_ID('cat-01');
  const isLight = theme === 'light';

  const handleNextStep = () => {
    soundManager.playClick();
    triggerHaptic('light');
    if (step < 3) {
      setStep((step + 1) as 2 | 3);
    }
  };

  const handleFinish = async () => {
    soundManager.playWinFanfare();
    triggerHaptic('success');
    setIsSubmitting(true);
    try {
      await onComplete(playerNameInput.trim() || 'Cat Lover', catNameInput.trim() || 'Snowflake');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${
        isLight
          ? 'bg-gradient-to-b from-white to-slate-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/30 text-white'
      }`}>
        {/* Glow orbs */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-pink-500' : isLight ? 'w-2 bg-slate-200' : 'w-2 bg-slate-700'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-pink-500' : isLight ? 'w-2 bg-slate-200' : 'w-2 bg-slate-700'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-pink-500' : isLight ? 'w-2 bg-slate-200' : 'w-2 bg-slate-700'}`} />
        </div>

        {/* Step 1: Welcome & Player ID */}
        {step === 1 && (
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30">
              <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-300'}`}>
                Welcome to CAT WORLD!
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Collect 50+ rare feline skins, open mysterious chests, and play arcade minigames.
              </p>
            </div>

            <div className={`rounded-2xl p-3 text-left border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/80 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Unique Player ID:
                </span>
                <span className="font-mono text-emerald-500 font-bold">{player.id}</span>
              </div>
              <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                What is your player name?
              </label>
              <input
                type="text"
                value={playerNameInput}
                onChange={e => setPlayerNameInput(e.target.value)}
                maxLength={20}
                placeholder="Enter player name..."
                className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-500 border ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <button
              onClick={handleNextStep}
              disabled={!playerNameInput.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-bold rounded-xl text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>Next to Your First Cat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: First Cat Name */}
        {step === 2 && (
          <div className="text-center space-y-4">
            <div className="flex justify-center -my-2">
              <CatIllustration cat={whiteCat} size={130} />
            </div>

            <div>
              <span className="text-[11px] font-bold text-pink-500 tracking-wider uppercase">
                Your Starting Companion
              </span>
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                The White Cat
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Give your loyal first companion a special custom name!
              </p>
            </div>

            <div className={`rounded-2xl p-3 text-left border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/80 border-slate-700/60'
            }`}>
              <label className={`block text-xs font-bold mb-1 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <Heart className="w-3.5 h-3.5 text-pink-500" />
                Cat Name:
              </label>
              <input
                type="text"
                value={catNameInput}
                onChange={e => setCatNameInput(e.target.value)}
                maxLength={20}
                placeholder="e.g. Snowflake, Luna, Mittens..."
                className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-500 border ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <button
              onClick={handleNextStep}
              disabled={!catNameInput.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-bold rounded-xl text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>View Starter Bundle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Starter Pack Summary */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div>
              <div className="text-3xl mb-1">🎁</div>
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Your Free Starter Bundle!
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Everything you need to begin your journey and open your first chests!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">🐱</div>
                <div>
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{catNameInput}</div>
                  <div className="text-[10px] text-slate-400">White Cat (Equipped)</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">🪙</div>
                <div>
                  <div className="font-bold text-amber-500">300 Coins</div>
                  <div className="text-[10px] text-slate-400">Starting Balance</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">🗝️</div>
                <div>
                  <div className="font-bold text-blue-500">3 Keys</div>
                  <div className="text-[10px] text-slate-400">2x Wooden, 1x Blue</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-black rounded-xl text-white shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>{isSubmitting ? 'Saving...' : '🐱 Enter Cat World!'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
