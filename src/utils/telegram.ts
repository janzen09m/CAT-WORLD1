/* eslint-disable @typescript-eslint/no-explicit-any */
import { Achievement, PlayerStats } from '../types/game';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          query_id?: string;
          auth_date?: number;
          hash?: string;
          start_param?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableVerticalSwipes?: () => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage?: {
          setItem: (key: string, value: string, callback?: (err: Error | null, stored?: boolean) => void) => void;
          getItem: (key: string, callback: (err: Error | null, value?: string) => void) => void;
          getItems: (keys: string[], callback: (err: Error | null, values?: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (err: Error | null, removed?: boolean) => void) => void;
          removeItems: (keys: string[], callback?: (err: Error | null, removed?: boolean) => void) => void;
          getKeys: (callback: (err: Error | null, keys?: string[]) => void) => void;
        };
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        openTelegramLink: (url: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        onEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
        offEvent: (eventType: string, eventHandler: (...args: any[]) => void) => void;
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}

export function isTelegramAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

export function initTelegramApp(): void {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;
  if (webApp) {
    try {
      webApp.ready();
      webApp.expand();
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor('#0f172a');
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor('#0b1120');
      }
      if (webApp.enableClosingConfirmation) {
        webApp.enableClosingConfirmation();
      }
      if (webApp.disableVerticalSwipes) {
        webApp.disableVerticalSwipes();
      }
    } catch {
      // ignore
    }
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'): void {
  if (typeof window === 'undefined') return;
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  if (!haptic) return;
  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      haptic.notificationOccurred(type);
    } else if (type === 'selection') {
      haptic.selectionChanged();
    } else {
      haptic.impactOccurred(type);
    }
  } catch {
    // ignore
  }
}

export function getTelegramInitData(): string {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData || '';
}

export function getTelegramUser(): {
  id?: number;
  name?: string;
  username?: string;
  isPremium?: boolean;
  photoUrl?: string;
} {
  if (typeof window === 'undefined') return {};
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (user) {
    return {
      id: user.id,
      name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
      username: user.username,
      isPremium: user.is_premium,
      photoUrl: user.photo_url,
    };
  }
  return {};
}

// Share directly to Telegram contacts/chats
export function shareToTelegram(text: string, url?: string): void {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;
  const currentUrl = url || window.location.href;
  const shareLink = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`;

  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(shareLink);
  } else {
    window.open(shareLink, '_blank');
  }
}

/* =========================================================================
   TELEGRAM CLOUD STORAGE FOR ACHIEVEMENTS & PROGRESS PERSISTENCE
   "alle erfolge sollen in telegram gespeichert werden"
========================================================================= */

const TG_STORAGE_KEY_ACHIEVEMENTS = 'catworld_tg_achievements_v1';
const TG_STORAGE_KEY_STATS = 'catworld_tg_stats_v1';
const TG_STORAGE_KEY_SYNC_TIME = 'catworld_tg_last_sync';

// Low-level async wrapper for Telegram WebApp CloudStorage.setItem
export function tgCloudSetItem(key: string, value: string): Promise<boolean> {
  return new Promise(resolve => {
    // Fallback mirror to localStorage
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }

    const cloud = window.Telegram?.WebApp?.CloudStorage;
    if (cloud && typeof cloud.setItem === 'function') {
      try {
        cloud.setItem(key, value, (err, stored) => {
          if (err) {
            console.warn('[Telegram CloudStorage] SetItem error:', err);
            resolve(false);
          } else {
            resolve(stored ?? true);
          }
        });
        return;
      } catch (e) {
        console.warn('[Telegram CloudStorage] Exception in setItem:', e);
      }
    }
    // If not running inside Telegram client with CloudStorage, local storage fulfilled it
    resolve(true);
  });
}

// Low-level async wrapper for Telegram WebApp CloudStorage.getItem
export function tgCloudGetItem(key: string): Promise<string | null> {
  return new Promise(resolve => {
    const cloud = window.Telegram?.WebApp?.CloudStorage;
    if (cloud && typeof cloud.getItem === 'function') {
      try {
        cloud.getItem(key, (err, value) => {
          if (err || !value) {
            // fallback to local mirror
            try {
              resolve(localStorage.getItem(key));
            } catch {
              resolve(null);
            }
          } else {
            resolve(value);
          }
        });
        return;
      } catch {
        // fallback
      }
    }

    // Fallback to local storage
    try {
      resolve(localStorage.getItem(key));
    } catch {
      resolve(null);
    }
  });
}

// Save all achievements and stats directly into Telegram CloudStorage
export async function saveAchievementsToTelegramCloud(
  achievements: Achievement[],
  stats?: PlayerStats
): Promise<{ success: boolean; count: number; timestamp: number }> {
  const timestamp = Date.now();
  const achievementsJson = JSON.stringify({
    timestamp,
    achievements,
  });

  const achSuccess = await tgCloudSetItem(TG_STORAGE_KEY_ACHIEVEMENTS, achievementsJson);

  if (stats) {
    await tgCloudSetItem(TG_STORAGE_KEY_STATS, JSON.stringify({ timestamp, stats }));
  }

  await tgCloudSetItem(TG_STORAGE_KEY_SYNC_TIME, timestamp.toString());

  const unlockedCount = achievements.filter(a => a.unlocked || a.claimed).length;
  return {
    success: achSuccess,
    count: unlockedCount,
    timestamp,
  };
}

// Load achievements from Telegram CloudStorage
export async function loadAchievementsFromTelegramCloud(): Promise<{
  achievements?: Achievement[];
  stats?: PlayerStats;
  timestamp?: number;
} | null> {
  try {
    const achRaw = await tgCloudGetItem(TG_STORAGE_KEY_ACHIEVEMENTS);
    const statsRaw = await tgCloudGetItem(TG_STORAGE_KEY_STATS);

    let achievements: Achievement[] | undefined;
    let timestamp: number | undefined;
    let stats: PlayerStats | undefined;

    if (achRaw) {
      const parsed = JSON.parse(achRaw);
      if (Array.isArray(parsed.achievements)) {
        achievements = parsed.achievements;
        timestamp = parsed.timestamp;
      } else if (Array.isArray(parsed)) {
        achievements = parsed;
      }
    }

    if (statsRaw) {
      const parsedStats = JSON.parse(statsRaw);
      if (parsedStats?.stats) {
        stats = parsedStats.stats;
      }
    }

    if (achievements || stats) {
      return { achievements, stats, timestamp };
    }
    return null;
  } catch (err) {
    console.warn('[Telegram CloudStorage] Error parsing achievements:', err);
    return null;
  }
}

// Dev test ID helper
export function getOrCreateLocalDevId(): string {
  if (typeof window === 'undefined') return 'CW-LOCAL-DEFAULT';
  const KEY = 'catworld_local_player_id';
  let devId = localStorage.getItem(KEY);
  if (!devId) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    devId = `CW-DEV-${rand}`;
    localStorage.setItem(KEY, devId);
  }
  return devId;
}
