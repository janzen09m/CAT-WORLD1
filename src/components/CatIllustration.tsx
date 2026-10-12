import React from 'react';
import { CatSkin } from '../types/game';

interface CatIllustrationProps {
  cat: CatSkin;
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

export const CatIllustration: React.FC<CatIllustrationProps> = ({
  cat,
  size = 140,
  className = '',
  isAnimated = true,
}) => {
  const {
    furColor,
    bellyColor,
    eyeColor,
    earInnerColor,
    noseColor,
    patternType,
    patternColor = '#000000',
    accessory = 'none',
    rarity,
    visualEffect,
  } = cat;

  const isPureGold = cat.specialTrait === 'pure-gold';
  const strokeColor = isPureGold ? '#B45309' : '#1E293B';
  const furFill = isPureGold ? `url(#grad-gold-metallic-${cat.id})` : furColor;
  const bodyFill = isPureGold ? `url(#grad-gold-metallic-${cat.id})` : `url(#grad-body-${cat.id})`;
  const bellyFill = isPureGold ? `url(#grad-gold-belly-${cat.id})` : bellyColor;

  // Rarity glow classes
  const getRarityAura = () => {
    if (isPureGold) {
      return 'drop-shadow-[0_0_25px_rgba(245,158,11,0.9)] ring-2 ring-amber-400 animate-pulse';
    }
    switch (rarity) {
      case 'mythic':
        return 'drop-shadow-[0_0_20px_rgba(236,72,153,0.7)]';
      case 'legendary':
        return 'drop-shadow-[0_0_16px_rgba(245,158,11,0.6)]';
      case 'epic':
        return 'drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]';
      case 'rare':
        return 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]';
      case 'uncommon':
        return 'drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]';
      default:
        return 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)]';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${getRarityAura()}`}
      style={{ width: size, height: size }}
    >
      {/* Background Aura / Orbits for Rare+ Cats */}
      {isPureGold && (
        <>
          <div className="absolute -top-3 -right-2 text-amber-300 animate-bounce pointer-events-none text-sm font-black">
            ✨
          </div>
          <div className="absolute -top-2 -left-2 text-yellow-300 animate-pulse pointer-events-none text-sm font-black">
            ✦
          </div>
          <div className="absolute -bottom-1 -right-2 text-amber-400 animate-pulse pointer-events-none text-xs">
            🪙
          </div>
        </>
      )}

      {visualEffect === 'celestial-orbit' && (
        <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-spin duration-10000 pointer-events-none">
          <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
          <span className="absolute -bottom-1 left-1/3 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#06b6d4]" />
        </div>
      )}

      {visualEffect === 'neon-glow' && (
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-md animate-pulse pointer-events-none" />
      )}

      {visualEffect === 'crystal-flare' && (
        <div className="absolute -top-1 -right-1 text-cyan-300 animate-bounce pointer-events-none text-xs">
          ✦
        </div>
      )}

      {visualEffect === 'fire-ember' && (
        <div className="absolute -top-2 left-1/4 text-amber-500 animate-pulse pointer-events-none text-xs">
          🔥
        </div>
      )}

