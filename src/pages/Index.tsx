import { useState } from 'react';
import { Brain, Zap, BarChart3, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { StrategySelector, StrategyType } from '@/components/StrategySelector';
import { AnalysisResults } from '@/components/AnalysisResults';
import { TradeJournal, Trade } from '@/components/TradeJournal';
import { TradingStats } from '@/components/TradingStats';
import { MarketSelector, CurrencyType, TimeframeType, TradingType } from '@/components/MarketSelector';
import { PricePrediction } from '@/components/PricePrediction';
import { CryptoNews } from '@/components/CryptoNews';
import { SMCAnalysis } from '@/components/SMCAnalysis';
import { ICTAnalysis } from '@/components/ICTAnalysis';
import { DataImport } from '@/components/DataImport';
import { AutoTradingSignals } from '@/components/AutoTradingSignals';
import { toast } from 'sonner';

const Index = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('swing');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('4h');
  const [selectedTradingType, setSelectedTradingType] = useState<TradingType>('spot');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showJournal, setShowJournal] = useState(false);

  const handleImageUpload = (file: File, imageUrl: string) => {
    setUploadedImage(imageUrl);
    setAnalysisResult(null);
  };

  const handleRemoveImage = () => {
    setUploadedImage('');
    setAnalysisResult(null);
  };

  const handleUpdateTrade = (tradeId: string, updates: Partial<Trade>) => {
    setTrades(prevTrades =>
      prevTrades.map(trade =>
        trade.id === tradeId ? { ...trade, ...updates } : trade
      )
    );
  };

  const createTradeFromAnalysis = (analysisData: any) => {
    const newTrade: Trade = {
      id: `trade_${Date.now()}`,
      strategy: analysisData.strategy,
      pattern: analysisData.pattern,
      direction: analysisData.direction === 'bullish' ? 'long' : 'short',
      entry: analysisData.entry,
      stopLoss: analysisData.stopLoss,
      takeProfit: analysisData.takeProfit,
      analyzedAt: new Date(),
      estimatedEntryTime: analysisData.estimatedEntryTime,
      status: 'pending'
    };
    
    setTrades(prevTrades => [newTrade, ...prevTrades]);
    toast.success('Trade added to journal!');
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const currentPrice = selectedCurrency === 'BTC' ? 45000 : 
                        selectedCurrency === 'ETH' ? 2500 : 
                        selectedCurrency === 'BNB' ? 350 : 
                        selectedCurrency === 'SOL' ? 85 : 25;
      const priceMultiplier = selectedCurrency === 'BTC' ? 1000 : selectedCurrency === 'ETH' ? 100 : 1;
      const direction = Math.random() > 0.5 ? 'bullish' : 'bearish' as 'bullish' | 'bearish';
      const changePercent = (Math.random() * 4 + 1) * (direction === 'bullish' ? 1 : -1);
      const predictedPrice = currentPrice * (1 + changePercent / 100);
      
      const mockAnalysisResult = {
        strategy: selectedStrategy,
        confidence: Math.floor(Math.random() * 30) + 70,
        pattern: selectedStrategy === 'swing' ? 'Bull Flag' : 'Ascending Triangle',
        direction,
        entry: currentPrice,
        stopLoss: direction === 'bullish' ? currentPrice * 0.97 : currentPrice * 1.03,
        takeProfit: direction === 'bullish' ? currentPrice * 1.05 : currentPrice * 0.95,
        riskReward: selectedStrategy === 'swing' ? '1:3.2' : '1:1.8',
        timeframe: selectedTimeframe,
        volume: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        estimatedEntryTime: selectedStrategy === 'swing' ? '2-4 hours' : '5-15 minutes',
        keyLevels: {
          support: [currentPrice * 0.97, currentPrice * 0.95, currentPrice * 0.93],
          resistance: [currentPrice * 1.03, currentPrice * 1.05, currentPrice * 1.07]
        }
      };

      const mockPredictionResult = {
        currentPrice,
        predictedPrice,
        priceChange: predictedPrice - currentPrice,
        percentageChange: changePercent,
        direction,
        confidence: Math.floor(Math.random() * 30) + 70,
        timeToTarget: selectedTimeframe === '1m' ? '1-2 minutes' : 
                     selectedTimeframe === '5m' ? '5-10 minutes' :
                     selectedTimeframe === '1h' ? '1-2 hours' : '4-8 hours',
        keyEvents: [
          'Federal Reserve meeting scheduled',
          'High trading volume detected',
          'Technical resistance breakout expected'
        ],
        volatility: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      };
      
      setAnalysisResult(mockAnalysisResult);
      setPredictionResult(mockPredictionResult);
      setIsAnalyzing(false);
      toast.success('Analysis complete! Price prediction generated.');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-chart">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SnapTrader AI - MEXC</h1>
                <p className="text-muted-foreground">
                  AI-Powered Crypto Chart Analysis & Trading Signals for MEXC Exchange
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={!showJournal ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowJournal(false)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analysis
                </Button>
                <Button
                  variant={showJournal ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowJournal(true)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Journal
                </Button>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                AI Engine Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {showJournal ? (
            /* Trade Journal View */
            <>
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Trading Statistics</h2>
                  <p className="text-muted-foreground">
                    Track your trading performance and win rate
                  </p>
                </div>
                <TradingStats trades={trades} />
              </section>

              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Trade Journal</h2>
                  <p className="text-muted-foreground">
                    Manage your trades and track their outcomes
                  </p>
                </div>
                <TradeJournal trades={trades} onUpdateTrade={handleUpdateTrade} />
              </section>
            </>
          ) : (
            /* Analysis View */
            <>
              {/* Market Selection */}
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">MEXC Crypto Trading</h2>
                  <p className="text-muted-foreground">
                    Select crypto pair and timeframe for MEXC exchange analysis
                  </p>
                </div>
                <MarketSelector 
                  selectedCurrency={selectedCurrency}
                  selectedTimeframe={selectedTimeframe}
                  selectedTradingType={selectedTradingType}
                  onCurrencyChange={setSelectedCurrency}
                  onTimeframeChange={setSelectedTimeframe}
                  onTradingTypeChange={setSelectedTradingType}
                />
              </section>

              {/* Strategy Selection */}
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Select Trading Strategy</h2>
                  <p className="text-muted-foreground">
                    Choose between swing trading for longer holds or scalping for quick profits
                  </p>
                </div>
                <StrategySelector 
                  selectedStrategy={selectedStrategy}
                  onStrategyChange={setSelectedStrategy}
                />
              </section>

              {/* Auto Trading Signals */}
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Automatiska Trading Signaler</h2>
                  <p className="text-muted-foreground">
                    AI analyserar MEXC data kontinuerligt och genererar köp/sälj signaler automatiskt
                  </p>
                </div>
                <AutoTradingSignals 
                  selectedCurrency={selectedCurrency}
                  selectedTimeframe={selectedTimeframe}
                  tradingType={selectedTradingType}
                />
              </section>

              {/* Price Prediction Results */}
              {predictionResult && (
                <section>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">MEXC Price Prediction</h2>
                    <p className="text-muted-foreground">
                      AI-powered price prediction for {selectedCurrency}/USDT on {selectedTimeframe} timeframe
                    </p>
                  </div>
                  <PricePrediction 
                    currency={selectedCurrency}
                    timeframe={selectedTimeframe}
                    data={predictionResult}
                  />
                </section>
              )}

              {/* Data Import */}
              <section>
                <DataImport 
                  currency={selectedCurrency} 
                  timeframe={selectedTimeframe}
                  tradingType={selectedTradingType}
                />
              </section>

              {/* Market News */}
              <section>
                <CryptoNews selectedCurrency={selectedCurrency} />
              </section>

              {/* SMC Analysis */}
              <section>
                <SMCAnalysis currency={selectedCurrency} timeframe={selectedTimeframe} />
              </section>

              {/* ICT Analysis */}
              <section>
                <ICTAnalysis currency={selectedCurrency} timeframe={selectedTimeframe} />
              </section>

              {/* Analysis Results */}
              {analysisResult && (
                <section>
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Chart Analysis</h2>
                      <p className="text-muted-foreground">
                        Technical analysis and trading signals for your chart
                      </p>
                    </div>
                    <Button
                      onClick={() => createTradeFromAnalysis(analysisResult)}
                      className="bg-gradient-primary"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Save to Journal
                    </Button>
                  </div>
                  <AnalysisResults 
                    data={analysisResult}
                    imageUrl={uploadedImage}
                  />
                </section>
              )}

              {/* Feature Cards */}
              {!uploadedImage && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Brain className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">AI Pattern Recognition</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced machine learning identifies chart patterns and market structures
                    </p>
                  </Card>

                  <Card className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">Instant Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get trading signals and recommendations in seconds, not hours
                    </p>
                  </Card>

                  <Card className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">Risk Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Precise entry, stop loss, and take profit levels for optimal risk/reward
                    </p>
                  </Card>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;