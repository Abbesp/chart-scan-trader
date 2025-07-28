import { TrendingUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type StrategyType = 'swing' | 'scalp';

interface StrategySelectorProps {
  selectedStrategy: StrategyType;
  onStrategyChange: (strategy: StrategyType) => void;
}

export const StrategySelector = ({ selectedStrategy, onStrategyChange }: StrategySelectorProps) => {
  const strategies = [
    {
      id: 'swing' as StrategyType,
      name: 'Swing Trading',
      description: 'Hold positions for days to weeks',
      icon: TrendingUp,
      features: ['Pattern Recognition', 'Support/Resistance', 'Trend Analysis'],
      timeframe: '1H - 1D',
      riskReward: '1:3 - 1:5',
      color: 'profit'
    },
    {
      id: 'scalp' as StrategyType,
      name: 'Scalp Trading',
      description: 'Quick entries and exits for rapid gains',
      icon: Zap,
      features: ['Quick Scalps', 'Volume Analysis', 'Price Action'],
      timeframe: '1M - 15M',
      riskReward: '1:1 - 1:2',
      color: 'primary'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {strategies.map((strategy) => {
        const Icon = strategy.icon;
        const isSelected = selectedStrategy === strategy.id;
        
        return (
          <Card
            key={strategy.id}
            className={`cursor-pointer transition-all duration-300 p-6 ${
              isSelected 
                ? 'ring-2 ring-primary shadow-neon bg-gradient-primary/10' 
                : 'hover:shadow-card hover:border-primary/50'
            }`}
            onClick={() => onStrategyChange(strategy.id)}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{strategy.name}</h3>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <Badge className="bg-gradient-primary">Active</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {strategy.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span>
                    <div className="font-medium">{strategy.timeframe}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk/Reward:</span>
                    <div className="font-medium">{strategy.riskReward}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};