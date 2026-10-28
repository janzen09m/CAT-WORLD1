import React, { useState } from 'react';
import { Theme } from '../types/game';
import { TOY_TRAIT_CONFIG, BACKGROUND_TRAIT_CONFIG } from '../utils/catGenerator';
import { soundManager } from '../utils/audio';
import { X, Sparkles, Flame, Trophy, Layers, HelpCircle } from 'lucide-react';

interface RarityGuideModalProps {
  onClose: () => void;
  theme?: Theme;
}

export const RarityGuideModal: React.FC<RarityGuideModalProps> = ({
  onClose,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [activeSection, setActiveSection] = useState<'tiers' | 'toys' | 'backgrounds'>('tiers');

  const tiers = [
    {
      stars: 1,
      title: 'Common (Gewöhnlich)',
      tag: '1 Stern ★',
      color: '#64748B',
      desc: '2D-Flachstil. Wilde, schrullige Farbvariationen mit lustigen Persönlichkeiten.',
      chance: 'Kisten: ~60%',
      bonus: 'Basis-Wert: 400 - 800 🪙',
    },
    {
      stars: 2,
      title: 'Uncommon (Ungewöhnlich)',
      tag: '2 Sterne ★★',
      color: '#10B981',
      desc: '2D-Designer-Paletten mit harmonisch abgestimmten Fell-, Bauch- und Augenfarben.',
      chance: 'Kisten: ~25%',
      bonus: 'Basis-Wert: 1.200 - 2.200 🪙',
    },
    {
      stars: 3,
      title: 'Rare (Selten)',
      tag: '3 Sterne ★★★',
      color: '#3B82F6',
      desc: 'Ausdrucksstarke Augen (Anime-Sparkle, Sleepy-Chic), schönere Ohren & ein eigenes Spielzeug neben der Katze!',
      chance: 'Kisten: ~10%',
      bonus: 'Basis-Wert: 3.500 - 5.500 🪙 + Spielzeug',
    },
    {
      stars: 4,
      title: 'Epic (Episch - 3D)',
      tag: '4 Sterne ★★★★',
      color: '#8B5CF6',
      desc: 'Echtes 3D-Volumen-Design! Sphärisches 3D-Shading, Tiefe, Glanz-Highlights & Bodenschatten.',
      chance: 'Kisten: ~4%',
      bonus: 'Basis-Wert: 8.000 - 15.000 🪙',
      isHighlight: true,
    },
    {
      stars: 5,
      title: 'Legendary (Legendär - Flauschig)',
      tag: '5 Sterne ★★★★★',
      color: '#F59E0B',
      desc: 'Flauschiges Fell mit Bäckchenbüscheln, Brustflausch, Plüschohren + einzigartiger animierter Hintergrund!',
      chance: 'Kisten: ~1%',
      bonus: 'Basis-Wert: 25.000 - 45.000 🪙 + Hintergrund',
      isHighlight: true,
    },
    {
      stars: 5,
      title: 'Mythic (Mythisch - 24K Gold Midas)',
      tag: 'Ultra-Gott Tier',
      color: '#FFD700',
      desc: 'Aus reinem 24K Gold geschmiedet, göttliche Aureole, goldene Krone, Trophäe & Thron! Das seltenste Wesen im Universum.',
      chance: 'Kisten: < 0.2%',
      bonus: 'Wert: 250.000 🪙 (Höchster Wert!)',
      isGodTier: true,
    },
  ];

  const toysList = Object.values(TOY_TRAIT_CONFIG).filter(t => t.id !== 'none');
  const bgList = Object.values(BACKGROUND_TRAIT_CONFIG).filter(b => b.id !== 'none');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-3xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 border max-h-[90vh] flex flex-col ${
        isLight
          ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/30 text-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Seltenheits-Guide
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Was ist selten & krass in CAT WORLD?
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className={`p-1.5 rounded-full transition-colors ${
              isLight ? 'bg-slate-100 text-slate-500 hover:text-slate-800' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl text-xs font-bold my-3 shrink-0 ${
          isLight ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800/60 border border-slate-700/60'
        }`}>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveSection('tiers');
            }}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeSection === 'tiers'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            1-5 Sterne
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveSection('toys');
            }}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeSection === 'toys'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            🧸 Spielzeuge
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveSection('backgrounds');
            }}
            className={`py-1.5 rounded-lg text-center transition-all ${
              activeSection === 'backgrounds'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm font-black'
                : isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            🌌 Hintergründe
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          {/* TAB 1: NIVEAU TIERS */}
          {activeSection === 'tiers' && (
            <div className="space-y-2.5">
              {tiers.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    t.isGodTier
                      ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/20 border-amber-400/80 ring-1 ring-amber-400/40'
                      : t.isHighlight
                      ? isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/20 border-purple-800/40'
                      : isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black" style={{ color: t.color }}>
                        {'★'.repeat(t.stars)}
                      </span>
                      <h4 className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {t.title}
                      </h4>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${t.color}20`, color: t.color }}
                    >
                      {t.tag}
                    </span>
                  </div>

                  <p className={`text-[11px] leading-relaxed mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {t.desc}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-700/20">
                    <span className="text-slate-400">{t.chance}</span>
                    <span className="font-bold text-amber-400">{t.bonus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TOYS */}
          {activeSection === 'toys' && (
            <div className="space-y-2">
              <div className={`p-2.5 rounded-xl text-[11px] border mb-2 ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              }`}>
                💡 <strong>Preis-Einfluss:</strong> Jedes Spielzeug hat eine feste Seltenheit und erhöht den Wert deiner Katze direkt um Extra-Münzen!
              </div>

              {toysList.map(toy => (
                <div
                  key={toy.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                    toy.isUltraRare
                      ? 'bg-amber-500/15 border-amber-400/80 ring-1 ring-amber-400/30'
                      : isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{toy.emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {toy.label}
                        </span>
                        {toy.isUltraRare && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            Ultra Krass!
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Drop-Chance: ~{toy.dropChancePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-amber-500 block">
                      +{toy.priceBonus.toLocaleString('de-DE')} 🪙
                    </span>
                    <span className="text-[9px] text-purple-400">
                      +{toy.collectorBonus} Rating
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: BACKGROUNDS */}
          {activeSection === 'backgrounds' && (
            <div className="space-y-2">
              <div className={`p-2.5 rounded-xl text-[11px] border mb-2 ${
                isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300'
              }`}>
                🌌 <strong>Hintergrund-Einfluss:</strong> Hintergründe droppen bei legendären Katzen und machen den Wert extrem gigantisch!
              </div>

              {bgList.map(bg => (
                <div
                  key={bg.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                    bg.isUltraRare
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-400 ring-1 ring-amber-400/30'
                      : isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{bg.emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {bg.label}
                        </span>
                        {bg.isUltraRare && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            God Tier
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Seltenheit: ~{bg.dropChancePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-amber-500 block">
                      +{bg.priceBonus.toLocaleString('de-DE')} 🪙
                    </span>
                    <span className="text-[9px] text-indigo-400">
                      +{bg.collectorBonus} Rating
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/30 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs shadow-md shadow-pink-500/20 active:scale-95 transition-all"
          >
            Verstanden & Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
