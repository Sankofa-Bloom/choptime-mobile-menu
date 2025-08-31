import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface RealTimeDataStatusProps {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  dataCount: {
    dishes: number;
    restaurants: number;
    menus: number;
  };
}

const RealTimeDataStatus: React.FC<RealTimeDataStatusProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  dataCount
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    onRefresh();
    toast({
      title: "Refreshing data...",
      description: "Fetching latest information from the database",
      variant: "default",
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusColor = () => {
    if (!lastUpdated) return 'text-gray-500';
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 5) return 'text-green-600';
    if (diffInMinutes < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!lastUpdated) return <Clock className="w-4 h-4" />;
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 5) return <CheckCircle className="w-4 h-4" />;
    if (diffInMinutes < 15) return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {lastUpdated ? `Updated ${formatTimeAgo(lastUpdated)}` : 'Loading data...'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{dataCount.dishes}</div>
              <div className="text-gray-600">Dishes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{dataCount.restaurants}</div>
              <div className="text-gray-600">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{dataCount.menus}</div>
              <div className="text-gray-600">Menu Items</div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Data automatically refreshes every 2 minutes
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeDataStatus;
