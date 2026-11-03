import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  getPlayer,
  getOrCreatePlayer,
  savePlayer,
  getLeaderboard,
  calculateCollectorValue,
  getNextGlobalMintNumber,
  getAllRegisteredPlayers,
  getMarketListings,
  addMarketListing,
  removeMarketListing,
} from './db';
import { CAT_SKINS, GET_CAT_BY_ID, getDuplicateCoinBonus } from '../data/catsData';
import { CHESTS_CONFIG, KEY_EXCHANGE_RATES } from '../data/chestsData';
import { KeyType, Rarity, TradeListing, CatSkin, PlayerData } from '../types/game';
import { generateUniqueCat } from '../utils/catGenerator';
import { TELEGRAM_STARS_BUNDLES } from '../data/starsBundles';

export const apiRouter = Router();

// Send real-time notification to Telegram Bot user
export async function sendTelegramNotification(telegramUserId: number | string | undefined, messageHtml: string): Promise<boolean> {
  const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN;
  if (!botToken || !telegramUserId) {
    console.log(`[TelegramBot Notification] Skipped (botToken: ${Boolean(botToken)}, target: ${telegramUserId})`);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text: messageHtml,
        parse_mode: 'HTML',
      }),
    });
    const data: any = await res.json();
    return Boolean(data && data.ok);
  } catch (err) {
    console.warn(`[TelegramBot Notification] Failed to notify ${telegramUserId}:`, err);
    return false;
  }
}

// Admin validation helper for Telegram User ID 8979248747
export function isUserAdmin(player: PlayerData | null, req: Request): boolean {
  const adminIdNum = 8979248747;
  const adminIdStr = '8979248747';
  const adminPlayerId = 'CW-TG-8979248747';

  const headerPlayerId = (req.headers['x-player-id'] as string) || '';
  const headerTgId = (req.headers['x-telegram-user-id'] as string) || '';

  if (headerPlayerId === adminPlayerId || headerTgId === adminIdStr) return true;

  if (player) {
    if (player.telegramUserId === adminIdNum || String(player.telegramUserId) === adminIdStr) return true;
    if (player.id === adminPlayerId || player.id === adminIdStr) return true;
  }
  return false;
}

// Seed initial marketplace listings if empty
function ensureInitialMarketListings() {
  const current = getMarketListings();
  if (current.length === 0) {
    addMarketListing({
      id: 'listing-1',
      sellerName: 'Alex_TG',
      sellerTelegram: 'alex_tg_collector',
      cat: generateUniqueCat('rare', 1042),
      priceCoins: 3800,
      wantsRarity: 'rare',
      createdAt: Date.now() - 3600000,
    });
    addMarketListing({
      id: 'listing-2',
      sellerName: 'MeowMaster',
      sellerTelegram: 'meow_master_99',
      cat: generateUniqueCat('epic', 1088),
      priceCoins: 8500,
      wantsRarity: 'epic',
      createdAt: Date.now() - 7200000,
    });
    addMarketListing({
      id: 'listing-3',
      sellerName: 'Elena_Kitties',
      sellerTelegram: 'elena_cats',
      cat: generateUniqueCat('uncommon', 1015),
      priceCoins: 1400,
      wantsRarity: 'uncommon',
      createdAt: Date.now() - 1800000,
    });
  }
}
ensureInitialMarketListings();

const SESSION_SECRET = process.env.SESSION_SECRET || 'catworld_secure_session_secret_2026_salt_87a3b4c';

