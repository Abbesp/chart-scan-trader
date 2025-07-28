import { Clock, Crosshair, Activity, BarChart, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ICTSignal {
  name: string;
  type: 'pd_array' | 'time_cycle' | 'market_structure' | 'killzone';
  status: 'active' | 'pending' | 'completed';
  direction: 'bullish' | 'bearish';
  timeframe: string;
  winProbability: number;
  description: string;
  nextEvent?: string;
}

interface ICTAnalysisData {
  currentKillZone: string;
  nextKillZone: string;
  marketStructure: 'bullish' | 'bearish' | 'consolidation';
  overallWinProbability: number;
  signals: ICTSignal[];
  timeBasedAnalysis: {
    londonSession: { active: boolean; bias: string; winRate: number };
    newYorkSession: { active: boolean; bias: string; winRate: number };
    asianSession: { active: boolean; bias: string; winRate: number };
  };
}

interface ICTAnalysisProps {
  currency: string;
  timeframe: string;
}

const mockICTData: ICTAnalysisData = {
  currentKillZone: 'London Open',
  nextKillZone: 'New York AM',
  marketStructure: 'bullish',
  overallWinProbability: 68,
  signals: [
    {
      name: 'Optimal Trade Entry (OTE)',
      type: 'pd_array',
      status: 'active',
      direction: 'bullish',
      timeframe: '15m',
      winProbability: 75,
      description: 'Price trading within 62-79% Fibonacci retracement of recent swing',
      nextEvent: 'Target: Premium array at 44,200'
    },
    {
      name: 'Fair Value Gap',
      type: 'pd_array',
      status: 'pending',
      direction: 'bullish',
      timeframe: '5m',
      winProbability: 82,
      description: 'Unfilled gap at 43,850 acting as magnetic price level',
      nextEvent: 'Expected fill within 2-4 hours'
    },
    {
      name: 'London Session Reversal',
      type: 'killzone',
      status: 'active',
      direction: 'bullish',
      timeframe: '1h',
      winProbability: 71,
      description: 'Typical London reversal pattern forming at 8:30 GMT',
      nextEvent: 'Target: NY session highs'
    },
    {
      name: 'Daily Bias Shift',
      type: 'market_structure',
      status: 'completed',
      direction: 'bullish',
      timeframe: '1d',
      winProbability: 65,
      description: 'Market structure shift confirmed on daily timeframe',
    }
  ],
  timeBasedAnalysis: {
    londonSession: { active: true, bias: 'Bullish', winRate: 73 },
    newYorkSession: { active: false, bias: 'Neutral', winRate: 58 },
    asianSession: { active: false, bias: 'Bearish', winRate: 42 }
  }
};

export const ICTAnalysis = ({ currency, timeframe }: ICTAnalysisProps) => {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'pd_array': return Crosshair;
      case 'time_cycle': return Clock;
      case 'market_structure': return BarChart;
      case 'killzone': return Activity;
      default: return TrendingUp;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-profit text-white';
      case 'pending': return 'bg-warning text-black';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getWinProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-profit';
    if (probability >= 60) return 'text-warning';
    return 'text-loss';
  };

  const getSessionColor = (bias: string) => {
    switch (bias.toLowerCase()) {
      case 'bullish': return 'text-profit';
      case 'bearish': return 'text-loss';
      case 'neutral': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">ICT Analysis</h3>
              <p className="text-sm text-muted-foreground">
                {currency}/USDT • Inner Circle Trader Concepts
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getWinProbabilityColor(mockICTData.overallWinProbability)}`}>
              {mockICTData.overallWinProbability}%
            </div>
            <div className="text-xs text-muted-foreground">Overall Win Rate</div>
          </div>
        </div>

        {/* Kill Zones & Market Structure */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Current Kill Zone</div>
            <div className="text-lg font-bold text-primary">
              {mockICTData.currentKillZone}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Next Kill Zone</div>
            <div className="text-lg font-bold">
              {mockICTData.nextKillZone}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Market Structure</div>
            <div className={`text-lg font-bold ${
              mockICTData.marketStructure === 'bullish' ? 'text-profit' : 
              mockICTData.marketStructure === 'bearish' ? 'text-loss' : 'text-warning'
            }`}>
              {mockICTData.marketStructure.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Session Analysis */}
        <div>
          <h4 className="text-md font-semibold mb-4">Session Analysis</h4>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(mockICTData.timeBasedAnalysis).map(([session, data]) => (
              <div key={session} className="p-3 rounded-lg bg-secondary">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">
                    {session.replace('Session', '').replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  {data.active && (
                    <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                  )}
                </div>
                <div className={`text-lg font-bold ${getSessionColor(data.bias)}`}>
                  {data.bias}
                </div>
                <div className="text-xs text-muted-foreground">
                  Win Rate: {data.winRate}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ICT Signals */}
        <div>
          <h4 className="text-md font-semibold mb-4">Active ICT Signals</h4>
          <div className="space-y-3">
            {mockICTData.signals.map((signal, index) => {
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
                          {signal.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {signal.timeframe} • {signal.type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(signal.status)}>
                        {signal.status.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getWinProbabilityColor(signal.winProbability)}`}>
                          {signal.winProbability}%
                        </div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {signal.description}
                  </p>

                  {signal.nextEvent && (
                    <div className="text-xs text-primary font-medium">
                      📍 {signal.nextEvent}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};