import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { PlayerData, LeaderboardEntry, CatSkin, TradeListing } from '../types/game';
import { CAT_SKINS, GET_CAT_BY_ID } from '../data/catsData';
import { INITIAL_DAILY_TASKS, INITIAL_ACHIEVEMENTS } from '../data/tasksAndAchievements';

const { Pool } = pg;

function getSafeDataDir(): string {
  try {
    if (fs.existsSync('/tmp')) {
      const p = path.resolve('/tmp', 'catworld_data');
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    }
  } catch {}
  return path.resolve(process.cwd(), 'data');
}

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = getSafeDataDir();
const DB_FILE = path.resolve(DATA_DIR, 'catworld_store.json');
const BUNDLED_DB_FILE = path.resolve(process.cwd(), 'data', 'catworld_store.json');

// PostgreSQL Connection Pool (optional fallback)
let customPostgresUrl: string | null = null;
const envConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let pgPool: pg.Pool | null = null;

export interface CloudflareD1Config {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

let cloudflareD1Config: CloudflareD1Config | null = null;
if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_D1_DATABASE_ID && process.env.CLOUDFLARE_API_TOKEN) {
  cloudflareD1Config = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID.trim(),
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID.trim(),
    apiToken: process.env.CLOUDFLARE_API_TOKEN.trim(),
  };
}

function cleanConnectionString(raw: string): string {
  let clean = raw.trim();
  clean = clean.replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1');
  clean = clean.replace(/[?&]$/, '');
  return clean;
}

