---
slug: and
title: AND
summary: True only when every condition inside it is true.
skills: [and]
topics: [conditional-cash-flows]
---
## What it does

`AND` takes several conditions and returns `TRUE` only if all of them hold.

```
=AND(logical1, [logical2], ...)
```

## In a cash flow model

It defines a window. A payment that runs from year 3 to year 7 is on when the period is at least 3 **and** at most 7:

```
=AND(A5>=$B$2, A5<=$B$4)
```

Wrap that in `IF` to turn it into a cash flow, or multiply the result by 1 to get a flag of 1 or 0 you can multiply by the payment.

## A worked example

With a start of 3 and an end of 7, periods 1, 2, 8 and 9 return `FALSE` and periods 3 through 7 return `TRUE`.

## Related

`OR` is the opposite test: true when any condition holds. The two are easy to mix up in a window test. "Between 3 and 7" is an `AND`; `OR` would switch the payment on in almost every period.
