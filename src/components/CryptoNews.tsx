import { Newspaper, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
  source: string;
  relevantCoins: string[];
  winProbability: number;
}

interface CryptoNewsProps {
  selectedCurrency: string;
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin ETF Approval Expected This Week',
    summary: 'Multiple sources suggest SEC approval for Bitcoin ETF is imminent, potentially driving massive institutional inflow.',
    impact: 'high',
    sentiment: 'bullish',
    timestamp: '2h ago',
    source: 'CoinDesk',
    relevantCoins: ['BTC', 'ETH'],
    winProbability: 85
  },
  {
    id: '2',
    title: 'Ethereum Shanghai Upgrade Completed Successfully',
    summary: 'The upgrade allows for ETH staking withdrawals, reducing selling pressure and improving network efficiency.',
    impact: 'medium',
    sentiment: 'bullish',
    timestamp: '4h ago',
    source: 'CryptoSlate',
    relevantCoins: ['ETH'],
    winProbability: 72
  },
  {
    id: '3',
    title: 'Federal Reserve Signals Interest Rate Cuts',
    summary: 'Fed Chairman hints at potential rate cuts in Q2, historically bullish for risk assets including crypto.',
    impact: 'high',
    sentiment: 'bullish',
    timestamp: '6h ago',
    source: 'Reuters',
    relevantCoins: ['BTC', 'ETH', 'SOL', 'ADA'],
    winProbability: 78
  },
  {
    id: '4',
    title: 'Major Exchange Security Breach Reported',
    summary: 'Smaller exchange reports security incident, raising concerns about market security.',
    impact: 'medium',
    sentiment: 'bearish',
    timestamp: '8h ago',
    source: 'BlockBeats',
    relevantCoins: ['BTC', 'ETH'],
    winProbability: 35
  }
];

export const CryptoNews = ({ selectedCurrency }: CryptoNewsProps) => {
  const relevantNews = mockNews.filter(news => 
    news.relevantCoins.includes(selectedCurrency)
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-loss text-white';
      case 'medium': return 'bg-warning text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-profit';
      case 'bearish': return 'text-loss';
      case 'neutral': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getWinProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-profit';
    if (probability >= 50) return 'text-warning';
    return 'text-loss';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Newspaper className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Market News & Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Latest news affecting {selectedCurrency}/USDT with win probability
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="space-y-4">
        {relevantNews.map((news) => (
          <Card key={news.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm leading-tight mb-2">
                    {news.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {news.summary}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className={`text-lg font-bold ${getWinProbabilityColor(news.winProbability)}`}>
                    {news.winProbability}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Win Odds
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getImpactColor(news.impact)} variant="secondary">
                    {news.impact.toUpperCase()}
                  </Badge>
                  <div className={`flex items-center gap-1 ${getSentimentColor(news.sentiment)}`}>
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {news.sentiment.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{news.source}</span>
                  <span>•</span>
                  <span>{news.timestamp}</span>
                </div>
              </div>

           <div className="flex flex-wrap gap-1">
  {news.relevantCoins.map((coin) => (
    <Badge 
      key={typeof coin === "string" ? coin : coin.symbol} 
      variant="outline" 
      className={`text-xs ${ (typeof coin === "string" ? coin : coin.symbol) === selectedCurrency ? 'border-primary text-primary' : ''}`}
    >
      {typeof coin === "string" ? coin : coin.symbol}
    </Badge>
  ))}
</div>

            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
