import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  getPlayer,
  getOrCreatePlayer,
  savePlayer,
  getLeaderboard,
  calculateCollectorValue,
  getNextGlobalMintNumber,
} from './db';
import { CAT_SKINS, GET_CAT_BY_ID, getDuplicateCoinBonus } from '../data/catsData';
import { CHESTS_CONFIG, KEY_EXCHANGE_RATES } from '../data/chestsData';
import { KeyType, Rarity, TradeListing, CatSkin } from '../types/game';
import { generateUniqueCat } from '../utils/catGenerator';

export const apiRouter = Router();

// In-memory Telegram Cat Trading Market Listings
const MARKET_LISTINGS: TradeListing[] = [
  {
    id: 'listing-1',
    sellerName: 'Alex_TG',
    sellerTelegram: 'alex_tg_collector',
    cat: generateUniqueCat('rare', 1042),
    priceCoins: 3800,
    wantsRarity: 'rare',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'listing-2',
    sellerName: 'MeowMaster',
    sellerTelegram: 'meow_master_99',
    cat: generateUniqueCat('epic', 1088),
    priceCoins: 8500,
    wantsRarity: 'epic',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'listing-3',
    sellerName: 'Elena_Kitties',
    sellerTelegram: 'elena_cats',
    cat: generateUniqueCat('uncommon', 1015),
    priceCoins: 1400,
    wantsRarity: 'uncommon',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'listing-4',
    sellerName: 'CosmicCollector',
    sellerTelegram: 'cosmic_tg',
    cat: generateUniqueCat('legendary', 1099),
    priceCoins: 28000,
    wantsRarity: 'legendary',
    createdAt: Date.now() - 900000,
  },
];

// Middleware to extract player ID from headers or body
function getAuthenticatedPlayer(req: Request): ReturnType<typeof getPlayer> {
  const playerId = (req.headers['x-player-id'] as string) || req.body?.playerId;
  if (!playerId) return null;
  return getPlayer(playerId);
}

// Telegram initData verification helper
function verifyTelegramInitData(initData: string, botToken?: string): { verified: boolean; user?: any } {
  if (!initData) return { verified: false };
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Parse user json
    const userStr = params.get('user');
    const user = userStr ? JSON.parse(userStr) : undefined;

    if (!botToken) {
      // Dev mode: if no bot token configured, accept but flag
      return { verified: true, user };
    }

    // Official Telegram HMAC verification
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const dataCheckArr: string[] = [];
    params.sort();
    for (const [key, value] of params.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    const dataCheckString = dataCheckArr.join('\n');
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return {
      verified: calculatedHash === hash,
      user,
    };
  } catch (e) {
    console.error('Error verifying initData:', e);
    return { verified: false };
  }
}

