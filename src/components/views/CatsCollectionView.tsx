import React, { useState, useMemo } from 'react';
import { PlayerData, CatSkin, Rarity, Theme } from '../../types/game';
import { CAT_SKINS, RARITY_CONFIG } from '../../data/catsData';
import { CatCard } from '../CatCard';
import { CatDetailModal } from '../CatDetailModal';
import { soundManager } from '../../utils/audio';
import { Search, Filter, Star, Sparkles, CheckCircle2 } from 'lucide-react';

interface CatsCollectionViewProps {
  player: PlayerData;
  onEquipCat: (catId: string) => Promise<void>;
  onToggleFavorite: (catId: string) => Promise<void>;
  onGoToShop: () => void;
  theme?: Theme;
}

export const CatsCollectionView: React.FC<CatsCollectionViewProps> = ({
  player,
  onEquipCat,
  onToggleFavorite,
  onGoToShop,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'unowned' | 'favorites'>('all');
  const [inspectCat, setInspectCat] = useState<CatSkin | null>(null);

  const isLight = theme === 'light';
  const totalSkinsCount = CAT_SKINS.length;
  const ownedCatsCount = Object.keys(player.ownedCats).length;
  const progressPercent = Math.round((ownedCatsCount / totalSkinsCount) * 100);

  // Filtered cats
  const filteredCats = useMemo(() => {
    return CAT_SKINS.filter(cat => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = cat.name.toLowerCase().includes(query);
        const matchesDesc = cat.description.toLowerCase().includes(query);
        const matchesCategory = cat.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      // Rarity
      if (selectedRarity !== 'all' && cat.rarity !== selectedRarity) {
        return false;
      }

      // Ownership
      const isOwned = !!player.ownedCats[cat.id];
      const isFav = player.ownedCats[cat.id]?.isFavorite;

      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'unowned' && isOwned) return false;
      if (ownershipFilter === 'favorites' && !isFav) return false;

      return true;
    });
  }, [searchQuery, selectedRarity, ownershipFilter, player.ownedCats]);

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Header Progress Card */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 to-indigo-950/70 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className={`text-base font-black flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Cat Collection</span>
              <span className="text-xs text-purple-500 font-mono">({ownedCatsCount} / {totalSkinsCount})</span>
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Collect all 52 unique cat skins in the world!
            </p>
          </div>
          <span className="text-sm font-black font-mono text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/30">
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
          isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700/60'
        }`}>
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search cats (e.g. Gold, Galaxy, White, Ninja)..."
            className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-pink-500 border transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-xs'
                : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Ownership Segmented Filter */}
        <div className={`rounded-xl p-1 grid grid-cols-4 gap-1 text-[11px] font-bold border ${
          isLight
            ? 'bg-slate-100 border-slate-200 text-slate-600'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'owned', label: 'Owned' },
              { id: 'unowned', label: 'Locked' },
              { id: 'favorites', label: 'Favorites' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setOwnershipFilter(tab.id);
              }}
              className={`py-1.5 rounded-lg text-center transition-all ${
                ownershipFilter === tab.id
                  ? isLight
                    ? 'bg-white text-pink-600 shadow-xs font-black'
                    : 'bg-slate-800 text-pink-400 shadow-sm font-black'
                  : 'hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rarity Horizontal Pill Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px] font-bold">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedRarity('all');
            }}
            className={`px-3 py-1 rounded-full shrink-0 border transition-all ${
              selectedRarity === 'all'
                ? isLight
                  ? 'bg-slate-900 text-white border-slate-900 font-black'
                  : 'bg-white text-slate-900 border-white font-black'
                : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Rarities
          </button>

          {(Object.keys(RARITY_CONFIG) as Rarity[]).map(r => {
            const meta = RARITY_CONFIG[r];
            const isSelected = selectedRarity === r;

            return (
              <button
                key={r}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedRarity(r);
                }}
                className={`px-3 py-1 rounded-full shrink-0 border transition-all font-mono ${
                  isSelected
                    ? 'border-white text-white font-black shadow-sm'
                    : isLight
                    ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                style={{
                  backgroundColor: isSelected ? meta.color : undefined,
                  borderColor: isSelected ? meta.color : undefined,
                }}
              >
                {meta.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cats Grid */}
      {filteredCats.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center text-xs border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-500'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <div className="text-3xl mb-2">🔍</div>
          <p>No matching cats found with these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {filteredCats.map(cat => (
            <CatCard
              key={cat.id}
              cat={cat}
              player={player}
              onSelect={c => setInspectCat(c)}
              onToggleFavorite={onToggleFavorite}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* 4. Cat Details Modal */}
      {inspectCat && (
        <CatDetailModal
          cat={inspectCat}
          player={player}
          onClose={() => setInspectCat(null)}
          onEquip={async id => {
            await onEquipCat(id);
            setInspectCat(null);
          }}
          onToggleFavorite={onToggleFavorite}
          onGoToShop={onGoToShop}
          theme={theme}
        />
      )}
    </div>
  );
};
