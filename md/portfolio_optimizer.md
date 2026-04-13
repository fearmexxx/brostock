# Portfolio Optimizer Specification

## Goal

Allocate capital across selected stocks to maximize **risk-adjusted
returns**.

------------------------------------------------------------------------

# Core Principles

Professional portfolio construction considers: - Expected Return - Risk
(Volatility) - Correlation - Position Sizing

Objective: **Maximize Sharpe Ratio**.

------------------------------------------------------------------------

# Inputs

Required inputs: - signal_score (-100 → +100) - historical volatility
(30d) - correlation matrix - portfolio capital

Example:

ticker \| signal \| volatility AAPL \| 78 \| 0.28 NVDA \| 72 \| 0.35
MSFT \| 65 \| 0.22

------------------------------------------------------------------------

# Expected Return Model

Convert signal score to expected return.

expected_return = signal_score / 100 \* target_alpha

Example: signal_score = 80 target_alpha = 20% expected_return = 0.16

------------------------------------------------------------------------

# Risk Model

Risk estimated using: - 30-day volatility - correlation matrix

Portfolio variance:

Var(p) = wᵀ Σ w

Where: w = weights Σ = covariance matrix

------------------------------------------------------------------------

# Optimization Objective

Maximize:

Sharpe Ratio

Sharpe = (Expected Return − Risk Free Rate) / Portfolio Volatility

------------------------------------------------------------------------

# Constraints

Common institutional constraints:

Long-only portfolio

0 ≤ weight ≤ 10%

Maximum sector exposure ≤ 30%

Maximum single stock ≤ 10%

------------------------------------------------------------------------

# Risk Parity Mode

Alternative method:

Allocate capital so each asset contributes equal risk.

Risk contribution:

RC_i = weight_i \* volatility_i

Goal:

RC_1 = RC_2 = RC_3

------------------------------------------------------------------------

# Kelly Criterion Sizing

Optional advanced sizing.

Kelly fraction:

f = (bp − q) / b

Use **fractional Kelly (0.25)** to reduce risk.

------------------------------------------------------------------------

# Output

Portfolio weights.

Example:

ticker \| weight NVDA \| 9% MSFT \| 8% AAPL \| 8% AMZN \| 7%

Remaining capital stays in cash.

------------------------------------------------------------------------

# Rebalancing

Recommended frequency:

Weekly or Monthly.
