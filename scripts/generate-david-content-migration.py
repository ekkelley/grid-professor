"""Generate the David-content migration from his 2026-10-15 prototype inventory (values transcribed by hand)."""

def q(v):
    if v is None:
        return "null"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"

NE = "(select id from public.owners where slug = 'not-established')"
ERIC = "(select id from public.owners where slug = 'eric-kelley')"
SRC = "gridprof add-in, per GRIDPROF-PROTOTYPE-INVENTORY-2026-10-15"

def item(kind, slug):
    return f"(select id from public.items where kind = {q(kind)} and slug = {q(slug)})"

def skill(slug):
    return f"(select id from public.skills where slug = {q(slug)})"

def topic(slug):
    return f"(select id from public.topics where slug = {q(slug)})"

out = []
w = out.append
w("-- David's add-in content for the prototype, from GRIDPROF-PROTOTYPE-INVENTORY-2026-10-15.md.")
w("-- Discounting is live on his side as a timed pack (assignment 221, units 216 to 220).")
w("-- Annuities is not converted yet, so it has no workbooks here. Guides, practice files and games")
w("-- go in the template course's library. Tag bases follow his notes: observed = in the graded")
w("-- answer formulas; declared = his challenge specs; claimed = teaching guides or videos.")
w("")
w("insert into public.owners (slug, name, type) values ('eric-kelley', 'Eric Kelley', 'person');")
for s, n in [("nper", "NPER"), ("pmt", "PMT"), ("sumproduct", "SUMPRODUCT"), ("index", "INDEX")]:
    w(f"insert into public.skills (slug, name, type) values ({q(s)}, {q(n)}, 'function');")
w("")

def workbook(slug, title, summary, note, builds, owner=NE):
    w(f"insert into public.items (slug, kind, title, summary, delivery_note, owner_id, origin, source) values "
      f"({q(slug)}, 'workbook', {q(title)}, {q(summary)}, {q(note)}, {owner}, 'primitive', {q(SRC)});")
    for variant, ref in builds:
        w(f"insert into public.workbook_builds (item_id, variant, addin_ref) values ({item('workbook', slug)}, {q(variant)}, {q(ref)});")

def tag_skills(kind, slug, pairs):
    for s, basis in pairs:
        w(f"insert into public.item_skills (item_id, skill_id, basis) values ({item(kind, slug)}, {skill(s)}, {q(basis)});")

def tag_topics(kind, slug, topics):
    for t in topics:
        w(f"insert into public.item_topics (item_id, topic_id, basis) values ({item(kind, slug)}, {topic(t)}, 'claimed');")

# --- Discounting: the timed pack and its five one-tab members ---------------------------------
workbook(
    "discounting-exercises",
    "Discounting Exercises: timed run",
    "All five discounting exercises in one sitting. The add-in serves one tab at a time on one clock, with fresh numbers each run.",
    "5 tabs, one clock. Full credit at 175 seconds or less; unlimited practice runs.",
    [("single", "assignment 221, build 323")],
)
members = [
    (216, 232, "Present value of one cash flow in one year.", [("absolute-references", "observed")], ["present-value", "discount-factor"]),
    (217, 233, "Present value of a fixed cash flow paid annually for 7 years.", [("sum", "observed"), ("sequence", "claimed"), ("absolute-references", "observed")], ["present-value", "discount-factor"]),
    (218, 234, "Future value of one cash flow in one year.", [("absolute-references", "observed")], ["future-value", "compounding"]),
    (219, 235, "Future value of a fixed cash flow paid annually for 10 years.", [("sum", "observed"), ("sequence", "claimed"), ("absolute-references", "observed")], ["future-value", "compounding"]),
    (220, 236, "Future value of a fixed cash flow paid monthly for 10 years.", [("sum", "observed"), ("sequence", "claimed"), ("absolute-references", "observed")], ["future-value", "compounding-frequency"]),
]
for n, (unit, build, summary, skills, topics) in enumerate(members, start=1):
    slug = f"discounting-exercise-{n}"
    workbook(slug, f"Discounting Exercise {n}", summary,
             f"Tab {n} of 5 in the Discounting Exercises timed run. One graded answer.",
             [("single", f"assignment {unit}, build {build}")])
    w(f"insert into public.workbook_members (sequence_id, member_id, position) values ({item('workbook', 'discounting-exercises')}, {item('workbook', slug)}, {n});")
    tag_skills("workbook", slug, skills)
    tag_topics("workbook", slug, ["time-value-of-money"] + topics)
