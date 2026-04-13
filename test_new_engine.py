
import pandas as pd
from stock_analyzer import get_stock_history_data, calculate_trend_metrics

def test_engine(symbol="FPT"):
    print(f"--- Testing New Institutional Engine for {symbol} ---")
    try:
        df = get_stock_history_data(symbol)
        if df.empty:
            print(f"No data for {symbol}")
            return
            
        metrics = calculate_trend_metrics(df)
        
        print(f"Price: {metrics.get('current_price_daily'):,.0f}")
        print(f"Signal Score: {metrics.get('signal_score'):+.0f}")
        print(f"Signal Label: {metrics.get('signal_label')}")
        print(f"Market Regime: {metrics.get('market_regime')} (ADX: {metrics.get('adx', 0):.1f})")
        print(f"Risk Score: {metrics.get('risk_score')}/100 ({metrics.get('risk_label')})")
        
        print("\nFactor Breakdown:")
        factors = metrics.get('factors', {})
        for f, score in factors.items():
            print(f" - {f.capitalize()}: {score:+d}")
            
        print("\nWeights used:")
        weights = metrics.get('weights', {})
        for f, w in weights.items():
            print(f" - {f.capitalize()}: {w:.0%}")
            
        print(f"\nOutlook (5d): {metrics.get('prediction_label')} ({metrics.get('prediction_5d_pct'):+.2f}%)")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test a few symbols
    for s in ["FPT", "VIC", "VNM"]:
        test_engine(s)
        print("-" * 40)