// POST /api/auth/init
apiRouter.post('/auth/init', (req: Request, res: Response) => {
  const { initData, devPlayerId } = req.body;
  const botToken = process.env.BOT_TOKEN;

  let tgUser: any = undefined;

  if (initData) {
    const verification = verifyTelegramInitData(initData, botToken);
    tgUser = verification.user;
  }

  // Derive stable player ID
  let playerId = devPlayerId;
  if (tgUser?.id) {
    playerId = `CW-TG-${tgUser.id}`;
  } else if (!playerId) {
    playerId = `CW-GUEST-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const player = getOrCreatePlayer(playerId, tgUser ? {
    id: tgUser.id,
    name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
    username: tgUser.username,
  } : undefined);

  res.json({
    success: true,
    player,
    collectorValue: calculateCollectorValue(player),
  });
});

// POST /api/player/update-names
apiRouter.post('/player/update-names', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { playerName, catCustomName } = req.body;
  if (typeof playerName === 'string' && playerName.trim()) {
    player.playerName = playerName.trim().slice(0, 25);
  }
  if (typeof catCustomName === 'string' && catCustomName.trim()) {
    player.catCustomName = catCustomName.trim().slice(0, 25);
  }

  savePlayer(player);
  res.json({ success: true, player });
});

// POST /api/player/set-active-cat
apiRouter.post('/player/set-active-cat', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { catId } = req.body;
  if (!player.ownedCats[catId]) {
    return res.status(400).json({ error: 'You do not own this cat yet!' });
  }

  player.activeCatId = catId;
  savePlayer(player);
  res.json({ success: true, player });
});

// POST /api/player/toggle-favorite
apiRouter.post('/player/toggle-favorite', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { catId } = req.body;
  if (!player.ownedCats[catId]) {
    return res.status(400).json({ error: 'Cat not found' });
  }

  player.ownedCats[catId].isFavorite = !player.ownedCats[catId].isFavorite;
  savePlayer(player);
  res.json({ success: true, player });
});

// POST /api/player/set-room-bg
apiRouter.post('/player/set-room-bg', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { background } = req.body;
  const allowed = ['cozy_living', 'sakura_garden', 'cosmic_dream', 'royal_castle', 'beach_sunset'];
  if (allowed.includes(background)) {
    player.roomBackground = background as any;
    savePlayer(player);
  }
  res.json({ success: true, player });
});

// POST /api/player/pet-cat
apiRouter.post('/player/pet-cat', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  player.stats.petCount = (player.stats.petCount || 0) + 1;

  // Update daily task if exists
  const petTask = player.dailyTasks.find(t => t.id === 'daily-pet');
  if (petTask && petTask.current < petTask.goal) {
    petTask.current += 1;
  }

  savePlayer(player);
  res.json({ success: true, player, petCount: player.stats.petCount });
});

// POST /api/shop/buy-cat
apiRouter.post('/shop/buy-cat', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { catId, rarity } = req.body;
  const baseSkin = catId ? GET_CAT_BY_ID(catId) : null;
  const targetRarity: Rarity = (rarity || baseSkin?.rarity || 'common') as Rarity;
  const price = baseSkin?.price || (targetRarity === 'common' ? 500 : targetRarity === 'uncommon' ? 1500 : targetRarity === 'rare' ? 4000 : targetRarity === 'epic' ? 12000 : 35000);

  // Check currency
  if (player.coins < price) {
    return res.status(400).json({ error: 'Not enough coins!' });
  }

  // Deduct
  player.coins -= price;
  player.stats.catsBought = (player.stats.catsBought || 0) + 1;

  const now = new Date().toISOString();
  const nextMintNumber = getNextGlobalMintNumber();
  const newCat = generateUniqueCat(targetRarity, nextMintNumber);

  player.ownedCats[newCat.id] = {
    count: 1,
    unlockedAt: now,
    isFavorite: false,
    customSkin: newCat,
  };

  // Check collection achievements
  const ownedCount = Object.keys(player.ownedCats).length;
  player.achievements.forEach(ach => {
    if (ach.id === 'ach-collector-5') ach.current = ownedCount;
    if (ach.id === 'ach-collector-15') ach.current = ownedCount;
    if (ach.id === 'ach-collector-30') ach.current = ownedCount;
    if (ach.id === 'ach-collector-all') ach.current = ownedCount;
    if (ach.current >= ach.goal) ach.unlocked = true;
  });

  savePlayer(player);
  res.json({
    success: true,
    player,
    skin: newCat,
    isDuplicate: false,
    duplicateCoinsGained: 0,
    starShardsGained: 0,
  });
});

// POST /api/shop/buy-key
apiRouter.post('/shop/buy-key', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { keyType, amount } = req.body as { keyType: KeyType; amount?: number };
  const rate = KEY_EXCHANGE_RATES[keyType];
  if (!rate) return res.status(400).json({ error: 'Invalid key type' });

  const qty = Math.max(1, Math.floor(amount || 1));
  const totalPrice = rate.coinPrice * qty;

  if (player.coins < totalPrice) {
    return res.status(400).json({ error: `Not enough coins for ${qty}x ${rate.name}!` });
  }

  player.coins -= totalPrice;
  player.keys[keyType] = (player.keys[keyType] || 0) + qty;
  player.stats.keysBought = (player.stats.keysBought || 0) + qty;

  // Check key master achievement
  const ach = player.achievements.find(a => a.id === 'ach-key-buyer');
  if (ach) {
    ach.current = player.stats.keysBought;
    if (ach.current >= ach.goal) ach.unlocked = true;
  }

  savePlayer(player);
  res.json({
    success: true,
    player,
    keyType,
    quantity: qty,
    totalPrice,
    newCount: player.keys[keyType],
  });
});

// POST /api/exchange/convert-keys -> now buy keys with coins!
apiRouter.post('/exchange/convert-keys', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { keyType, amount } = req.body as { keyType: KeyType; amount?: number };
  const rate = KEY_EXCHANGE_RATES[keyType];
  if (!rate) return res.status(400).json({ error: 'Invalid key type' });

  const qty = Math.max(1, Math.floor(amount || 1));
  const totalPrice = rate.coinPrice * qty;

  if (player.coins < totalPrice) {
    return res.status(400).json({ error: `Not enough coins for ${qty}x ${rate.name}!` });
  }

  player.coins -= totalPrice;
  player.keys[keyType] = (player.keys[keyType] || 0) + qty;
  player.stats.keysBought = (player.stats.keysBought || 0) + qty;

  savePlayer(player);
  res.json({
    success: true,
    player,
    keyType,
    quantity: qty,
    totalPrice,
  });
});

// Helper for random chest drop selection
function rollChestReward(dropRates: { common: number; uncommon: number; rare: number; epic: number; legendary: number; mythic: number }): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;

  const tiers: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  for (const tier of tiers) {
    cumulative += dropRates[tier];
    if (roll < cumulative && dropRates[tier] > 0) {
      return tier;
    }
  }
  return 'common';
}

// POST /api/chests/open
apiRouter.post('/chests/open', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { chestId, useCoins } = req.body as { chestId: 'wooden' | 'blue' | 'epic' | 'legendary'; useCoins?: boolean };
  const chest = CHESTS_CONFIG.find(c => c.id === chestId);
  if (!chest) return res.status(404).json({ error: 'Chest not found' });

  const requiredKey = chest.keyRequired;
  const hasKey = (player.keys[requiredKey] || 0) >= 1;

  // Chests can ONLY be opened with keys!
  if (!hasKey) {
    return res.status(400).json({
      error: `Diese Kiste kann nur mit einem ${KEY_EXCHANGE_RATES[requiredKey].name} geöffnet werden! Kaufe Schlüssel im Shop mit deinen Münzen.`
    });
  }

  // Deduct key
  player.keys[requiredKey] -= 1;

  // Authoritative server drop roll
  const rolledRarity = rollChestReward(chest.dropRates);
  const nextMintNumber = getNextGlobalMintNumber();
  // Generate a completely UNIQUE procedural cat with global Mint # and DNA!
  const droppedCat = generateUniqueCat(rolledRarity, nextMintNumber);

  const now = new Date().toISOString();
  const isDuplicate = false;
  const coinsAwarded = 0;

  player.ownedCats[droppedCat.id] = {
    count: 1,
    unlockedAt: now,
    isFavorite: false,
    customSkin: droppedCat,
  };

  // If player doesn't have an active cat yet, equip this first cat automatically!
  if (!player.activeCatId || !player.ownedCats[player.activeCatId]) {
    player.activeCatId = droppedCat.id;
  }

  // Update stats
  player.stats.chestsOpened = (player.stats.chestsOpened || 0) + 1;

  // Update daily task
  const chestTask = player.dailyTasks.find(t => t.id === 'daily-chest');
  if (chestTask && chestTask.current < chestTask.goal) {
    chestTask.current += 1;
  }

  // Update achievements
  const firstChestAch = player.achievements.find(a => a.id === 'ach-first-chest');
  if (firstChestAch) {
    firstChestAch.current = player.stats.chestsOpened;
    if (firstChestAch.current >= firstChestAch.goal) firstChestAch.unlocked = true;
  }

  const ownedCount = Object.keys(player.ownedCats).length;
  player.achievements.forEach(ach => {
    if (ach.id === 'ach-collector-5') ach.current = ownedCount;
    if (ach.id === 'ach-collector-15') ach.current = ownedCount;
    if (ach.id === 'ach-collector-30') ach.current = ownedCount;
    if (ach.id === 'ach-collector-all') ach.current = ownedCount;
    if (ach.current >= ach.goal) ach.unlocked = true;
  });

  // Record in history (max 20)
  player.chestHistory.unshift({
    id: `ch-${Date.now()}`,
    timestamp: Date.now(),
    chestId: chest.id,
    catId: droppedCat.id,
    catName: droppedCat.name,
    rarity: droppedCat.rarity,
    isDuplicate,
    coinsAwarded,
  });
  if (player.chestHistory.length > 20) {
    player.chestHistory = player.chestHistory.slice(0, 20);
  }

  savePlayer(player);
  res.json({
    success: true,
    player,
    droppedCat,
    isDuplicate,
    coinsAwarded,
    shardsAwarded: 0,
  });
});

// POST /api/minigames/complete
apiRouter.post('/minigames/complete', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { gameType, outcome, score } = req.body as {
    gameType: 'tictactoe' | 'tennis' | 'chess' | 'memory' | 'catcatch';
    outcome: 'win' | 'draw' | 'loss';
    score?: number;
  };

  let coinsEarned = 0;
  let shardsEarned = 0;

  // Strict reward validation rules
  if (gameType === 'tictactoe') {
    if (outcome === 'win') {
      coinsEarned = 20;
      player.stats.tictactoeWins = (player.stats.tictactoeWins || 0) + 1;
      // Daily task
      const tttTask = player.dailyTasks.find(t => t.id === 'daily-tictactoe');
      if (tttTask && tttTask.current < tttTask.goal) tttTask.current += 1;
      // Ach
      const tttAch = player.achievements.find(a => a.id === 'ach-tictactoe-10');
      if (tttAch) {
        tttAch.current = player.stats.tictactoeWins;
        if (tttAch.current >= tttAch.goal) tttAch.unlocked = true;
      }
    } else if (outcome === 'draw') {
      coinsEarned = 8;
    } else {
      coinsEarned = 3;
    }
  } else if (gameType === 'tennis') {
    if (outcome === 'win') {
      coinsEarned = 35;
      player.stats.tennisWins = (player.stats.tennisWins || 0) + 1;
      const tennisAch = player.achievements.find(a => a.id === 'ach-tennis-ace');
      if (tennisAch) {
        tennisAch.current = player.stats.tennisWins;
        if (tennisAch.current >= tennisAch.goal) tennisAch.unlocked = true;
      }
    } else {
      coinsEarned = 12;
    }
    // Daily task tennis
    const tennisTask = player.dailyTasks.find(t => t.id === 'daily-tennis');
    if (tennisTask && tennisTask.current < tennisTask.goal) tennisTask.current += 1;
  } else if (gameType === 'chess') {
    if (outcome === 'win') {
      coinsEarned = 60;
      player.stats.chessWins = (player.stats.chessWins || 0) + 1;
      const chessAch = player.achievements.find(a => a.id === 'ach-chess-win');
      if (chessAch) {
        chessAch.current = player.stats.chessWins;
        if (chessAch.current >= chessAch.goal) chessAch.unlocked = true;
      }
    } else if (outcome === 'draw') {
      coinsEarned = 20;
    } else {
      coinsEarned = 5;
    }
  } else if (gameType === 'memory') {
    if (outcome === 'win') {
      coinsEarned = 30;
      player.stats.memoryWins = (player.stats.memoryWins || 0) + 1;
    } else {
      coinsEarned = 5;
    }
  } else if (gameType === 'catcatch') {
    const raw = Math.floor((score || 0) / 10);
    coinsEarned = Math.min(50, Math.max(5, raw));
    if ((score || 0) > (player.stats.catCatchHighScore || 0)) {
      player.stats.catCatchHighScore = score || 0;
    }
    const catchAch = player.achievements.find(a => a.id === 'ach-catch-500');
    if (catchAch) {
      catchAch.current = Math.max(catchAch.current, player.stats.catCatchHighScore);
      if (catchAch.current >= catchAch.goal) catchAch.unlocked = true;
    }
  }

  // Update general games stats
  player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
  if (outcome === 'win') {
    player.stats.gamesWon = (player.stats.gamesWon || 0) + 1;
  }

  // Update daily task: Play 3 minigames
  const gamesTask = player.dailyTasks.find(t => t.id === 'daily-minigames');
  if (gamesTask && gamesTask.current < gamesTask.goal) {
    gamesTask.current += 1;
  }

  // Apply coins only
  player.coins += coinsEarned;
  player.stats.totalCoinsEarned = (player.stats.totalCoinsEarned || 0) + coinsEarned;

  savePlayer(player);
  res.json({
    success: true,
    player,
    coinsEarned,
    outcome,
  });
});

// POST /api/daily/claim-login
apiRouter.post('/daily/claim-login', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  if (player.dailyLoginClaimedToday) {
    return res.status(400).json({ error: 'Daily reward already claimed today!' });
  }

  // Streak reward scaling
  const streak = player.loginStreak || 1;
  const coinsReward = 60 + streak * 20; // Day 1: 80, Day 7: 200

  player.coins += coinsReward;
  player.dailyLoginClaimedToday = true;

  // Streak achievement check
  const streakAch = player.achievements.find(a => a.id === 'ach-streak-7');
  if (streakAch) {
    streakAch.current = streak;
    if (streakAch.current >= streakAch.goal) streakAch.unlocked = true;
  }

  savePlayer(player);
  res.json({
    success: true,
    player,
    coinsReward,
    streak,
  });
});

// POST /api/tasks/claim
apiRouter.post('/tasks/claim', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { taskId } = req.body;
  const task = player.dailyTasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.claimed) return res.status(400).json({ error: 'Already claimed!' });
  if (task.current < task.goal) return res.status(400).json({ error: 'Task not completed yet!' });

  task.claimed = true;
  player.coins += task.rewardCoins;

  savePlayer(player);
  res.json({ success: true, player, task });
});

// POST /api/achievements/claim
apiRouter.post('/achievements/claim', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { achievementId } = req.body;
  const ach = player.achievements.find(a => a.id === achievementId);
  if (!ach) return res.status(404).json({ error: 'Achievement not found' });
  if (ach.claimed) return res.status(400).json({ error: 'Already claimed!' });
  if (ach.current < ach.goal) return res.status(400).json({ error: 'Achievement not unlocked yet!' });

  ach.claimed = true;
  player.coins += ach.rewardCoins;

  savePlayer(player);
  res.json({ success: true, player, ach });
});

// GET /api/leaderboard
apiRouter.get('/leaderboard', (_req: Request, res: Response) => {
  const leaderboards = getLeaderboard();
  res.json({ success: true, leaderboards });
});

// ==========================================
// TELEGRAM CAT TRADING MARKETPLACE ENDPOINTS
// ==========================================

// GET /api/market/listings
apiRouter.get('/market/listings', (_req: Request, res: Response) => {
  res.json({ success: true, listings: MARKET_LISTINGS });
});

// POST /api/market/buy
apiRouter.post('/market/buy', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { listingId } = req.body;
  const index = MARKET_LISTINGS.findIndex(l => l.id === listingId);
  if (index === -1) return res.status(404).json({ error: 'Trade listing no longer available' });

  const listing = MARKET_LISTINGS[index];
  if (player.coins < listing.priceCoins) {
    return res.status(400).json({ error: `Not enough coins! You need ${listing.priceCoins} Coins.` });
  }

  // Deduct coins & add unique cat to collection
  player.coins -= listing.priceCoins;
  const now = new Date().toISOString();
  player.ownedCats[listing.cat.id] = {
    count: 1,
    unlockedAt: now,
    isFavorite: false,
    customSkin: listing.cat,
  };

  // Remove from market and auto-generate fresh Telegram community listing
  MARKET_LISTINGS.splice(index, 1);
  const freshRarities: Rarity[] = ['uncommon', 'rare', 'epic', 'legendary'];
  const newRarity = freshRarities[Math.floor(Math.random() * freshRarities.length)];
  const communityNames = ['CryptoCat_99', 'SatoshiWhiskers', 'NekoMaster', 'TelegramTrader', 'LunaCollector', 'PixelPaw_TG'];
  MARKET_LISTINGS.push({
    id: `listing-${Date.now()}`,
    sellerName: communityNames[Math.floor(Math.random() * communityNames.length)],
    sellerTelegram: 'tg_community',
    cat: generateUniqueCat(newRarity),
    priceCoins: newRarity === 'uncommon' ? 1500 : newRarity === 'rare' ? 4200 : newRarity === 'epic' ? 9500 : 30000,
    wantsRarity: newRarity,
    createdAt: Date.now(),
  });

  savePlayer(player);
  res.json({ success: true, player, boughtCat: listing.cat, listings: MARKET_LISTINGS });
});

// POST /api/market/trade (Cat-for-Cat swap!)
apiRouter.post('/market/trade', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ error: 'Player not found' });

  const { listingId, offeredCatId } = req.body;
  const index = MARKET_LISTINGS.findIndex(l => l.id === listingId);
  if (index === -1) return res.status(404).json({ error: 'Trade listing no longer available' });

  const listing = MARKET_LISTINGS[index];
  const offeredOwned = player.ownedCats[offeredCatId];
  if (!offeredOwned) {
    return res.status(400).json({ error: 'You do not own this cat to trade!' });
  }

  // Active cat cannot be traded away
  if (player.activeCatId === offeredCatId) {
    return res.status(400).json({ error: 'Cannot trade your currently active cat! Equip a different cat first.' });
  }

  const offeredCatSkin = offeredOwned.customSkin || GET_CAT_BY_ID(offeredCatId);

  // Transfer offered cat out
  if (offeredOwned.count > 1) {
    offeredOwned.count -= 1;
  } else {
    delete player.ownedCats[offeredCatId];
  }

  // Transfer received cat in
  const now = new Date().toISOString();
  player.ownedCats[listing.cat.id] = {
    count: 1,
    unlockedAt: now,
    isFavorite: false,
    customSkin: listing.cat,
  };

  // Replace listing with offered cat
  MARKET_LISTINGS[index] = {
    id: `listing-trade-${Date.now()}`,
    sellerName: player.playerName,
    sellerTelegram: player.telegramUsername,
    cat: offeredCatSkin,
    priceCoins: offeredCatSkin.price,
    wantsRarity: listing.cat.rarity,
    createdAt: Date.now(),
  };

  savePlayer(player);
  res.json({
    success: true,
    player,
    receivedCat: listing.cat,
    tradedAway: offeredCatSkin,
    listings: MARKET_LISTINGS,
  });
});
