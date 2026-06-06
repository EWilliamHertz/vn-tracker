'use client';

export default function OuryieLogo({ size = 32, showText = true, className = '' }: { size?: number; showText?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="32" cy="32" r="30" fill="url(#ouryie-grad)" />
        {/* Book shape */}
        <path d="M18 16C18 14.9 18.9 14 20 14H30V32H20C18.9 32 18 31.1 18 30V16Z" fill="white" fillOpacity="0.9"/>
        <path d="M46 16C46 14.9 45.1 14 44 14H34V32H44C45.1 32 46 31.1 46 30V16Z" fill="white" fillOpacity="0.7"/>
        {/* Page lines */}
        <path d="M21 19H27M21 23H26M21 27H25" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M37 19H43M38 23H43M39 27H43" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Sparkle / star */}
        <path d="M32 36L34.5 41L40 42L35.5 46L36.5 52L32 49L27.5 52L28.5 46L24 42L29.5 41L32 36Z" fill="white" fillOpacity="0.95"/>
        {/* Gradient */}
        <defs>
          <linearGradient id="ouryie-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6"/>
            <stop offset="1" stopColor="#6d28d9"/>
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className="font-bold text-[#8b5cf6] tracking-tight" style={{ fontSize: size * 0.75 }}>
          Ouryie
        </span>
      )}
    </div>
  );
}
