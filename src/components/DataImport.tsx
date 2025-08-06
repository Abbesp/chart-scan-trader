import { Database, Download, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { toast } from 'sonner';

// MEXC API Keys - VARNING: Dessa bör flyttas till säker backend senare
const MEXC_API_KEYS = {
  secret: '4aab87c1d148494386ef5d5d191e9e20',
  accessKey: 'mx0vglc20OzMqpRgDx'
};

interface DataImportProps {
  currency: string;
  timeframe: string;
  tradingType: 'spot' | 'futures';
}

export const DataImport = ({ currency, timeframe, tradingType }: DataImportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [lastImport, setLastImport] = useState<Date | null>(null);

  const handleImportData = async () => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      // Create MEXC API signature for authentication
      const timestamp = Date.now();
      const symbol = `${currency}USDT`;
      
      setImportProgress(25);

      // MEXC API endpoint
      const baseUrl = tradingType === 'futures' 
        ? 'https://contract.mexc.com/api/v1/contract/kline'
        : 'https://api.mexc.com/api/v3/klines';
      
      const params = new URLSearchParams({
        symbol,
        interval: timeframe,
        limit: '100'
      });

      setImportProgress(50);

      // Fetch data from MEXC
      const response = await fetch(`${baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`MEXC API Error: ${response.status}`);
      }

      const data = await response.json();
      setImportProgress(75);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setImportProgress(100);
      setLastImport(new Date());
      
      toast.success(`Importerade ${data.length} datapunkter från MEXC API`);
      console.log('MEXC Data:', data);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Fel vid import av data från MEXC API');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">MEXC Data Import</h3>
              <p className="text-sm text-muted-foreground">
                Import real-time {currency}/USDT {tradingType} data
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {timeframe} timeframe
          </Badge>
        </div>

        {/* Import Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Data Source</div>
            <div className="text-lg font-bold text-primary">MEXC API</div>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Market Type</div>
            <div className="text-lg font-bold">
              {tradingType.toUpperCase()}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-secondary">
            <div className="text-sm text-muted-foreground">Last Import</div>
            <div className="text-lg font-bold">
              {lastImport ? lastImport.toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Import Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Importing {currency} data...</span>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleImportData}
            disabled={isImporting}
            className="bg-gradient-primary flex-1"
          >
            {isImporting ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Importing Data...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import Live Data
              </>
            )}
          </Button>
          
          <Button variant="outline" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Chart
          </Button>
        </div>

        {/* API Notice */}
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-medium">MEXC API Integration</div>
              <div className="text-sm text-muted-foreground">
                För att importera riktig data behövs MEXC API-nycklar. 
                Anslut till Supabase för säker hantering av API-nycklar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};