function createPgPool(connStr: string): pg.Pool {
  const sanitized = cleanConnectionString(connStr);
  const pool = new Pool({
    connectionString: sanitized,
    ssl: sanitized.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => {
    console.warn('PostgreSQL pool background warning (auto-handled):', err?.message || err);
  });
  return pool;
}

if (envConnectionString) {
  try {
    pgPool = createPgPool(envConnectionString);
  } catch (err) {
    console.warn('PostgreSQL pool creation failed, falling back to local store:', err);
  }
}

interface DatabaseStore {
  players: Record<string, PlayerData>;
  marketListings: TradeListing[];
  serverStartedAt: string;
  nextGlobalMintNumber?: number;
  botToken?: string;
  postgresUrl?: string;
  cloudflareD1?: CloudflareD1Config;
}

// In-memory cache
let memoryStore: DatabaseStore = {
  players: {},
  marketListings: [],
  serverStartedAt: new Date().toISOString(),
  nextGlobalMintNumber: 1,
  botToken: undefined,
  postgresUrl: undefined,
  cloudflareD1: undefined,
};

// Initialize PostgreSQL tables if pool is active
async function initPgTables() {
  if (!pgPool) return;
  try {
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id VARCHAR(64) PRIMARY KEY,
          telegram_user_id BIGINT,
          telegram_username VARCHAR(128),
          player_name VARCHAR(64) NOT NULL DEFAULT 'Katzenfreund',
          cat_custom_name VARCHAR(64) NOT NULL DEFAULT 'Schneeflöckchen',
          active_cat_id VARCHAR(32) NOT NULL DEFAULT 'cat-01',
          coins INTEGER NOT NULL DEFAULT 500,
          keys_wooden INTEGER NOT NULL DEFAULT 2,
          keys_blue INTEGER NOT NULL DEFAULT 1,
          keys_epic INTEGER NOT NULL DEFAULT 0,
          keys_legendary INTEGER NOT NULL DEFAULT 0,
          room_background VARCHAR(32) NOT NULL DEFAULT 'cozy_living',
          login_streak INTEGER NOT NULL DEFAULT 1,
          last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
          daily_login_claimed_today BOOLEAN NOT NULL DEFAULT FALSE,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS global_meta (
          key VARCHAR(64) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_players_tg_uid ON players(telegram_user_id);
      `);

      // Load global mint counter from DB
      const metaRes = await client.query(`SELECT value FROM global_meta WHERE key = 'nextGlobalMintNumber'`);
      if (metaRes.rows.length > 0 && typeof metaRes.rows[0].value === 'number') {
        memoryStore.nextGlobalMintNumber = Math.max(memoryStore.nextGlobalMintNumber || 1, metaRes.rows[0].value);
      }

      // Load existing players from PostgreSQL
      const playersRes = await client.query(`SELECT id, data FROM players`);
      for (const row of playersRes.rows) {
        if (row.data && row.data.id) {
          memoryStore.players[row.data.id] = row.data;
        }
      }
      console.log(`🐘 Loaded ${playersRes.rows.length} players from PostgreSQL database`);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL tables:', err);
  }
}

// Write a player record to PostgreSQL asynchronously in background
function savePlayerToPg(player: PlayerData) {
  if (!pgPool) return;
  pgPool.query(
    `INSERT INTO players (
      id, telegram_user_id, telegram_username, player_name, cat_custom_name,
      active_cat_id, coins, keys_wooden, keys_blue, keys_epic, keys_legendary,
      room_background, login_streak, last_login_date, daily_login_claimed_today,
      data, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    ON CONFLICT (id) DO UPDATE SET
      telegram_user_id = EXCLUDED.telegram_user_id,
      telegram_username = EXCLUDED.telegram_username,
      player_name = EXCLUDED.player_name,
      cat_custom_name = EXCLUDED.cat_custom_name,
      active_cat_id = EXCLUDED.active_cat_id,
      coins = EXCLUDED.coins,
      keys_wooden = EXCLUDED.keys_wooden,
      keys_blue = EXCLUDED.keys_blue,
      keys_epic = EXCLUDED.keys_epic,
      keys_legendary = EXCLUDED.keys_legendary,
      room_background = EXCLUDED.room_background,
      login_streak = EXCLUDED.login_streak,
      last_login_date = EXCLUDED.last_login_date,
      daily_login_claimed_today = EXCLUDED.daily_login_claimed_today,
      data = EXCLUDED.data,
      updated_at = NOW()`,
    [
      player.id,
      player.telegramUserId || null,
      player.telegramUsername || null,
      player.playerName,
      player.catCustomName,
      player.activeCatId,
      player.coins,
      player.keys.wooden || 0,
      player.keys.blue || 0,
      player.keys.epic || 0,
      player.keys.legendary || 0,
      player.roomBackground,
      player.loginStreak || 1,
      player.lastLoginDate || new Date().toISOString().split('T')[0],
      player.dailyLoginClaimedToday || false,
      JSON.stringify(player),
    ]
  ).catch(err => {
    console.error(`PostgreSQL save error for player ${player.id}:`, err);
  });
}

function saveMintNumberToPg(mintNumber: number) {
  if (!pgPool) return;
  pgPool.query(
    `INSERT INTO global_meta (key, value, updated_at) VALUES ('nextGlobalMintNumber', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(mintNumber)]
  ).catch(() => {});
}

// ==========================================
// Cloudflare D1 Serverless Database (SQL at Edge)
// ==========================================

export async function queryCloudflareD1(sql: string, params: any[] = []): Promise<any[]> {
  const config = cloudflareD1Config || memoryStore.cloudflareD1;
  if (!config || !config.accountId || !config.databaseId || !config.apiToken) {
    throw new Error('Cloudflare D1 ist nicht eingerichtet');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    const errorMsg = data?.errors?.[0]?.message || `Cloudflare API Fehler (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  const queryResult = data.result?.[0];
  if (!queryResult || queryResult.success === false) {
    throw new Error(queryResult?.error || 'D1 SQL Query Fehler');
  }

  return queryResult.results || [];
}

export async function initCloudflareD1Tables(): Promise<void> {
  const config = cloudflareD1Config || memoryStore.cloudflareD1;
  if (!config || !config.accountId || !config.databaseId || !config.apiToken) return;

  try {
    await queryCloudflareD1(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        telegram_user_id INTEGER,
        telegram_username TEXT,
        player_name TEXT NOT NULL,
        coins INTEGER NOT NULL DEFAULT 500,
        data TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryCloudflareD1(`
      CREATE TABLE IF NOT EXISTS global_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryCloudflareD1(`
      CREATE TABLE IF NOT EXISTS market_listings (
        id TEXT PRIMARY KEY,
        seller_id TEXT,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Load global mint counter from D1
    try {
      const metaRes = await queryCloudflareD1(`SELECT value FROM global_meta WHERE key = 'nextGlobalMintNumber'`);
      if (metaRes.length > 0 && metaRes[0].value) {
        const val = typeof metaRes[0].value === 'string' ? JSON.parse(metaRes[0].value) : metaRes[0].value;
        if (typeof val === 'number') {
          memoryStore.nextGlobalMintNumber = Math.max(memoryStore.nextGlobalMintNumber || 1, val);
        }
      }
    } catch {}

    // Load existing players from D1 into memory cache
    try {
      const playersRes = await queryCloudflareD1(`SELECT id, data FROM players`);
      let loaded = 0;
      for (const row of playersRes) {
        if (row.data) {
          try {
            const p = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
            if (p && p.id) {
              memoryStore.players[p.id] = p;
              loaded++;
            }
          } catch {}
        }
      }
      console.log(`☁️ Loaded ${loaded} players from Cloudflare D1 database`);
    } catch (err) {
      console.warn('Could not load players from Cloudflare D1:', err);
    }
  } catch (err) {
    console.error('Error initializing Cloudflare D1 tables:', err);
    throw err;
  }
}

function savePlayerToCloudflareD1(player: PlayerData): void {
  const config = cloudflareD1Config || memoryStore.cloudflareD1;
  if (!config || !config.accountId || !config.databaseId || !config.apiToken) return;

  const sql = `
    INSERT INTO players (id, telegram_user_id, telegram_username, player_name, coins, data, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      telegram_user_id = excluded.telegram_user_id,
      telegram_username = excluded.telegram_username,
      player_name = excluded.player_name,
      coins = excluded.coins,
      data = excluded.data,
      updated_at = datetime('now');
  `;

  queryCloudflareD1(sql, [
    player.id,
    player.telegramUserId || null,
    player.telegramUsername || null,
    player.playerName,
    player.coins,
    JSON.stringify(player),
  ]).catch(err => {
    console.warn(`Cloudflare D1 background save for player ${player.id}:`, err?.message || err);
  });
}

function saveMintNumberToCloudflareD1(mintNumber: number): void {
  const config = cloudflareD1Config || memoryStore.cloudflareD1;
  if (!config || !config.accountId || !config.databaseId || !config.apiToken) return;

  const sql = `
    INSERT INTO global_meta (key, value, updated_at)
    VALUES ('nextGlobalMintNumber', ?, datetime('now'))
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = datetime('now');
  `;
  queryCloudflareD1(sql, [JSON.stringify(mintNumber)]).catch(() => {});
}

// Initialize file storage safely across both local Node and Vercel Serverless
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // If mkdir fails, continue in-memory
  }

  // Check if primary DB file exists
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.players === 'object') {
        memoryStore = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse primary db file, checking bundled fallback:', e);
    }
  } else if (isVercel && fs.existsSync(BUNDLED_DB_FILE)) {
    // On Vercel first run: seed from repository data file into /tmp
    try {
      const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.players === 'object') {
        memoryStore = parsed;
      }
      saveToDisk();
    } catch {
      saveToDisk();
    }
  } else {
    saveToDisk();
  }

  // Ensure default counter
  if (!memoryStore.nextGlobalMintNumber || memoryStore.nextGlobalMintNumber < 1) {
    memoryStore.nextGlobalMintNumber = 1;
  }

  // Number any cats if present
  syncAndNumberAllExistingCats();

  // Try PostgreSQL connection in background
  if (pgPool) {
    initPgTables().catch(() => {});
  }

  // Try Cloudflare D1 connection in background
  if (cloudflareD1Config || memoryStore.cloudflareD1) {
    initCloudflareD1Tables().catch(() => {});
  }
}

let isWriting = false;
let pendingWrite = false;

function saveToDisk() {
  if (isWriting) {
    pendingWrite = true;
    return;
  }
  isWriting = true;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database to disk:', err);
  } finally {
    isWriting = false;
    if (pendingWrite) {
      pendingWrite = false;
      saveToDisk();
    }
  }
}

/**
 * Iterates through all existing players and their owned cats,
 * sorting them chronologically and assigning clean sequential global mint numbers:
 * First unlocked cat gets #1, next #2, #3, etc.
 */
function syncAndNumberAllExistingCats() {
  interface CatRef {
    playerId: string;
    catId: string;
    unlockedAt: string;
    info: PlayerData['ownedCats'][string];
  }

  const allOwnedCats: CatRef[] = [];
  for (const player of Object.values(memoryStore.players)) {
    for (const [catId, info] of Object.entries(player.ownedCats)) {
      allOwnedCats.push({
        playerId: player.id,
        catId,
        unlockedAt: info.unlockedAt || player.createdAt || '2026-01-01',
        info,
      });
    }
  }

  if (allOwnedCats.length === 0) {
    memoryStore.nextGlobalMintNumber = 1;
    saveToDisk();
    return;
  }

  // Sort by unlocked timestamp ascending so the first cat unlocked is Global #1
  allOwnedCats.sort((a, b) => new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime());

  let serial = 1;
  let modified = false;

  for (const item of allOwnedCats) {
    const { catId, info } = item;
    const base = GET_CAT_BY_ID(catId, info.customSkin);
    const cleanName = (base.name || 'Cat').replace(/\s*#\d+/, '').trim();
    const mintNum = serial;

    // Check if renumbering or creation is needed
    if (!info.customSkin || info.customSkin.mintNumber !== mintNum) {
      const updatedSkin: CatSkin = {
        ...base,
        name: `${cleanName} #${mintNum}`,
        mintNumber: mintNum,
        dna: base.dna || `DNA-GLOBAL-${mintNum.toString().padStart(6, '0')}`,
        generation: base.generation || 1,
        isProcedural: true,
        personality: base.personality || 'Original Companion',
        earType: base.earType || (base.rarity === 'common' ? 'pointed' : (base.rarity === 'uncommon' ? 'rounded' : 'tufted-lynx')),
        eyeType: base.eyeType || (base.rarity === 'common' || base.rarity === 'uncommon' ? 'round' : 'anime-sparkle'),
        renderStyle: base.renderStyle || (base.rarity === 'common' ? '2d-flat' : (base.rarity === 'uncommon' ? '2d-harmonious' : (base.rarity === 'rare' ? '2d-expressive' : (base.rarity === 'epic' ? '3d-volumetric' : 'fluffy-legendary')))),
        toy: base.toy || (base.rarity === 'rare' ? 'yarn-ball' : (base.rarity === 'legendary' || base.rarity === 'mythic' ? 'golden-trophy' : 'none')),
        backgroundType: base.backgroundType || (base.rarity === 'legendary' ? 'sunset-aurora' : (base.rarity === 'mythic' ? 'golden-throne' : 'none')),
      };

      info.customSkin = updatedSkin;
      modified = true;
    }
    serial++;
  }

  memoryStore.nextGlobalMintNumber = serial;
  if (modified) {
    saveToDisk();
  }
}

// Global Mint sequence generator
export function getNextGlobalMintNumber(): number {
  if (!memoryStore.nextGlobalMintNumber || memoryStore.nextGlobalMintNumber < 1) {
    memoryStore.nextGlobalMintNumber = 1;
  }
  const next = memoryStore.nextGlobalMintNumber;
  memoryStore.nextGlobalMintNumber += 1;
  saveToDisk();
  saveMintNumberToPg(memoryStore.nextGlobalMintNumber);
  saveMintNumberToCloudflareD1(memoryStore.nextGlobalMintNumber);
  return next;
}

// Initialize immediately
ensureDataDir();

export function createNewPlayer(id: string, tgUser?: { id?: number; name?: string; username?: string }): PlayerData {
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  // Guaranteed starter cat (cat-01 White Cat) for every new player
  const starterBase = GET_CAT_BY_ID('cat-01');
  const starterMint = getNextGlobalMintNumber();
  const starterSkin: CatSkin = {
    ...starterBase,
    name: `${starterBase.name} #${starterMint}`,
    mintNumber: starterMint,
    dna: starterBase.dna || `DNA-GLOBAL-${starterMint.toString().padStart(6, '0')}`,
    generation: 1,
    isProcedural: false,
    personality: 'Treuer Starter-Gefährte',
  };

  const newPlayer: PlayerData = {
    id,
    telegramUserId: tgUser?.id,
    telegramUsername: tgUser?.username,
    playerName: tgUser?.name || 'Katzenfreund',
    catCustomName: 'Schneeflöckchen',
    activeCatId: 'cat-01',
    createdAt: now,
    coins: 500,
    starShards: 0,
    keys: {
      wooden: 2,
      blue: 1,
      epic: 0,
      legendary: 0,
    },
    ownedCats: {
      'cat-01': {
        count: 1,
        unlockedAt: now,
        isFavorite: true,
        customSkin: starterSkin,
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
    dailyTasks: JSON.parse(JSON.stringify(INITIAL_DAILY_TASKS)),
    achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
    loginStreak: 1,
    lastLoginDate: todayStr,
    dailyLoginClaimedToday: false,
    chestHistory: [],
    hasOnboarded: Boolean(tgUser?.name && tgUser.name !== 'Katzenfreund'),
  };

  // Sync starter cat to collection achievement
  newPlayer.achievements.forEach(ach => {
    if (ach.id === 'ach-collector-5') {
      ach.current = 1;
    }
  });

  memoryStore.players[id] = newPlayer;
  saveToDisk();
  savePlayerToPg(newPlayer);
  savePlayerToCloudflareD1(newPlayer);
  return newPlayer;
}

export function getPlayer(id: string): PlayerData | null {
  let player: PlayerData | undefined = memoryStore.players[id];
  if (!player) {
    reloadStoreFromDiskIfNeeded();
    player = memoryStore.players[id];
  }

  // If still not found and id is a Telegram-based ID, look up by telegramUserId or matching substring
  if (!player && id.startsWith('CW-TG-')) {
    const rawTgId = id.replace('CW-TG-', '');
    const numTgId = parseInt(rawTgId, 10);
    player = Object.values(memoryStore.players).find(
      p => p.id === id || (numTgId && p.telegramUserId === numTgId) || String(p.telegramUserId) === rawTgId
    );
  }

  if (!player) return null;

  // Ensure starShards is 0 and stats keysBought exists
  player.starShards = 0;
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
  if (player.stats.keysBought === undefined) {
    player.stats.keysBought = 0;
  }
  if (!player.dailyTasks || !Array.isArray(player.dailyTasks)) {
    player.dailyTasks = JSON.parse(JSON.stringify(INITIAL_DAILY_TASKS));
  }
  if (!player.achievements || !Array.isArray(player.achievements)) {
    player.achievements = JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS));
  }
  if (!player.chestHistory || !Array.isArray(player.chestHistory)) {
    player.chestHistory = [];
  }
  if (!player.keys) {
    player.keys = { wooden: 2, blue: 1, epic: 0, legendary: 0 };
  }
  if (!player.ownedCats) {
    player.ownedCats = {};
  }

  let needsSave = false;

  // Guarantee starter cat if player has 0 cats (fixes any previous desync)
  if (Object.keys(player.ownedCats).length === 0) {
    const starterBase = GET_CAT_BY_ID('cat-01');
    const starterMint = getNextGlobalMintNumber();
    const starterSkin: CatSkin = {
      ...starterBase,
      name: `${starterBase.name} #${starterMint}`,
      mintNumber: starterMint,
      dna: starterBase.dna || `DNA-GLOBAL-${starterMint.toString().padStart(6, '0')}`,
      generation: 1,
      isProcedural: false,
      personality: 'Treuer Starter-Gefährte',
    };
    player.ownedCats['cat-01'] = {
      count: 1,
      unlockedAt: player.createdAt || new Date().toISOString(),
      isFavorite: true,
      customSkin: starterSkin,
    };
    player.activeCatId = 'cat-01';
    needsSave = true;
  }

  // Ensure activeCatId points to a valid owned cat
  if (!player.activeCatId || !player.ownedCats[player.activeCatId]) {
    const firstCatId = Object.keys(player.ownedCats)[0];
    if (firstCatId) {
      player.activeCatId = firstCatId;
      needsSave = true;
    }
  }

  // Check if any owned cats lack customSkin or mintNumber
  for (const [catId, info] of Object.entries(player.ownedCats)) {
    if (!info.customSkin || !info.customSkin.mintNumber) {
      const mintNum = getNextGlobalMintNumber();
      const base = GET_CAT_BY_ID(catId, info.customSkin);
      const cleanName = (base.name || 'Cat').replace(/\s*#\d+/, '').trim();
      info.customSkin = {
        ...base,
        name: `${cleanName} #${mintNum}`,
        mintNumber: mintNum,
        dna: base.dna || `DNA-GLOBAL-${mintNum.toString().padStart(6, '0')}`,
        generation: 1,
        isProcedural: true,
      };
      needsSave = true;
    }
  }

  // Ensure collection achievements match true owned count
  const ownedCount = Object.keys(player.ownedCats).length;
  player.achievements.forEach(ach => {
    if (ach.id === 'ach-collector-5') ach.current = Math.max(ach.current, ownedCount);
    if (ach.id === 'ach-collector-15') ach.current = Math.max(ach.current, ownedCount);
    if (ach.id === 'ach-collector-30') ach.current = Math.max(ach.current, ownedCount);
    if (ach.id === 'ach-collector-all') ach.current = Math.max(ach.current, ownedCount);
    if (ach.current >= ach.goal) ach.unlocked = true;
  });

  if (needsSave) {
    saveToDisk();
    savePlayerToPg(player);
    savePlayerToCloudflareD1(player);
  }

  // Check daily reset
  checkDailyReset(player);
  return player;
}

export function getOrCreatePlayer(id: string, tgUser?: { id?: number; name?: string; username?: string }): PlayerData {
  const existing = getPlayer(id);
  if (existing) {
    if (tgUser?.id && !existing.telegramUserId) {
      existing.telegramUserId = tgUser.id;
      existing.telegramUsername = tgUser.username;
      saveToDisk();
      savePlayerToPg(existing);
      savePlayerToCloudflareD1(existing);
    }
    return existing;
  }
  return createNewPlayer(id, tgUser);
}

export function savePlayer(player: PlayerData): void {
  memoryStore.players[player.id] = player;
  saveToDisk();
  savePlayerToPg(player);
  savePlayerToCloudflareD1(player);
}

export function reloadStoreFromDiskIfNeeded(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.players === 'object') {
        memoryStore.players = { ...memoryStore.players, ...parsed.players };
      }
      if (parsed && Array.isArray(parsed.marketListings) && parsed.marketListings.length > 0) {
        memoryStore.marketListings = parsed.marketListings;
      }
      if (parsed && parsed.botToken) {
        memoryStore.botToken = parsed.botToken;
      }
      if (parsed && parsed.postgresUrl) {
        memoryStore.postgresUrl = parsed.postgresUrl;
        customPostgresUrl = parsed.postgresUrl;
        if (!pgPool) {
          try {
            pgPool = createPgPool(parsed.postgresUrl);
            initPgTables().catch(() => {});
          } catch {}
        }
      }
      if (parsed && parsed.cloudflareD1) {
        memoryStore.cloudflareD1 = parsed.cloudflareD1;
        if (!cloudflareD1Config) {
          cloudflareD1Config = parsed.cloudflareD1;
          initCloudflareD1Tables().catch(() => {});
        }
      }
      if (parsed && parsed.nextGlobalMintNumber) {
        memoryStore.nextGlobalMintNumber = Math.max(memoryStore.nextGlobalMintNumber || 1, parsed.nextGlobalMintNumber);
      }
    }
  } catch (e) {
    // ignore read conflicts
  }
}

export function getAllRegisteredPlayers(): PlayerData[] {
  reloadStoreFromDiskIfNeeded();
  return Object.values(memoryStore.players || {});
}

export function getMarketListings(): TradeListing[] {
  reloadStoreFromDiskIfNeeded();
  if (!Array.isArray(memoryStore.marketListings)) {
    memoryStore.marketListings = [];
  }
  return memoryStore.marketListings;
}

export function addMarketListing(listing: TradeListing): void {
  reloadStoreFromDiskIfNeeded();
  if (!Array.isArray(memoryStore.marketListings)) {
    memoryStore.marketListings = [];
  }
  memoryStore.marketListings.unshift(listing);
  saveToDisk();
}

export function removeMarketListing(listingId: string): TradeListing | null {
  reloadStoreFromDiskIfNeeded();
  if (!Array.isArray(memoryStore.marketListings)) {
    memoryStore.marketListings = [];
    return null;
  }
  const index = memoryStore.marketListings.findIndex(l => l.id === listingId);
  if (index === -1) return null;
  const [removed] = memoryStore.marketListings.splice(index, 1);
  saveToDisk();
  return removed;
}

export function getStoredBotToken(): string | undefined {
  reloadStoreFromDiskIfNeeded();
  return memoryStore.botToken;
}

export function setStoredBotToken(token: string): void {
  memoryStore.botToken = token.trim();
  saveToDisk();
  if (pgPool) {
    pgPool.query(
      `INSERT INTO global_meta (key, value, updated_at) VALUES ('botToken', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(memoryStore.botToken)]
    ).catch(() => {});
  }
}

export function getCloudflareD1Status(): {
  isConnected: boolean;
  accountId?: string;
  databaseId?: string;
  maskedToken?: string;
} {
  const config = cloudflareD1Config || memoryStore.cloudflareD1;
  if (!config || !config.accountId || !config.databaseId || !config.apiToken) {
    return { isConnected: false };
  }
  const token = config.apiToken;
  const maskedToken = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '****';
  return {
    isConnected: true,
    accountId: config.accountId,
    databaseId: config.databaseId,
    maskedToken,
  };
}

export async function setCloudflareD1Config(config: CloudflareD1Config): Promise<{ success: boolean; message: string; userCount: number }> {
  const accountId = config.accountId.trim();
  const databaseId = config.databaseId.trim();
  const apiToken = config.apiToken.trim();

  if (!accountId || !databaseId || !apiToken) {
    throw new Error('Account ID, Database ID und API Token müssen angegeben werden.');
  }

  // Test Cloudflare D1 query
  const testEndpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const res = await fetch(testEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: 'SELECT 1 as test', params: [] }),
  });

  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    const errorMsg = data?.errors?.[0]?.message || `Cloudflare API Fehler (${res.status}). Prüfe Account ID, Database ID und Token.`;
    throw new Error(errorMsg);
  }

  // Active configuration
  cloudflareD1Config = { accountId, databaseId, apiToken };
  memoryStore.cloudflareD1 = { accountId, databaseId, apiToken };
  saveToDisk();

  // Initialize tables
  await initCloudflareD1Tables();

  // Push existing memory players to Cloudflare D1
  for (const player of Object.values(memoryStore.players)) {
    savePlayerToCloudflareD1(player);
  }

  return {
    success: true,
    message: 'Erfolgreich mit Cloudflare D1 verbunden! Tabellen angelegt und alle Daten synchronisiert.',
    userCount: Object.keys(memoryStore.players).length,
  };
}

export function getDatabaseStatus(): {
  provider: 'cloudflare_d1' | 'postgres' | 'local';
  isConnected: boolean;
  cloudflare: {
    isConnected: boolean;
    accountId?: string;
    databaseId?: string;
    maskedToken?: string;
  };
  postgres: {
    isConnected: boolean;
    connectionStringPresent: boolean;
    maskedUrl?: string;
    source?: 'env' | 'custom' | 'none';
  };
} {
  const cf = getCloudflareD1Status();
  const pg = getPostgresStatus();
  let provider: 'cloudflare_d1' | 'postgres' | 'local' = 'local';
  if (cf.isConnected) {
    provider = 'cloudflare_d1';
  } else if (pg.isConnected) {
    provider = 'postgres';
  }

  return {
    provider,
    isConnected: cf.isConnected || pg.isConnected,
    cloudflare: cf,
    postgres: pg,
  };
}

export function getPostgresStatus(): {
  isConnected: boolean;
  connectionStringPresent: boolean;
  maskedUrl?: string;
  source?: 'env' | 'custom' | 'none';
} {
  const url = customPostgresUrl || memoryStore.postgresUrl || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  let maskedUrl = '';
  let source: 'env' | 'custom' | 'none' = 'none';

  if (url) {
    source = (customPostgresUrl || memoryStore.postgresUrl) ? 'custom' : 'env';
    try {
      const parsed = new URL(url);
      maskedUrl = `${parsed.protocol}//${parsed.username ? parsed.username + '@' : ''}${parsed.host}${parsed.pathname}`;
    } catch {
      maskedUrl = url.length > 20 ? `${url.slice(0, 15)}...${url.slice(-8)}` : url;
    }
  }

  return {
    isConnected: Boolean(pgPool),
    connectionStringPresent: Boolean(url),
    maskedUrl,
    source,
  };
}

export async function setPostgresConnectionString(rawUrl: string): Promise<{ success: boolean; message: string; userCount: number }> {
  let url = rawUrl.trim();
  if (!url || (!url.startsWith('postgres://') && !url.startsWith('postgresql://'))) {
    throw new Error('Ungültige Postgres-URL. Muss mit postgresql:// oder postgres:// beginnen.');
  }

  // Detect if user copied masked password with asterisks
  if (url.includes('****') || url.includes('neondb_owner:***')) {
    throw new Error('Im Link stehen noch Sternchen (***)! Klicke in Neon bei "Connection Details" zuerst auf "Show password" oder das Kopieren-Symbol, damit das echte Passwort im Link steht.');
  }

  url = cleanConnectionString(url);
  const testPool = createPgPool(url);

  // Test actual connection
  let testClient: pg.PoolClient;
  try {
    testClient = await testPool.connect();
  } catch (connErr: any) {
    if (connErr?.message?.includes('password authentication failed')) {
      throw new Error('Passwort falsch! Bitte stelle sicher, dass du in Neon bei "Connection Details" auf "Show password" klickst und das unmaskierte Kennwort kopierst.');
    }
    throw new Error(`Verbindungsaufbau fehlgeschlagen: ${connErr?.message || connErr}`);
  }

  try {
    await testClient.query('SELECT 1;');
  } finally {
    testClient.release();
  }

  // Swap to new pool
  if (pgPool) {
    try {
      await pgPool.end();
    } catch {}
  }
  pgPool = testPool;
  customPostgresUrl = url;
  memoryStore.postgresUrl = url;

  // Initialize tables in Neon Postgres
  await initPgTables();

  // Push all existing memory players to PostgreSQL
  for (const player of Object.values(memoryStore.players)) {
    savePlayerToPg(player);
  }

  // Load all players currently in PostgreSQL into memory
  try {
    const res = await testPool.query('SELECT id, data FROM players');
    for (const row of res.rows) {
      if (row.data && row.data.id) {
        memoryStore.players[row.data.id] = row.data;
      }
    }
  } catch {}

  saveToDisk();

  return {
    success: true,
    message: 'Erfolgreich mit Neon.tech PostgreSQL verbunden! Tabellen initialisiert und alle Spielerdaten synchronisiert.',
    userCount: Object.keys(memoryStore.players).length,
  };
}

export function syncPlayerProfile(profile: PlayerData): PlayerData {
  if (!profile || !profile.id) {
    throw new Error('Ungültiges Spielerprofil');
  }
  reloadStoreFromDiskIfNeeded();
  const existing = memoryStore.players[profile.id];

  if (existing) {
    // Merge defensively: never lose higher coins or cats
    const mergedCoins = Math.max(existing.coins || 0, profile.coins || 0);
    const mergedOwnedCats = { ...(existing.ownedCats || {}), ...(profile.ownedCats || {}) };
    const mergedKeys = {
      wooden: Math.max(existing.keys?.wooden || 0, profile.keys?.wooden || 0),
      blue: Math.max(existing.keys?.blue || 0, profile.keys?.blue || 0),
      epic: Math.max(existing.keys?.epic || 0, profile.keys?.epic || 0),
      legendary: Math.max(existing.keys?.legendary || 0, profile.keys?.legendary || 0),
    };

    const mergedPlayer: PlayerData = {
      ...existing,
      ...profile,
      coins: mergedCoins,
      ownedCats: mergedOwnedCats,
      keys: mergedKeys,
      activeCatId: profile.activeCatId && mergedOwnedCats[profile.activeCatId] ? profile.activeCatId : (existing.activeCatId || Object.keys(mergedOwnedCats)[0] || 'cat-01'),
      stats: {
        ...(existing.stats || {}),
        ...(profile.stats || {}),
        gamesWon: Math.max(existing.stats?.gamesWon || 0, profile.stats?.gamesWon || 0),
        chessWins: Math.max(existing.stats?.chessWins || 0, profile.stats?.chessWins || 0),
        chestsOpened: Math.max(existing.stats?.chestsOpened || 0, profile.stats?.chestsOpened || 0),
        totalCoinsEarned: Math.max(existing.stats?.totalCoinsEarned || 0, profile.stats?.totalCoinsEarned || 0, mergedCoins),
      },
    };

    savePlayer(mergedPlayer);
    return mergedPlayer;
  } else {
    savePlayer(profile);
    return profile;
  }
}

function checkDailyReset(player: PlayerData): void {
  const todayStr = new Date().toISOString().split('T')[0];
  if (player.lastLoginDate !== todayStr) {
    // Check streak
    const lastDate = new Date(player.lastLoginDate);
    const today = new Date(todayStr);
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      player.loginStreak = (player.loginStreak || 1) + 1;
    } else if (diffDays > 1) {
      player.loginStreak = 1;
    }

    player.lastLoginDate = todayStr;
    player.dailyLoginClaimedToday = false;

    // Reset daily tasks
    player.dailyTasks = JSON.parse(JSON.stringify(INITIAL_DAILY_TASKS));
    saveToDisk();
  }
}

