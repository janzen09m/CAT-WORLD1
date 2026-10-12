import React from 'react';
import { Home, Cat, Package, Gamepad2, ShoppingBag, Trophy } from 'lucide-react';
import { Theme } from '../types/game';
import { soundManager } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';

export type TabType = 'home' | 'cats' | 'chests' | 'games' | 'shop' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unclaimedRewardsCount: number;
  theme?: Theme;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unclaimedRewardsCount,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cats', label: 'Cats', icon: Cat },
    { id: 'chests', label: 'Chests', icon: Package },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: Trophy, badge: unclaimedRewardsCount },
  ];

  const handleTabClick = (tabId: TabType) => {
    if (activeTab !== tabId) {
      soundManager.playClick();
      triggerHaptic('selection');
      onTabChange(tabId);
    }
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 pb-safe select-none border-t backdrop-blur-md transition-colors duration-200 ${
      isLight
        ? 'bg-white/95 border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]'
        : 'bg-slate-900/95 border-slate-800'
    }`}>
      <div className="max-w-md mx-auto grid grid-cols-6 px-1 py-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-pink-500 font-bold scale-105'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-3 h-0.5 bg-pink-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
