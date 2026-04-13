# Signal Engine Specification

## Overview

Defines the exact computation logic for the multi-factor trading signal
engine.

Signal output: Conviction Score: **-100 to +100**

Factors:

-   Trend
-   Momentum
-   Volume Intelligence
-   Volatility
-   Mean Reversion

------------------------------------------------------------------------

# Data Inputs

Required market data:

-   OHLCV daily data
-   20-day history minimum
-   200-day history recommended

Fields:

-   open
-   high
-   low
-   close
-   volume

------------------------------------------------------------------------

# Indicator Calculations

## Moving Averages

SMA20 = mean(close, 20) SMA50 = mean(close, 50) SMA200 = mean(close,
200)

------------------------------------------------------------------------

## Momentum Indicators

RSI(14)

MACD:

MACD_line = EMA12 − EMA26 Signal_line = EMA9(MACD_line) Histogram =
MACD_line − Signal_line

ROC(14)

ROC = (Close_today − Close_14_days_ago) / Close_14_days_ago

------------------------------------------------------------------------

## Volume Indicators

Volume Surge:

volume_surge = current_volume / avg_volume_7

On Balance Volume:

if close_today \> close_yesterday: OBV += volume else: OBV -= volume

VWAP

VWAP = sum(price \* volume) / sum(volume)

------------------------------------------------------------------------

## Volatility

ATR(14)

True Range = max( high - low, abs(high - prev_close), abs(low -
prev_close) )

ATR = moving_average(TR, 14)

Bollinger Bands:

Middle = SMA20 Upper = SMA20 + 2 \* std(20) Lower = SMA20 - 2 \* std(20)

------------------------------------------------------------------------

# Factor Score Computation

Each factor produces a normalized score.

Trend Score Range: ±30 Momentum Score Range: ±20 Volume Score Range: ±15
Volatility Score Range: ±15 Mean Reversion Score Range: ±20

------------------------------------------------------------------------

# Final Conviction Score

signal_score =

0.30 \* trend_score + 0.20 \* momentum_score + 0.15 \* volume_score +
0.15 \* volatility_score + 0.20 \* mean_reversion_score

Clamp output between:

-100 ≤ score ≤ 100
