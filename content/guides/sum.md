---
slug: sum
title: SUM
summary: Add a column of present values, or anything else, in one step.
skills: [sum]
topics: [time-value-of-money]
---
## What it does

`SUM` adds every number in the ranges you give it.

```
=SUM(number1, [number2], ...)
```

## In a cash flow model

Once you have a column of discounted cash flows, the present value of the whole stream is one formula:

```
=SUM(E5:E14)
```

That is the last line of every Discounting exercise.

## A few habits that save time

- Press `Alt` `=` with the cell below a column selected and Excel writes the `SUM` for you.
- `SUM` ignores text and empty cells, so a blank row at the bottom of the range does no harm.
- When the column is built with `SEQUENCE` and spills, sum the spill with the `#` operator: `=SUM(E5#)` grows with it.

## Related

`SUMPRODUCT` multiplies two columns pairwise and adds the results, which collapses a discount factor column and a cash flow column into one formula. Warm Up 13 uses it.