      {visualEffect === 'golden-crown' && !isPureGold && (
        <div className="absolute -top-2 right-1/4 text-amber-400 animate-pulse pointer-events-none text-xs">
          ✨
        </div>
      )}

      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={`w-full h-full transition-transform duration-300 ${
          isAnimated ? 'hover:scale-105' : ''
        }`}
      >
        <defs>
          {/* Subtle gradient for body */}
          <linearGradient id={`grad-body-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={furColor} />
            <stop offset="100%" stopColor={furColor} stopOpacity="0.92" />
          </linearGradient>

          {/* 24K Metallic Gold Gradient for Pure Gold Cat */}
          <linearGradient id={`grad-gold-metallic-${cat.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="25%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* 24K Golden Belly Shimmer */}
          <linearGradient id={`grad-gold-belly-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="45%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>

          {/* Eye glow shine */}
          <radialGradient id={`grad-eye-${cat.id}`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="30%" stopColor={eyeColor} />
            <stop offset="100%" stopColor="#0B132B" />
          </radialGradient>
        </defs>

        {/* --- TAIL --- */}
        <path
          d="M 145 140 C 180 135 185 105 170 95 C 158 87 150 102 145 115"
          fill="none"
          stroke={furFill}
          strokeWidth="14"
          strokeLinecap="round"
          className={isAnimated ? 'origin-[145px_140px] animate-[pulse_3s_ease-in-out_infinite]' : ''}
        />
        {patternType === 'stripes' && (
          <path
            d="M 160 115 C 168 110 170 105 168 100"
            fill="none"
            stroke={patternColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* --- EARS --- */}
        {/* Left Ear */}
        <polygon
          points="46,75 28,24 80,48"
          fill={furFill}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polygon
          points="46,68 35,34 72,50"
          fill={isPureGold ? '#FEF08A' : earInnerColor}
        />

        {/* Right Ear */}
        <polygon
          points="154,75 172,24 120,48"
          fill={furFill}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polygon
          points="154,68 165,34 128,50"
          fill={isPureGold ? '#FEF08A' : earInnerColor}
        />

        {/* --- BODY --- */}
        <ellipse
          cx="100"
          cy="142"
          rx="52"
          ry="44"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="2.5"
        />

        {/* Belly patch */}
        <ellipse
          cx="100"
          cy="146"
          rx="32"
          ry="30"
          fill={bellyFill}
        />

        {/* Tuxedo Bow or Chest Pattern */}
        {patternType === 'tuxedo' && (
          <path
            d="M 85 125 L 100 148 L 115 125 Z"
            fill="#FFFFFF"
          />
        )}

        {/* --- PAWS (Front) --- */}
        <ellipse cx="78" cy="178" rx="14" ry="10" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
        <ellipse cx="122" cy="178" rx="14" ry="10" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
        {/* Paw toe lines */}
        <line x1="75" y1="174" x2="75" y2="182" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="81" y1="174" x2="81" y2="182" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="119" y1="174" x2="119" y2="182" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="125" y1="174" x2="125" y2="182" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />

        {/* --- HEAD --- */}
        <ellipse
          cx="100"
          cy="92"
          rx="54"
          ry="44"
          fill={bodyFill}
          stroke={strokeColor}
          strokeWidth="2.5"
        />

        {/* --- PATTERNS --- */}
        {patternType === 'stripes' && (
          <g fill="none" stroke={patternColor} strokeWidth="3.5" strokeLinecap="round">
            {/* Forehead stripes */}
            <path d="M 100 58 L 100 70" />
            <path d="M 91 60 L 93 72" />
            <path d="M 109 60 L 107 72" />
            {/* Cheek stripes */}
            <path d="M 52 90 L 65 92" />
            <path d="M 50 98 L 63 99" />
            <path d="M 148 90 L 135 92" />
            <path d="M 150 98 L 137 99" />
          </g>
        )}

        {patternType === 'spots' && (
          <g fill={patternColor}>
            <ellipse cx="72" cy="74" rx="12" ry="8" />
            <circle cx="125" cy="80" r="9" />
            <ellipse cx="100" cy="132" rx="14" ry="10" />
          </g>
        )}

        {patternType === 'calico' && (
          <g>
            <path d="M 55 65 Q 75 75 80 55 Z" fill={patternColor} />
            <path d="M 125 55 Q 135 80 150 70 Z" fill="#D97706" />
            <circle cx="68" cy="140" r="14" fill={patternColor} />
            <circle cx="132" cy="148" r="12" fill="#D97706" />
          </g>
        )}

        {patternType === 'robot' && (
          <g stroke={patternColor} strokeWidth="2" fill="none">
            <line x1="80" y1="62" x2="80" y2="76" />
            <line x1="120" y1="62" x2="120" y2="76" />
            <circle cx="80" cy="62" r="3" fill={patternColor} />
            <circle cx="120" cy="62" r="3" fill={patternColor} />
            <line x1="56" y1="92" x2="68" y2="92" />
            <line x1="132" y1="92" x2="144" y2="92" />
          </g>
        )}

        {patternType === 'cosmic' && (
          <g fill="#FDF4FF">
            <polygon points="100,64 102,68 106,68 103,71 104,75 100,72 96,75 97,71 94,68 98,68" />
            <circle cx="70" cy="80" r="1.5" />
            <circle cx="130" cy="78" r="1.5" />
            <circle cx="82" cy="135" r="2" />
            <circle cx="118" cy="142" r="1.5" />
          </g>
        )}

        {patternType === 'sparkle' && (
          <g fill={patternColor}>
            <polygon points="100,62 101,65 104,66 101,67 100,70 99,67 96,66 99,65" />
            <polygon points="68,76 69,78 71,79 69,80 68,82 67,80 65,79 67,78" />
            <polygon points="132,76 133,78 135,79 133,80 132,82 131,80 129,79 131,78" />
          </g>
        )}

        {patternType === 'elemental' && (
          <g fill={patternColor} opacity="0.85">
            <path d="M 95 62 Q 100 52 105 62 Q 108 58 105 70 Q 100 74 95 70 Z" />
            <path d="M 64 88 Q 68 80 72 88 Z" />
            <path d="M 128 88 Q 132 80 136 88 Z" />
          </g>
        )}

        {/* --- CHEEKS (BLUSH) --- */}
        <ellipse cx="64" cy="104" rx="8" ry="5" fill={isPureGold ? '#FEF08A' : '#FDA4AF'} opacity={isPureGold ? 0.9 : 0.6} />
        <ellipse cx="136" cy="104" rx="8" ry="5" fill={isPureGold ? '#FEF08A' : '#FDA4AF'} opacity={isPureGold ? 0.9 : 0.6} />

        {/* --- EYES --- */}
        {/* Left Eye */}
        <g>
          <ellipse cx="78" cy="92" rx="10" ry="12" fill={isPureGold ? `url(#grad-gold-metallic-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={isPureGold ? '#B45309' : '#1E293B'} strokeWidth="1.5" />
          {/* Pupil highlight shine */}
          <circle cx="75" cy="88" r="3.5" fill="#FFFFFF" />
          <circle cx="81" cy="95" r="1.5" fill={isPureGold ? '#FFFBEB' : '#FFFFFF'} />
        </g>

        {/* Right Eye */}
        <g>
          <ellipse cx="122" cy="92" rx="10" ry="12" fill={isPureGold ? `url(#grad-gold-metallic-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={isPureGold ? '#B45309' : '#1E293B'} strokeWidth="1.5" />
          {/* Pupil highlight shine */}
          <circle cx="119" cy="88" r="3.5" fill="#FFFFFF" />
          <circle cx="125" cy="95" r="1.5" fill={isPureGold ? '#FFFBEB' : '#FFFFFF'} />
        </g>

        {/* --- NOSE & MOUTH --- */}
        <polygon points="100,102 96,98 104,98" fill={isPureGold ? '#D97706' : noseColor} />
        {/* Cat Smile :3 */}
        <path
          d="M 94 105 Q 100 110 100 104 Q 100 110 106 105"
          fill="none"
          stroke={isPureGold ? '#B45309' : '#1E293B'}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* --- WHISKERS --- */}
        <g stroke={isPureGold ? '#F59E0B' : '#334155'} strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
          <line x1="58" y1="99" x2="32" y2="94" />
          <line x1="58" y1="104" x2="30" y2="105" />
          <line x1="58" y1="109" x2="34" y2="116" />

          <line x1="142" y1="99" x2="168" y2="94" />
          <line x1="142" y1="104" x2="170" y2="105" />
          <line x1="142" y1="109" x2="166" y2="116" />
        </g>

        {/* --- ACCESSORIES --- */}
        {accessory === 'crown' && (
          <g>
            <polygon
              points="84,54 78,32 92,42 100,28 108,42 122,32 116,54"
              fill={isPureGold ? '#FFD700' : '#F59E0B'}
              stroke={isPureGold ? '#B45309' : '#B45309'}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Crown Jewels */}
            <circle cx="100" cy="44" r="2.5" fill={isPureGold ? '#38BDF8' : '#EF4444'} />
            <circle cx="88" cy="48" r="2" fill={isPureGold ? '#F43F5E' : '#3B82F6'} />
            <circle cx="112" cy="48" r="2" fill={isPureGold ? '#10B981' : '#10B981'} />
          </g>
        )}

        {accessory === 'wizard-hat' && (
          <g>
            <polygon points="100,14 68,54 132,54" fill="#6D28D9" stroke="#4C1D95" strokeWidth="2" />
            <ellipse cx="100" cy="54" rx="36" ry="7" fill="#5B21B6" stroke="#4C1D95" strokeWidth="2" />
            <polygon points="100,32 102,36 106,37 103,40 104,44 100,41 96,44 97,40 94,37 98,36" fill="#FBBF24" />
          </g>
        )}

        {accessory === 'astronaut-helmet' && (
          <g>
            <ellipse cx="100" cy="92" rx="58" ry="48" fill="#38BDF8" fillOpacity="0.25" stroke="#94A3B8" strokeWidth="3" />
            {/* Visor reflection */}
            <path d="M 68 76 Q 100 68 132 76" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
          </g>
        )}

        {accessory === 'pirate-hat' && (
          <g>
            <path d="M 64 54 Q 100 24 136 54 Q 100 44 64 54 Z" fill="#0F172A" stroke="#475569" strokeWidth="2" />
            <circle cx="100" cy="42" r="4" fill="#FFFFFF" />
            <line x1="95" y1="46" x2="105" y2="38" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="95" y1="38" x2="105" y2="46" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )}

        {accessory === 'ninja-headband' && (
          <g>
            <rect x="62" y="66" width="76" height="11" rx="4" fill="#DC2626" />
            {/* Metal plate */}
            <rect x="91" y="68" width="18" height="7" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
            {/* Floating ribbon */}
            <path d="M 138 72 Q 152 70 162 76" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        )}

        {accessory === 'knight-helm' && (
          <g>
            <path d="M 66 52 Q 100 36 134 52 L 134 76 Q 100 86 66 76 Z" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
            <line x1="85" y1="64" x2="115" y2="64" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="88" y1="70" x2="112" y2="70" stroke="#1E293B" strokeWidth="2" />
          </g>
        )}

        {accessory === 'glasses' && (
          <g stroke="#0F172A" strokeWidth="2" fill="#38BDF8" fillOpacity="0.4">
            <circle cx="78" cy="92" r="14" />
            <circle cx="122" cy="92" r="14" />
            <line x1="92" y1="92" x2="108" y2="92" stroke="#0F172A" strokeWidth="2.5" />
          </g>
        )}

        {accessory === 'headphones' && (
          <g>
            {/* Headband */}
            <path d="M 52 92 Q 100 24 148 92" fill="none" stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />
            {/* Earcups */}
            <ellipse cx="50" cy="92" rx="7" ry="12" fill="#06B6D4" stroke="#0F172A" strokeWidth="1.5" />
            <ellipse cx="150" cy="92" rx="7" ry="12" fill="#06B6D4" stroke="#0F172A" strokeWidth="1.5" />
          </g>
        )}

        {accessory === 'halo' && (
          <g>
            <ellipse cx="100" cy="38" rx="28" ry="7" fill="none" stroke="#FDE047" strokeWidth="4" />
            <ellipse cx="100" cy="38" rx="28" ry="7" fill="none" stroke="#FEF08A" strokeWidth="2" opacity="0.8" />
          </g>
        )}

        {accessory === 'bow' && (
          <g>
            {/* Bowtie on neck */}
            <polygon points="100,128 88,122 88,134" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
            <polygon points="100,128 112,122 112,134" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
            <circle cx="100" cy="128" r="3" fill="#B91C1C" />
          </g>
        )}

        {accessory === 'cape' && (
          <g>
            <path d="M 68 132 Q 45 160 52 178" fill="none" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" />
            <path d="M 132 132 Q 155 160 148 178" fill="none" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
