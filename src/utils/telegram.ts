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
        isVersionAtLeast?: (version: string) => boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        disableVerticalSwipes?: () => void;
        HapticFeedback?: {
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
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        onEvent?: (eventType: string, eventHandler: (...args: any[]) => void) => void;
        offEvent?: (eventType: string, eventHandler: (...args: any[]) => void) => void;
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

// Check if Telegram client version supports a given feature version (e.g. 6.9 for CloudStorage)
export function isTgVersionAtLeast(requiredVersion: string): boolean {
  if (typeof window === 'undefined') return false;
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return false;
  try {
    if (typeof webApp.isVersionAtLeast === 'function') {
      return webApp.isVersionAtLeast(requiredVersion);
    }
    if (webApp.version) {
      const current = parseFloat(webApp.version);
      const req = parseFloat(requiredVersion);
      return !isNaN(current) && !isNaN(req) && current >= req;
    }
  } catch {
    return false;
  }
  return false;
}

// Telegram CloudStorage was added in Bot API 6.9.
// Calling CloudStorage in Telegram 6.0 causes "[Telegram.WebApp] CloudStorage is not supported in version 6.0"
export function isTgCloudStorageSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.CloudStorage) return false;
  return isTgVersionAtLeast('6.9');
}

export function initTelegramApp(): void {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;
  if (webApp) {
    try {
      if (typeof webApp.ready === 'function') webApp.ready();
      if (typeof webApp.expand === 'function') webApp.expand();

      // Features introduced in 6.1+
      if (isTgVersionAtLeast('6.1')) {
        if (webApp.setHeaderColor) webApp.setHeaderColor('#0f172a');
        if (webApp.setBackgroundColor) webApp.setBackgroundColor('#0b1120');
      }

      // Closing confirmation introduced in 6.2+
      if (isTgVersionAtLeast('6.2') && webApp.enableClosingConfirmation) {
        webApp.enableClosingConfirmation();
      }

      // Vertical swipe disabling introduced in 7.7+
      if (isTgVersionAtLeast('7.7') && webApp.disableVerticalSwipes) {
        webApp.disableVerticalSwipes();
      }
    } catch {
      // ignore
    }
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'): void {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;
  if (!webApp || !isTgVersionAtLeast('6.1')) return;
  const haptic = webApp.HapticFeedback;
  if (!haptic) return;
  try {
    if (type === 'success' || type === 'warning' || type === 'error') {
      haptic.notificationOccurred?.(type);
    } else if (type === 'selection') {
      haptic.selectionChanged?.();
    } else {
      haptic.impactOccurred?.(type);
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
// Guaranteed not to throw or freeze on Telegram v6.0 or any older version
export function tgCloudSetItem(key: string, value: string): Promise<boolean> {
  // Always persist to local storage first
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }

  // If CloudStorage is not supported (e.g. Telegram 6.0), succeed via local mirror immediately
  if (!isTgCloudStorageSupported()) {
    return Promise.resolve(true);
  }

  const cloud = window.Telegram?.WebApp?.CloudStorage;
  if (!cloud || typeof cloud.setItem !== 'function') {
    return Promise.resolve(true);
  }

  return new Promise(resolve => {
    let finished = false;
    // Safety timeout prevents hangs if Telegram bridge callback fails to fire
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(true);
      }
    }, 1000);

    try {
      cloud.setItem(key, value, (err, stored) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          if (err) {
            console.warn('[Telegram CloudStorage] SetItem error:', err);
            resolve(false);
          } else {
            resolve(stored ?? true);
          }
        }
      });
    } catch (e) {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        console.warn('[Telegram CloudStorage] Exception in setItem:', e);
        resolve(true);
      }
    }
  });
}

// Low-level async wrapper for Telegram WebApp CloudStorage.getItem
// Guaranteed not to hang on Telegram v6.0 or any client
export function tgCloudGetItem(key: string): Promise<string | null> {
  // If Telegram CloudStorage is not supported, read immediately from local mirror
  if (!isTgCloudStorageSupported()) {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  }

  const cloud = window.Telegram?.WebApp?.CloudStorage;
  if (!cloud || typeof cloud.getItem !== 'function') {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  }

  return new Promise(resolve => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try {
          resolve(localStorage.getItem(key));
        } catch {
          resolve(null);
        }
      }
    }, 1000);

    try {
      cloud.getItem(key, (err, value) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          if (err || !value) {
            try {
              resolve(localStorage.getItem(key));
            } catch {
              resolve(null);
            }
          } else {
            resolve(value);
          }
        }
      });
    } catch (e) {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        try {
          resolve(localStorage.getItem(key));
        } catch {
          resolve(null);
        }
      }
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
