import { TrendingUp, TrendingDown, Target, Shield, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StrategyType } from './StrategySelector';

interface AnalysisData {
  strategy: StrategyType;
  confidence: number;
  pattern: string;
  direction: 'bullish' | 'bearish';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  timeframe: string;
  volume: 'high' | 'medium' | 'low';
  keyLevels: {
    support: number[];
    resistance: number[];
  };
}

interface AnalysisResultsProps {
  data: AnalysisData;
  imageUrl?: string;
}

export const AnalysisResults = ({ data, imageUrl }: AnalysisResultsProps) => {
  const isProfit = data.direction === 'bullish';
  const confidenceColor = data.confidence >= 80 ? 'profit' : 
                          data.confidence >= 60 ? 'warning' : 'loss';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isProfit ? 'bg-profit text-white' : 'bg-loss text-white'}`}>
              {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {data.pattern} Detected
              </h3>
              <p className="text-muted-foreground">
                {data.strategy === 'swing' ? 'Swing Trading' : 'Scalp Trading'} Signal
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

        <Progress 
          value={data.confidence} 
          className="h-2"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Setup */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Trade Setup
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-sm text-muted-foreground">Entry Price</div>
                <div className="text-lg font-bold text-primary">${data.entry.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-sm text-muted-foreground">Direction</div>
                <div className={`text-lg font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                  {data.direction.toUpperCase()}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-loss" />
                  <span className="text-sm">Stop Loss</span>
                </div>
                <span className="font-semibold text-loss">${data.stopLoss.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-profit" />
                  <span className="text-sm">Take Profit</span>
                </div>
                <span className="font-semibold text-profit">${data.takeProfit.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  <span className="text-sm">Risk/Reward</span>
                </div>
                <span className="font-semibold">{data.riskReward}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Market Analysis */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Market Analysis
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-sm text-muted-foreground">Timeframe</div>
                <div className="text-lg font-bold">{data.timeframe}</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-sm text-muted-foreground">Volume</div>
                <div className={`text-lg font-bold ${
                  data.volume === 'high' ? 'text-profit' : 
                  data.volume === 'medium' ? 'text-warning' : 'text-loss'
                }`}>
                  {data.volume.toUpperCase()}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Key Support Levels</div>
                <div className="flex flex-wrap gap-2">
                  {data.keyLevels.support.map((level, index) => (
                    <Badge key={index} variant="outline" className="text-profit border-profit">
                      ${level.toFixed(2)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Key Resistance Levels</div>
                <div className="flex flex-wrap gap-2">
                  {data.keyLevels.resistance.map((level, index) => (
                    <Badge key={index} variant="outline" className="text-loss border-loss">
                      ${level.toFixed(2)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analyzed Chart */}
      {imageUrl && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Analyzed Chart
          </h4>
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Analyzed chart" 
              className="w-full h-auto rounded-lg border"
            />
            {/* Overlay markers would go here in a real implementation */}
            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-2">
              <Badge className="bg-gradient-primary">AI Analysis Complete</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};