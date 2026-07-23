import React from 'react';

interface ArcaneBookIconProps {
  isAnimating?: boolean;
  className?: string;
}

export const ArcaneBookIcon: React.FC<ArcaneBookIconProps> = ({ isAnimating = false, className = '' }) => {
  return (
    <div 
      className={`relative w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-800 transition-all duration-500 ${
        isAnimating ? 'border-red-500/80 shadow-red-500/50 scale-110' : ''
      } ${className}`}
      style={isAnimating ? { animation: 'bookAuraPulse 2s ease-in-out infinite' } : {}}
    >
      {/* Glowing background aura when active */}
      {isAnimating && (
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-full blur-md opacity-75 animate-pulse" />
      )}

      {/* Book Icon Container with 3D Perspective */}
      <div className="relative z-10 w-4 h-4 flex items-center justify-center [perspective:500px]">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`w-4 h-4 transition-colors duration-300 ${
            isAnimating ? 'text-red-500 dark:text-red-600' : 'text-white dark:text-black'
          }`}
        >
          {/* Static Left Cover/Page */}
          <path d="M12 5 C8 3.5 3 4.5 3 19.5 C8 18.5 12 19.5 12 19.5" />

          {/* Static Right Cover/Page */}
          <path d="M12 5 C16 3.5 21 4.5 21 19.5 C16 18.5 12 19.5 12 19.5" />

          {/* Central Spine */}
          <line x1="12" y1="5" x2="12" y2="19.5" strokeWidth="1.5" />

          {/* Turning Page 1 */}
          <path 
            d="M12 5 C16 3.5 21 4.5 21 19.5 C16 18.5 12 19.5 12 19.5" 
            className={isAnimating ? "animate-pageTurnFirst" : "hidden"}
            style={{ transformOrigin: '12px 12px' }}
          />

          {/* Turning Page 2 (Offset time for fluid consecutive page flips) */}
          <path 
            d="M12 5 C16 3.5 21 4.5 21 19.5 C16 18.5 12 19.5 12 19.5" 
            className={isAnimating ? "animate-pageTurnSecond" : "hidden"}
            style={{ transformOrigin: '12px 12px' }}
          />
        </svg>
      </div>
    </div>
  );
};

export default ArcaneBookIcon;
