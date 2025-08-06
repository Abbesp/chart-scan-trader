import { Clock, Crosshair, Activity, BarChart, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ICTSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  stopLoss: number;
  takeProfit: number;
}

interface ICTAnalysisData {
  signals: ICTSignal[];
}

interface ICTAnalysisProps {
  currency: string;
  timeframe: string;
}

const mockICTData: ICTAnalysisData = {
  signals: [
    {
      signal: 'SELL',
      entry: 0.2634,
      stopLoss: 0.2687,
      takeProfit: 0.2476
    }
  ]
};

export const ICTAnalysis = ({ currency, timeframe }: ICTAnalysisProps) => {
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
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">ICT Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {currency}/USDT • {timeframe}
            </p>
          </div>
        </div>

        {/* Trading Signals */}
        <div className="space-y-3">
          {mockICTData.signals.map((signal, index) => (
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
                    ${signal.entry.toFixed(4)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">SL</div>
                  <div className="text-lg font-semibold text-loss">
                    ${signal.stopLoss.toFixed(4)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">TP</div>
                  <div className="text-lg font-semibold text-profit">
                    ${signal.takeProfit.toFixed(4)}
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