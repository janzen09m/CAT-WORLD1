import React, { useState, useMemo } from 'react';
import { PlayerData, CatSkin, Rarity, Theme } from '../../types/game';
import { GET_CAT_BY_ID, RARITY_CONFIG } from '../../data/catsData';
import { CatCard } from '../CatCard';
import { CatDetailModal } from '../CatDetailModal';
import { RarityGuideModal } from '../RarityGuideModal';
import { soundManager } from '../../utils/audio';
import { Search, Star, Sparkles, ArrowRightLeft, ArrowDownUp, PackageOpen, HelpCircle, Flame } from 'lucide-react';

interface CatsCollectionViewProps {
  player: PlayerData;
  onEquipCat: (catId: string) => Promise<void>;
  onToggleFavorite: (catId: string) => Promise<void>;
  onGoToShop: () => void;
  onOpenTradingMarket?: () => void;
  theme?: Theme;
}

export const CatsCollectionView: React.FC<CatsCollectionViewProps> = ({
  player,
  onEquipCat,
  onToggleFavorite,
  onGoToShop,
  onOpenTradingMarket,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
  const [favoriteOnly, setFavoriteOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'mint-asc' | 'mint-desc' | 'rarity-desc' | 'rarity-asc'>('mint-asc');
  const [inspectCat, setInspectCat] = useState<CatSkin | null>(null);
  const [showRarityGuide, setShowRarityGuide] = useState<boolean>(false);

  const isLight = theme === 'light';

  // Player's actual owned cats collection — each with their unique Global Mint #
  const myOwnedCats = useMemo(() => {
    const list: CatSkin[] = [];
    Object.keys(player.ownedCats).forEach(catId => {
      const owned = player.ownedCats[catId];
      const cat = GET_CAT_BY_ID(catId, owned.customSkin);
      if (cat) {
        list.push(cat);
      }
    });
    return list;
  }, [player.ownedCats]);

  const ownedCatsCount = myOwnedCats.length;
  const lowestMint = myOwnedCats.length > 0 ? Math.min(...myOwnedCats.map(c => c.mintNumber || 1)) : 1;
  const highestMint = myOwnedCats.length > 0 ? Math.max(...myOwnedCats.map(c => c.mintNumber || 1)) : 1;
  const totalCollectorValue = myOwnedCats.reduce((sum, c) => sum + (c.collectorValue || 0), 0);

  // Filtered and sorted cats
  const filteredCats = useMemo(() => {
    return myOwnedCats
      .filter(cat => {
        // Search
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = cat.name.toLowerCase().includes(query);
          const matchesDesc = cat.description.toLowerCase().includes(query);
          const matchesCategory = cat.category.toLowerCase().includes(query);
          const matchesPersonality = cat.personality ? cat.personality.toLowerCase().includes(query) : false;
          const matchesToy = cat.toy ? cat.toy.toLowerCase().includes(query) : false;
          const matchesMint = cat.mintNumber ? cat.mintNumber.toString().includes(query) || `#${cat.mintNumber}`.includes(query) : false;
          if (!matchesName && !matchesDesc && !matchesCategory && !matchesPersonality && !matchesToy && !matchesMint) {
            return false;
          }
        }

        // Rarity
        if (selectedRarity !== 'all' && cat.rarity !== selectedRarity) {
          return false;
        }

        // Favorites
        const isFav = player.ownedCats[cat.id]?.isFavorite;
        if (favoriteOnly && !isFav) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'mint-asc') return (a.mintNumber || 999999) - (b.mintNumber || 999999);
        if (sortBy === 'mint-desc') return (b.mintNumber || 0) - (a.mintNumber || 0);
        const rarityRank: Record<Rarity, number> = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        if (sortBy === 'rarity-desc') return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0);
        return (rarityRank[a.rarity] || 0) - (rarityRank[b.rarity] || 0);
      });
  }, [myOwnedCats, searchQuery, selectedRarity, favoriteOnly, sortBy, player.ownedCats]);

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* 1. Header Progress & Collection Stats Card */}
      <div className={`rounded-3xl p-4 shadow-xl border transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 to-indigo-950/70 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-base font-black flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>My Cat Collection</span>
              <span className="text-xs text-purple-500 font-mono font-bold">({ownedCatsCount} Unique)</span>
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              100% uniquely generated cats with verifiable Global Mint # serials!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setShowRarityGuide(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all border ${
                isLight
                  ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
              }`}
              title="Was ist selten & krass?"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Was ist selten?</span>
            </button>

            {onOpenTradingMarket && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenTradingMarket();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 active:scale-95 transition-all"
                title="Open Trading Market"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Trade Market</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Mint stats row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className={`p-2 rounded-2xl border ${isLight ? 'bg-white/90 border-purple-100 shadow-xs' : 'bg-slate-900/80 border-slate-800'}`}>
            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Global Serials</span>
            <span className="font-mono font-extrabold text-amber-500">
              {ownedCatsCount > 0 ? (lowestMint === highestMint ? `#${lowestMint}` : `#${lowestMint} - #${highestMint}`) : 'None'}
            </span>
          </div>
          <div className={`p-2 rounded-2xl border ${isLight ? 'bg-white/90 border-purple-100 shadow-xs' : 'bg-slate-900/80 border-slate-800'}`}>
            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Owned</span>
            <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
              {ownedCatsCount} 🐱
            </span>
          </div>
          <div className={`p-2 rounded-2xl border ${isLight ? 'bg-white/90 border-purple-100 shadow-xs' : 'bg-slate-900/80 border-slate-800'}`}>
            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Collector Rating</span>
            <span className="font-mono font-extrabold text-pink-500">
              +{totalCollectorValue} ⭐
            </span>
          </div>
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
            placeholder="Search by name, #mint (e.g. #1), trait, toy..."
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

        {/* Filter Controls Row (Favorites toggle + Sorting) */}
        <div className="flex items-center justify-between gap-2">
          {/* Favorite filter toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              setFavoriteOnly(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              favoriteOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : isLight
                ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-white text-white' : 'text-amber-400'}`} />
            <span>Favorites only</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-[11px]">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => {
                soundManager.playClick();
                setSortBy(e.target.value as any);
              }}
              className={`rounded-xl px-2 py-1 text-xs font-bold border focus:outline-none focus:border-pink-500 ${
                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <option value="mint-asc">Mint #1 → Top</option>
              <option value="mint-desc">Newest Mint First</option>
              <option value="rarity-desc">Rarity (Highest)</option>
              <option value="rarity-asc">Rarity (Lowest)</option>
            </select>
          </div>
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
            All Rarities ({myOwnedCats.length})
          </button>

          {(Object.keys(RARITY_CONFIG) as Rarity[]).map(r => {
            const meta = RARITY_CONFIG[r];
            const isSelected = selectedRarity === r;
            const countForRarity = myOwnedCats.filter(c => c.rarity === r).length;

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
                {meta.name} ({countForRarity})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Unique Cats Grid (No mystery fake slots!) */}
      {filteredCats.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center text-xs border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-500 shadow-sm'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <div className="text-4xl mb-2">🐾</div>
          <p className="font-bold text-sm mb-1">No cats found matching your filters</p>
          <p className="text-[11px] mb-4">Every cat drop is 100% unique! Open chests or trade with players to discover new unique cats.</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRarity('all');
                setFavoriteOnly(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
            >
              Reset Filters
            </button>
            {onOpenTradingMarket && (
              <button
                onClick={onOpenTradingMarket}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-bold"
              >
                Trade Market
              </button>
            )}
          </div>
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

      {/* 5. Rarity & Trait Guide Modal */}
      {showRarityGuide && (
        <RarityGuideModal
          onClose={() => setShowRarityGuide(false)}
          theme={theme}
        />
      )}
    </div>
  );
};
