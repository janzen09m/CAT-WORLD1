import fs from 'fs';
import path from 'path';
import { PlayerData, LeaderboardEntry, CatSkin } from '../types/game';
import { CAT_SKINS, GET_CAT_BY_ID } from '../data/catsData';
import { INITIAL_DAILY_TASKS, INITIAL_ACHIEVEMENTS } from '../data/tasksAndAchievements';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'catworld_store.json');

interface DatabaseStore {
  players: Record<string, PlayerData>;
  serverStartedAt: string;
}

// In-memory cache
let memoryStore: DatabaseStore = {
  players: {},
  serverStartedAt: new Date().toISOString(),
};

// Initialize file storage
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    saveToDisk();
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.players === 'object') {
        memoryStore = parsed;
      }
    } catch (e) {
      console.error('Failed to read db file, using fresh store', e);
      saveToDisk();
    }
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

// Initialize immediately
ensureDataDir();

export function createNewPlayer(id: string, tgUser?: { id?: number; name?: string; username?: string }): PlayerData {
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  const newPlayer: PlayerData = {
    id,
    telegramUserId: tgUser?.id,
    telegramUsername: tgUser?.username,
    playerName: tgUser?.name || 'Cat Lover',
    catCustomName: 'Snowflake',
    activeCatId: 'cat-01',
    createdAt: now,
    coins: 300,
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
      totalCoinsEarned: 300,
      petCount: 0,
    },
    dailyTasks: JSON.parse(JSON.stringify(INITIAL_DAILY_TASKS)),
    achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
    loginStreak: 1,
    lastLoginDate: todayStr,
    dailyLoginClaimedToday: false,
    chestHistory: [],
  };

  memoryStore.players[id] = newPlayer;
  saveToDisk();
  return newPlayer;
}

export function getPlayer(id: string): PlayerData | null {
  const player = memoryStore.players[id];
  if (!player) return null;

  // Ensure starShards is 0 and stats keysBought exists
  player.starShards = 0;
  if (player.stats.keysBought === undefined) {
    player.stats.keysBought = 0;
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
    }
    return existing;
  }
  return createNewPlayer(id, tgUser);
}

export function savePlayer(player: PlayerData): void {
  memoryStore.players[player.id] = player;
  saveToDisk();
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
    const skin = GET_CAT_BY_ID(catId);
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
    const activeSkin = GET_CAT_BY_ID(p.activeCatId);
    return {
      id: p.id,
      playerName: p.playerName,
      catCustomName: p.catCustomName,
      activeCatId: p.activeCatId,
      activeCatName: activeSkin.name,
      activeCatRarity: activeSkin.rarity,
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
