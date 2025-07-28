import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

export interface Trade {
  id: string;
  strategy: string;
  pattern: string;
  direction: 'long' | 'short';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  analyzedAt: Date;
  estimatedEntryTime: string;
  status: 'pending' | 'entered' | 'completed';
  result?: 'win' | 'loss';
  profit?: number;
  fees?: number;
  exitPrice?: number;
  exitDate?: Date;
}

interface TradeJournalProps {
  trades: Trade[];
  onUpdateTrade: (tradeId: string, updates: Partial<Trade>) => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ trades, onUpdateTrade }) => {
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    exitPrice: string;
    fees: string;
  }>({ exitPrice: '', fees: '' });

  const handleCompleteTradeClick = (trade: Trade) => {
    setEditingTrade(trade.id);
    setFormData({
      exitPrice: trade.exitPrice?.toString() || '',
      fees: trade.fees?.toString() || '5'
    });
  };

  const handleCompleteTrade = (trade: Trade) => {
    const exitPrice = parseFloat(formData.exitPrice);
    const fees = parseFloat(formData.fees);
    
    if (!exitPrice) return;

    const isLong = trade.direction === 'long';
    const profitBeforeFees = isLong 
      ? (exitPrice - trade.entry) * 100 // Assuming 100 shares/units
      : (trade.entry - exitPrice) * 100;
    
    const netProfit = profitBeforeFees - fees;
    const result = netProfit > 0 ? 'win' : 'loss';

    onUpdateTrade(trade.id, {
      status: 'completed',
      result,
      profit: netProfit,
      fees,
      exitPrice,
      exitDate: new Date()
    });

    setEditingTrade(null);
    setFormData({ exitPrice: '', fees: '' });
  };

  const getStatusColor = (status: Trade['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'entered': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getResultColor = (result?: Trade['result']) => {
    if (!result) return '';
    return result === 'win' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Trade Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trades.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No trades yet. Analyze a chart to create your first trade.
          </p>
        ) : (
          trades.map((trade) => (
            <div key={trade.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{trade.strategy}</Badge>
                    <Badge className={getStatusColor(trade.status)}>
                      {trade.status}
                    </Badge>
                    {trade.result && (
                      <Badge variant={trade.result === 'win' ? 'default' : 'destructive'}>
                        {trade.result.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{trade.pattern}</p>
                  <p className="text-sm text-muted-foreground">
                    {trade.direction.toUpperCase()} - Entry: ${trade.entry}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">
                    {trade.analyzedAt.toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground">
                    Est. entry: {trade.estimatedEntryTime}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stop Loss:</span>
                  <span className="ml-2">${trade.stopLoss}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Take Profit:</span>
                  <span className="ml-2">${trade.takeProfit}</span>
                </div>
              </div>

              {trade.status === 'completed' && trade.profit !== undefined && (
                <div className="bg-muted p-3 rounded">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {trade.result === 'win' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${getResultColor(trade.result)}`}>
                        ${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Exit: ${trade.exitPrice} | Fees: ${trade.fees}
                    </span>
                  </div>
                </div>
              )}

              {trade.status !== 'completed' && (
                <div className="flex gap-2">
                  {trade.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onUpdateTrade(trade.id, { status: 'entered' })}
                    >
                      Mark as Entered
                    </Button>
                  )}
                  {trade.status === 'entered' && editingTrade !== trade.id && (
                    <Button 
                      size="sm"
                      onClick={() => handleCompleteTradeClick(trade)}
                    >
                      Complete Trade
                    </Button>
                  )}
                </div>
              )}

              {editingTrade === trade.id && (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="exitPrice">Exit Price</Label>
                      <Input
                        id="exitPrice"
                        type="number"
                        step="0.01"
                        value={formData.exitPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, exitPrice: e.target.value }))}
                        placeholder="Exit price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fees">Fees ($)</Label>
                      <Input
                        id="fees"
                        type="number"
                        step="0.01"
                        value={formData.fees}
                        onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
                        placeholder="5.00"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleCompleteTrade(trade)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingTrade(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};