-- Course function guides, generated from content/guides/*.md by scripts/generate-guides-migration.py.

-- absolute-references
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('absolute-references', 'guide', 'Absolute references ($ and F4)', 'Pin a row, a column, or both, so a formula survives being filled down.', (select id from public.owners where slug = 'eric-kelley'), '## The problem

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

A column of identical answers usually means the period reference is anchored too. A column of zeros or `#VALUE!` usually means the rate is not anchored at all. Click a cell in the middle of the column and read the formula bar: each reference should move only if it is meant to.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'absolute-references'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'absolute-references');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'absolute-references'), (select id from public.skills where slug = 'absolute-references'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'absolute-references'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- and
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('and', 'guide', 'AND', 'True only when every condition inside it is true.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

`OR` is the opposite test: true when any condition holds. The two are easy to mix up in a window test. "Between 3 and 7" is an `AND`; `OR` would switch the payment on in almost every period.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'and'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'and');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'and'), (select id from public.skills where slug = 'and'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'and'), (select id from public.topics where slug = 'conditional-cash-flows'), 'declared');

-- fv
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('fv', 'guide', 'FV', 'The future value of a level stream of payments, or of one amount invested today.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

`FV` runs `PV` in the other direction. It compounds every payment forward to the end of the last period and adds them up.

```
=FV(rate, nper, pmt, [pv], [type])
```

## A worked example

Saving $100 at the end of each year for 10 years at 6%:

```
=FV(6%, 10, -100)
```

returns **1,318.08**. The payment is entered as a negative number (money out), so the result comes back positive (money in).

## One amount, no payments

To compound a single deposit, set `pmt` to 0 and use `pv`:

```
=FV(6%, 10, 0, -1000)
```

returns **1,790.85**, the same as `=1000*(1+6%)^10`.

## The optional arguments

- `pv` is an amount already in the account at time zero.
- `type` is 0 for end-of-period payments (the default) and 1 for start-of-period payments.

## Keep the rate and the periods in step

Monthly payments need a monthly rate and the number of months. For 10 years of monthly deposits at a 6% annual rate, use `6%/12` and `120`.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'fv'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'fv');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'fv'), (select id from public.skills where slug = 'fv'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'fv'), (select id from public.topics where slug = 'future-value'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'fv'), (select id from public.topics where slug = 'compounding'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'fv'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- if
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('if', 'guide', 'IF', 'Return one value when a condition holds and another when it does not.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

A window of years needs `AND` inside the test: `=IF(AND(A5>=$B$2, A5<=$B$4), $B$3, 0)`. The Flags video shows a shorter way to do the same thing by multiplying by 1s and 0s.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'if'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'if');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'if'), (select id from public.skills where slug = 'if'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'if'), (select id from public.topics where slug = 'conditional-cash-flows'), 'declared');

-- nper
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('nper', 'guide', 'NPER', 'How many periods it takes for payments to pay off a loan or reach a target.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

Payments and the present value need opposite signs, the same rule as `PV` and `RATE`. A positive payment and a positive loan make Excel think the balance grows forever, and you get `#NUM!`.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'nper'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'nper');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'nper'), (select id from public.skills where slug = 'nper'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'nper'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- npv
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('npv', 'guide', 'NPV', 'The present value of an uneven series of cash flows at one discount rate.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

The Discounting exercises build this calculation as a column of discount factors multiplied by cash flows, then `SUM` it. That column shows every step; `NPV` hides them. Both give the same answer.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'npv'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'npv');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'npv'), (select id from public.skills where slug = 'npv'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'npv'), (select id from public.topics where slug = 'present-value'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'npv'), (select id from public.topics where slug = 'discount-factor'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'npv'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- or
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('or', 'guide', 'OR', 'True when at least one condition inside it is true.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

With conditions `A5=1` and `A5=5`, only periods 1 and 5 return `TRUE`.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'or'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'or');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'or'), (select id from public.skills where slug = 'or'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'or'), (select id from public.topics where slug = 'conditional-cash-flows'), 'declared');

-- pmt
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('pmt', 'guide', 'PMT', 'The level payment that pays off a loan, or reaches a savings target.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

`PMT` assumes a fixed rate and a fixed payment. A loan whose rate changes partway through, like the one in Warm Up 12, has to be built period by period in the sheet.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'pmt'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'pmt');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pmt'), (select id from public.skills where slug = 'pmt'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pmt'), (select id from public.topics where slug = 'annuity'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pmt'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- pv
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('pv', 'guide', 'PV', 'The present value of a level stream of payments, or of one future amount.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

- `fv` is a single amount at the very end, on top of the payments. Use it for a bond''s face value.
- `type` is 0 for payments at the end of each period (an ordinary annuity, the default) and 1 for payments at the start (an annuity due).

## When to use the formula instead

`PV` only works when every payment is the same. A growing annuity, a deferred annuity or an irregular stream needs the closed-form formula or a cash flow column. The Annuities exercises build both.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'pv'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'pv');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pv'), (select id from public.skills where slug = 'pv'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pv'), (select id from public.topics where slug = 'present-value'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pv'), (select id from public.topics where slug = 'annuity'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'pv'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- rate
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('rate', 'guide', 'RATE', 'The interest rate per period implied by a payment, a present value and a number of periods.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

`RATE` is the one function in this group that Excel cannot solve directly. There is no closed-form formula for the rate, so Excel searches for it by trial and error until the present value of the payments matches the amount you gave it.

```
=RATE(nper, pmt, pv, [fv], [type], [guess])
```

## A worked example

You borrow $10,000 and repay $2,500 at the end of each year for 5 years:

```
=RATE(5, -2500, 10000)
```

returns **7.93%**. The amount borrowed and the payments must have opposite signs, or Excel has nothing to solve.

## It returns the rate per period

Monthly payments give a monthly rate. Multiply by 12 for the annual rate most lenders quote (the APR), or use `=(1+r)^12-1` for the effective annual rate.

## Bonds

For a bond, `pv` is the price (negative, because you pay it), `pmt` is the coupon and `fv` is the face value. The result is the yield to maturity per period. The bond exercises in the other finance packs use exactly this setup.

## When it fails

If Excel''s search does not converge you get `#NUM!`. Supply a `guess` close to the answer, such as 0.05, and it usually resolves.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'rate'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'rate');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'rate'), (select id from public.skills where slug = 'rate'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'rate'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- sequence
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('sequence', 'guide', 'SEQUENCE', 'Generate a column of period numbers without typing them.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

`SEQUENCE` is a dynamic array function. It writes into the cells below the formula and shows `#SPILL!` if any of them is occupied. Clear the space below before you enter it, and never type over the spilled cells.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'sequence'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'sequence');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'sequence'), (select id from public.skills where slug = 'sequence'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'sequence'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');

-- sum
insert into public.items (slug, kind, title, summary, owner_id, body_md, origin, source) values ('sum', 'guide', 'SUM', 'Add a column of present values, or anything else, in one step.', (select id from public.owners where slug = 'eric-kelley'), '## What it does

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

`SUMPRODUCT` multiplies two columns pairwise and adds the results, which collapses a discount factor column and a cash flow column into one formula. Warm Up 13 uses it.', 'primitive', 'hand-authored draft, 2026-10-17; review before release') on conflict (kind, slug) do update set title = excluded.title, summary = excluded.summary, body_md = excluded.body_md, source = excluded.source;
delete from public.item_skills where item_id = (select id from public.items where kind = 'guide' and slug = 'sum'); delete from public.item_topics where item_id = (select id from public.items where kind = 'guide' and slug = 'sum');
insert into public.item_skills (item_id, skill_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'sum'), (select id from public.skills where slug = 'sum'), 'declared');
insert into public.item_topics (item_id, topic_id, basis) values ((select id from public.items where kind = 'guide' and slug = 'sum'), (select id from public.topics where slug = 'time-value-of-money'), 'declared');


-- The template course offers every course guide in its library, in teaching order.
delete from public.course_library where section = 'function_guide';
insert into public.course_library (course_id, item_id, section, position)
select c.id, i.id, 'function_guide', g.position
from public.courses c
join (values ('absolute-references', 1), ('sequence', 2), ('sum', 3), ('if', 4), ('and', 5), ('or', 6),
             ('pv', 7), ('fv', 8), ('pmt', 9), ('rate', 10), ('nper', 11), ('npv', 12)) as g (slug, position) on true
join public.items i on i.kind = 'guide' and i.slug = g.slug
where c.slug = 'excel-for-finance-tvm';
