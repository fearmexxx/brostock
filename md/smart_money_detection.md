# Smart Money Detection Model

## Purpose

Detect **institutional accumulation and distribution** using price and
volume patterns.

Retail traders follow price.\
Smart money leaves **volume footprints**.

------------------------------------------------------------------------

# Core Indicators

The model combines:

-   Volume Spike Detection
-   Accumulation/Distribution Line
-   VWAP positioning
-   Block trade detection

------------------------------------------------------------------------

# Volume Spike Model

volume_spike = current_volume / avg_volume_30

Thresholds:

> 2.0 = abnormal institutional activity\
> 3.0 = major accumulation event

------------------------------------------------------------------------

# Accumulation Detection

Institutional accumulation pattern:

Price flat\
Volume increasing\
OBV trending upward

Signal:

ACCUMULATION_SCORE +10

------------------------------------------------------------------------

# Distribution Detection

Distribution pattern:

Price flat or rising\
Volume spikes\
OBV falling

Signal:

DISTRIBUTION_SCORE -10

------------------------------------------------------------------------

# VWAP Positioning

Institutions often buy **below VWAP**.

Signals:

price \< VWAP and volume rising → accumulation\
price \> VWAP and volume spike → possible distribution

------------------------------------------------------------------------

# Dark Pool Proxy

Without direct dark pool data, proxy using:

Large volume candle with: - small price move - high traded value

Possible hidden institutional order.

------------------------------------------------------------------------

# Smart Money Score

smart_money_score =

0.4 \* volume_spike_score + 0.3 \* OBV_trend_score + 0.3 \*
VWAP_position_score

Range:

-20 → +20

------------------------------------------------------------------------

# Dashboard Visualization

Recommended UI:

-   Smart Money Gauge
-   Accumulation Heatmap
-   Institutional Activity Feed
