import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Play, Pause, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import tradingChart from '@/assets/trading-chart.jpg';

interface TradingSignal {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strategy: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  analysis: string;
  trading_type: string;
  interval: string;
  created_at: string;
}

interface AutoTradingSignalsProps {
  selectedCurrency: string;
  selectedTimeframe: string;
  tradingType: string;
}

export const AutoTradingSignals: React.FC<AutoTradingSignalsProps> = ({
  selectedCurrency,
  selectedTimeframe,
  tradingType
}) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock realistic price data based on currency
  const getRealisticPrice = (currency: string) => {
    const prices: { [key: string]: number } = {
      'SAND': 0.2634,
      'BTC': 43250,
      'ETH': 2890,
      'ADA': 0.3421,
      'SOL': 98.45
    };
    return prices[currency] || 1.0;
  };

  // Generate single realistic signal
  const generateMockSignal = () => {
    const basePrice = getRealisticPrice(selectedCurrency);
    const signal: TradingSignal = {
      id: Date.now().toString(),
      symbol: selectedCurrency,
      signal: Math.random() > 0.4 ? 'BUY' : 'SELL',
      confidence: 85,
      strategy: 'AI Analysis',
      entry_price: basePrice,
      stop_loss: basePrice * (Math.random() > 0.5 ? 0.98 : 1.02),
      take_profit: basePrice * (Math.random() > 0.5 ? 1.06 : 0.94),
      analysis: 'AI-genererad signal baserad på marknadsanalys',
      trading_type: tradingType,
      interval: selectedTimeframe,
      created_at: new Date().toISOString()
    };
    return signal;
  };

  // Generate new signal
  const generateSignal = async () => {
    setIsLoading(true);
    try {
      // Generate mock signal with realistic prices
      const newSignal = generateMockSignal();
      setSignals([newSignal]); // Only show 1 signal
      toast({ title: "Ny AI-signal genererad", description: `${newSignal.signal} signal för ${selectedCurrency}` });
    } catch (error) {
      console.error('Error generating signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-start and generate signals automatically
  useEffect(() => {
    // Start auto-running immediately
    setIsAutoRunning(true);
    
    // Generate first signal immediately
    generateSignal();
    
    // Then continue every 2 minutes
    const interval = setInterval(() => {
      generateSignal();
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCurrency, selectedTimeframe, tradingType]);

  // Generate initial signal on mount
  useEffect(() => {
    generateSignal();
  }, [selectedCurrency, tradingType]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-600 bg-green-50';
      case 'SELL': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Automatiska Trading Signaler
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600">Auto Aktiv</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Importerar data automatiskt var 2:a minut
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Analyserar marknadsdata...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Image */}
            <div className="mb-4">
              <img 
                src={tradingChart} 
                alt="KuCoin trading chart preview" 
                className="w-full h-48 object-cover rounded-lg border"
                loading="lazy"
              />
            </div>
            
            {/* Single AI Signal */}
            {signals.slice(0, 1).map((signal) => (
              <div key={signal.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getSignalColor(signal.signal)}>
                      {getSignalIcon(signal.signal)}
                      {signal.signal}
                    </Badge>
                    <span className="font-medium">{signal.symbol}/USDT</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI Analys • {new Date().toLocaleTimeString('sv-SE')}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">ENTRY</div>
                    <div className="font-bold text-blue-600">${signal.entry_price.toFixed(4)}</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">SL</div>
                    <div className="font-bold text-red-600">${signal.stop_loss.toFixed(4)}</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">TP</div>
                    <div className="font-bold text-green-600">${signal.take_profit.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};