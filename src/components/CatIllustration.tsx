import React from 'react';
import { CatSkin, RenderStyle, EarType, EyeType, CatToy, CatBackground } from '../types/game';

interface CatIllustrationProps {
  cat: CatSkin;
  size?: number;
  className?: string;
  isAnimated?: boolean;
  pixelBlur?: boolean;
  showBackground?: boolean;
}

export const CatIllustration: React.FC<CatIllustrationProps> = ({
  cat,
  size = 140,
  className = '',
  isAnimated = true,
  pixelBlur = false,
  showBackground = true,
}) => {
  const {
    furColor,
    bellyColor,
    eyeColor,
    earInnerColor,
    noseColor = '#FDA4AF',
    patternType,
    patternColor = '#000000',
    accessory = 'none',
    rarity,
    visualEffect,
  } = cat;

  const isPureGold = cat.specialTrait === 'pure-gold' || cat.renderStyle === 'mythic-divine';
  const renderStyle: RenderStyle = cat.renderStyle || (rarity === 'common' ? '2d-flat' : rarity === 'uncommon' ? '2d-harmonious' : rarity === 'rare' ? '2d-expressive' : rarity === 'epic' ? '3d-volumetric' : 'fluffy-legendary');
  const is3D = renderStyle === '3d-volumetric';
  const isFluffy = renderStyle === 'fluffy-legendary' || renderStyle === 'mythic-divine';
  const earType: EarType = cat.earType || (rarity === 'common' ? 'small' : rarity === 'rare' ? 'tufted-lynx' : isFluffy ? 'fluffy-plush' : 'pointed');
  const eyeType: EyeType = cat.eyeType || (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary' ? 'anime-sparkle' : 'round');
  const toy: CatToy = cat.toy || 'none';
  const backgroundType: CatBackground = (showBackground && cat.backgroundType) ? cat.backgroundType : 'none';

  const strokeColor = isPureGold ? '#B45309' : is3D ? '#0F172A' : '#1E293B';
  const furFill = isPureGold
    ? `url(#grad-gold-metallic-${cat.id})`
    : is3D
    ? `url(#grad-3d-fur-${cat.id})`
    : furColor;

  const bodyFill = isPureGold
    ? `url(#grad-gold-metallic-${cat.id})`
    : is3D
    ? `url(#grad-3d-body-${cat.id})`
    : `url(#grad-body-${cat.id})`;

  const bellyFill = isPureGold
    ? `url(#grad-gold-belly-${cat.id})`
    : is3D
    ? `url(#grad-3d-belly-${cat.id})`
    : bellyColor;

  // Rarity aura
  const getRarityAura = () => {
    if (pixelBlur) return 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]';
    if (isPureGold) return 'drop-shadow-[0_0_25px_rgba(245,158,11,0.9)] ring-2 ring-amber-400 animate-pulse';
    if (isFluffy) return 'drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]';
    if (is3D) return 'drop-shadow-[0_0_16px_rgba(139,92,246,0.6)]';
    switch (rarity) {
      case 'mythic': return 'drop-shadow-[0_0_22px_rgba(236,72,153,0.8)]';
      case 'legendary': return 'drop-shadow-[0_0_18px_rgba(245,158,11,0.65)]';
      case 'epic': return 'drop-shadow-[0_0_14px_rgba(139,92,246,0.55)]';
      case 'rare': return 'drop-shadow-[0_0_10px_rgba(59,130,246,0.45)]';
      case 'uncommon': return 'drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]';
      default: return 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.15)]';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${getRarityAura()}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Glow Particles (hidden if pixelBlur) */}
      {!pixelBlur && isPureGold && (
        <>
          <div className="absolute -top-3 -right-2 text-amber-300 animate-bounce pointer-events-none text-sm font-black z-20">✨</div>
          <div className="absolute -top-2 -left-2 text-yellow-300 animate-pulse pointer-events-none text-sm font-black z-20">✦</div>
          <div className="absolute -bottom-1 -right-2 text-amber-400 animate-pulse pointer-events-none text-xs z-20">🪙</div>
        </>
      )}

      {!pixelBlur && visualEffect === 'celestial-orbit' && (
        <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-spin duration-10000 pointer-events-none z-20">
          <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
          <span className="absolute -bottom-1 left-1/3 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#06b6d4]" />
        </div>
      )}

      {/* SVG Container with PixelBlur if cat is not owned */}
      <div
        className={`w-full h-full flex items-center justify-center relative overflow-hidden rounded-2xl ${
          pixelBlur ? 'select-none pointer-events-none' : ''
        }`}
      >
        <div
          className="w-full h-full flex items-center justify-center transition-all"
          style={
            pixelBlur
              ? {
                  filter: 'blur(14px) contrast(175%) brightness(0.28) saturate(0.25)',
                  transform: 'scale(0.96)',
                  pointerEvents: 'none',
                }
              : undefined
          }
        >
          <svg
            viewBox="0 0 200 200"
            width={size}
            height={size}
            className={`w-full h-full transition-transform duration-300 ${
              isAnimated && !pixelBlur ? 'hover:scale-105' : ''
            }`}
          >
            <defs>
              {/* Subtle 2D gradient for body */}
              <linearGradient id={`grad-body-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={furColor} />
                <stop offset="100%" stopColor={furColor} stopOpacity="0.92" />
              </linearGradient>

              {/* 3D Volumetric Head Shading Gradient with spherical key light */}
              <radialGradient id={`grad-3d-body-${cat.id}`} cx="38%" cy="32%" r="68%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="35%" stopColor={furColor} />
                <stop offset="85%" stopColor={furColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0B132B" stopOpacity="0.75" />
              </radialGradient>

              <radialGradient id={`grad-3d-fur-${cat.id}`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
                <stop offset="40%" stopColor={furColor} />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.65" />
              </radialGradient>

              <radialGradient id={`grad-3d-belly-${cat.id}`} cx="45%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="50%" stopColor={bellyColor} />
                <stop offset="100%" stopColor={furColor} stopOpacity="0.5" />
              </radialGradient>

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
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="35%" stopColor={eyeColor} />
                <stop offset="100%" stopColor="#090D16" />
              </radialGradient>

              {/* 3D Glass Orb Eye for Epic/Legendary */}
              <radialGradient id={`grad-3d-eye-${cat.id}`} cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="25%" stopColor={eyeColor} />
                <stop offset="75%" stopColor={eyeColor} stopOpacity="0.85" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Background Gradients for Legendary */}
              <linearGradient id={`bg-cosmic-${cat.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="50%" stopColor="#312E81" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
              <linearGradient id={`bg-aurora-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#064E3B" />
                <stop offset="40%" stopColor="#047857" />
                <stop offset="70%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
              <linearGradient id={`bg-throne-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id={`bg-sakura-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#831843" />
                <stop offset="50%" stopColor="#BE185D" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
              <linearGradient id={`bg-cyber-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="60%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id={`bg-crystal-${cat.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#083344" />
                <stop offset="50%" stopColor="#0E7490" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>

            {/* --- PROCEDURAL UNIQUE BACKGROUND (LEGENDARY / MYTHIC) --- */}
            {backgroundType === 'cosmic-nebula' && (
              <g>
                <rect x="0" y="0" width="200" height="200" rx="20" fill={`url(#bg-cosmic-${cat.id})`} />
                <circle cx="45" cy="40" r="1.5" fill="#FFFFFF" opacity="0.9" />
                <circle cx="165" cy="35" r="2" fill="#FDE047" opacity="0.8" />
                <circle cx="30" cy="160" r="1.5" fill="#E879F9" opacity="0.8" />
                <circle cx="170" cy="165" r="1.5" fill="#38BDF8" opacity="0.8" />
                <polygon points="150,55 152,60 157,60 153,63 155,68 150,65 145,68 147,63 143,60 148,60" fill="#F472B6" opacity="0.75" />
                <polygon points="40,110 41,113 44,113 42,115 43,118 40,116 37,118 38,115 36,113 39,113" fill="#67E8F9" opacity="0.75" />
              </g>
            )}

            {backgroundType === 'sunset-aurora' && (
              <g>
                <rect x="0" y="0" width="200" height="200" rx="20" fill={`url(#bg-aurora-${cat.id})`} />
                {/* Dancing Aurora Ribbons */}
                <path d="M 0 50 Q 50 20 100 45 T 200 35 L 200 90 L 0 90 Z" fill="#34D399" opacity="0.35" />
                <path d="M 0 35 Q 70 65 140 30 T 200 55 L 200 80 L 0 80 Z" fill="#A7F3D0" opacity="0.25" />
                {/* Silhouette mountains */}
                <polygon points="0,170 45,130 90,170" fill="#064E3B" opacity="0.6" />
                <polygon points="80,170 140,120 200,170" fill="#022C22" opacity="0.8" />
              </g>
            )}

            {backgroundType === 'golden-throne' && (
              <g>
                <rect x="0" y="0" width="200" height="200" rx="20" fill={`url(#bg-throne-${cat.id})`} />
                {/* Royal golden sunrays */}
                <path d="M 100 0 L 70 200 L 130 200 Z" fill="#FDE047" opacity="0.15" />
                <path d="M 100 0 L 20 200 L 60 200 Z" fill="#FDE047" opacity="0.1" />
                <path d="M 100 0 L 140 200 L 180 200 Z" fill="#FDE047" opacity="0.1" />
                {/* Sparkles */}
                <polygon points="100,25 102,30 107,30 103,33 105,38 100,35 95,38 97,33 93,30 98,30" fill="#FEF08A" opacity="0.9" />
              </g>
            )}

            {backgroundType === 'sakura-drift' && (
              <g>
                <rect x="0" y="0" width="200" height="200" rx="20" fill={`url(#bg-sakura-${cat.id})`} />
                {/* Drifting cherry petals */}
                <ellipse cx="40" cy="45" rx="6" ry="3" fill="#FDF2F8" opacity="0.8" transform="rotate(25 40 45)" />
                <ellipse cx="160" cy="55" rx="7" ry="4" fill="#FCE7F3" opacity="0.75" transform="rotate(-35 160 55)" />
                <ellipse cx="30" cy="150" rx="6" ry="3" fill="#FDF2F8" opacity="0.8" transform="rotate(45 30 150)" />
                <ellipse cx="170" cy="140" rx="8" ry="4" fill="#FBCFE8" opacity="0.7" transform="rotate(-15 170 140)" />
              </g>
            )}

            {backgroundType === 'cyber-matrix' && (
              <g>
                <rect x="0" y="0" width="200" height="200" rx="20" fill={`url(#bg-cyber-${cat.id})`} />
                {/* Retro sun */}
                <circle cx="100" cy="80" r="42" fill="#F43F5E" opacity="0.4" />
                {/* Grid floor */}
                <line x1="0" y1="160" x2="200" y2="160" stroke="#06B6D4" strokeWidth="1.5" opacity="0.6" />
                <line x1="0" y1="175" x2="200" y2="175" stroke="#06B6D4" strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="190" x2="200" y2="190" stroke="#06B6D4" strokeWidth="0.7" opacity="0.4" />
                <line x1="100" y1="160" x2="20" y2="200" stroke="#EC4899" strokeWidth="1" opacity="0.5" />
                <line x1="100" y1="160" x2="180" y2="200" stroke="#EC4899" strokeWidth="1" opacity="0.5" />
              </g>
            )}

            {backgroundType === 'crystal-cavern' && (
              <g>
                <rect x="0" y="0" width="200" height="200" rx="20" fill={`url(#bg-crystal-${cat.id})`} />
                {/* Floating crystal shards */}
                <polygon points="25,40 32,25 36,45 28,52" fill="#67E8F9" opacity="0.75" />
                <polygon points="170,45 178,30 182,50 173,58" fill="#A5F3FC" opacity="0.8" />
                <polygon points="160,150 166,135 170,155 162,162" fill="#22D3EE" opacity="0.7" />
              </g>
            )}

            {/* --- 3D AMBIENT OCCLUSION FLOOR SHADOW --- */}
            {(is3D || isFluffy) && (
              <ellipse cx="100" cy="186" rx="60" ry="12" fill="#000000" opacity="0.35" filter="blur(3px)" />
            )}

            {/* --- TAIL --- */}
            <path
              d="M 145 140 C 180 135 185 105 170 95 C 158 87 150 102 145 115"
              fill="none"
              stroke={furFill}
              strokeWidth={isFluffy ? '18' : '14'}
              strokeLinecap="round"
              className={isAnimated ? 'origin-[145px_140px] animate-[pulse_3s_ease-in-out_infinite]' : ''}
            />
            {isFluffy && (
              <path
                d="M 165 92 Q 178 85 172 102 Q 182 108 168 118"
                fill={furFill}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
            )}
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
            {/* 1. Crooked / Small Ears (Common) */}
            {earType === 'crooked' && (
              <g>
                <polygon points="48,74 34,36 78,54" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="48,68 40,44 72,55" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                <polygon points="152,74 162,42 122,50" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="152,68 158,48 128,52" fill={isPureGold ? '#FEF08A' : earInnerColor} />
              </g>
            )}

            {earType === 'small' && (
              <g>
                <polygon points="50,74 38,44 76,54" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="50,68 42,50 70,55" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                <polygon points="150,74 162,44 124,54" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="150,68 158,50 130,55" fill={isPureGold ? '#FEF08A' : earInnerColor} />
              </g>
            )}

            {/* 2. Rounded Scottish Fold (Rare) */}
            {earType === 'folded-scottish' && (
              <g>
                <path d="M 44 74 Q 38 48 55 42 Q 72 45 76 56 Z" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <path d="M 46 68 Q 42 52 56 48 Q 68 50 72 56 Z" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                <path d="M 156 74 Q 162 48 145 42 Q 128 45 124 56 Z" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <path d="M 154 68 Q 158 52 144 48 Q 132 50 128 56 Z" fill={isPureGold ? '#FEF08A' : earInnerColor} />
              </g>
            )}

            {/* 3. Tufted Lynx Ears (Rare/Epic) */}
            {earType === 'tufted-lynx' && (
              <g>
                <polygon points="46,75 24,18 80,48" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="46,68 32,28 72,50" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                {/* Lynx feather tuft */}
                <path d="M 24 18 Q 18 10 20 4 Q 24 10 26 18 Z" fill="#0F172A" />

                <polygon points="154,75 176,18 120,48" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="154,68 168,28 128,50" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                {/* Lynx feather tuft */}
                <path d="M 176 18 Q 182 10 180 4 Q 176 10 174 18 Z" fill="#0F172A" />
              </g>
            )}

            {/* 4. Fluffy Plush / Multi-tier Ears (Legendary / Mythic) */}
            {earType === 'fluffy-plush' && (
              <g>
                <polygon points="46,75 22,20 82,48" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="46,68 30,30 74,50" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                {/* Fluffy ear sprout tufts */}
                <path d="M 36 45 Q 26 38 34 52 Q 22 46 36 60" fill={furFill} stroke={strokeColor} strokeWidth="1.5" />

                <polygon points="154,75 178,20 118,48" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="154,68 170,30 126,50" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                {/* Fluffy ear sprout tufts */}
                <path d="M 164 45 Q 174 38 166 52 Q 178 46 164 60" fill={furFill} stroke={strokeColor} strokeWidth="1.5" />
              </g>
            )}

            {/* 5. Standard Pointed / Rounded Ears */}
            {(earType === 'pointed' || earType === 'basic' || earType === 'rounded') && (
              <g>
                <polygon points="46,75 28,24 80,48" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="46,68 35,34 72,50" fill={isPureGold ? '#FEF08A' : earInnerColor} />
                <polygon points="154,75 172,24 120,48" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
                <polygon points="154,68 165,34 128,50" fill={isPureGold ? '#FEF08A' : earInnerColor} />
              </g>
            )}

            {/* --- BODY --- */}
            <ellipse
              cx="100"
              cy="142"
              rx="52"
              ry="44"
              fill={bodyFill}
              stroke={strokeColor}
              strokeWidth={is3D ? '3' : '2.5'}
            />

            {/* 3D Depth Shadow on Body */}
            {is3D && (
              <ellipse cx="100" cy="155" rx="42" ry="24" fill="#000000" opacity="0.25" />
            )}

            {/* Belly patch */}
            <ellipse
              cx="100"
              cy="146"
              rx="32"
              ry="30"
              fill={bellyFill}
            />

            {/* Fluffy chest fur tufts (Legendary) */}
            {isFluffy && (
              <g fill={bellyFill} stroke={strokeColor} strokeWidth="1.2">
                <path d="M 85 130 Q 100 145 88 152 Q 100 148 100 156 Q 100 148 112 152 Q 100 145 115 130 Z" />
              </g>
            )}

            {/* Tuxedo Pattern */}
            {patternType === 'tuxedo' && (
              <path d="M 85 125 L 100 148 L 115 125 Z" fill="#FFFFFF" />
            )}

            {/* --- PAWS (Front) --- */}
            <ellipse cx="78" cy="178" rx="14" ry="10" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
            <ellipse cx="122" cy="178" rx="14" ry="10" fill={furFill} stroke={strokeColor} strokeWidth="2.5" />
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
              strokeWidth={is3D ? '3' : '2.5'}
            />

            {/* 3D Specular Highlight on Forehead (Epic 3D) */}
            {is3D && (
              <g>
                <ellipse cx="88" cy="74" rx="22" ry="10" fill="#FFFFFF" opacity="0.35" transform="rotate(-15 88 74)" />
                <ellipse cx="100" cy="118" rx="38" ry="14" fill="#000000" opacity="0.18" />
              </g>
            )}

            {/* Fluffy Cheek Tufts (Legendary) */}
            {isFluffy && (
              <g fill={bodyFill} stroke={strokeColor} strokeWidth="1.8">
                {/* Left cheek fluff */}
                <path d="M 50 85 Q 32 90 42 98 Q 30 102 46 108 Q 42 112 55 110" />
                {/* Right cheek fluff */}
                <path d="M 150 85 Q 168 90 158 98 Q 170 102 154 108 Q 158 112 145 110" />
              </g>
            )}

            {/* --- PATTERNS --- */}
            {patternType === 'stripes' && (
              <g fill="none" stroke={patternColor} strokeWidth="3.5" strokeLinecap="round">
                <path d="M 100 58 L 100 70" />
                <path d="M 91 60 L 93 72" />
                <path d="M 109 60 L 107 72" />
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

            {patternType === 'sparkle' && (
              <g fill={patternColor}>
                <polygon points="100,62 101,65 104,66 101,67 100,70 99,67 96,66 99,65" />
                <polygon points="68,76 69,78 71,79 69,80 68,82 67,80 65,79 67,78" />
                <polygon points="132,76 133,78 135,79 133,80 132,82 131,80 129,79 131,78" />
              </g>
            )}

            {/* --- CHEEKS (BLUSH) --- */}
            <ellipse cx="64" cy="104" rx="8" ry="5" fill={isPureGold ? '#FEF08A' : '#FDA4AF'} opacity={isPureGold ? 0.9 : 0.6} />
            <ellipse cx="136" cy="104" rx="8" ry="5" fill={isPureGold ? '#FEF08A' : '#FDA4AF'} opacity={isPureGold ? 0.9 : 0.6} />

            {/* --- EYES --- */}
            {/* 1. Anime Sparkle Eyes (Rare+) */}
            {eyeType === 'anime-sparkle' && (
              <g>
                {/* Left */}
                <ellipse cx="78" cy="92" rx="12" ry="14" fill={is3D ? `url(#grad-3d-eye-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={strokeColor} strokeWidth="1.8" />
                {/* Sparkle star in pupil */}
                <polygon points="76,89 77,91 80,91 78,93 79,96 76,94 73,96 74,93 72,91 75,91" fill="#FFFFFF" />
                <circle cx="82" cy="96" r="2.2" fill="#FFFFFF" />
                <circle cx="73" cy="97" r="1.2" fill="#FFFFFF" />

                {/* Right */}
                <ellipse cx="122" cy="92" rx="12" ry="14" fill={is3D ? `url(#grad-3d-eye-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={strokeColor} strokeWidth="1.8" />
                <polygon points="120,89 121,91 124,91 122,93 123,96 120,94 117,96 118,93 116,91 119,91" fill="#FFFFFF" />
                <circle cx="126" cy="96" r="2.2" fill="#FFFFFF" />
                <circle cx="117" cy="97" r="1.2" fill="#FFFFFF" />
              </g>
            )}

            {/* 2. Mystic Gem / Slit Eyes (Rare/Epic) */}
            {eyeType === 'mystic-gem' && (
              <g>
                <ellipse cx="78" cy="92" rx="11" ry="13" fill={is3D ? `url(#grad-3d-eye-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={strokeColor} strokeWidth="1.8" />
                {/* Vertical Feline Slit */}
                <ellipse cx="78" cy="92" rx="3.5" ry="10" fill="#020617" />
                <circle cx="76" cy="88" r="2.5" fill="#FFFFFF" />

                <ellipse cx="122" cy="92" rx="11" ry="13" fill={is3D ? `url(#grad-3d-eye-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={strokeColor} strokeWidth="1.8" />
                <ellipse cx="122" cy="92" rx="3.5" ry="10" fill="#020617" />
                <circle cx="120" cy="88" r="2.5" fill="#FFFFFF" />
              </g>
            )}

            {/* 3. Sleepy Chic Eyes */}
            {eyeType === 'sleepy-chic' && (
              <g stroke={strokeColor} strokeWidth="3" fill="none" strokeLinecap="round">
                <path d="M 68 94 Q 78 100 88 94" />
                <path d="M 112 94 Q 122 100 132 94" />
              </g>
            )}

            {/* 4. Standard / Boba Round Eyes */}
            {(eyeType === 'round' || eyeType === 'glossy-boba') && (
              <g>
                <ellipse cx="78" cy="92" rx="10" ry="12" fill={is3D ? `url(#grad-3d-eye-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={strokeColor} strokeWidth="1.5" />
                <circle cx="75" cy="88" r="3.5" fill="#FFFFFF" />
                <circle cx="81" cy="95" r="1.5" fill="#FFFFFF" />

                <ellipse cx="122" cy="92" rx="10" ry="12" fill={is3D ? `url(#grad-3d-eye-${cat.id})` : `url(#grad-eye-${cat.id})`} stroke={strokeColor} strokeWidth="1.5" />
                <circle cx="119" cy="88" r="3.5" fill="#FFFFFF" />
                <circle cx="125" cy="95" r="1.5" fill="#FFFFFF" />
              </g>
            )}

            {/* --- NOSE & MOUTH --- */}
            <polygon points="100,99 96,95 104,95" fill={isPureGold ? '#FEF08A' : noseColor} />
            <path
              d="M 96 102 Q 100 106 100 102 Q 100 106 104 102"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* --- WHISKERS --- */}
            <g stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round">
              <line x1="68" y1="100" x2="40" y2="97" />
              <line x1="68" y1="104" x2="42" y2="106" />
              <line x1="132" y1="100" x2="160" y2="97" />
              <line x1="132" y1="104" x2="158" y2="106" />
            </g>

            {/* --- CUTE TOY NEXT TO THE CAT (RARE, EPIC, LEGENDARY) --- */}
            {toy === 'yarn-ball' && (
              <g className={isAnimated ? 'origin-[32px_170px] hover:rotate-12 transition-transform' : ''}>
                {/* Yarn ball */}
                <circle cx="34" cy="170" r="13" fill="#EC4899" stroke="#9D174D" strokeWidth="1.5" />
                <path d="M 24 168 Q 34 160 44 168" fill="none" stroke="#F472B6" strokeWidth="2" />
                <path d="M 26 174 Q 34 180 42 174" fill="none" stroke="#BE185D" strokeWidth="2" />
                {/* Loose curling string on floor */}
                <path d="M 46 172 Q 58 178 52 182 Q 46 186 64 184" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {toy === 'rubber-duck' && (
              <g className={isAnimated ? 'origin-[34px_168px] hover:scale-110 transition-transform' : ''}>
                {/* Duck Body */}
                <ellipse cx="32" cy="172" rx="12" ry="9" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
                {/* Duck Head */}
                <circle cx="38" cy="163" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
                {/* Beak */}
                <polygon points="45,163 50,165 45,167" fill="#EA580C" />
                {/* Eye */}
                <circle cx="41" cy="161" r="1.2" fill="#0F172A" />
              </g>
            )}

            {toy === 'fish-bone' && (
              <g className={isAnimated ? 'hover:-translate-y-1 transition-transform' : ''}>
                <line x1="22" y1="174" x2="46" y2="174" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                {/* Head */}
                <polygon points="22,174 16,168 16,180" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
                <circle cx="18" cy="172" r="1" fill="#78350F" />
                {/* Ribs */}
                <line x1="28" y1="168" x2="28" y2="180" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                <line x1="35" y1="168" x2="35" y2="180" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                <line x1="42" y1="169" x2="42" y2="179" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                {/* Tail */}
                <polygon points="46,174 52,168 52,180" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
              </g>
            )}

            {toy === 'mouse-toy' && (
              <g className={isAnimated ? 'origin-[36px_174px] hover:translate-x-1 transition-transform' : ''}>
                {/* Mouse Body */}
                <ellipse cx="36" cy="174" rx="11" ry="7" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
                <circle cx="43" cy="171" r="3.5" fill="#FDA4AF" />
                <circle cx="45" cy="174" r="1" fill="#0F172A" />
                {/* Windup Key on back */}
                <line x1="33" y1="167" x2="33" y2="162" stroke="#CA8A04" strokeWidth="2" />
                <circle cx="33" cy="160" r="3" fill="none" stroke="#CA8A04" strokeWidth="1.5" />
                {/* Tail */}
                <path d="M 25 174 Q 18 170 18 178" fill="none" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}

            {toy === 'catnip-bell' && (
              <g className={isAnimated ? 'origin-[34px_170px] animate-[bounce_2s_infinite]' : ''}>
                <circle cx="34" cy="172" r="10" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
                <line x1="26" y1="172" x2="42" y2="172" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="34" cy="176" r="2.5" fill="#78350F" />
                {/* Red ribbon */}
                <polygon points="34,162 26,156 34,160 42,156" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
              </g>
            )}

            {toy === 'golden-trophy' && (
              <g className={isAnimated ? 'hover:scale-110 transition-transform' : ''}>
                {/* Trophy cup */}
                <path d="M 26 162 L 42 162 L 39 174 L 29 174 Z" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
                {/* Base */}
                <rect x="30" y="174" width="8" height="6" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
                <rect x="26" y="180" width="16" height="4" rx="1" fill="#78350F" />
                {/* Star on cup */}
                <polygon points="34,166 35,168 37,168 35,170 36,172 34,171 32,172 33,170 31,168 33,168" fill="#FFFBEB" />
              </g>
            )}

            {/* --- ACCESSORIES --- */}
            {accessory === 'crown' && (
              <g>
                <polygon points="80,55 86,40 100,50 114,40 120,55" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5" />
                <circle cx="86" cy="40" r="2.5" fill="#EF4444" />
                <circle cx="100" cy="50" r="2.5" fill="#3B82F6" />
                <circle cx="114" cy="40" r="2.5" fill="#10B981" />
              </g>
            )}

            {accessory === 'wizard-hat' && (
              <g>
                <polygon points="65,58 100,12 135,58" fill="#6366F1" stroke="#4338CA" strokeWidth="2" />
                <ellipse cx="100" cy="58" rx="38" ry="8" fill="#4F46E5" stroke="#3730A3" strokeWidth="2" />
                <polygon points="98,32 100,28 102,32 104,33 102,35 100,38 98,35 96,33" fill="#FDE047" />
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
                <path d="M 52 92 Q 100 24 148 92" fill="none" stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />
                <ellipse cx="50" cy="92" rx="7" ry="12" fill="#06B6D4" stroke="#0F172A" strokeWidth="1.5" />
                <ellipse cx="150" cy="92" rx="7" ry="12" fill="#06B6D4" stroke="#0F172A" strokeWidth="1.5" />
              </g>
            )}

            {accessory === 'bow' && (
              <g>
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

        {/* Retro Pixel / Mosaic grid overlay + mystery lock when pixelBlur is active */}
        {pixelBlur && (
          <>
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.28) 1.5px, transparent 0)',
                backgroundSize: '6px 6px',
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-30 rounded-2xl"
              style={{
                backgroundImage: 'linear-gradient(0deg, transparent 50%, rgba(0, 0, 0, 0.6) 50%)',
                backgroundSize: '100% 4px',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 gap-1 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-amber-400/60 shadow-lg flex items-center justify-center text-amber-400">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="text-[9px] font-black tracking-widest uppercase text-amber-300 font-mono bg-slate-950/90 px-2 py-0.5 rounded-full border border-amber-500/40 shadow-md">
                ???
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
