---
slug: pmt
title: PMT
summary: The level payment that pays off a loan, or reaches a savings target.
skills: [pmt]
topics: [annuity, time-value-of-money]
---
## What it does

`PMT` solves the annuity formula for the payment. Give it the rate per period, the number of periods and the amount borrowed today, and it returns the equal payment that pays the loan off exactly.

```
=PMT(rate, nper, pv, [fv], [type])
```

## A worked example

A $200,000 mortgage over 30 years at a 6% annual rate, paid monthly:

```
=PMT(6%/12, 360, 200000)
```

returns **-1,199.10**. The loan amount is money in, so the payment comes out negative. Enter `-200000` if you want the payment shown as a positive number.

## Saving toward a target

Use `fv` for a goal and leave `pv` at 0. To have $50,000 in 8 years at 5%, saving once a year:

```
=PMT(5%, 8, 0, 50000)
```

returns **-5,236.09** per year.

## What it cannot do

`PMT` assumes a fixed rate and a fixed payment. A loan whose rate changes partway through, like the one in Warm Up 12, has to be built period by period in the sheet.
