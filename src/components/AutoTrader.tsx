import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, TrendingUp, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface TradeOpportunity {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence: number;
  ai_score: number; // 1-10 AI scoring
  risk_reward: number;
  analysis: string;
}

interface ActiveTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry_price: number;
  quantity: number;
  stop_loss: number;
  take_profit: number;
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';
  created_at: string;
}

export const AutoTrader = () => {
  const [isActive, setIsActive] = useState(false);
  const [dailyTrades, setDailyTrades] = useState(0);
  const [accountBalance] = useState(22); // USDT
  const [tradeOpportunities, setTradeOpportunities] = useState<TradeOpportunity[]>([]);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const MAX_DAILY_TRADES = 5;
  const RISK_PERCENTAGE = 0.04; // 4%
  const riskPerTrade = accountBalance * RISK_PERCENTAGE; // 0.88 USDT

  // Calculate position size based on risk
  const calculatePositionSize = (entryPrice: number, stopLoss: number) => {
    const riskDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = riskPerTrade / riskDistance;
    return Math.min(positionSize, accountBalance * 0.8); // Max 80% of account
  };

  // AI scoring algorithm for trades
  const scoreTradeOpportunity = (opportunity: TradeOpportunity): number => {
    let score = opportunity.confidence / 10; // Base score from confidence
    
    // Risk/Reward ratio bonus
    if (opportunity.risk_reward >= 3) score += 3;
    else if (opportunity.risk_reward >= 2) score += 2;
    else if (opportunity.risk_reward >= 1.5) score += 1;
    
    // Price action bonus (mock analysis)
    if (opportunity.analysis.includes('struktur')) score += 1;
    if (opportunity.analysis.includes('breakout')) score += 1;
    if (opportunity.analysis.includes('confluence')) score += 2;
    
    return Math.min(score, 10);
  };

  // Generate mock trading opportunities
  const generateTradeOpportunities = () => {
    setIsAnalyzing(true);
    
    const symbols = ['SAND', 'BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'DOT', 'LINK'];
    const opportunities: TradeOpportunity[] = [];
    
    symbols.forEach((symbol, index) => {
      const basePrice = symbol === 'SAND' ? 0.2634 : 
                       symbol === 'BTC' ? 43250 : 
                       symbol === 'ETH' ? 2890 : Math.random() * 10;
      
      const signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const stopDistance = basePrice * (0.02 + Math.random() * 0.03); // 2-5%
      const profitDistance = stopDistance * (2 + Math.random() * 2); // 2-4x R:R
      
      const opportunity: TradeOpportunity = {
        id: `trade_${index}`,
        symbol: `${symbol}USDT`,
        signal,
        entry_price: basePrice,
        stop_loss: signal === 'BUY' ? basePrice - stopDistance : basePrice + stopDistance,
        take_profit: signal === 'BUY' ? basePrice + profitDistance : basePrice - profitDistance,
        confidence: 70 + Math.random() * 25,
        ai_score: 0,
        risk_reward: profitDistance / stopDistance,
        analysis: `AI analys visar ${signal === 'BUY' ? 'bullish' : 'bearish'} struktur med break of structure och confluence.`
      };
      
      opportunity.ai_score = scoreTradeOpportunity(opportunity);
      opportunities.push(opportunity);
    });
    
    // Sort by AI score (highest first)
    opportunities.sort((a, b) => b.ai_score - a.ai_score);
    
    setTimeout(() => {
      setTradeOpportunities(opportunities);
      setIsAnalyzing(false);
      toast.success(`Analyserade ${opportunities.length} trading möjligheter`);
    }, 2000);
  };

  // Execute top 5 trades
  const executeTopTrades = async () => {
    if (dailyTrades >= MAX_DAILY_TRADES) {
      toast.error('Daglig trade limit uppnådd (5/5)');
      return;
    }
    
    const remainingTrades = MAX_DAILY_TRADES - dailyTrades;
    const tradesToExecute = tradeOpportunities.slice(0, remainingTrades);
    
    for (const trade of tradesToExecute) {
      const positionSize = calculatePositionSize(trade.entry_price, trade.stop_loss);
      
      // Mock MEXC API call (skulle vara verklig API call)
      try {
        const orderData = {
          symbol: trade.symbol,
          side: trade.signal,
          type: 'MARKET',
          quantity: positionSize.toFixed(4),
          stopPrice: trade.stop_loss.toFixed(4),
          timeInForce: 'GTC'
        };
        
        console.log('Placing order:', orderData);
        
        // Simulate API response
        const newTrade: ActiveTrade = {
          id: `active_${Date.now()}_${Math.random()}`,
          symbol: trade.symbol,
          side: trade.signal,
          entry_price: trade.entry_price,
          quantity: positionSize,
          stop_loss: trade.stop_loss,
          take_profit: trade.take_profit,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };
        
        setActiveTrades(prev => [...prev, newTrade]);
        setDailyTrades(prev => prev + 1);
        
        toast.success(`Trade placerad: ${trade.signal} ${trade.symbol} @ $${trade.entry_price.toFixed(4)}`);
        
        // Wait between orders
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error placing order:', error);
        toast.error(`Fel vid placering av order för ${trade.symbol}`);
      }
    }
  };

  // Start/Stop auto trader
  const toggleAutoTrader = () => {
    setIsActive(!isActive);
    if (!isActive) {
      generateTradeOpportunities();
      toast.success('Auto Trader aktiverad');
    } else {
      toast.info('Auto Trader stoppad');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Auto Trader
            </div>
            <div className="flex items-center gap-2">
              {isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "AKTIV" : "STOPPAD"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-xs text-muted-foreground">Kontosaldo</div>
              <div className="font-bold text-blue-600">${accountBalance} USDT</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-xs text-muted-foreground">Risk/Trade</div>
              <div className="font-bold text-yellow-600">${riskPerTrade.toFixed(2)} USDT</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-xs text-muted-foreground">Trades Idag</div>
              <div className="font-bold text-green-600">{dailyTrades}/{MAX_DAILY_TRADES}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Daglig Trade Limit</span>
              <span>{dailyTrades}/{MAX_DAILY_TRADES}</span>
            </div>
            <Progress value={(dailyTrades / MAX_DAILY_TRADES) * 100} className="h-2" />
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={toggleAutoTrader}
              className={`flex-1 ${isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
            >
              {isActive ? "Stoppa Auto Trader" : "Starta Auto Trader"}
            </Button>
            <Button
              onClick={generateTradeOpportunities}
              variant="outline"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyserar..." : "Sök Trades"}
            </Button>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>VARNING:</strong> Automatisk trading innebär hög risk. Systemet riskerar max 4% (${riskPerTrade.toFixed(2)}) per trade.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Trade Opportunities */}
      {tradeOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>AI Trade Ranking (Top 5)</span>
              <Button
                onClick={executeTopTrades}
                disabled={dailyTrades >= MAX_DAILY_TRADES}
                className="bg-gradient-primary"
              >
                Utför Top Trades
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tradeOpportunities.slice(0, 5).map((trade, index) => (
                <div key={trade.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-100 text-purple-700">#{index + 1}</Badge>
                      <span className="font-medium">{trade.symbol}</span>
                      <Badge variant={trade.signal === 'BUY' ? 'default' : 'destructive'}>
                        {trade.signal}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">AI Score</div>
                      <div className="font-bold text-purple-600">{trade.ai_score.toFixed(1)}/10</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-xs text-muted-foreground">ENTRY</div>
                      <div className="font-bold">${trade.entry_price.toFixed(4)}</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-xs text-muted-foreground">SL</div>
                      <div className="font-bold">${trade.stop_loss.toFixed(4)}</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-xs text-muted-foreground">TP</div>
                      <div className="font-bold">${trade.take_profit.toFixed(4)}</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="text-xs text-muted-foreground">R:R</div>
                      <div className="font-bold">{trade.risk_reward.toFixed(1)}:1</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Trades */}
      {activeTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktiva Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>
                        {trade.side}
                      </Badge>
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        Qty: {trade.quantity.toFixed(4)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {trade.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};