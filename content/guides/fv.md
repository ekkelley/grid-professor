---
slug: fv
title: FV
summary: The future value of a level stream of payments, or of one amount invested today.
skills: [fv]
topics: [future-value, compounding, time-value-of-money]
---
## What it does

`FV` runs `PV` in the other direction. It compounds every payment forward to the end of the last period and adds them up.

```
=FV(rate, nper, pmt, [pv], [type])
```

## A worked example

Saving $100 at the end of each year for 10 years at 6%:

```
=FV(6%, 10, -100)
```

returns **1,318.08**. The payment is entered as a negative number (money out), so the result comes back positive (money in).

## One amount, no payments

To compound a single deposit, set `pmt` to 0 and use `pv`:

```
=FV(6%, 10, 0, -1000)
```

returns **1,790.85**, the same as `=1000*(1+6%)^10`.

## The optional arguments

- `pv` is an amount already in the account at time zero.
- `type` is 0 for end-of-period payments (the default) and 1 for start-of-period payments.

## Keep the rate and the periods in step

Monthly payments need a monthly rate and the number of months. For 10 years of monthly deposits at a 6% annual rate, use `6%/12` and `120`.
