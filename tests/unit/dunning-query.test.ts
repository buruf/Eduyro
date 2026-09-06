// tests/unit/dunning-query.test.ts
// The dunning cron failed on every run from Jun 16 to Sep 4 2026 because its
// opening findMany carried `take: 1` inside a one-to-one `school` include,
// hidden from tsc by `as any`. Prisma rejected the query before reading a row,
// so no past-due customer was contacted for nearly three months.
//
// The mock database accepts any shape, and Prisma 5 opens a connection before
// it validates arguments, so the query cannot be validated at runtime without
// a live database. The guard is therefore the type checker: PAST_DUE_QUERY is
// declared with `satisfies Prisma.SubscriptionFindManyArgs` and never cast,
// and this file (typechecked by `tsc --noEmit`) pins that the broken shape is
// a compile error. Remove the `as any` escape hatch and the bug cannot return.
import type { Prisma } from "@prisma/client";
import { PAST_DUE_QUERY, nextDunningStage, shouldDowngrade, DUNNING_STAGES } from "@/lib/dunning";

const brokenShape: Prisma.SubscriptionFindManyArgs = {
  where: { status: "PAST_DUE" },
  // @ts-expect-error `take` is not valid inside a one-to-one include — this is the exact shape that broke the cron
  include: { user: true, school: { include: { teachers: true }, take: 1 } },
};
void brokenShape;

describe("dunning opening query", () => {
  it("is a plain, uncast Prisma query that includes only the user", () => {
    expect(Object.keys(PAST_DUE_QUERY.include)).toEqual(["user"]);
    expect(JSON.stringify(PAST_DUE_QUERY)).not.toContain("take");
    expect(PAST_DUE_QUERY.where.status).toBe("PAST_DUE");
  });
});

describe("catch-up after a long outage", () => {
  const none = new Set<string>();
  it("a customer 80 days past due who was never contacted gets the final warning, not a silent downgrade", () => {
    expect(nextDunningStage(80, none)?.label).toBe("final_warning");
    expect(shouldDowngrade(80, none)).toBe(false);
  });
  it("downgrades only once the final warning has gone out", () => {
    const warned = new Set(DUNNING_STAGES.map((s) => s.label));
    expect(nextDunningStage(80, warned)).toBeNull();
    expect(shouldDowngrade(80, warned)).toBe(true);
    expect(shouldDowngrade(7, warned)).toBe(false);
  });
  it("normal cadence: day 1, 3, 7 each fire once", () => {
    const sent = new Set<string>();
    expect(nextDunningStage(0, sent)).toBeNull();
    expect(nextDunningStage(1, sent)?.label).toBe("soft_reminder"); sent.add("soft_reminder");
    expect(nextDunningStage(2, sent)).toBeNull();
    expect(nextDunningStage(3, sent)?.label).toBe("stronger_nudge"); sent.add("stronger_nudge");
    expect(nextDunningStage(7, sent)?.label).toBe("final_warning"); sent.add("final_warning");
    expect(nextDunningStage(8, sent)).toBeNull();
  });
});
