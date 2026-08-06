// One-off check: exercise the same INCR+PEXPIRE fixed-window logic as
// src/lib/api/helpers.ts rateLimit() against the real Upstash database.
import { Redis } from "@upstash/redis";
import { readFileSync } from "fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"\r]*)"?/);
  if (m) process.env[m[1]] ??= m[2];
}

const redis = Redis.fromEnv();
const key = `rl:test:${Date.now()}`;
const limit = 3;

const results = [];
for (let i = 0; i < 5; i++) {
  const count = await redis.incr(key);
  if (count === 1) await redis.pexpire(key, 10_000);
  results.push(count <= limit ? "allowed" : "BLOCKED");
}
const ttl = await redis.pttl(key);
await redis.del(key);

console.log("attempts:", results.join(", "));
console.log("ttl was set:", ttl > 0 && ttl <= 10_000 ? "yes" : `NO (${ttl})`);
console.log(
  results.slice(0, 3).every((r) => r === "allowed") &&
    results.slice(3).every((r) => r === "BLOCKED")
    ? "PASS: limit of 3 enforced across shared Redis"
    : "FAIL"
);
