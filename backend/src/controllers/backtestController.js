const marketDataService = require('../services/marketDataService');

exports.runBacktest = async (req, res) => {
  try {
    const { symbol, strategy, initialInvestment, period } = req.body;
    
    if (!symbol || !strategy || !initialInvestment || !period) {
      return res.status(400).json({ message: 'Missing required parameters: symbol, strategy, initialInvestment, period' });
    }

    const data = await marketDataService.getHistoricalData(symbol, period, '1d');
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Historical data not available for backtesting' });
    }

    // Benchmark (buy and hold) array computation
    const benchmarkResults = [];
    const initialPrice = data[0].close;
    let maxDrawdown = 0;
    let peakValue = initialInvestment;
    
    let strategyResults = [];
    let capital = initialInvestment;
    let shares = 0;
    let tradesTriggered = 0;
    let winningTrades = 0;
    
    // Simple Strategy Mapping
    if (strategy === 'buy_and_hold') {
      shares = capital / initialPrice;
      capital = 0;
      
      for (const pt of data) {
        const currentValue = capital + (shares * pt.close);
        if (currentValue > peakValue) peakValue = currentValue;
        const drawdown = (peakValue - currentValue) / peakValue;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        benchmarkResults.push({
          date: pt.time * 1000,
          originalPrice: pt.close,
          portfolioValue: parseFloat(currentValue.toFixed(2))
        });
      }
      strategyResults = benchmarkResults; // same for B&H
    } 
    else if (strategy === 'sma_crossover') {
      // Very crude 5-day / 20-day SMA Crossover
      const shortWindow = 5;
      const longWindow = 20;
      
      for (let i = 0; i < data.length; i++) {
        const pt = data[i];
        
        // Benchmark calc
        const benchVal = initialInvestment * (pt.close / initialPrice);
        benchmarkResults.push({ date: pt.time * 1000, portfolioValue: parseFloat(benchVal.toFixed(2)) });
        
        if (i >= longWindow) {
          const shortSum = data.slice(i - shortWindow, i).reduce((sum, d) => sum + d.close, 0);
          const longSum = data.slice(i - longWindow, i).reduce((sum, d) => sum + d.close, 0);
          const shortSMA = shortSum / shortWindow;
          const longSMA = longSum / longWindow;
          
          if (shortSMA > longSMA && capital > 0) {
            // Golden Cross -> Buy
            shares = capital / pt.close;
            capital = 0;
            tradesTriggered++;
          } else if (shortSMA < longSMA && shares > 0) {
            // Death Cross -> Sell
            const newCapital = shares * pt.close;
            if (newCapital > initialInvestment) winningTrades++; // Simplistic win calculation
            capital = newCapital;
            shares = 0;
            tradesTriggered++;
          }
        }
        
        const currentValue = capital + (shares * pt.close);
        if (currentValue > peakValue) peakValue = currentValue;
        const drawdown = (peakValue - currentValue) / peakValue;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        strategyResults.push({
          date: pt.time * 1000,
          originalPrice: pt.close,
          portfolioValue: parseFloat(currentValue.toFixed(2))
        });
      }
      
      // Handle the initial gap array fill
      for (let i = 0; i < longWindow && i < data.length; i++) {
        strategyResults.unshift({
          date: data[i].time * 1000,
          originalPrice: data[i].close,
          portfolioValue: initialInvestment
        });
      }
      // Trim to match
      strategyResults = strategyResults.slice(0, data.length).sort((a,b) => a.date - b.date);
    }
    else {
      return res.status(400).json({ message: 'Unknown strategy type' });
    }

    const finalValue = strategyResults[strategyResults.length - 1].portfolioValue;
    const benchFinalValue = benchmarkResults[benchmarkResults.length - 1].portfolioValue;
    
    const returnPct = ((finalValue - initialInvestment) / initialInvestment) * 100;
    const benchReturnPct = ((benchFinalValue - initialInvestment) / initialInvestment) * 100;

    res.json({
      metrics: {
        totalReturnPct: returnPct.toFixed(2),
        benchmarkReturnPct: benchReturnPct.toFixed(2),
        maxDrawdownPct: (maxDrawdown * 100).toFixed(2),
        totalTrades: tradesTriggered,
        finalValue: finalValue.toFixed(2),
        alpha: (returnPct - benchReturnPct).toFixed(2) // outperformance versus buy and hold
      },
      chartData: strategyResults.map((s, idx) => ({
        date: new Date(s.date).toLocaleDateString(),
        strategy: s.portfolioValue,
        benchmark: benchmarkResults[idx] ? benchmarkResults[idx].portfolioValue : s.portfolioValue 
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