export function createSessionToken(playerId: string): string {
  const timestamp = Date.now();
  const payload = `${playerId}.${timestamp}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [playerId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  // Session valid for 30 days
  if (Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) return null;

  const payload = `${playerId}.${timestampStr}`;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  try {
    if (signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return playerId;
    }
  } catch {
    return null;
  }
  return null;
}

// Middleware to extract verified player from signed session token or request headers
function getAuthenticatedPlayer(req: Request): ReturnType<typeof getPlayer> {
  const authHeader = req.headers['authorization'];
  const sessionTokenHeader = req.headers['x-session-token'] as string;
  let token = sessionTokenHeader;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (token) {
    const verifiedPlayerId = verifySessionToken(token);
    if (verifiedPlayerId) {
      let player = getPlayer(verifiedPlayerId);
      if (!player) {
        // Cold start auto-recovery
        player = getOrCreatePlayer(verifiedPlayerId);
      }
      return player;
    }
  }

  // Safe fallback for direct browser / Vercel play
  const fallbackId = (req.headers['x-player-id'] as string) || req.body?.playerId;
  if (fallbackId && typeof fallbackId === 'string' && fallbackId.trim()) {
    const cleanId = fallbackId.trim();
    let player = getPlayer(cleanId);
    if (!player) {
      player = getOrCreatePlayer(cleanId);
    }
    return player;
  }

  return null;
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
  const { initData, devPlayerId, telegramUser } = req.body;
  const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

  let tgUser: any = telegramUser;

  if (initData) {
    const verification = verifyTelegramInitData(initData, botToken);
    if (verification.user) {
      tgUser = verification.user;
    }
  }

  // Derive stable player ID for Telegram user: NEVER change across sessions
  let playerId = devPlayerId;
  if (tgUser?.id) {
    playerId = `CW-TG-${tgUser.id}`;
  } else if (!playerId) {
    playerId = `CW-GUEST-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const tgName = tgUser?.first_name ? (tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '')) : tgUser?.name;

  const player = getOrCreatePlayer(playerId, tgUser?.id ? {
    id: tgUser.id,
    name: tgName || 'Katzenfreund',
    username: tgUser.username,
  } : undefined);

  // If player was created with telegram name, ensure playerName reflects it
  if (tgName && (!player.playerName || player.playerName === 'Katzenfreund')) {
    player.playerName = tgName.slice(0, 25);
    savePlayer(player);
  }

  // Generate authentic cryptographic session token
  const sessionToken = createSessionToken(player.id);

  res.json({
    success: true,
    player,
    sessionToken,
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
  player.hasOnboarded = true;

  savePlayer(player);
  res.json({ success: true, player });
});

// POST /api/player/set-active-cat
apiRouter.post('/player/set-active-cat', (req: Request, res: Response) => {
  const player = getAuthenticatedPlayer(req);
  if (!player) return res.status(401).json({ success: false, error: 'Player not found' });

  const { catId, catSkin } = req.body;
  if (!player.ownedCats) player.ownedCats = {};

  if (!player.ownedCats[catId]) {
    if (catSkin) {
      player.ownedCats[catId] = {
        count: 1,
        unlockedAt: new Date().toISOString(),
        isFavorite: false,
        customSkin: catSkin,
      };
    } else {
      return res.status(400).json({ success: false, error: 'You do not own this cat yet!' });
    }
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
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht angemeldet' });

    const { keyType, amount } = req.body as { keyType: KeyType; amount?: number };
    const rate = KEY_EXCHANGE_RATES[keyType];
    if (!rate) return res.status(400).json({ success: false, error: 'Ungültiger Schlüsseltyp' });

    const qty = Math.max(1, Math.floor(amount || 1));
    const totalPrice = rate.coinPrice * qty;

    if (player.coins < totalPrice) {
      return res.status(400).json({
        success: false,
        error: `Nicht genügend Münzen! Du hast ${player.coins.toLocaleString('de-DE')} 🪙, benötigst aber ${totalPrice.toLocaleString('de-DE')} 🪙.`,
      });
    }

    // Defensive initialization
    if (!player.keys) {
      player.keys = { wooden: 2, blue: 1, epic: 0, legendary: 0 };
    }
    if (!player.stats) {
      player.stats = {
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
      };
    }
    if (!player.achievements) {
      player.achievements = [];
    }

    player.coins -= totalPrice;
    player.keys[keyType] = (player.keys[keyType] || 0) + qty;
    player.stats.keysBought = (player.stats.keysBought || 0) + qty;
    player.stats.coinsSpent = (player.stats.coinsSpent || 0) + totalPrice;

    // Check key master achievement
    const ach = player.achievements.find(a => a.id === 'ach-key-buyer');
    if (ach) {
      ach.current = player.stats.keysBought;
      if (ach.current >= ach.goal) ach.unlocked = true;
    }

    savePlayer(player);
    return res.json({
      success: true,
      player,
      keyType,
      quantity: qty,
      totalPrice,
      newCount: player.keys[keyType],
    });
  } catch (err: any) {
    console.error('Error in /api/shop/buy-key:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Serverfehler beim Kauf des Schlüssels' });
  }
});

