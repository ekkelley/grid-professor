---
slug: sequence
title: SEQUENCE
summary: Generate a column of period numbers without typing them.
skills: [sequence]
topics: [time-value-of-money]
---
## What it does

`SEQUENCE` writes a list of numbers into the sheet in one formula. In a cash flow model it builds the period column: 1, 2, 3 and so on, as far as you need.

```
=SEQUENCE(rows, [columns], [start], [step])
```

Only `rows` is required. The others default to 1.

## A worked example

Ten annual periods, starting at 1:

```
=SEQUENCE(10)
```

fills ten cells going down. Change the 10 to a cell reference, say `=SEQUENCE(B3)`, and the column grows or shrinks when the number of periods changes.

## Starting at zero

For a model where the first cash flow happens today, start at 0:

```
=SEQUENCE(B3+1, 1, 0)
```

gives 0 through B3. Annuities Exercise 2 uses this to shift an annuity due one period earlier.

## It spills

`SEQUENCE` is a dynamic array function. It writes into the cells below the formula and shows `#SPILL!` if any of them is occupied. Clear the space below before you enter it, and never type over the spilled cells.
