import React, { useState, useEffect } from 'react';
import { CAT_SKINS } from '../../data/catsData';
import { CatIllustration } from '../CatIllustration';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Theme } from '../../types/game';

interface MemoryGameProps {
  onBack: () => void;
  onGameComplete: (outcome: 'win', moves: number) => Promise<{ coinsEarned: number }>;
  theme?: Theme;
}

interface CardItem {
  uid: number;
  catId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({
  onBack,
  onGameComplete,
  theme = 'light',
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  const isLight = theme === 'light';

  // Initialize 8 pairs (16 cards)
  const setupGame = () => {
    const shuffledCats = [...CAT_SKINS].sort(() => 0.5 - Math.random()).slice(0, 8);
    const deck: CardItem[] = [];

    shuffledCats.forEach((cat, idx) => {
      deck.push({ uid: idx * 2, catId: cat.id, isFlipped: false, isMatched: false });
      deck.push({ uid: idx * 2 + 1, catId: cat.id, isFlipped: false, isMatched: false });
    });

    deck.sort(() => 0.5 - Math.random());
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatchesFound(0);
    setIsGameOver(false);
    setRewardMsg(null);
  };

  useEffect(() => {
    setupGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2 || isGameOver) {
      return;
    }

    soundManager.playPop();
    triggerHaptic('light');

    const nextCards = [...cards];
    nextCards[index].isFlipped = true;
    setCards(nextCards);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].catId === cards[secondIdx].catId) {
        // Matched
        setTimeout(() => {
          soundManager.playCoin();
          triggerHaptic('success');
          nextCards[firstIdx].isMatched = true;
          nextCards[secondIdx].isMatched = true;
          setCards([...nextCards]);
          setFlippedIndices([]);

          const nextMatches = matchesFound + 1;
          setMatchesFound(nextMatches);

          if (nextMatches >= 8) {
            handleWin(moves + 1);
          }
        }, 450);
      } else {
        // Not a match
        setTimeout(() => {
          nextCards[firstIdx].isFlipped = false;
          nextCards[secondIdx].isFlipped = false;
          setCards([...nextCards]);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleWin = async (finalMoves: number) => {
    setIsGameOver(true);
    soundManager.playWinFanfare();
    triggerHaptic('success');

    try {
      const res = await onGameComplete('win', finalMoves);
      if (res?.coinsEarned) {
        setRewardMsg(`+${res.coinsEarned} Münzen verdient! 🪙`);
      }
    } catch {
      // ignore
    }
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
          Katzen-Memory
        </h3>

        <button
          onClick={() => {
            soundManager.playClick();
            setupGame();
          }}
          className={`p-2 rounded-xl transition-colors ${
            isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Neu starten"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats HUD */}
      <div className={`p-2.5 rounded-2xl flex items-center justify-around text-xs font-mono border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div>
          <span className="text-slate-400 block text-[10px]">Züge:</span>
          <span className={`text-base font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>{moves}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Paare gefunden:</span>
          <span className="text-base font-black text-pink-500">{matchesFound} / 8</span>
        </div>
      </div>

      {/* 4x4 Memory Grid */}
      <div className={`grid grid-cols-4 gap-2 p-3 rounded-2xl shadow-xl border ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-700/80'
      }`}>
        {cards.map((card, idx) => {
          const cat = CAT_SKINS.find(c => c.id === card.catId) || CAT_SKINS[0];

          return (
            <button
              key={card.uid}
              onClick={() => handleCardClick(idx)}
              disabled={card.isFlipped || card.isMatched || isGameOver}
              className={`aspect-square rounded-xl p-1 flex items-center justify-center transition-all duration-300 relative ${
                card.isMatched
                  ? isLight ? 'bg-emerald-50 border border-emerald-300 opacity-90' : 'bg-emerald-950/40 border border-emerald-500/50 opacity-90'
                  : card.isFlipped
                  ? isLight ? 'bg-white border-2 border-pink-500 shadow-md scale-95' : 'bg-slate-800 border-2 border-pink-500 shadow-md scale-95'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95'
                  : 'bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 hover:border-slate-500 active:scale-95'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="flex flex-col items-center">
                  <CatIllustration cat={cat} size={50} isAnimated={false} />
                  <span className={`text-[8px] font-bold truncate max-w-full ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {cat.name.slice(0, 8)}
                  </span>
                </div>
              ) : (
                <span className="text-xl">🐾</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Victory modal */}
      {isGameOver && (
        <div className={`rounded-2xl p-4 text-center space-y-3 animate-in fade-in duration-200 border ${
          isLight ? 'bg-white border-purple-200 shadow-md text-slate-800' : 'bg-slate-800/95 border-purple-500/30 text-white'
        }`}>
          <div className="text-3xl">🎉🐱🎉</div>
          <div className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Hervorragendes Gedächtnis!</div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Du hast alle Paare in {moves} Zügen aufgedeckt.</p>

          {rewardMsg && (
            <div className={`text-xs font-bold p-2 rounded-xl border ${
              isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
            }`}>
              {rewardMsg}
            </div>
          )}

          <button
            onClick={() => {
              soundManager.playClick();
              setupGame();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-bold text-xs rounded-xl text-white shadow-lg transition-all"
          >
            Neue Runde spielen
          </button>
        </div>
      )}
    </div>
  );
};
