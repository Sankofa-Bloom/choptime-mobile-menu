import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="text-center">
        {/* Logo with Animation */}
        <div className="mb-8 animate-bounce">
          <div className="relative">
            {/* ChopTime Logo */}
            <img 
              src="/splash-logo.svg" 
              alt="ChopTime Logo" 
              className="w-64 h-64 mx-auto animate-pulse"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(213, 122, 31, 0.3))'
              }}
            />
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-8 w-2 h-2 bg-orange-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-8 right-12 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-4 right-8 w-1 h-1 bg-amber-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Welcome text */}
        <p className="mt-6 text-lg text-gray-600 font-medium">
          Welcome to ChopTime
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Connecting you to authentic Cameroonian cuisine
        </p>
      </div>
    </div>
  );
}; 