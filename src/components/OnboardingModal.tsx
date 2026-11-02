import React, { useState } from 'react';
import { PlayerData, Theme } from '../types/game';
import { CatIllustration } from './CatIllustration';
import { GET_CAT_BY_ID } from '../data/catsData';
import { soundManager } from '../utils/audio';
import { triggerHaptic, getTelegramUser } from '../utils/telegram';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Dices } from 'lucide-react';

interface OnboardingModalProps {
  player: PlayerData;
  onComplete: (playerName: string, catCustomName: string) => Promise<void>;
  theme?: Theme;
}

const RANDOM_PLAYER_NAMES = [
  'KatzenKaiser',
  'MiauRitter',
  'WhiskersPro',
  'SternenJäger',
  'PfotenMeister',
  'SamtPfote',
  'LunaMaster',
  'CosmicClaws',
  'CatChampion',
  'FellFreund',
  'ShadowPaws',
  'TigerHerz',
  'SilberSchweif',
  'GoldTatze',
  'SchnurrLord',
  'KaterKönig',
];

const RANDOM_CAT_NAMES = [
  'Schneeflöckchen',
  'Simba',
  'Mimi',
  'Loki',
  'Nala',
  'Muffin',
  'Peaches',
  'Luna',
  'Felix',
  'Balu',
  'Oreo',
  'Keks',
  'Flöckchen',
  'Casper',
  'Sammy',
  'Bella',
  'Cleo',
  'Barnaby',
  'Gismo',
  'Whiskers',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  player,
  onComplete,
  theme = 'light',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const tgUser = getTelegramUser();
  const initialGreetingName = tgUser?.first_name || tgUser?.name;

  const [playerNameInput, setPlayerNameInput] = useState(() => {
    if (initialGreetingName) return initialGreetingName;
    if (player.playerName && player.playerName !== 'Katzenfreund') return player.playerName;
    return 'Katzenfreund';
  });

  const [catNameInput, setCatNameInput] = useState(player.catCustomName || 'Schneeflöckchen');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whiteCat = GET_CAT_BY_ID('cat-01');
  const isLight = theme === 'light';

  const handleRandomizePlayerName = () => {
    soundManager.playPop();
    triggerHaptic('light');
    const randomPick = RANDOM_PLAYER_NAMES[Math.floor(Math.random() * RANDOM_PLAYER_NAMES.length)];
    setPlayerNameInput(randomPick);
  };

  const handleRandomizeCatName = () => {
    soundManager.playPop();
    triggerHaptic('light');
    const randomPick = RANDOM_CAT_NAMES[Math.floor(Math.random() * RANDOM_CAT_NAMES.length)];
    setCatNameInput(randomPick);
  };

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
      await onComplete(playerNameInput.trim() || 'Katzenfreund', catNameInput.trim() || 'Schneeflöckchen');
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

        {/* Step 1: Willkommen & Spielername mit Telegram-Begrüßung & Würfel */}
        {step === 1 && (
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30">
              <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
            </div>

            <div>
              {/* Telegram-Begrüßung wenn in Telegram geöffnet */}
              {initialGreetingName ? (
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-1">
                    Telegram verbunden
                  </span>
                  <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-300'}`}>
                    Willkommen, {initialGreetingName}! 🐱
                  </h2>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Schön, dass du da bist! Dein Telegram-Fortschritt wird ab sofort dauerhaft gespeichert.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-300'}`}>
                    Willkommen in CAT WORLD!
                  </h2>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                    Sammle über 50+ einzigartige Katzen, öffne geheimnisvolle Truhen und meistere Minispiele.
                  </p>
                </div>
              )}
            </div>

            <div className={`rounded-2xl p-3.5 text-left border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/80 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Konto-ID:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  {player.id}
                </span>
              </div>

              <div className="flex items-center justify-between mb-1">
                <label className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  Dein Spielername:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Würfeln zum Ändern</span>
              </div>

              {/* Name Input with Dice Icon Button */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={playerNameInput}
                  onChange={e => setPlayerNameInput(e.target.value)}
                  maxLength={20}
                  placeholder="Spielername eingeben..."
                  className={`w-full rounded-xl pl-3 pr-11 py-2.5 text-sm font-semibold focus:outline-none focus:border-pink-500 border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleRandomizePlayerName}
                  title="Zufälligen Namen würfeln"
                  className="absolute right-1.5 p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-transform active:scale-90 cursor-pointer"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              disabled={!playerNameInput.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-bold rounded-xl text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs cursor-pointer active:scale-95"
            >
              <span>Weiter zu deiner Starter-Katze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Name des ersten Begleiters mit Würfel */}
        {step === 2 && (
          <div className="text-center space-y-4">
            <div className="flex justify-center -my-2">
              <CatIllustration cat={whiteCat} size={130} />
            </div>

            <div>
              <span className="text-[11px] font-bold text-pink-500 tracking-wider uppercase">
                Dein Starter-Gefährte
              </span>
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Die Weiße Katze
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Gib deinem ersten treuen Gefährten einen Kosenamen oder würfle einen aus!
              </p>
            </div>

            <div className={`rounded-2xl p-3.5 text-left border ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/80 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className={`block text-xs font-bold flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  Katzenname:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Würfeln zum Ändern</span>
              </div>

              {/* Cat Name Input with Dice Button */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={catNameInput}
                  onChange={e => setCatNameInput(e.target.value)}
                  maxLength={20}
                  placeholder="z.B. Schneeflöckchen, Luna, Simba..."
                  className={`w-full rounded-xl pl-3 pr-11 py-2.5 text-sm font-semibold focus:outline-none focus:border-pink-500 border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleRandomizeCatName}
                  title="Zufälligen Katzennamen würfeln"
                  className="absolute right-1.5 p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-transform active:scale-90 cursor-pointer"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              disabled={!catNameInput.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-bold rounded-xl text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs cursor-pointer active:scale-95"
            >
              <span>Starter-Paket ansehen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Starter Pack Zusammenfassung */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div>
              <div className="text-3xl mb-1">🎁</div>
              <h2 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Dein kostenloses Starter-Paket!
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Alles, was du für den Start und deine ersten Kistenfunde brauchst!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">🐱</div>
                <div>
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{catNameInput}</div>
                  <div className="text-[10px] text-slate-400">Weiße Katze (Ausgerüstet)</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">🪙</div>
                <div>
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>500 Münzen</div>
                  <div className="text-[10px] text-slate-400">Startkapital</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">🗝️</div>
                <div>
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>2x Holzschlüssel</div>
                  <div className="text-[10px] text-slate-400">Sofort 2 Kisten öffnen</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-2xl flex items-center gap-2 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <div className="text-xl">💎</div>
                <div>
                  <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>1x Blauer Schlüssel</div>
                  <div className="text-[10px] text-slate-400">Für Saphir-Kiste</div>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border text-xs text-left ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
            }`}>
              <p className="font-bold">✨ Trainer & Katze:</p>
              <p className="text-[11px] mt-0.5">
                Trainer: <strong>{playerNameInput}</strong> • Begleiter: <strong>{catNameInput}</strong>
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-black rounded-xl text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Wird gestartet...' : 'Ins Spiel starten!'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