tag_topics("workbook", "discounting-exercises", ["time-value-of-money", "present-value", "future-value"])
w("")

# Each Discounting exercise module gets its workbook in slot 2.
for n in range(1, 6):
    m = f"discounting-exercise-{n}"
    w(f"insert into public.module_slots (module_id, position) values ((select id from public.modules where slug = {q(m)}), 2);")
    w(f"insert into public.slot_items (slot_id, item_id, position) values ((select s.id from public.module_slots s join public.modules mo on mo.id = s.module_id where mo.slug = {q(m)} and s.position = 2), {item('workbook', m)}, 1);")

# A module for the timed run, last in the Discounting unit of the template.
w("insert into public.modules (slug, title, summary) values ('discounting-exercises-timed-run', 'Discounting Exercises: timed run', 'All five exercises in one timed sitting, graded live by the add-in.');")
w("insert into public.module_slots (module_id, position) values ((select id from public.modules where slug = 'discounting-exercises-timed-run'), 1);")
w(f"insert into public.slot_items (slot_id, item_id, position) values ((select s.id from public.module_slots s join public.modules mo on mo.id = s.module_id where mo.slug = 'discounting-exercises-timed-run' and s.position = 1), {item('workbook', 'discounting-exercises')}, 1);")
w("insert into public.course_modules (unit_id, module_id, position) values ("
  "(select u.id from public.course_units u join public.courses c on c.id = u.course_id where c.slug = 'excel-for-finance-tvm' and u.slug = 'discounting'), "
  "(select id from public.modules where slug = 'discounting-exercises-timed-run'), "
  "(select coalesce(max(cm.position), 0) + 1 from public.course_modules cm join public.course_units u on u.id = cm.unit_id join public.courses c on c.id = u.course_id where c.slug = 'excel-for-finance-tvm' and u.slug = 'discounting'));")
w("")

# --- Function guides (public, generated from David's challenge specs) -------------------------
guides = [
    ("absolute-references", "Absolute references ($ and F4)", "Pin a row, a column, or both, so a formula survives being filled.", "https://app.gridprof.com/assets/guide-sprint-anchors.html#level-1", "absolute-references"),
    ("if", "IF", "Do one thing when a condition holds and another when it does not.", "https://app.gridprof.com/assets/guide-sprint-if-logic.html#level-1", "if"),
    ("and", "AND", "True only when every condition is true.", "https://app.gridprof.com/assets/guide-sprint-if-logic.html#level-2", "and"),
    ("sequence", "SEQUENCE", "Manufacture a list of numbers without typing them.", "https://app.gridprof.com/assets/guide-datatable-sequence.html#level-1", "sequence"),
    ("sum", "SUM", "Add it up.", "https://app.gridprof.com/assets/guide-sumifs.html#level-1", "sum"),
]
for slug, title, summary, url, sk in guides:
    w(f"insert into public.items (slug, kind, title, summary, owner_id, stored_at, origin, source) values "
      f"({q(slug)}, 'guide', {q(title)}, {q(summary)}, {NE}, {q(url)}, 'primitive', 'gridprof skill guide generator (GUIDE_SKILLS)');")
    tag_skills("guide", slug, [(sk, "declared")])
w("")

