---
slug: pv
title: PV
summary: The present value of a level stream of payments, or of one future amount.
skills: [pv]
topics: [present-value, annuity, time-value-of-money]
---
## What it does

`PV` answers one question: what is a stream of equal payments worth today? Give it the rate per period, the number of periods and the payment, and it discounts every payment back to time zero and adds them up.

```
=PV(rate, nper, pmt, [fv], [type])
```

## A worked example

Five annual payments of $100 at 5%:

```
=PV(5%, 5, 100)
```

returns **-432.95**.

## The sign

That minus sign is not a mistake. Excel treats the payments as money going out and the present value as money coming in, so the two carry opposite signs. If you want a positive answer, enter the payment as a negative number, or wrap the function: `=-PV(5%, 5, 100)`.

## The optional arguments

- `fv` is a single amount at the very end, on top of the payments. Use it for a bond's face value.
- `type` is 0 for payments at the end of each period (an ordinary annuity, the default) and 1 for payments at the start (an annuity due).

## When to use the formula instead

`PV` only works when every payment is the same. A growing annuity, a deferred annuity or an irregular stream needs the closed-form formula or a cash flow column. The Annuities exercises build both.
