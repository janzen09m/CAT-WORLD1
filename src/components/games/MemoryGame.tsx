import React, { useState, useEffect } from 'react';
import { CAT_SKINS } from '../../data/catsData';
import { CatIllustration } from '../CatIllustration';
import { soundManager } from '../../utils/audio';
import { triggerHaptic } from '../../utils/telegram';
import { ArrowLeft, RefreshCw, Trophy, Timer } from 'lucide-react';
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
  theme = 'dark',
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
    // Pick 8 random distinct cats
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
    if (
      flippedIndices.length >= 2 ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      isGameOver
    ) {
      return;
    }

    soundManager.playClick();
    triggerHaptic('light');

    const nextFlipped = [...flippedIndices, index];
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(m => m + 1);
      const [idx1, idx2] = nextFlipped;
      const card1 = newCards[idx1];
      const card2 = newCards[idx2];

      if (card1.catId === card2.catId) {
        // MATCH!
        setTimeout(() => {
          soundManager.playCoin();
          triggerHaptic('success');
          card1.isMatched = true;
          card2.isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);

          const nextMatches = matchesFound + 1;
          setMatchesFound(nextMatches);

          if (nextMatches >= 8) {
            handleVictory(moves + 1);
          }
        }, 400);
      } else {
        // NO MATCH -> flip back
        setTimeout(() => {
          card1.isFlipped = false;
          card2.isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleVictory = async (finalMoves: number) => {
    setIsGameOver(true);
    soundManager.playWinFanfare();
    triggerHaptic('success');

    try {
      const res = await onGameComplete('win', finalMoves);
      setRewardMsg(`Found all 8 cat pairs! Earned +${res.coinsEarned} Coins! 🎉`);
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

        <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Cat Memory</h3>

        <button
          onClick={() => {
            soundManager.playClick();
            setupGame();
          }}
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

      {/* Stats row */}
      <div className={`rounded-2xl p-2.5 flex items-center justify-around text-center border ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-800/90 border-slate-700/80'
      }`}>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Pairs Matched</span>
          <span className="text-lg font-black text-emerald-500 font-mono">{matchesFound} / 8</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Moves</span>
          <span className={`text-lg font-black font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>{moves}</span>
        </div>
      </div>

      {/* 4x4 Grid of Cards */}
      <div className={`grid grid-cols-4 gap-2 p-2 rounded-2xl shadow-xl border ${
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
          <div className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Outstanding Memory!</div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>You revealed all pairs in {moves} moves.</p>

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
            Play Another Round
          </button>
        </div>
      )}
    </div>
  );
};