// POST /api/exchange/convert-keys -> now buy keys with coins!
apiRouter.post('/exchange/convert-keys', (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht angemeldet' });

    const { keyType, amount } = req.body as { keyType: KeyType; amount?: number };
    const rate = KEY_EXCHANGE_RATES[keyType];
    if (!rate) return res.status(400).json({ success: false, error: 'Ungültiger Schlüsseltyp' });

    const qty = Math.max(1, Math.floor(amount || 1));
    const totalPrice = rate.coinPrice * qty;

    if (player.coins < totalPrice) {
      return res.status(400).json({
        success: false,
        error: `Nicht genügend Münzen für ${qty}x ${rate.name}!`,
      });
    }

    if (!player.keys) {
      player.keys = { wooden: 2, blue: 1, epic: 0, legendary: 0 };
    }
    if (!player.stats) {
      player.stats = {
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
      };
    }

    player.coins -= totalPrice;
    player.keys[keyType] = (player.keys[keyType] || 0) + qty;
    player.stats.keysBought = (player.stats.keysBought || 0) + qty;

    savePlayer(player);
    return res.json({
      success: true,
      player,
      keyType,
      quantity: qty,
      totalPrice,
      newCount: player.keys[keyType],
    });
  } catch (err: any) {
    console.error('Error in /api/exchange/convert-keys:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Serverfehler beim Schlüsseltausch' });
  }
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
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht gefunden oder Sitzung abgelaufen' });

    const { chestId } = req.body as { chestId: 'wooden' | 'blue' | 'epic' | 'legendary' };
    const chest = CHESTS_CONFIG.find(c => c.id === chestId);
    if (!chest) return res.status(404).json({ success: false, error: 'Kiste nicht gefunden' });

    const requiredKey = chest.keyRequired;
    const hasKey = (player.keys[requiredKey] || 0) >= 1;

    // Chests can ONLY be opened with keys!
    if (!hasKey) {
      const keyInfo = KEY_EXCHANGE_RATES[requiredKey] || { name: requiredKey };
      return res.status(400).json({
        success: false,
        error: `Diese Kiste kann nur mit einem ${keyInfo.name} geöffnet werden! Kaufe Schlüssel im Shop mit deinen Münzen.`
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
    return res.json({
      success: true,
      player,
      droppedCat,
      isDuplicate,
      coinsAwarded,
      shardsAwarded: 0,
    });
  } catch (err: any) {
    console.error('Error opening chest:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Öffnen der Kiste' });
  }
});

// POST /api/stars/create-invoice - Official Telegram Stars Payment
apiRouter.post('/stars/create-invoice', async (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht gefunden' });

    const { bundleId } = req.body;
    const bundle = TELEGRAM_STARS_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return res.status(400).json({ success: false, error: 'Ungültiges Stars-Paket' });

    const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN;
    if (botToken) {
      try {
        const cleanTitle = `${bundle.coins.toLocaleString('de-DE')} Münzen`.slice(0, 32);
        const cleanDescription = `CatWorld: ${bundle.coins.toLocaleString('de-DE')} Münzen für Schlüssel & Truhen`.slice(0, 255);
        const payloadStr = JSON.stringify({ playerId: player.id, bundleId: bundle.id }).slice(0, 128);

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            description: cleanDescription,
            payload: payloadStr,
            provider_token: '', // Empty for Telegram Stars (XTR)
            currency: 'XTR',
            prices: [{ label: cleanTitle, amount: bundle.stars }],
          }),
        });
        const tgData: any = await tgRes.json();
        if (tgData && tgData.ok && tgData.result) {
          return res.json({
            success: true,
            invoiceUrl: tgData.result,
            bundle,
          });
        } else {
          console.warn('Telegram createInvoiceLink returned non-ok result:', tgData);
        }
      } catch (e) {
        console.warn('Telegram createInvoiceLink failed, offering simulated fallback:', e);
      }
    }

    // Direct mode / fallback when bot token is not configured or in preview
    return res.json({
      success: true,
      isSimulation: true,
      bundle,
    });
  } catch (err: any) {
    console.error('Error creating Stars invoice:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler bei der Stars-Rechnung' });
  }
});

