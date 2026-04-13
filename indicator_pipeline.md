# Indicator Data Pipeline

## Goal

Create a scalable data pipeline for computing trading indicators across
many stocks.

Pipeline Stages:

Market Data → Cleaning → Indicator Engine → Signal Engine → Dashboard
API

------------------------------------------------------------------------

# Stage 1: Market Data Ingestion

Sources:

-   Exchange APIs
-   Polygon
-   AlphaVantage
-   Yahoo Finance

Scheduler:

-   Daily batch job
-   Optional intraday updates

Storage:

Recommended database:

Timeseries DB:

-   ClickHouse
-   TimescaleDB

Table Structure

prices

ticker date open high low close volume

------------------------------------------------------------------------

# Stage 2: Data Cleaning

Steps:

1 Remove duplicate rows 2 Fill missing trading days 3 Adjust for stock
splits 4 Normalize ticker symbols

------------------------------------------------------------------------

# Stage 3: Indicator Engine

Compute indicators in batch.

Indicators:

Trend:

-   SMA20
-   SMA50
-   SMA200

Momentum:

-   RSI
-   MACD
-   ROC

Volume:

-   OBV
-   Volume Surge
-   VWAP

Volatility:

-   ATR
-   Bollinger Bands

Store results in:

indicators table

ticker date indicator_name value

------------------------------------------------------------------------

# Stage 4: Signal Engine

Combine indicators into factor scores.

Trend Score Momentum Score Volume Score Volatility Score Mean Reversion
Score

Generate:

signal_score

Output stored in:

signals table

ticker date signal_score trend_score momentum_score volume_score
volatility_score mean_reversion_score

------------------------------------------------------------------------

# Stage 5: Dashboard API

Expose REST endpoints

GET /signals/{ticker} GET /top-signals GET /market-heatmap

Recommended stack:

FastAPI Redis cache Postgres / ClickHouse
