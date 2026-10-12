-- =========================================================
-- CAT WORLD - PostgreSQL Database Schema
-- Production Schema for Vercel Postgres / Supabase / Neon
-- =========================================================

-- 1. Players Table
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(64) PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE,
    telegram_username VARCHAR(128),
    player_name VARCHAR(64) NOT NULL DEFAULT 'Katzenfreund',
    cat_custom_name VARCHAR(64) NOT NULL DEFAULT 'Schneeflöckchen',
    active_cat_id VARCHAR(32) NOT NULL DEFAULT 'cat-01',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    coins INTEGER NOT NULL DEFAULT 250 CHECK (coins >= 0),
    star_shards INTEGER NOT NULL DEFAULT 25 CHECK (star_shards >= 0),
    wooden_keys INTEGER NOT NULL DEFAULT 2 CHECK (wooden_keys >= 0),
    blue_keys INTEGER NOT NULL DEFAULT 1 CHECK (blue_keys >= 0),
    epic_keys INTEGER NOT NULL DEFAULT 0 CHECK (epic_keys >= 0),
    legendary_keys INTEGER NOT NULL DEFAULT 0 CHECK (legendary_keys >= 0),
    room_background VARCHAR(32) NOT NULL DEFAULT 'cozy_living',
    login_streak INTEGER NOT NULL DEFAULT 1,
    last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    daily_login_claimed_today BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for Telegram user queries
CREATE INDEX IF NOT EXISTS idx_players_tg_id ON players(telegram_user_id);

-- 2. Owned Cats (Inventory & Duplicates)
CREATE TABLE IF NOT EXISTS owned_cats (
    player_id VARCHAR(64) REFERENCES players(id) ON DELETE CASCADE,
    cat_id VARCHAR(32) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (player_id, cat_id)
);

-- 3. Player Stats Table
CREATE TABLE IF NOT EXISTS player_stats (
    player_id VARCHAR(64) PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    tictactoe_wins INTEGER NOT NULL DEFAULT 0,
    tennis_wins INTEGER NOT NULL DEFAULT 0,
    chess_wins INTEGER NOT NULL DEFAULT 0,
    memory_wins INTEGER NOT NULL DEFAULT 0,
    cat_catch_high_score INTEGER NOT NULL DEFAULT 0,
    chests_opened INTEGER NOT NULL DEFAULT 0,
    cats_bought INTEGER NOT NULL DEFAULT 0,
    keys_converted INTEGER NOT NULL DEFAULT 0,
    total_coins_earned INTEGER NOT NULL DEFAULT 250,
    pet_count INTEGER NOT NULL DEFAULT 0
);

-- 4. Chest Opening History
CREATE TABLE IF NOT EXISTS chest_history (
    id VARCHAR(64) PRIMARY KEY,
    player_id VARCHAR(64) REFERENCES players(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    chest_id VARCHAR(32) NOT NULL,
    cat_id VARCHAR(32) NOT NULL,
    cat_name VARCHAR(64) NOT NULL,
    rarity VARCHAR(24) NOT NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    shards_awarded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chest_history_player ON chest_history(player_id, timestamp DESC);

-- 5. Economic Audit Ledger (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    player_id VARCHAR(64) REFERENCES players(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- 'minigame_reward', 'chest_open', 'shop_buy', 'key_convert', 'login_bonus'
    currency VARCHAR(16) NOT NULL, -- 'coins', 'star_shards', 'key'
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id, created_at DESC);
