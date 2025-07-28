import { useState } from 'react';
import { DollarSign, Euro, Clock, Bitcoin, Coins, Search, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export type CurrencyType = string;
export type TimeframeType = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
export type TradingType = 'spot' | 'futures';

interface MarketSelectorProps {
  selectedCurrency: CurrencyType;
  selectedTimeframe: TimeframeType;
  selectedTradingType: TradingType;
  onCurrencyChange: (currency: CurrencyType) => void;
  onTimeframeChange: (timeframe: TimeframeType) => void;
  onTradingTypeChange: (type: TradingType) => void;
}

// MEXC Top Cryptocurrencies
const mexcCurrencies = [
  { symbol: 'BTC', name: 'Bitcoin', volume: 'high', marketCap: 'large' },
  { symbol: 'ETH', name: 'Ethereum', volume: 'high', marketCap: 'large' },
  { symbol: 'BNB', name: 'BNB', volume: 'high', marketCap: 'large' },
  { symbol: 'SOL', name: 'Solana', volume: 'high', marketCap: 'large' },
  { symbol: 'ADA', name: 'Cardano', volume: 'medium', marketCap: 'large' },
  { symbol: 'DOT', name: 'Polkadot', volume: 'medium', marketCap: 'large' },
  { symbol: 'MATIC', name: 'Polygon', volume: 'high', marketCap: 'large' },
  { symbol: 'AVAX', name: 'Avalanche', volume: 'medium', marketCap: 'large' },
  { symbol: 'LINK', name: 'Chainlink', volume: 'medium', marketCap: 'large' },
  { symbol: 'UNI', name: 'Uniswap', volume: 'medium', marketCap: 'large' },
  { symbol: 'LTC', name: 'Litecoin', volume: 'medium', marketCap: 'large' },
  { symbol: 'BCH', name: 'Bitcoin Cash', volume: 'medium', marketCap: 'large' },
  { symbol: 'XRP', name: 'XRP', volume: 'high', marketCap: 'large' },
  { symbol: 'DOGE', name: 'Dogecoin', volume: 'high', marketCap: 'large' },
  { symbol: 'SHIB', name: 'Shiba Inu', volume: 'high', marketCap: 'medium' },
  { symbol: 'TRX', name: 'TRON', volume: 'medium', marketCap: 'large' },
  { symbol: 'ATOM', name: 'Cosmos', volume: 'medium', marketCap: 'medium' },
  { symbol: 'FTM', name: 'Fantom', volume: 'medium', marketCap: 'medium' },
  { symbol: 'NEAR', name: 'NEAR Protocol', volume: 'medium', marketCap: 'medium' },
  { symbol: 'ALGO', name: 'Algorand', volume: 'medium', marketCap: 'medium' },
  { symbol: 'VET', name: 'VeChain', volume: 'medium', marketCap: 'medium' },
  { symbol: 'ICP', name: 'Internet Computer', volume: 'medium', marketCap: 'medium' },
  { symbol: 'FLOW', name: 'Flow', volume: 'low', marketCap: 'medium' },
  { symbol: 'XLM', name: 'Stellar', volume: 'medium', marketCap: 'medium' },
  { symbol: 'MANA', name: 'Decentraland', volume: 'medium', marketCap: 'medium' },
  { symbol: 'SAND', name: 'The Sandbox', volume: 'medium', marketCap: 'medium' },
  { symbol: 'AXS', name: 'Axie Infinity', volume: 'medium', marketCap: 'medium' },
  { symbol: 'CHZ', name: 'Chiliz', volume: 'medium', marketCap: 'medium' },
  { symbol: 'ENJ', name: 'Enjin Coin', volume: 'low', marketCap: 'medium' },
  { symbol: 'THETA', name: 'Theta Network', volume: 'low', marketCap: 'medium' },
  { symbol: 'FIL', name: 'Filecoin', volume: 'medium', marketCap: 'medium' },
  { symbol: 'XTZ', name: 'Tezos', volume: 'low', marketCap: 'medium' },
  { symbol: 'EOS', name: 'EOS', volume: 'low', marketCap: 'medium' },
  { symbol: 'AAVE', name: 'Aave', volume: 'medium', marketCap: 'medium' },
  { symbol: 'MKR', name: 'Maker', volume: 'low', marketCap: 'medium' },
  { symbol: 'COMP', name: 'Compound', volume: 'low', marketCap: 'medium' },
  { symbol: 'SUSHI', name: 'SushiSwap', volume: 'medium', marketCap: 'medium' },
  { symbol: 'YFI', name: 'yearn.finance', volume: 'low', marketCap: 'medium' },
  { symbol: 'CRV', name: 'Curve DAO Token', volume: 'medium', marketCap: 'medium' },
  { symbol: 'BAL', name: 'Balancer', volume: 'low', marketCap: 'small' },
  { symbol: 'ZRX', name: '0x', volume: 'low', marketCap: 'small' },
  { symbol: 'GRT', name: 'The Graph', volume: 'medium', marketCap: 'medium' },
  { symbol: 'LRC', name: 'Loopring', volume: 'medium', marketCap: 'small' },
  { symbol: 'SNX', name: 'Synthetix', volume: 'low', marketCap: 'medium' },
  { symbol: 'REN', name: 'Ren', volume: 'low', marketCap: 'small' },
  { symbol: 'BAT', name: 'Basic Attention Token', volume: 'low', marketCap: 'medium' },
  { symbol: 'ZEC', name: 'Zcash', volume: 'low', marketCap: 'medium' },
  { symbol: 'DASH', name: 'Dash', volume: 'low', marketCap: 'medium' },
  { symbol: 'DCR', name: 'Decred', volume: 'low', marketCap: 'small' },
  { symbol: 'OMG', name: 'OMG Network', volume: 'low', marketCap: 'small' },
  { symbol: 'ICX', name: 'ICON', volume: 'low', marketCap: 'small' },
  { symbol: 'ZIL', name: 'Zilliqa', volume: 'low', marketCap: 'small' },
  { symbol: 'QTUM', name: 'Qtum', volume: 'low', marketCap: 'small' },
  { symbol: 'ONT', name: 'Ontology', volume: 'low', marketCap: 'small' },
  { symbol: 'IOST', name: 'IOST', volume: 'low', marketCap: 'small' },
  { symbol: 'ZEN', name: 'Horizen', volume: 'low', marketCap: 'small' },
  { symbol: 'DGB', name: 'DigiByte', volume: 'low', marketCap: 'small' },
  { symbol: 'SC', name: 'Siacoin', volume: 'low', marketCap: 'small' },
  { symbol: 'KMD', name: 'Komodo', volume: 'low', marketCap: 'small' },
  { symbol: 'WAVES', name: 'Waves', volume: 'low', marketCap: 'small' },
  { symbol: 'NANO', name: 'Nano', volume: 'low', marketCap: 'small' },
  { symbol: 'RVN', name: 'Ravencoin', volume: 'low', marketCap: 'small' },
  { symbol: 'HBAR', name: 'Hedera', volume: 'medium', marketCap: 'medium' },
  { symbol: 'HOT', name: 'Holo', volume: 'medium', marketCap: 'small' },
  { symbol: 'IOTA', name: 'IOTA', volume: 'low', marketCap: 'medium' },
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
  selectedTradingType,
  onCurrencyChange, 
  onTimeframeChange,
  onTradingTypeChange
}: MarketSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [volumeFilter, setVolumeFilter] = useState<string>('all');

  const filteredCurrencies = mexcCurrencies.filter(currency => {
    const matchesSearch = currency.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         currency.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVolume = volumeFilter === 'all' || currency.volume === volumeFilter;
    return matchesSearch && matchesVolume;
  });

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case 'high': return 'text-profit';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };
  return (
    <div className="space-y-6">
      {/* Trading Type Selection */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          MEXC Trading Type
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={selectedTradingType === 'spot' ? "default" : "outline"}
            className={`p-4 h-auto ${
              selectedTradingType === 'spot' 
                ? 'bg-gradient-primary text-primary-foreground' 
                : ''
            }`}
            onClick={() => onTradingTypeChange('spot')}
          >
            <div className="flex flex-col items-center gap-2">
              <Coins className="h-6 w-6" />
              <div>
                <div className="font-semibold">Spot Trading</div>
                <div className="text-xs opacity-80">Buy & Hold Assets</div>
              </div>
            </div>
          </Button>
          
          <Button
            variant={selectedTradingType === 'futures' ? "default" : "outline"}
            className={`p-4 h-auto ${
              selectedTradingType === 'futures' 
                ? 'bg-gradient-primary text-primary-foreground' 
                : ''
            }`}
            onClick={() => onTradingTypeChange('futures')}
          >
            <div className="flex flex-col items-center gap-2">
              <Bitcoin className="h-6 w-6" />
              <div>
                <div className="font-semibold">Futures Trading</div>
                <div className="text-xs opacity-80">Leverage & Contracts</div>
              </div>
            </div>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Selection */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Select Crypto Pair
          </h4>
          
          {/* Search and Filter */}
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volume</SelectItem>
                  <SelectItem value="high">High Volume</SelectItem>
                  <SelectItem value="medium">Medium Volume</SelectItem>
                  <SelectItem value="low">Low Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Currency Grid */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {filteredCurrencies.map((currency) => (
                <Button
                  key={currency.symbol}
                  variant={selectedCurrency === currency.symbol ? "default" : "outline"}
                  className={`p-3 h-auto justify-between ${
                    selectedCurrency === currency.symbol 
                      ? 'bg-gradient-primary text-primary-foreground' 
                      : ''
                  }`}
                  onClick={() => onCurrencyChange(currency.symbol)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-start">
                      <div className="font-semibold text-sm">{currency.symbol}/USDT</div>
                      <div className="text-xs opacity-70">{currency.name}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getVolumeColor(currency.volume)}`}
                    >
                      {currency.volume.toUpperCase()}
                    </Badge>
                    <div className="text-xs opacity-70">{currency.marketCap}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Timeframe Selection */}
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
    </div>
  );
};