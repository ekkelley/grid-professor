---
slug: nper
title: NPER
summary: How many periods it takes for payments to pay off a loan or reach a target.
skills: [nper]
topics: [time-value-of-money]
---
## What it does

`NPER` solves the annuity formula for time. Give it the rate per period, the payment and the present value, and it tells you how many periods the payments run.

```
=NPER(rate, pmt, pv, [fv], [type])
```

## A worked example

You owe $5,000 at 1% per month and pay $200 a month:

```
=NPER(1%, -200, 5000)
```

returns **28.9** months. The answer is rarely a whole number. Round up to find the month the last payment lands in, or treat the fraction as a partial final payment.

## Reaching a goal

Leave `pv` at 0 and give `fv` the target. Saving $300 a month at 0.5% per month until you have $20,000:

```
=NPER(0.5%, -300, 0, 20000)
```

returns **57.7** months.

## Signs

Payments and the present value need opposite signs, the same rule as `PV` and `RATE`. A positive payment and a positive loan make Excel think the balance grows forever, and you get `#NUM!`.
