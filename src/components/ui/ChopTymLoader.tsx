import React from 'react';

interface ChopTymLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  className?: string;
}

export const ChopTymLoader: React.FC<ChopTymLoaderProps> = ({
  size = 'md',
  message = '',
  subMessage = '',
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const spinnerSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-8 h-8 border-4',
    xl: 'w-10 h-10 border-4'
  };

  const particleConfig = {
    sm: { 
      particles: [
        { size: 'w-1 h-1', position: 'top-1 left-2' },
        { size: 'w-0.5 h-0.5', position: 'top-2 right-3', delay: '0.5s' },
        { size: 'w-0.5 h-0.5', position: 'bottom-2 left-3', delay: '1s' },
        { size: 'w-0.5 h-0.5', position: 'bottom-1 right-2', delay: '1.5s' }
      ]
    },
    md: {
      particles: [
        { size: 'w-1.5 h-1.5', position: 'top-2 left-4' },
        { size: 'w-1 h-1', position: 'top-3 right-5', delay: '0.5s' },
        { size: 'w-1 h-1', position: 'bottom-3 left-5', delay: '1s' },
        { size: 'w-1 h-1', position: 'bottom-2 right-4', delay: '1.5s' }
      ]
    },
    lg: {
      particles: [
        { size: 'w-2 h-2', position: 'top-3 left-6' },
        { size: 'w-1 h-1', position: 'top-4 right-8', delay: '0.5s' },
        { size: 'w-1.5 h-1.5', position: 'bottom-4 left-8', delay: '1s' },
        { size: 'w-1 h-1', position: 'bottom-3 right-6', delay: '1.5s' }
      ]
    },
    xl: {
      particles: [
        { size: 'w-3 h-3', position: 'top-4 left-8' },
        { size: 'w-1.5 h-1.5', position: 'top-6 right-12', delay: '0.5s' },
        { size: 'w-2 h-2', position: 'bottom-6 left-12', delay: '1s' },
        { size: 'w-1.5 h-1.5', position: 'bottom-4 right-8', delay: '1.5s' }
      ]
    }
  };

  const LoaderContent = () => (
    <div className="text-center">
      {/* Animated Logo with Particles */}
      <div className="mb-6 animate-bounce">
        <div className="relative mx-auto w-fit">
          {/* ChopTym Logo */}
          <img 
            src="/splash-logo.svg" 
            alt="ChopTym Logo" 
            className={`${sizeClasses[size]} mx-auto animate-pulse`}
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(213, 122, 31, 0.3))'
            }}
          />
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            {particleConfig[size].particles.map((particle, index) => (
              <div 
                key={index}
                className={`absolute ${particle.size} ${particle.position} bg-orange-400 rounded-full animate-ping opacity-75`}
                style={{ 
                  animationDelay: particle.delay || '0s',
                  backgroundColor: index % 2 === 0 ? '#fb923c' : '#fbbf24' // Orange/Amber alternating
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Spinning Loading Indicator */}
      <div className="flex justify-center mb-4">
        <div className={`${spinnerSizes[size]} border-orange-200 border-t-orange-500 rounded-full animate-spin`}></div>
      </div>
      
      {/* Loading Messages */}
      {message && (
        <p className="text-choptym-brown font-medium mb-2">
          {message}
        </p>
      )}
      {subMessage && (
        <p className="text-choptym-brown/60 text-sm">
          {subMessage}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <LoaderContent />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LoaderContent />
    </div>
  );
};

export default ChopTymLoader;