export function calculateCollectorValue(player: PlayerData): number {
  let total = 0;
  for (const [catId, info] of Object.entries(player.ownedCats)) {
    const skin = GET_CAT_BY_ID(catId, info.customSkin);
    if (skin) {
      total += skin.collectorValue;
      if (info.count > 1) {
        total += (info.count - 1) * Math.round(skin.collectorValue * 0.25);
      }
    }
  }
  return total;
}

export function getLeaderboard(): {
  topCollectors: LeaderboardEntry[];
  topWinners: LeaderboardEntry[];
  topChess: LeaderboardEntry[];
  topStreaks: LeaderboardEntry[];
} {
  const all = Object.values(memoryStore.players);

  // Seeded bot players for an exciting global leaderboard!
  const virtualPlayers: LeaderboardEntry[] = [
    {
      id: 'BOT-1',
      playerName: 'Felix the Cat',
      catCustomName: 'Galaxy Paw',
      activeCatId: 'cat-42',
      activeCatName: 'Galaxy Cat Andromeda',
      activeCatRarity: 'legendary',
      collectorValue: 12450,
      catsCount: 28,
      gamesWon: 45,
      chessWins: 18,
      loginStreak: 14,
    },
    {
      id: 'BOT-2',
      playerName: 'Mimi & Purr',
      catCustomName: 'Aura',
      activeCatId: 'cat-47',
      activeCatName: 'Crystal Cat Prismatica',
      activeCatRarity: 'mythic',
      collectorValue: 18900,
      catsCount: 35,
      gamesWon: 82,
      chessWins: 24,
      loginStreak: 21,
    },
    {
      id: 'BOT-3',
      playerName: 'Captain Whiskers',
      catCustomName: 'Blackbeard',
      activeCatId: 'cat-24',
      activeCatName: 'Pirate Cat',
      activeCatRarity: 'rare',
      collectorValue: 7800,
      catsCount: 19,
      gamesWon: 39,
      chessWins: 9,
      loginStreak: 8,
    },
    {
      id: 'BOT-4',
      playerName: 'Star Dancer',
      catCustomName: 'Stardust',
      activeCatId: 'cat-48',
      activeCatName: 'Astral Star Cat',
      activeCatRarity: 'mythic',
      collectorValue: 24500,
      catsCount: 42,
      gamesWon: 110,
      chessWins: 32,
      loginStreak: 30,
    },
  ];

  const realEntries: LeaderboardEntry[] = all.map(p => {
    const activeSkin = p.activeCatId && p.ownedCats[p.activeCatId]
      ? GET_CAT_BY_ID(p.activeCatId, p.ownedCats[p.activeCatId]?.customSkin)
      : null;
    return {
      id: p.id,
      playerName: p.playerName,
      catCustomName: p.catCustomName,
      activeCatId: p.activeCatId || '',
      activeCatName: activeSkin ? activeSkin.name : 'Keine Katze',
      activeCatRarity: activeSkin ? activeSkin.rarity : 'common',
      collectorValue: calculateCollectorValue(p),
      catsCount: Object.keys(p.ownedCats).length,
      gamesWon: p.stats.gamesWon || 0,
      chessWins: p.stats.chessWins || 0,
      loginStreak: p.loginStreak || 1,
    };
  });

  const combined = [...realEntries, ...virtualPlayers];

  return {
    topCollectors: [...combined].sort((a, b) => b.collectorValue - a.collectorValue).slice(0, 15),
    topWinners: [...combined].sort((a, b) => b.gamesWon - a.gamesWon).slice(0, 15),
    topChess: [...combined].sort((a, b) => b.chessWins - a.chessWins).slice(0, 15),
    topStreaks: [...combined].sort((a, b) => b.loginStreak - a.loginStreak).slice(0, 15),
  };
}
