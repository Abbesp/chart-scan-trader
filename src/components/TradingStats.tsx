import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, BarChart3 } from "lucide-react";
import type { Trade } from './TradeJournal';

interface TradingStatsProps {
  trades: Trade[];
}

export const TradingStats: React.FC<TradingStatsProps> = ({ trades }) => {
  const completedTrades = trades.filter(trade => trade.status === 'completed');
  const winningTrades = completedTrades.filter(trade => trade.result === 'win');
  const losingTrades = completedTrades.filter(trade => trade.result === 'loss');

  const totalTrades = completedTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const totalProfit = completedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const totalFees = completedTrades.reduce((sum, trade) => sum + (trade.fees || 0), 0);
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / winningTrades.length 
    : 0;
    
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / losingTrades.length)
    : 0;

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  const stats = [
    {
      title: "Total Trades",
      value: totalTrades.toString(),
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 50 ? "text-green-600" : "text-red-600"
    },
    {
      title: "Total P&L",
      value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`,
      icon: DollarSign,
      color: totalProfit >= 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "Profit Factor",
      value: profitFactor > 0 ? profitFactor.toFixed(2) : "N/A",
      icon: TrendingUp,
      color: profitFactor >= 1 ? "text-green-600" : "text-red-600"
    }
  ];

  if (totalTrades === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete some trades to see your statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trading Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {totalTrades > 0 && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Winning Trades</span>
                </div>
                <div className="text-xl font-bold text-green-600">
                  {winningTrades.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg: ${avgWin.toFixed(2)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Losing Trades</span>
                </div>
                <div className="text-xl font-bold text-red-600">
                  {losingTrades.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg: -${avgLoss.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground border-t pt-3">
              Total Fees Paid: ${totalFees.toFixed(2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};