# --- Practice files ----------------------------------------------------------------------------
practice = [
    ("warm-up-8-valuing-future-cash-flows", "Warm Up 8: Valuing Future Cash Flows", "Discount factors applied to a series of future cash flows.", 115, 72, [("sequence", "claimed")], ["present-value", "discount-factor"]),
    ("compound-annuity-1", "Compound Annuity 1", "Present value of an annuity with PV and with a cash flow column.", 28, 9, [("pv", "claimed"), ("sequence", "claimed")], ["annuity", "present-value"]),
    ("compound-annuity-2", "Compound Annuity 2", "Growing annuities.", 29, 23, [("sequence", "claimed")], ["growing-annuity"]),
    ("warm-up-10-solving-for-t", "Warm Up 10: Solving for t", "How long until an investment reaches a target.", 117, 74, [("nper", "claimed"), ("pv", "claimed")], ["present-value"]),
    ("warm-up-11-changing-discount-rates", "Warm Up 11: Valuation with Changing Discount Rates", "Discount factors when the rate changes over time.", 118, 75, [], ["discount-factor"]),
    ("warm-up-12-changing-loan-interest-rates", "Warm Up 12: Changing Loan Interest Rates", "Loan payments when the rate changes.", 119, 76, [("pmt", "claimed")], ["annuity"]),
    ("warm-up-13-loan-npv", "Warm Up 13: Loan NPV", "Net present value of a loan.", 120, 77, [("pmt", "claimed"), ("sumproduct", "claimed")], ["present-value"]),
]
for slug, title, summary, aid, build, skills, topics in practice:
    workbook(slug, title, summary, "1 tab, 3 questions, about 5 to 10 minutes. Untimed.", [("single", f"assignment {aid}, build {build}")])
    tag_skills("workbook", slug, skills)
    tag_topics("workbook", slug, ["time-value-of-money"] + topics)

workbook("sprint-anchors", "Sprint: The Dollar Sign, and Why Copying Breaks a Formula",
         "Pinning rows and columns so formulas survive being filled.",
         "4 levels, about 15 minutes. Practice and timed versions.",
         [("training", "assignment 85"), ("competition", "assignment 86")])
tag_skills("workbook", "sprint-anchors", [("absolute-references", "declared"), ("index", "declared")])
workbook("sprint-if-logic", "Sprint: IF, and the Order You Ask the Questions In",
         "Conditions with IF and AND. There is no OR level yet.",
         "4 levels, about 30 minutes. Practice and timed versions.",
         [("training", "assignment 91"), ("competition", "assignment 92")])
tag_skills("workbook", "sprint-if-logic", [("if", "declared"), ("and", "declared")])
tag_topics("workbook", "sprint-if-logic", ["conditional-cash-flows"])
w("")

# --- Games ---------------------------------------------------------------------------------------
workbook("tvm-case-finc306", "TVM Case", "Eric's time value of money case from FINC 306, in MECC format.",
         "30 minutes. 7 levels and 5 bonuses (145 questions). Solo or teams.", [("single", "assignment 77")], owner=ERIC)
tag_topics("workbook", "tvm-case-finc306", ["time-value-of-money"])
workbook("bonds-warm-up-coupon-payments", "Bonds Warm-up: Coupon Payments", "A one-level warm-up before the bonds case.",
         "1 level, 20 questions. A few minutes.", [("single", "assignment 195")])
tag_topics("workbook", "bonds-warm-up-coupon-payments", ["time-value-of-money"])
workbook("bonds-case-finc402", "Bonds Case", "Eric's bonds case from FINC 402, in MECC format.",
         "30 minutes. 7 levels and 5 bonuses (145 questions). Solo or teams.", [("single", "assignment 192 (team copy 193)")], owner=ERIC)
tag_topics("workbook", "bonds-case-finc402", ["time-value-of-money", "present-value"])
workbook("datatable-sequence", "Data Tables: Twenty Games for the Price of One", "Data tables and SEQUENCE, built up over four levels.",
         "4 levels, about 40 minutes. Practice and timed versions.", [("training", "assignment 83"), ("competition", "assignment 84")])
tag_skills("workbook", "datatable-sequence", [("sequence", "declared"), ("sum", "declared"), ("index", "declared")])
w("")

# --- Template course library ---------------------------------------------------------------------
course = "(select id from public.courses where slug = 'excel-for-finance-tvm')"
for pos, (slug, *_rest) in enumerate(guides, start=1):
    w(f"insert into public.course_library (course_id, item_id, section, position) values ({course}, {item('guide', slug)}, 'function_guide', {pos});")
practice_order = [p[0] for p in practice] + ["sprint-anchors", "sprint-if-logic"]
for pos, slug in enumerate(practice_order, start=1):
    w(f"insert into public.course_library (course_id, item_id, section, position) values ({course}, {item('workbook', slug)}, 'practice', {pos});")
for pos, slug in enumerate(["discounting-exercises", "bonds-warm-up-coupon-payments", "tvm-case-finc306", "bonds-case-finc402", "datatable-sequence"], start=1):
    w(f"insert into public.course_library (course_id, item_id, section, position) values ({course}, {item('workbook', slug)}, 'game', {pos});")

print("\n".join(out))
