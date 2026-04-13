# Top 100 Stock Scanner

## Goal

Automatically rank the **top opportunities in the market** using the
signal engine.

Output: Daily ranked list of best stocks.

------------------------------------------------------------------------

# Universe Selection

Example universe:

Top 1000 stocks by market cap.

Liquidity filter:

average_volume \> 1M\
market_cap \> 1B

------------------------------------------------------------------------

# Filtering Stage

Remove:

-   illiquid stocks
-   penny stocks
-   extreme volatility assets

Filters:

price \> \$5\
ATR/Price \< 10%

------------------------------------------------------------------------

# Signal Ranking

For each stock compute:

signal_score\
risk_score\
smart_money_score

Composite ranking:

rank_score =

0.5 \* signal_score + 0.3 \* smart_money_score + 0.2 \* (100 -
risk_score)

------------------------------------------------------------------------

# Top 100 Selection

Sort descending by rank_score.

Select top 100 stocks.

------------------------------------------------------------------------

# Example Output

rank \| ticker \| score 1 \| NVDA \| 84 2 \| MSFT \| 80 3 \| AAPL \| 78
4 \| AMD \| 77

------------------------------------------------------------------------

# Scanner Frequency

Recommended runs:

Daily after market close.

Optional intraday scans every 30 minutes.

------------------------------------------------------------------------

# API Output

Endpoint:

GET /scanner/top100

Example:

{ "date": "2026-03-16", "top_stocks": \[ {"ticker":"NVDA","score":84},
{"ticker":"MSFT","score":80} \] }

------------------------------------------------------------------------

# Dashboard View

Features:

-   Top 100 leaderboard
-   Sector heatmap
-   Momentum leaders
-   Smart money alerts
