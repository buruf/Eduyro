// tests/__mocks__/prisma.ts
// In-memory mock of the Prisma client for API integration tests.
//
// We don't want tests to need a real database. This mock implements only
// the methods our test cases actually call, returning fixture data that
// can be reset between tests with resetMockDb().

type Row = Record<string, any>;

interface MockTables {
  user: Row[];
  subject: Row[];
  level: Row[];
  placementAttempt: Row[];
  placementResult: Row[];
  shopPurchase: Row[];
  shopPurchaseFile: Row[];
  subscription: Row[];
  auditLog: Row[];
  notification: Row[];
  coppaConsentRequest: Row[];
}

const initialState = (): MockTables => ({
  user: [],
  subject: [
    { id: "s-math", slug: "MATH", name: "Mathematics" },
    { id: "s-reading", slug: "READING", name: "Reading" },
    { id: "s-writing", slug: "WRITING", name: "Writing" },
    { id: "s-science", slug: "SCIENCE", name: "Science" },
  ],
  level: [
    { id: "lvl-m1", subjectId: "s-math", code: "M1", name: "Early Counting", sortOrder: 1 },
    { id: "lvl-m5", subjectId: "s-math", code: "M5", name: "Multiplication Fluency", sortOrder: 5 },
    { id: "lvl-m18", subjectId: "s-math", code: "M18", name: "Calculus", sortOrder: 18 },
  ],
  placementAttempt: [],
  placementResult: [],
  shopPurchase: [],
  shopPurchaseFile: [],
  subscription: [],
  auditLog: [],
  notification: [],
  coppaConsentRequest: [],
});

let state: MockTables = initialState();

export function resetMockDb() {
  state = initialState();
}

export function getMockDbState(): MockTables {
  return state;
}

// ─────────────────────────────────────────────
// Mocked Prisma client
// ─────────────────────────────────────────────

