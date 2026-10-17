---
slug: rate
title: RATE
summary: The interest rate per period implied by a payment, a present value and a number of periods.
skills: [rate]
topics: [time-value-of-money]
---
## What it does

`RATE` is the one function in this group that Excel cannot solve directly. There is no closed-form formula for the rate, so Excel searches for it by trial and error until the present value of the payments matches the amount you gave it.

```
=RATE(nper, pmt, pv, [fv], [type], [guess])
```

## A worked example

You borrow $10,000 and repay $2,500 at the end of each year for 5 years:

```
=RATE(5, -2500, 10000)
```

returns **7.93%**. The amount borrowed and the payments must have opposite signs, or Excel has nothing to solve.

## It returns the rate per period

Monthly payments give a monthly rate. Multiply by 12 for the annual rate most lenders quote (the APR), or use `=(1+r)^12-1` for the effective annual rate.

## Bonds

For a bond, `pv` is the price (negative, because you pay it), `pmt` is the coupon and `fv` is the face value. The result is the yield to maturity per period. The bond exercises in the other finance packs use exactly this setup.

## When it fails

If Excel's search does not converge you get `#NUM!`. Supply a `guess` close to the answer, such as 0.05, and it usually resolves.
