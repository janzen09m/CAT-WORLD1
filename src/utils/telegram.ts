/* eslint-disable @typescript-eslint/no-explicit-any */

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
          };
          query_id?: string;
          auth_date?: number;
          hash?: string;
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
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}

export function initTelegramApp(): void {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;
  if (webApp) {
    try {
      webApp.ready();
      webApp.expand();
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

export function getTelegramUser(): { id?: number; name?: string; username?: string } {
  if (typeof window === 'undefined') return {};
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (user) {
    return {
      id: user.id,
      name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
      username: user.username,
    };
  }
  return {};
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
