import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Play, Pause, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Temporarily disable Supabase import to prevent crashes
// import { supabase } from "@/integrations/supabase/client";

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

  // Fetch signals from database - temporarily disabled
  const fetchSignals = async () => {
    // Temporarily disabled until Supabase is properly configured
    console.log('fetchSignals temporarily disabled - Supabase not configured');
    return;
    
    /* 
    try {
      const { data, error } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('symbol', selectedCurrency)
        .eq('trading_type', tradingType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
    */
  };

  // Generate new signal - temporarily disabled  
  const generateSignal = async () => {
    setIsLoading(true);
    try {
      // Temporarily show placeholder until Supabase is configured
      toast({
        title: "Supabase Integration Required",
        description: "Please ensure your Supabase integration is properly configured with environment variables.",
        variant: "destructive"
      });
      
      /* 
      const response = await supabase.functions.invoke('mexc-data', {
        body: {
          symbol: selectedCurrency,
          interval: selectedTimeframe,
          tradingType
        }
      });

      if (response.error) throw response.error;

      const { signal, klineData } = response.data;
      
      toast({
        title: "Ny signal genererad!",
        description: `${signal.signal} ${selectedCurrency} - ${signal.confidence}% säkerhet`,
      });

      await fetchSignals(); // Refresh signals list
      */
    } catch (error) {
      toast({
        title: "Fel",
        description: "Supabase integration krävs för automatiska signaler.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate signals every 5 minutes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoRunning) {
      interval = setInterval(() => {
        generateSignal();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRunning, selectedCurrency, selectedTimeframe, tradingType]);

  // Fetch signals on component mount and when parameters change
  useEffect(() => {
    fetchSignals();
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
            Auto Trading Signaler
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAutoRunning(!isAutoRunning)}
              variant={isAutoRunning ? "destructive" : "default"}
              size="sm"
            >
              {isAutoRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isAutoRunning ? 'Stoppa Auto' : 'Starta Auto'}
            </Button>
            <Button
              onClick={generateSignal}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Generera Nu
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAutoRunning && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Auto-signaler aktivt - Nya signaler var 5:e minut
            </div>
          </div>
        )}

        {signals.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-muted-foreground mb-4">
              Supabase integration krävs för automatiska trading signaler.
            </p>
            <p className="text-sm text-muted-foreground">
              Kontrollera att VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY är konfigurerade.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <div key={signal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getSignalColor(signal.signal)}>
                      {getSignalIcon(signal.signal)}
                      {signal.signal}
                    </Badge>
                    <span className="font-medium">{signal.symbol}</span>
                    <Badge variant="outline">{signal.confidence}% säkerhet</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(signal.created_at).toLocaleString('sv-SE')}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry:</span>
                    <div className="font-medium">${signal.entry_price.toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <div className="font-medium text-red-600">${signal.stop_loss.toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Take Profit:</span>
                    <div className="font-medium text-green-600">${signal.take_profit.toFixed(4)}</div>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Strategi:</span>
                  <span className="ml-2 font-medium">{signal.strategy}</span>
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  {signal.analysis}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};