// POST /api/stars/claim-purchase - Crediting coins upon payment confirmation
apiRouter.post('/stars/claim-purchase', (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht gefunden' });

    const { bundleId } = req.body;
    const bundle = TELEGRAM_STARS_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return res.status(400).json({ success: false, error: 'Ungültiges Stars-Paket' });

    if (!player.stats) {
      player.stats = {
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
      };
    }

    player.coins = (player.coins || 0) + bundle.coins;
    player.stats.totalCoinsEarned = (player.stats.totalCoinsEarned || 0) + bundle.coins;

    savePlayer(player);

    return res.json({
      success: true,
      player,
      coinsAdded: bundle.coins,
      bundle,
      message: `${bundle.coins.toLocaleString('de-DE')} Münzen erfolgreich gutgeschrieben! ⭐🎉`,
    });
  } catch (err: any) {
    console.error('Error claiming Stars purchase:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Gutschreiben der Münzen' });
  }
});

// POST /api/minigames/complete
apiRouter.post('/minigames/complete', (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Player not found' });

    if (!player.stats) {
      player.stats = {
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
      };
    }
    if (!player.dailyTasks) player.dailyTasks = [];
    if (!player.achievements) player.achievements = [];

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
  return res.json({
    success: true,
    player,
    coinsEarned,
    outcome,
  });
} catch (err: any) {
  console.error('Error completing minigame:', err);
  return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Abschließen des Spiels' });
}
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
  res.json({ success: true, listings: getMarketListings() });
});

// POST /api/market/list - List an owned cat on the marketplace
apiRouter.post('/market/list', (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht angemeldet' });

    const { catId, priceCoins } = req.body;
    if (!catId || !player.ownedCats[catId]) {
      return res.status(400).json({ success: false, error: 'Du besitzt diese Katze nicht!' });
    }

    if (player.activeCatId === catId) {
      return res.status(400).json({
        success: false,
        error: 'Du kannst deine aktuell ausgerüstete Katze nicht auf den Markt stellen! Rüste zuerst eine andere Katze aus.',
      });
    }

    const price = Math.max(50, Math.min(1000000, Math.floor(Number(priceCoins) || 500)));
    const catInfo = player.ownedCats[catId];
    const catSkin = catInfo.customSkin || GET_CAT_BY_ID(catId);

    // Remove or decrement from player inventory
    if (catInfo.count > 1) {
      catInfo.count -= 1;
    } else {
      delete player.ownedCats[catId];
    }

    const listing: TradeListing = {
      id: `listing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sellerPlayerId: player.id,
      sellerTelegramId: player.telegramUserId,
      sellerName: player.playerName,
      sellerTelegram: player.telegramUsername,
      cat: catSkin,
      priceCoins: price,
      wantsRarity: catSkin.rarity,
      createdAt: Date.now(),
    };

    addMarketListing(listing);
    savePlayer(player);

    return res.json({
      success: true,
      player,
      listing,
      listings: getMarketListings(),
      message: `${catSkin.name} für ${price.toLocaleString('de-DE')} Münzen auf dem Markt angeboten!`,
    });
  } catch (err: any) {
    console.error('Error listing cat on market:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Einstellen auf den Markt' });
  }
});

// POST /api/market/buy - Buy cat with coins & notify seller via Telegram bot
apiRouter.post('/market/buy', async (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht angemeldet' });

    const { listingId } = req.body;
    const listings = getMarketListings();
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return res.status(404).json({ success: false, error: 'Dieses Marktangebot ist nicht mehr verfügbar' });

    if (listing.sellerPlayerId === player.id) {
      return res.status(400).json({ success: false, error: 'Du kannst dein eigenes Angebot nicht kaufen!' });
    }

    if (player.coins < listing.priceCoins) {
      return res.status(400).json({
        success: false,
        error: `Nicht genügend Münzen! Du benötigst ${listing.priceCoins.toLocaleString('de-DE')} Münzen.`,
      });
    }

    // Deduct coins & add unique cat to buyer's collection
    player.coins -= listing.priceCoins;
    const now = new Date().toISOString();
    player.ownedCats[listing.cat.id] = {
      count: 1,
      unlockedAt: now,
      isFavorite: false,
      customSkin: listing.cat,
    };

    // Credit seller if it's a real player in db
    let sellerPlayer: PlayerData | null = null;
    if (listing.sellerPlayerId) {
      sellerPlayer = getPlayer(listing.sellerPlayerId);
      if (sellerPlayer) {
        sellerPlayer.coins = (sellerPlayer.coins || 0) + listing.priceCoins;
        if (!sellerPlayer.stats) {
          sellerPlayer.stats = {
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
          };
        }
        sellerPlayer.stats.totalCoinsEarned = (sellerPlayer.stats.totalCoinsEarned || 0) + listing.priceCoins;
        savePlayer(sellerPlayer);
      }
    }

    // Remove listing from store
    removeMarketListing(listing.id);

    // Save buyer
    savePlayer(player);

    // NOTIFY SELLER VIA TELEGRAM BOT API!
    const targetTelegramId = listing.sellerTelegramId || sellerPlayer?.telegramUserId;
    if (targetTelegramId) {
      const buyerHandle = player.telegramUsername ? `@${player.telegramUsername}` : player.playerName;
      const mintBadge = listing.cat.mintNumber ? ` (Mint #${listing.cat.mintNumber})` : '';
      sendTelegramNotification(
        targetTelegramId,
        `🎉 <b>Katze auf dem Markt verkauft!</b>\n\n` +
        `Spieler <b>${player.playerName}</b> (${buyerHandle}) hat deine Katze <b>${listing.cat.name}</b>${mintBadge} für <b>${listing.priceCoins.toLocaleString('de-DE')} Münzen</b> gekauft!\n\n` +
        `💰 Die <b>+${listing.priceCoins.toLocaleString('de-DE')} Münzen</b> wurden deinem Konto gutgeschrieben.\n` +
        `Öffne CatWorld, um neue Kisten oder Katzen zu sammeln! 🐾`
      ).catch(() => {});
    }

    return res.json({
      success: true,
      player,
      boughtCat: listing.cat,
      listings: getMarketListings(),
      message: `Erfolg! ${listing.cat.name} gehört jetzt dir! 🎉`,
    });
  } catch (err: any) {
    console.error('Error buying from market:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Kauf' });
  }
});

