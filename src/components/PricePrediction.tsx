import { TrendingUp, TrendingDown, Target, Clock, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CurrencyType, TimeframeType } from './MarketSelector';

interface PricePredictionData {
  currentPrice: number;
  predictedPrice: number;
  priceChange: number;
  percentageChange: number;
  direction: 'bullish' | 'bearish';
  confidence: number;
  timeToTarget: string;
  keyEvents: string[];
  volatility: 'low' | 'medium' | 'high';
}

interface PricePredictionProps {
  currency: CurrencyType;
  timeframe: TimeframeType;
  data: PricePredictionData;
}

export const PricePrediction = ({ currency, timeframe, data }: PricePredictionProps) => {
  const isPositive = data.direction === 'bullish';
  const formatPrice = (price: number) => {
    if (currency === 'BTC' || currency === 'ETH') {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(4)}`;
  };

  return (
    <Card className="p-6 bg-gradient-chart">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPositive ? 'bg-profit text-white' : 'bg-loss text-white'}`}>
              {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {currency} Price Prediction
              </h3>
              <p className="text-muted-foreground">
                {timeframe} Analysis
              </p>
            </div>
          </div>
          <Badge 
            className={`text-sm ${
              data.confidence >= 80 ? 'bg-profit text-white' : 
              data.confidence >= 60 ? 'bg-warning text-black' : 'bg-loss text-white'
            }`}
          >
            {data.confidence}% Confidence
          </Badge>
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Current Price</div>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(data.currentPrice)}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Predicted Price</div>
            <div className={`text-2xl font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
              {formatPrice(data.predictedPrice)}
            </div>
          </div>
        </div>

        {/* Change Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Price Change</div>
            <div className={`text-lg font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{formatPrice(data.priceChange)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">% Change</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
              <Percent className="h-4 w-4" />
              {isPositive ? '+' : ''}{data.percentageChange.toFixed(2)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Time to Target</div>
            <div className="text-lg font-bold flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {data.timeToTarget}
            </div>
          </div>
        </div>

        {/* Confidence Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Prediction Confidence</span>
            <span className="text-sm text-muted-foreground">{data.confidence}%</span>
          </div>
          <Progress value={data.confidence} className="h-2" />
        </div>

        {/* Market Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Market Volatility</div>
            <Badge 
              className={`${
                data.volatility === 'high' ? 'bg-loss text-white' : 
                data.volatility === 'medium' ? 'bg-warning text-black' : 'bg-profit text-white'
              }`}
            >
              {data.volatility.toUpperCase()}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-2">Key Events</div>
            <div className="space-y-1">
              {data.keyEvents.slice(0, 2).map((event, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {event}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};