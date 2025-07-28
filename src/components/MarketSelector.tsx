import { DollarSign, Euro, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type CurrencyType = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'BTC' | 'ETH';
export type TimeframeType = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

interface MarketSelectorProps {
  selectedCurrency: CurrencyType;
  selectedTimeframe: TimeframeType;
  onCurrencyChange: (currency: CurrencyType) => void;
  onTimeframeChange: (timeframe: TimeframeType) => void;
}

const currencies = [
  { value: 'USD' as CurrencyType, label: 'USD/USD', icon: DollarSign },
  { value: 'EUR' as CurrencyType, label: 'EUR/USD', icon: Euro },
  { value: 'GBP' as CurrencyType, label: 'GBP/USD', icon: DollarSign },
  { value: 'JPY' as CurrencyType, label: 'USD/JPY', icon: DollarSign },
  { value: 'BTC' as CurrencyType, label: 'BTC/USD', icon: DollarSign },
  { value: 'ETH' as CurrencyType, label: 'ETH/USD', icon: DollarSign },
];

const timeframes = [
  { value: '1m' as TimeframeType, label: '1 Minute' },
  { value: '5m' as TimeframeType, label: '5 Minutes' },
  { value: '15m' as TimeframeType, label: '15 Minutes' },
  { value: '1h' as TimeframeType, label: '1 Hour' },
  { value: '4h' as TimeframeType, label: '4 Hours' },
  { value: '1d' as TimeframeType, label: '1 Day' },
  { value: '1w' as TimeframeType, label: '1 Week' },
];

export const MarketSelector = ({ 
  selectedCurrency, 
  selectedTimeframe, 
  onCurrencyChange, 
  onTimeframeChange 
}: MarketSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Select Currency Pair
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          {currencies.map((currency) => {
            const IconComponent = currency.icon;
            return (
              <Button
                key={currency.value}
                variant={selectedCurrency === currency.value ? "default" : "outline"}
                className={`p-3 h-auto ${
                  selectedCurrency === currency.value 
                    ? 'bg-gradient-primary text-primary-foreground' 
                    : ''
                }`}
                onClick={() => onCurrencyChange(currency.value)}
              >
                <div className="flex flex-col items-center gap-1">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{currency.label}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Select Timeframe
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          {timeframes.map((timeframe) => (
            <Button
              key={timeframe.value}
              variant={selectedTimeframe === timeframe.value ? "default" : "outline"}
              className={`p-3 h-auto ${
                selectedTimeframe === timeframe.value 
                  ? 'bg-gradient-primary text-primary-foreground' 
                  : ''
              }`}
              onClick={() => onTimeframeChange(timeframe.value)}
            >
              <div className="flex flex-col items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{timeframe.label}</span>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};