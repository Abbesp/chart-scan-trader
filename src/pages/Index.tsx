import { useState } from 'react';
import { Brain, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { StrategySelector, StrategyType } from '@/components/StrategySelector';
import { AnalysisResults } from '@/components/AnalysisResults';
import { toast } from 'sonner';

const Index = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('swing');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleImageUpload = (file: File, imageUrl: string) => {
    setUploadedImage(imageUrl);
    setAnalysisResult(null);
  };

  const handleRemoveImage = () => {
    setUploadedImage('');
    setAnalysisResult(null);
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const mockResult = {
        strategy: selectedStrategy,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        pattern: selectedStrategy === 'swing' ? 'Bull Flag' : 'Ascending Triangle',
        direction: Math.random() > 0.5 ? 'bullish' : 'bearish' as 'bullish' | 'bearish',
        entry: 156.75,
        stopLoss: 152.30,
        takeProfit: 164.20,
        riskReward: selectedStrategy === 'swing' ? '1:3.2' : '1:1.8',
        timeframe: selectedStrategy === 'swing' ? '4H' : '5M',
        volume: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        keyLevels: {
          support: [152.30, 148.50, 145.00],
          resistance: [161.20, 164.20, 168.50]
        }
      };
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
      toast.success('Analysis complete! Trade signal generated.');
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
                <h1 className="text-2xl font-bold">SnapTrader AI</h1>
                <p className="text-muted-foreground">
                  AI-Powered Chart Analysis & Trading Signals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Image Upload */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Upload Chart</h2>
              <p className="text-muted-foreground">
                Upload a screenshot of your trading chart for AI analysis
              </p>
            </div>
            <ImageUpload 
              onImageUploaded={handleImageUpload}
              uploadedImage={uploadedImage}
              onRemoveImage={handleRemoveImage}
            />
          </section>

          {/* Analysis Button */}
          {uploadedImage && !analysisResult && (
            <section className="text-center">
              <Card className="p-8 bg-gradient-chart">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-gradient-primary">
                      <BarChart3 className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                    <p className="text-muted-foreground mb-6">
                      Click below to analyze your chart with our AI engine
                    </p>
                  </div>
                  <Button
                    onClick={simulateAnalysis}
                    disabled={isAnalyzing}
                    size="lg"
                    className="bg-gradient-primary px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <Zap className="h-5 w-5 mr-2 animate-spin" />
                        Analyzing Chart...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Analyze Chart
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </section>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>
                <p className="text-muted-foreground">
                  AI has analyzed your chart and generated trading recommendations
                </p>
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
        </div>
      </div>
    </div>
  );
};

export default Index;