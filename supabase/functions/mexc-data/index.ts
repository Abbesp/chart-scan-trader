import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MEXCKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strategy: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  analysis: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol, interval = '1h', tradingType = 'spot' } = await req.json()
    
    // Fetch MEXC data
    const mexcUrl = tradingType === 'futures' 
      ? `https://contract.mexc.com/api/v1/contract/kline/${symbol}?interval=${interval}&limit=100`
      : `https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
    
    const mexcResponse = await fetch(mexcUrl)
    const klineData: MEXCKlineData[] = await mexcResponse.json()
    
    if (!klineData || klineData.length === 0) {
      throw new Error('No data received from MEXC')
    }

    // Analyze data and generate signal
    const signal = generateTradingSignal(klineData, symbol)
    
    // Store in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase
      .from('trading_signals')
      .insert({
        symbol,
        signal: signal.signal,
        confidence: signal.confidence,
        strategy: signal.strategy,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        analysis: signal.analysis,
        trading_type: tradingType,
        interval,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        signal,
        klineData: klineData.slice(-20) // Return last 20 candles
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})

function generateTradingSignal(klineData: MEXCKlineData[], symbol: string): TradingSignal {
  const prices = klineData.map(k => parseFloat(k.close))
  const currentPrice = prices[prices.length - 1]
  
  // Calculate technical indicators
  const sma20 = calculateSMA(prices, 20)
  const sma50 = calculateSMA(prices, 50)
  const rsi = calculateRSI(prices, 14)
  
  // SMC Analysis
  const structureBreak = checkStructureBreak(prices)
  const liquidityLevel = findLiquidityLevel(klineData)
  
  // Generate signal based on multiple factors
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
  let confidence = 50
  let analysis = ''
  
  // Bullish conditions
  if (currentPrice > sma20 && sma20 > sma50 && rsi < 70 && structureBreak === 'bullish') {
    signal = 'BUY'
    confidence = 85
    analysis = 'Bullish struktur med break of structure upptåt. SMA20 över SMA50. RSI visar inte överköpt.'
  }
  // Bearish conditions
  else if (currentPrice < sma20 && sma20 < sma50 && rsi > 30 && structureBreak === 'bearish') {
    signal = 'SELL'
    confidence = 85
    analysis = 'Bearish struktur med break of structure nedåt. SMA20 under SMA50. RSI visar inte översålt.'
  }
  // Strong bullish
  else if (currentPrice > sma50 && rsi < 50) {
    signal = 'BUY'
    confidence = 70
    analysis = 'Pris över SMA50 med RSI under 50. Bra köpläge.'
  }
  // Strong bearish
  else if (currentPrice < sma50 && rsi > 50) {
    signal = 'SELL'
    confidence = 70
    analysis = 'Pris under SMA50 med RSI över 50. Bra säljläge.'
  }
  
  const stopLossDistance = currentPrice * 0.02 // 2% stop loss
  const takeProfitDistance = currentPrice * 0.06 // 6% take profit (3:1 R:R)
  
  return {
    symbol,
    signal,
    confidence,
    strategy: 'SMC + SMA + RSI',
    entry_price: currentPrice,
    stop_loss: signal === 'BUY' ? currentPrice - stopLossDistance : currentPrice + stopLossDistance,
    take_profit: signal === 'BUY' ? currentPrice + takeProfitDistance : currentPrice - takeProfitDistance,
    analysis
  }
}

function calculateSMA(prices: number[], period: number): number {
  const slice = prices.slice(-period)
  return slice.reduce((sum, price) => sum + price, 0) / slice.length
}

function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses -= change
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function checkStructureBreak(prices: number[]): 'bullish' | 'bearish' | 'none' {
  if (prices.length < 10) return 'none'
  
  const recentHigh = Math.max(...prices.slice(-5))
  const previousHigh = Math.max(...prices.slice(-15, -5))
  const recentLow = Math.min(...prices.slice(-5))
  const previousLow = Math.min(...prices.slice(-15, -5))
  
  if (recentHigh > previousHigh && recentLow > previousLow) return 'bullish'
  if (recentHigh < previousHigh && recentLow < previousLow) return 'bearish'
  
  return 'none'
}

function findLiquidityLevel(klineData: MEXCKlineData[]): number {
  // Find significant support/resistance levels
  const highs = klineData.map(k => parseFloat(k.high))
  const lows = klineData.map(k => parseFloat(k.low))
  
  return Math.max(...highs) // Simple implementation
}