import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Shield, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChartOverlayProps {
  imageUrl: string;
  analysisData: {
    direction: 'bullish' | 'bearish';
    entry: number;
    stopLoss: number;
    takeProfit: number;
    keyLevels: {
      support: number[];
      resistance: number[];
    };
  };
}

export const ChartOverlay = ({ imageUrl, analysisData }: ChartOverlayProps) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (imageRef.current) {
        setImageDimensions({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight
        });
      }
    };

    const img = imageRef.current;
    if (img) {
      if (img.complete) {
        updateDimensions();
      } else {
        img.onload = updateDimensions;
      }
    }

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [imageUrl]);

  // Calculate positions based on price levels (mock positioning for demo)
  const calculatePosition = (price: number) => {
    // In a real app, this would calculate based on chart scale
    // For demo purposes, we'll distribute levels across the image height
    const allPrices = [
      ...analysisData.keyLevels.support,
      ...analysisData.keyLevels.resistance,
      analysisData.entry,
      analysisData.stopLoss,
      analysisData.takeProfit
    ].sort((a, b) => b - a); // Sort descending

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    // Position from 10% to 90% of image height
    const normalizedPosition = (maxPrice - price) / priceRange;
    return (normalizedPosition * 0.8 + 0.1) * imageDimensions.height;
  };

  const MarkerLine = ({ 
    price, 
    color, 
    label, 
    icon: Icon 
  }: { 
    price: number; 
    color: string; 
    label: string; 
    icon?: any;
  }) => {
    const y = calculatePosition(price);
    
    return (
      <g>
        {/* Line */}
        <line
          x1="0"
          y1={y}
          x2={imageDimensions.width}
          y2={y}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.8"
        />
        
        {/* Label background */}
        <rect
          x={imageDimensions.width - 120}
          y={y - 12}
          width="115"
          height="24"
          fill={color}
          rx="4"
          opacity="0.9"
        />
        
        {/* Label text */}
        <text
          x={imageDimensions.width - 110}
          y={y + 4}
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {label}: ${price.toFixed(2)}
        </text>
        
        {/* Icon */}
        {Icon && (
          <foreignObject
            x={imageDimensions.width - 135}
            y={y - 8}
            width="16"
            height="16"
          >
            <Icon className="h-4 w-4" style={{ color: 'white' }} />
          </foreignObject>
        )}
      </g>
    );
  };

  const EntryMarker = () => {
    const y = calculatePosition(analysisData.entry);
    const isLong = analysisData.direction === 'bullish';
    
    return (
      <g>
        {/* Entry arrow */}
        <polygon
          points={`20,${y - 10} 40,${y} 20,${y + 10} 25,${y}`}
          fill={isLong ? '#22c55e' : '#ef4444'}
          opacity="0.9"
        />
        
        {/* Entry label */}
        <rect
          x="45"
          y={y - 16}
          width="140"
          height="32"
          fill={isLong ? '#22c55e' : '#ef4444'}
          rx="6"
          opacity="0.95"
        />
        
        <text
          x="55"
          y={y - 4}
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          ENTRY POINT
        </text>
        
        <text
          x="55"
          y={y + 10}
          fill="white"
          fontSize="13"
          fontWeight="bold"
        >
          {isLong ? 'LONG' : 'SHORT'} ${analysisData.entry.toFixed(2)}
        </text>
        
        {/* Direction icon */}
        <foreignObject
          x="15"
          y={y - 8}
          width="16"
          height="16"
        >
          {isLong ? (
            <TrendingUp className="h-4 w-4 text-white" />
          ) : (
            <TrendingDown className="h-4 w-4 text-white" />
          )}
        </foreignObject>
      </g>
    );
  };

  const SupportResistanceLines = () => {
    return (
      <g>
        {/* Support levels */}
        {analysisData.keyLevels.support.map((level, index) => (
          <g key={`support-${index}`}>
            <line
              x1="0"
              y1={calculatePosition(level)}
              x2={imageDimensions.width}
              y2={calculatePosition(level)}
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray="4,2"
              opacity="0.5"
            />
            <text
              x="10"
              y={calculatePosition(level) - 5}
              fill="#22c55e"
              fontSize="10"
              opacity="0.7"
            >
              S: ${level.toFixed(2)}
            </text>
          </g>
        ))}
        
        {/* Resistance levels */}
        {analysisData.keyLevels.resistance.map((level, index) => (
          <g key={`resistance-${index}`}>
            <line
              x1="0"
              y1={calculatePosition(level)}
              x2={imageDimensions.width}
              y2={calculatePosition(level)}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4,2"
              opacity="0.5"
            />
            <text
              x="10"
              y={calculatePosition(level) + 15}
              fill="#ef4444"
              fontSize="10"
              opacity="0.7"
            >
              R: ${level.toFixed(2)}
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Trading chart with analysis"
        className="w-full h-auto rounded-lg border"
      />
      
      {imageDimensions.width > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
          preserveAspectRatio="none"
        >
          {/* Support/Resistance lines (drawn first, behind other markers) */}
          <SupportResistanceLines />
          
          {/* Entry marker */}
          <EntryMarker />
          
          {/* Stop Loss */}
          <MarkerLine
            price={analysisData.stopLoss}
            color="#ef4444"
            label="Stop Loss"
            icon={Shield}
          />
          
          {/* Take Profit */}
          <MarkerLine
            price={analysisData.takeProfit}
            color="#22c55e"
            label="Take Profit"
            icon={Target}
          />
        </svg>
      )}
      
      {/* Analysis Complete Badge */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-2">
        <Badge className="bg-gradient-primary">AI Analysis Complete</Badge>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-white">Support Levels</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span className="text-white">Resistance Levels</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500 border-dashed"></div>
          <span className="text-white">Key Levels</span>
        </div>
      </div>
    </div>
  );
};