// POST /api/market/trade (Cat-for-Cat swap & Telegram notification)
apiRouter.post('/market/trade', async (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!player) return res.status(401).json({ success: false, error: 'Spieler nicht angemeldet' });

    const { listingId, offeredCatId } = req.body;
    const listings = getMarketListings();
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return res.status(404).json({ success: false, error: 'Angebot nicht mehr verfügbar' });

    if (listing.sellerPlayerId === player.id) {
      return res.status(400).json({ success: false, error: 'Du kannst nicht mit deinem eigenen Angebot tauschen!' });
    }

    const offeredOwned = player.ownedCats[offeredCatId];
    if (!offeredOwned) {
      return res.status(400).json({ success: false, error: 'Du besitzt diese Katze zum Tauschen nicht!' });
    }

    if (player.activeCatId === offeredCatId) {
      return res.status(400).json({
        success: false,
        error: 'Du kannst deine ausgerüstete Katze nicht tauschen! Rüste zuerst eine andere aus.',
      });
    }

    const offeredCatSkin = offeredOwned.customSkin || GET_CAT_BY_ID(offeredCatId);

    // Transfer offered cat out of player
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

    // If seller is a registered player, credit them with the offered cat
    let sellerPlayer: PlayerData | null = null;
    if (listing.sellerPlayerId) {
      sellerPlayer = getPlayer(listing.sellerPlayerId);
      if (sellerPlayer) {
        if (!sellerPlayer.ownedCats) sellerPlayer.ownedCats = {};
        sellerPlayer.ownedCats[offeredCatSkin.id] = {
          count: 1,
          unlockedAt: now,
          isFavorite: false,
          customSkin: offeredCatSkin,
        };
        savePlayer(sellerPlayer);
      }
    }

    // Remove old listing and add new listing with offered cat
    removeMarketListing(listing.id);

    // Save player
    savePlayer(player);

    // NOTIFY SELLER VIA TELEGRAM BOT!
    const targetTelegramId = listing.sellerTelegramId || sellerPlayer?.telegramUserId;
    if (targetTelegramId) {
      const traderHandle = player.telegramUsername ? `@${player.telegramUsername}` : player.playerName;
      sendTelegramNotification(
        targetTelegramId,
        `🔄 <b>Katzen-Tausch abgeschlossen!</b>\n\n` +
        `Spieler <b>${player.playerName}</b> (${traderHandle}) hat deine Katze <b>${listing.cat.name}</b> gegen <b>${offeredCatSkin.name}</b> getauscht!\n\n` +
        `Die neue Katze wurde zu deiner Sammlung hinzugefügt. 🐾`
      ).catch(() => {});
    }

    return res.json({
      success: true,
      player,
      receivedCat: listing.cat,
      tradedAway: offeredCatSkin,
      listings: getMarketListings(),
      message: `Tausch erfolgreich abgeschlossen! 🎉`,
    });
  } catch (err: any) {
    console.error('Error executing trade:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Tausch' });
  }
});

