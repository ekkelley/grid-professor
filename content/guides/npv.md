---
slug: npv
title: NPV
summary: The present value of an uneven series of cash flows at one discount rate.
skills: [npv]
topics: [present-value, discount-factor, time-value-of-money]
---
## What it does

`NPV` discounts a list of cash flows, which do not have to be equal, and adds them up. It is the function to reach for when `PV` cannot help because the payments differ.

```
=NPV(rate, value1, [value2], ...)
```

Point `value1` at the whole range of cash flows and Excel treats them as one per period, in order.

## The one thing everybody gets wrong

`NPV` assumes the **first** cash flow arrives at the end of period 1, not today. A project that costs money now and pays off later has to be entered as the up-front amount **plus** `NPV` of the later flows:

```
=B2 + NPV(8%, B3:B7)
```

where B2 holds the time-zero cash flow (negative if it is a cost) and B3:B7 hold years 1 to 5. Putting the time-zero amount inside `NPV` discounts it one period too many.

## A worked example

Cash flows of 100, 150 and 200 at the end of years 1, 2 and 3, discounted at 10%:

```
=NPV(10%, 100, 150, 200)
```

returns **365.14**. Check it by hand: 100/1.1 + 150/1.1² + 200/1.1³.

## The cash flow column does the same job

The Discounting exercises build this calculation as a column of discount factors multiplied by cash flows, then `SUM` it. That column shows every step; `NPV` hides them. Both give the same answer.
