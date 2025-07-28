import { Database, Download, TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

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

    // Simulate data import progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsImporting(false);
          setLastImport(new Date());
          return 100;
        }
        return prev + 10;
      });
    }, 200);
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