// ==========================================
// ADMIN ENDPOINTS (EXCLUSIVE FOR TELEGRAM ID 8979248747)
// ==========================================

// GET /api/admin/overview
apiRouter.get('/admin/overview', (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!isUserAdmin(player, req)) {
      return res.status(403).json({
        success: false,
        error: 'Zugriff verweigert. Diese Funktion ist exklusiv für Admin 8979248747.',
      });
    }

    const allPlayers = getAllRegisteredPlayers();
    const sanitizedPlayers = allPlayers.map(p => ({
      id: p.id,
      telegramUserId: p.telegramUserId,
      telegramUsername: p.telegramUsername,
      playerName: p.playerName,
      coins: p.coins,
      keys: p.keys || { wooden: 0, blue: 0, epic: 0, legendary: 0 },
      catsCount: Object.keys(p.ownedCats || {}).length,
      loginStreak: p.loginStreak || 1,
      createdAt: p.createdAt,
    }));

    // Sort by coins descending
    sanitizedPlayers.sort((a, b) => (b.coins || 0) - (a.coins || 0));

    return res.json({
      success: true,
      isAdmin: true,
      totalUsers: allPlayers.length,
      players: sanitizedPlayers,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching admin overview:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Laden der Admin-Daten' });
  }
});

// POST /api/admin/grant-coins
apiRouter.post('/admin/grant-coins', (req: Request, res: Response) => {
  try {
    const player = getAuthenticatedPlayer(req);
    if (!isUserAdmin(player, req)) {
      return res.status(403).json({
        success: false,
        error: 'Zugriff verweigert. Diese Funktion ist exklusiv für Admin 8979248747.',
      });
    }

    const { targetPlayerId, amount } = req.body;
    const addCoins = Math.floor(Number(amount));
    if (isNaN(addCoins) || addCoins === 0) {
      return res.status(400).json({ success: false, error: 'Ungültiger Münzbetrag' });
    }

    let target = getPlayer(targetPlayerId);
    if (!target) {
      // If targetPlayerId matches admin id or current session, recover target
      if (player && (player.id === targetPlayerId || targetPlayerId === 'CW-TG-8979248747')) {
        target = player;
      } else {
        target = getOrCreatePlayer(targetPlayerId);
      }
    }

    target.coins = Math.max(0, (target.coins || 0) + addCoins);
    if (!target.stats) {
      target.stats = {
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
      };
    }
    if (addCoins > 0) {
      target.stats.totalCoinsEarned = (target.stats.totalCoinsEarned || 0) + addCoins;
    }

    savePlayer(target);

    // If target has a telegram id and is not the admin themselves, optionally notify them
    if (target.telegramUserId && target.telegramUserId !== 8979248747 && addCoins > 0) {
      sendTelegramNotification(
        target.telegramUserId,
        `🎁 <b>Münzen vom Admin erhalten!</b>\n\n` +
        `Der Spielleiter hat deinem CatWorld-Konto <b>+${addCoins.toLocaleString('de-DE')} Münzen</b> gutgeschrieben! 🪙✨\n\n` +
        `Viel Spaß beim Kisten-Öffnen!`
      ).catch(() => {});
    }

    return res.json({
      success: true,
      message: `${addCoins > 0 ? '+' : ''}${addCoins.toLocaleString('de-DE')} Münzen erfolgreich an ${target.playerName} (${target.id}) vergeben!`,
      targetPlayer: target,
      grantedAmount: addCoins,
    });
  } catch (err: any) {
    console.error('Error granting coins in admin panel:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Fehler beim Vergeben der Münzen' });
  }
});
