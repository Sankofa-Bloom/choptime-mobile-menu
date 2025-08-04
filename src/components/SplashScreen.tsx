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
        {/* Logo */}
        <div className="mb-8">
          <svg 
            viewBox="0 0 400 300" 
            className="w-64 h-48 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashOrangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FF6B35', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#E89A4D', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            
            {/* Location Pin */}
            <g transform="translate(200, 120)">
              {/* Pin shadow */}
              <ellipse cx="0" cy="60" rx="12" ry="4" fill="#D57A1F" opacity="0.3"/>
              
              {/* Pin body */}
              <path 
                d="M0,-45 L-15,20 L0,35 L15,20 Z" 
                fill="url(#splashOrangeGradient)" 
                stroke="#D57A1F" 
                strokeWidth="3"
              />
              
              {/* Pin hole */}
              <circle cx="0" cy="0" r="6" fill="white"/>
              <circle cx="0" cy="0" r="3" fill="#D57A1F"/>
            </g>
            
            {/* Link elements */}
            <g transform="translate(170, 140)">
              {/* First link segment */}
              <rect 
                x="0" y="0" width="16" height="10" rx="5" 
                fill="url(#splashOrangeGradient)" 
                stroke="#D57A1F" 
                strokeWidth="1.5"
              />
              
              {/* Second link segment */}
              <rect 
                x="11" y="0" width="16" height="10" rx="5" 
                fill="url(#splashOrangeGradient)" 
                stroke="#D57A1F" 
                strokeWidth="1.5"
              />
              
              {/* Connection line */}
              <line 
                x1="16" y1="5" x2="11" y2="5" 
                stroke="#D57A1F" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
            </g>
            
            {/* Text: ChopTime */}
            <text 
              x="200" y="220" 
              textAnchor="middle" 
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              fontSize="36" 
              fontWeight="700" 
              fill="#FF6B35"
            >
              Kwata<tspan fontWeight="400">Link</tspan>
            </text>
            
            {/* Subtitle */}
            <text 
              x="200" y="250" 
              textAnchor="middle" 
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              fontSize="16" 
              fontWeight="400" 
              fill="#8B4513" 
              opacity="0.8"
            >
              Cameroonian Food Delivery
            </text>
          </svg>
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