function makeModel<K extends keyof MockTables>(table: K) {
  return {
    findUnique: jest.fn(async ({ where, include }: any) => {
      const rec = state[table].find((r) => matchesWhere(r, where));
      if (!rec) return null;
      return applyInclude(rec, include, table);
    }),
    findFirst: jest.fn(async ({ where, include }: any = {}) => {
      const rec = state[table].find((r) => matchesWhere(r, where ?? {}));
      if (!rec) return null;
      return applyInclude(rec, include, table);
    }),
    findMany: jest.fn(async ({ where, include, orderBy, take, skip }: any = {}) => {
      let recs = state[table].filter((r) => matchesWhere(r, where ?? {}));
      if (orderBy) recs = applyOrderBy(recs, orderBy);
      if (skip) recs = recs.slice(skip);
      if (take) recs = recs.slice(0, take);
      return recs.map((r) => applyInclude(r, include, table));
    }),
    create: jest.fn(async ({ data }: any) => {
      const newRec = {
        id: data.id ?? `${table}-${state[table].length + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      state[table].push(newRec);
      return newRec;
    }),
    createMany: jest.fn(async ({ data }: any) => {
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        state[table].push({
          id: d.id ?? `${table}-${state[table].length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...d,
        });
      }
      return { count: arr.length };
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const idx = state[table].findIndex((r) => matchesWhere(r, where));
      if (idx === -1) throw new Error("Record to update not found");
      state[table][idx] = { ...state[table][idx], ...applyUpdateData(state[table][idx], data), updatedAt: new Date() };
      return state[table][idx];
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      let count = 0;
      for (let i = 0; i < state[table].length; i++) {
        if (matchesWhere(state[table][i], where ?? {})) {
          state[table][i] = { ...state[table][i], ...applyUpdateData(state[table][i], data), updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    }),
    delete: jest.fn(async ({ where }: any) => {
      const idx = state[table].findIndex((r) => matchesWhere(r, where));
      if (idx === -1) throw new Error("Record to delete not found");
      const deleted = state[table][idx];
      state[table].splice(idx, 1);
      return deleted;
    }),
    deleteMany: jest.fn(async ({ where }: any = {}) => {
      const before = state[table].length;
      state[table] = state[table].filter((r) => !matchesWhere(r, where ?? {}));
      return { count: before - state[table].length };
    }),
    count: jest.fn(async ({ where }: any = {}) => {
      return state[table].filter((r) => matchesWhere(r, where ?? {})).length;
    }),
    groupBy: jest.fn(async ({ by, where }: any) => {
      const recs = state[table].filter((r) => matchesWhere(r, where ?? {}));
      const groups: Row = {};
      for (const r of recs) {
        const key = (by as string[]).map((k) => r[k]).join("|");
        if (!groups[key]) {
          groups[key] = (by as string[]).reduce((o, k) => ({ ...o, [k]: r[k] }), {} as Row);
          groups[key]._count = 0;
        }
        groups[key]._count++;
      }
      return Object.values(groups);
    }),
  };
}

// Resolve Prisma update operators ({ increment: n }, { decrement: n }, etc.)
// into final values, using the existing record's current values.
function applyUpdateData(currentRec: any, data: any): any {
  const out: any = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      if ("increment" in val) {
        out[key] = (currentRec[key] ?? 0) + val.increment;
      } else if ("decrement" in val) {
        out[key] = (currentRec[key] ?? 0) - val.decrement;
      } else if ("set" in val) {
        out[key] = val.set;
      } else if ("multiply" in val) {
        out[key] = (currentRec[key] ?? 1) * val.multiply;
      } else {
        // Plain object value (e.g. JSON column) — pass through
        out[key] = val;
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

function matchesWhere(rec: any, where: any): boolean {
  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val === undefined) continue;
    if (val && typeof val === "object" && "in" in val) {
      if (!val.in.includes(rec[key])) return false;
    } else if (val && typeof val === "object" && ("gt" in val || "gte" in val || "lt" in val || "lte" in val)) {
      const v = rec[key];
      if (val.gt !== undefined && !(v > val.gt)) return false;
      if (val.gte !== undefined && !(v >= val.gte)) return false;
      if (val.lt !== undefined && !(v < val.lt)) return false;
      if (val.lte !== undefined && !(v <= val.lte)) return false;
    } else if (rec[key] !== val) {
      return false;
    }
  }
  return true;
}

function applyOrderBy(recs: any[], orderBy: any): any[] {
  const keys = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...recs].sort((a, b) => {
    for (const k of keys) {
      const field = Object.keys(k)[0];
      const dir = k[field] === "desc" ? -1 : 1;
      if (a[field] < b[field]) return -1 * dir;
      if (a[field] > b[field]) return 1 * dir;
    }
    return 0;
  });
}

function applyInclude(rec: any, include: any, table: keyof MockTables): any {
  if (!include) return rec;
  const result = { ...rec };
  for (const key of Object.keys(include)) {
    if (!include[key]) continue;
    // Simple include logic — only handles a few known relations we use
    if (key === "files" && table === "shopPurchase") {
      result.files = state.shopPurchaseFile.filter((f) => f.purchaseId === rec.id);
    }
    if (key === "levels" && table === "subject") {
      const opts = typeof include[key] === "object" ? include[key] : {};
      let levels = state.level.filter((l) => l.subjectId === rec.id);
      if (opts.orderBy) levels = applyOrderBy(levels, opts.orderBy);
      result.levels = levels;
    }
    if (key === "user" && table === "subscription") {
      result.user = state.user.find((u) => u.id === rec.userId) ?? null;
    }
  }
  return result;
}

export const mockDb: any = {
  user: makeModel("user"),
  subject: makeModel("subject"),
  level: makeModel("level"),
  placementAttempt: makeModel("placementAttempt"),
  placementResult: makeModel("placementResult"),
  shopPurchase: makeModel("shopPurchase"),
  shopPurchaseFile: makeModel("shopPurchaseFile"),
  subscription: makeModel("subscription"),
  auditLog: makeModel("auditLog"),
  notification: makeModel("notification"),
  coppaConsentRequest: makeModel("coppaConsentRequest"),
  $transaction: jest.fn(async (operations: any) => {
    if (Array.isArray(operations)) {
      const results = [];
      for (const op of operations) results.push(await op);
      return results;
    } else if (typeof operations === "function") {
      return operations(mockDb);
    }
    return [];
  }),
};
