import { Brain, Target, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SMCSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  stopLoss: number;
  takeProfit: number;
}

interface SMCAnalysisData {
  signals: SMCSignal[];
}

interface SMCAnalysisProps {
  currency: string;
  timeframe: string;
}

const mockSMCData: SMCAnalysisData = {
  signals: [
    {
      signal: 'BUY',
      entry: 43250,
      stopLoss: 42800,
      takeProfit: 44500
    }
  ]
};

export const SMCAnalysis = ({ currency, timeframe }: SMCAnalysisProps) => {
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-profit';
      case 'SELL': return 'text-loss';
      case 'HOLD': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">SMC Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {currency}/USDT • {timeframe}
            </p>
          </div>
        </div>

        {/* Trading Signals */}
        <div className="space-y-3">
          {mockSMCData.signals.map((signal, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">SIGNAL</div>
                  <div className={`text-lg font-bold ${getSignalColor(signal.signal)}`}>
                    {signal.signal}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">ENTRY</div>
                  <div className="text-lg font-semibold">
                    ${signal.entry.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">SL</div>
                  <div className="text-lg font-semibold text-loss">
                    ${signal.stopLoss.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">TP</div>
                  <div className="text-lg font-semibold text-profit">
                    ${signal.takeProfit.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};