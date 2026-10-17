---
slug: if
title: IF
summary: Return one value when a condition holds and another when it does not.
skills: [if]
topics: [conditional-cash-flows]
---
## What it does

`IF` asks a yes-or-no question and gives back one of two answers.

```
=IF(logical_test, value_if_true, value_if_false)
```

## In a cash flow model

The usual job is switching a cash flow on or off. If payments start in year 3, the cash flow for a row is:

```
=IF(A5>=$B$2, $B$3, 0)
```

where A5 is the period, B2 the start year and B3 the payment. Anchor the inputs with `$` so the formula fills down without drifting.

## A worked example

With B2 = 3 and B3 = 100, rows for periods 1 and 2 return 0 and every later row returns 100. Change B2 to 5 and the cash flows move with it.

## Two conditions

A window of years needs `AND` inside the test: `=IF(AND(A5>=$B$2, A5<=$B$4), $B$3, 0)`. The Flags video shows a shorter way to do the same thing by multiplying by 1s and 0s.
