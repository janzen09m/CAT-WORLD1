import React, { useState, useEffect, useCallback } from 'react';
import { PlayerData, CatSkin, ChestConfig, KeyType, Rarity, Theme, Achievement } from './types/game';
import { GET_CAT_BY_ID } from './data/catsData';
import { INITIAL_DAILY_TASKS, INITIAL_ACHIEVEMENTS } from './data/tasksAndAchievements';
import {
  initTelegramApp,
  getTelegramInitData,
  getOrCreateLocalDevId,
  isTelegramWebApp,
  saveAchievementsToTelegramCloud,
  loadAchievementsFromTelegramCloud,
} from './utils/telegram';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { ConvertKeysModal } from './components/ConvertKeysModal';
import { TelegramBotModal } from './components/TelegramBotModal';
import { TradingMarketModal } from './components/TradingMarketModal';

import { HomeView } from './components/views/HomeView';
import { CatsCollectionView } from './components/views/CatsCollectionView';
import { ChestsView } from './components/views/ChestsView';
import { GamesView } from './components/views/GamesView';
import { ShopView } from './components/views/ShopView';
import { ProfileView } from './components/views/ProfileView';

export default function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [collectorValue, setCollectorValue] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Theme state: defaults to light view (Helle Ansicht) or user preference
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('catworld_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light'; // Default to Light Mode as requested
    } catch {
      return 'light';
    }
  });

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('catworld_theme', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const [sessionToken, setSessionToken] = useState<string>(() => {
    try {
      return localStorage.getItem('catworld_session_token') || '';
    } catch {
      return '';
    }
  });

  const createFallbackPlayer = (id: string): PlayerData => {
    try {
      const cached = localStorage.getItem(`catworld_player_cache_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id && parsed.ownedCats && Object.keys(parsed.ownedCats).length > 0) return parsed;
      }
    } catch {}

    const baseWhiteCat = GET_CAT_BY_ID('cat-01')!;
    const starterCat: CatSkin = {
      ...baseWhiteCat,
      name: 'Schneeflöckchen #1',
      description: 'Dein treuer Starter-Gefährte vom ersten Tag an.',
      mintNumber: 1,
      personality: 'Treuer Starter-Gefährte',
      toy: 'none',
      backgroundType: 'none',
      renderStyle: '2d-flat',
    };

    return {
      id,
      playerName: 'Katzenfreund',
      catCustomName: 'Schneeflöckchen',
      activeCatId: 'cat-01',
      createdAt: new Date().toISOString(),
      coins: 500,
      starShards: 0,
      keys: { wooden: 2, blue: 1, epic: 0, legendary: 0 },
      ownedCats: {
        'cat-01': {
          count: 1,
          unlockedAt: new Date().toISOString(),
          isFavorite: true,
          customSkin: starterCat,
        },
      },
      roomBackground: 'cozy_living',
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        tictactoeWins: 0,
        tennisWins: 0,
        chessWins: 0,
        memoryWins: 0,
        catCatchHighScore: 0,
        chestsOpened: 0,
        catsBought: 0,
        keysBought: 0,
        totalCoinsEarned: 500,
        petCount: 0,
      },
      dailyTasks: INITIAL_DAILY_TASKS,
      achievements: INITIAL_ACHIEVEMENTS.map(ach => ach.id === 'ach-collector-5' ? { ...ach, current: 1 } : ach),
      loginStreak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      dailyLoginClaimedToday: false,
      chestHistory: [],
    };
  };

  // Initialize game & authenticate
  const initGame = useCallback(async () => {
    setIsLoading(true);
    setInitError(null);

    initTelegramApp();
    const initData = getTelegramInitData();
    const devPlayerId = getOrCreateLocalDevId();

    try {
      const res = await fetch('/api/auth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, devPlayerId }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.player) {
        let currentPlayer = data.player;
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
          try {
            localStorage.setItem('catworld_session_token', data.sessionToken);
          } catch {}
        }

        // Auto-load & merge achievements from Telegram CloudStorage
        try {
          const tgData = await loadAchievementsFromTelegramCloud();
          if (tgData?.achievements && Array.isArray(tgData.achievements)) {
            const mergedAchievements = currentPlayer.achievements.map((localAch: Achievement) => {
              const cloudAch = tgData.achievements?.find((c: Achievement) => c.id === localAch.id);
              if (cloudAch) {
                return {
                  ...localAch,
                  unlocked: localAch.unlocked || cloudAch.unlocked,
                  claimed: localAch.claimed || cloudAch.claimed,
                  current: Math.max(localAch.current, cloudAch.current || 0),
                };
              }
              return localAch;
            });
            currentPlayer = { ...currentPlayer, achievements: mergedAchievements };
          }
          // Ensure synced back to Telegram Cloud
          saveAchievementsToTelegramCloud(currentPlayer.achievements, currentPlayer.stats).catch(() => {});
        } catch {
          // ignore
        }

        try {
          localStorage.setItem(`catworld_player_cache_${currentPlayer.id}`, JSON.stringify(currentPlayer));
        } catch {}

        setPlayer(currentPlayer);
        setCollectorValue(data.collectorValue || 0);

        // First time onboarding check: if player has not customized names yet
        const hasSeenOnboarding = localStorage.getItem(`catworld_onboarded_${data.player.id}`);
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } else {
        throw new Error('Invalid player response');
      }
    } catch (err: any) {
      console.warn('Game server sync delayed, booting resilient session:', err);
      // Fallback: player never gets blocked by server connection errors
      const fallback = createFallbackPlayer(devPlayerId);
      setPlayer(fallback);
      setCollectorValue(0);
      const hasSeenOnboarding = localStorage.getItem(`catworld_onboarded_${fallback.id}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Authenticated API request helper with resilient JSON handling
  const apiRequest = async (url: string, body: Record<string, any>) => {
    if (!player) throw new Error('Nicht eingeloggt');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-player-id': player.id,
    };
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
      headers['x-session-token'] = sessionToken;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, playerId: player.id }),
      });
    } catch {
      throw new Error('Verbindung zum Spielserver fehlgeschlagen. Bitte prüfe dein Internet.');
    }

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      const text = await res.text().catch(() => '');
      console.warn('API returned non-JSON response:', res.status, text.slice(0, 100));
    }

    if (!res.ok || !data || !data.success) {
      const errMsg = data?.error || (res.status === 401 ? 'Sitzung abgelaufen. Bitte Spiel neu laden.' : `Serverfehler (${res.status})`);
      throw new Error(errMsg);
    }

    if (data.player) {
      try {
        localStorage.setItem(`catworld_player_cache_${data.player.id}`, JSON.stringify(data.player));
      } catch {}
      setPlayer(data.player);
      // Auto-save all achievements to Telegram Cloud on every progress action
      saveAchievementsToTelegramCloud(data.player.achievements, data.player.stats).catch(() => {});
    }
    return data;
  };

  // Handlers
  const handleOnboardingComplete = async (playerName: string, catCustomName: string) => {
    if (!player) return;
    try {
      await apiRequest('/api/player/update-names', { playerName, catCustomName });
      localStorage.setItem(`catworld_onboarded_${player.id}`, 'true');
      setShowOnboarding(false);
    } catch {
      setShowOnboarding(false);
    }
  };

  const handlePetCat = async () => {
    try {
      await apiRequest('/api/player/pet-cat', {});
    } catch {
      // silent
    }
  };

  const handleChangeBackground = async (roomBackground: PlayerData['roomBackground']) => {
    try {
      await apiRequest('/api/player/set-room-bg', { background: roomBackground });
    } catch {
      // silent
    }
  };

  const handleClaimDailyLogin = async () => {
    try {
      await apiRequest('/api/daily/claim-login', {});
    } catch {
      // silent
    }
  };

  const handleEquipCat = async (catId: string) => {
    await apiRequest('/api/player/set-active-cat', { catId });
  };

  const handleToggleFavorite = async (catId: string) => {
    await apiRequest('/api/player/toggle-favorite', { catId });
  };

  const handleOpenChest = async (chestId: ChestConfig['id'], useCoins: boolean) => {
    const res = await apiRequest('/api/chests/open', { chestId, useCoins });
    return {
      droppedCat: res.droppedCat,
      isDuplicate: res.isDuplicate,
      coinsAwarded: res.coinsAwarded,
      shardsAwarded: 0,
    };
  };

  const handleBuyCoinsWithStars = async (bundleId: string) => {
    const res = await apiRequest('/api/stars/create-invoice', { bundleId });
    if (res.invoiceUrl && typeof window !== 'undefined' && typeof window.Telegram?.WebApp?.openInvoice === 'function') {
      return new Promise<void>((resolve, reject) => {
        window.Telegram!.WebApp!.openInvoice!(res.invoiceUrl, async (status: string) => {
          if (status === 'paid') {
            try {
              await apiRequest('/api/stars/claim-purchase', { bundleId });
              resolve();
            } catch (e) {
              reject(e);
            }
          } else if (status === 'cancelled') {
            reject(new Error('Zahlung abgebrochen'));
          } else {
            reject(new Error(`Zahlungsstatus: ${status}`));
          }
        });
      });
    } else {
      // Direct simulation mode or instant claim
      return await apiRequest('/api/stars/claim-purchase', { bundleId });
    }
  };

  const handleBuyKey = async (keyType: KeyType, amount: number = 1) => {
    await apiRequest('/api/shop/buy-key', { keyType, amount });
  };

  const handleBuyKeysModal = async (keyType: KeyType, amount: number) => {
    await apiRequest('/api/shop/buy-key', { keyType, amount });
  };

  const handleCompleteGame = async (
    gameType: 'tictactoe' | 'tennis' | 'chess' | 'memory' | 'catcatch',
    outcome: 'win' | 'draw' | 'loss',
    score?: number
  ) => {
    const res = await apiRequest('/api/minigames/complete', { gameType, outcome, score });
    return { coinsEarned: res.coinsEarned };
  };

  const handleClaimTask = async (taskId: string) => {
    await apiRequest('/api/tasks/claim', { taskId });
  };

  const handleClaimAchievement = async (achievementId: string) => {
    await apiRequest('/api/achievements/claim', { achievementId });
  };

  const handleUpdateNames = async (playerName: string, catCustomName: string) => {
    await apiRequest('/api/player/update-names', { playerName, catCustomName });
  };

  const isLight = theme === 'light';

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center select-none transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'
      }`}>
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl animate-bounce mb-4 text-white">
          🐱
        </div>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
          CAT WORLD
        </h1>
        <p className={`text-xs mt-2 animate-pulse ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Loading cat world, chests & kittens...
        </p>
      </div>
    );
  }

  // Error state
  if (initError || !player) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center select-none transition-colors ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'
      }`}>
        <div className="text-5xl mb-3">😿</div>
        <h2 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Connection Interrupted</h2>
        <p className={`text-xs max-w-xs mb-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {initError || 'Could not connect to the game server.'}
        </p>
        <button
          onClick={initGame}
          className="py-2.5 px-6 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-xs transition-colors shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  const activeCat = (player.activeCatId && player.ownedCats[player.activeCatId])
    ? GET_CAT_BY_ID(player.activeCatId, player.ownedCats[player.activeCatId]?.customSkin)
    : null;
  const unclaimedRewardsCount =
    player.dailyTasks.filter(t => !t.claimed && t.current >= t.goal).length +
    player.achievements.filter(a => !a.claimed && a.unlocked).length +
    (!player.dailyLoginClaimedToday ? 1 : 0);

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Main Responsive App Container (Framed for mobile & telegram) */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl border-x transition-colors duration-200 ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-slate-950 border-slate-900 text-slate-100'
      }`}>
        {/* Top Sticky Header */}
        <Header
          player={player}
          onOpenExchangeModal={() => setShowConvertModal(true)}
          collectorValue={collectorValue}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenTelegramBotModal={() => setShowTelegramModal(true)}
          onOpenProfile={() => setActiveTab('profile')}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3">
          {activeTab === 'home' && (
            <HomeView
              player={player}
              activeCat={activeCat}
              collectorValue={collectorValue}
              onPetCat={handlePetCat}
              onChangeBackground={handleChangeBackground}
              onClaimDailyLogin={handleClaimDailyLogin}
              onNavigateTab={tab => setActiveTab(tab)}
              onOpenExchangeModal={() => setShowConvertModal(true)}
              theme={theme}
            />
          )}

          {activeTab === 'cats' && (
            <CatsCollectionView
              player={player}
              onEquipCat={handleEquipCat}
              onToggleFavorite={handleToggleFavorite}
              onGoToShop={() => setActiveTab('shop')}
              onOpenTradingMarket={() => setShowTradingModal(true)}
              theme={theme}
            />
          )}

          {activeTab === 'chests' && (
            <ChestsView
              player={player}
              onOpenChest={handleOpenChest}
              onEquipCat={handleEquipCat}
              onOpenExchangeModal={() => setShowConvertModal(true)}
              theme={theme}
            />
          )}

          {activeTab === 'games' && (
            <GamesView
              player={player}
              onCompleteGame={handleCompleteGame}
              theme={theme}
            />
          )}

          {activeTab === 'shop' && (
            <ShopView
              player={player}
              onBuyCoinsWithStars={handleBuyCoinsWithStars}
              onBuyKey={handleBuyKey}
              onOpenExchangeModal={() => setShowConvertModal(true)}
              onNavigateToChests={() => setActiveTab('chests')}
              theme={theme}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              player={player}
              collectorValue={collectorValue}
              onUpdateNames={handleUpdateNames}
              onClaimTask={handleClaimTask}
              onClaimAchievement={handleClaimAchievement}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={tab => setActiveTab(tab)}
          unclaimedRewardsCount={unclaimedRewardsCount}
          theme={theme}
        />

        {/* Onboarding Dialog for new players */}
        {showOnboarding && (
          <OnboardingModal
            player={player}
            onComplete={handleOnboardingComplete}
            theme={theme}
          />
        )}

        {/* Buy Keys with Coins Modal */}
        {showConvertModal && (
          <ConvertKeysModal
            player={player}
            onClose={() => setShowConvertModal(false)}
            onBuyKey={handleBuyKeysModal}
            theme={theme}
          />
        )}

        {/* Telegram Bot Hub & Cloud Storage Modal */}
        {showTelegramModal && (
          <TelegramBotModal
            player={player}
            onClose={() => setShowTelegramModal(false)}
            theme={theme}
          />
        )}

        {/* Telegram Cat Trading Marketplace Modal */}
        {showTradingModal && (
          <TradingMarketModal
            player={player}
            onClose={() => setShowTradingModal(false)}
            onTradeSuccess={updatedPlayer => setPlayer(updatedPlayer)}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
