---
slug: absolute-references
title: Absolute references ($ and F4)
summary: Pin a row, a column, or both, so a formula survives being filled down.
skills: [absolute-references]
topics: [time-value-of-money]
---
## The problem

A reference like `B2` means "the cell up and to the left of me," not "cell B2." Copy a formula down one row and Excel moves the reference down one row with it. For a period number that is exactly what you want. For a discount rate it is a disaster: the formula points at an empty cell and quietly returns the wrong number, often with no error.

## The fix

Dollar signs pin a reference:

- `$B$2` never moves.
- `B$2` keeps the row; the column can move.
- `$B2` keeps the column; the row can move.

Press `F4` while editing a reference to cycle through the four forms. Tap it as soon as you click the input cell and you never have to think about it again.

## A worked example

Discount factors for periods 1 to 10, with the rate in B2 and the period in column A:

```
=1/(1+$B$2)^A5
```

Fill down and only `A5` changes. Leave off the dollars and the second row reads `B3`, which is not the rate.

## When something still looks wrong

A column of identical answers usually means the period reference is anchored too. A column of zeros or `#VALUE!` usually means the rate is not anchored at all. Click a cell in the middle of the column and read the formula bar: each reference should move only if it is meant to.
