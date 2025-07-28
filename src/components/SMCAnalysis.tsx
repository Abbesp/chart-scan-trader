import { Brain, Target, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SMCSignal {
  type: 'order_block' | 'fair_value_gap' | 'liquidity_grab' | 'break_of_structure';
  direction: 'bullish' | 'bearish';
  strength: number;
  price: number;
  description: string;
  winProbability: number;
}

interface SMCAnalysisData {
  marketStructure: 'bullish' | 'bearish' | 'ranging';
  signals: SMCSignal[];
  overallWinProbability: number;
  institutionalFlow: 'buying' | 'selling' | 'neutral';
  liquidityLevels: {
    type: 'buy_side' | 'sell_side';
    price: number;
    strength: number;
  }[];
}

interface SMCAnalysisProps {
  currency: string;
  timeframe: string;
}

const mockSMCData: SMCAnalysisData = {
  marketStructure: 'bullish',
  overallWinProbability: 74,
  institutionalFlow: 'buying',
  signals: [
    {
      type: 'order_block',
      direction: 'bullish',
      strength: 85,
      price: 43250,
      description: 'Strong bullish order block formed at key support level',
      winProbability: 82
    },
    {
      type: 'fair_value_gap',
      direction: 'bullish',
      strength: 72,
      price: 43800,
      description: 'Unfilled fair value gap acting as magnet for price',
      winProbability: 68
    },
    {
      type: 'liquidity_grab',
      direction: 'bullish',
      strength: 68,
      price: 42900,
      description: 'Recent liquidity grab below key level, now reversing',
      winProbability: 75
    }
  ],
  liquidityLevels: [
    { type: 'buy_side', price: 44200, strength: 78 },
    { type: 'sell_side', price: 42800, strength: 65 }
  ]
};

export const SMCAnalysis = ({ currency, timeframe }: SMCAnalysisProps) => {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'order_block': return Target;
      case 'fair_value_gap': return Zap;
      case 'liquidity_grab': return TrendingUp;
      case 'break_of_structure': return AlertTriangle;
      default: return Brain;
    }
  };

  const getSignalName = (type: string) => {
    switch (type) {
      case 'order_block': return 'Order Block';
      case 'fair_value_gap': return 'Fair Value Gap';
      case 'liquidity_grab': return 'Liquidity Grab';
      case 'break_of_structure': return 'Break of Structure';
      default: return type;
    }
  };

  const getWinProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-profit';
    if (probability >= 60) return 'text-warning';
    return 'text-loss';
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-profit';
    if (strength >= 60) return 'bg-warning';
    return 'bg-loss';
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Smart Money Concepts (SMC)</h3>
              <p className="text-sm text-muted-foreground">
                {currency}/USDT • {timeframe} Analysis
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getWinProbabilityColor(mockSMCData.overallWinProbability)}`}>
              {mockSMCData.overallWinProbability}%
            </div>
            <div className="text-xs text-muted-foreground">Win Probability</div>
          </div>
        </div>

        {/* Market Structure */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Market Structure</div>
            <div className={`text-lg font-bold ${
              mockSMCData.marketStructure === 'bullish' ? 'text-profit' : 
              mockSMCData.marketStructure === 'bearish' ? 'text-loss' : 'text-warning'
            }`}>
              {mockSMCData.marketStructure.toUpperCase()}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Institutional Flow</div>
            <div className={`text-lg font-bold ${
              mockSMCData.institutionalFlow === 'buying' ? 'text-profit' : 
              mockSMCData.institutionalFlow === 'selling' ? 'text-loss' : 'text-warning'
            }`}>
              {mockSMCData.institutionalFlow.toUpperCase()}
            </div>
          </div>
        </div>

        {/* SMC Signals */}
        <div>
          <h4 className="text-md font-semibold mb-4">Active SMC Signals</h4>
          <div className="space-y-3">
            {mockSMCData.signals.map((signal, index) => {
              const IconComponent = getSignalIcon(signal.type);
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${signal.direction === 'bullish' ? 'bg-profit' : 'bg-loss'} text-white`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {getSignalName(signal.type)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${signal.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getWinProbabilityColor(signal.winProbability)}`}>
                        {signal.winProbability}%
                      </div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {signal.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>Signal Strength</span>
                      <span className="font-medium">{signal.strength}%</span>
                    </div>
                    <Progress 
                      value={signal.strength} 
                      className="h-2"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Liquidity Levels */}
        <div>
          <h4 className="text-md font-semibold mb-4">Key Liquidity Levels</h4>
          <div className="grid grid-cols-2 gap-3">
            {mockSMCData.liquidityLevels.map((level, index) => (
              <div key={index} className="p-3 rounded-lg bg-secondary">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {level.type === 'buy_side' ? 'Buy Side' : 'Sell Side'} Liquidity
                    </div>
                    <div className="font-semibold">
                      ${level.price.toLocaleString()}
                    </div>
                  </div>
                  <Badge 
                    className={`${getStrengthColor(level.strength)} text-white`}
                  >
                    {level.strength}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};