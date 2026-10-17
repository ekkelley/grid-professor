---
slug: or
title: OR
summary: True when at least one condition inside it is true.
skills: [or]
topics: [conditional-cash-flows]
---
## What it does

`OR` takes several conditions and returns `TRUE` if any one of them holds.

```
=OR(logical1, [logical2], ...)
```

## When it fits

`OR` is for cash flows that happen in more than one situation: a fee charged in the first year **or** in any year the balance is late, a bonus paid in a good year **or** a very good year.

```
=IF(OR(A5=1, C5="late"), $B$3, 0)
```

## The trap in a window test

Students often write `=OR(A5>=start, A5<=end)` hoping for "between start and end." That returns `TRUE` for almost every period, because every period is either after the start or before the end. A window needs `AND`. The If And Or video walks through exactly this mistake.

## A worked example

With conditions `A5=1` and `A5=5`, only periods 1 and 5 return `TRUE`.
