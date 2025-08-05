import React from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 'md', 
  animated = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const animationClasses = animated ? 'animate-pulse hover:animate-bounce transition-all duration-300' : '';

  return (
    <div className={`relative ${className}`}>
      <img 
        src="/logo.svg" 
        alt="ChopTym Logo" 
        className={`${sizeClasses[size]} ${animationClasses}`}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(213, 122, 31, 0.2))'
        }}
      />
      
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-1 h-1 bg-orange-400 rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-0 right-0 w-0.5 h-0.5 bg-amber-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-0.5 bg-orange-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-0.5 bg-amber-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo; 