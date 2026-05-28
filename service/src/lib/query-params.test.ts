import assert from "node:assert/strict";
import test from "node:test";

import { parseStringListParam } from "@/lib/query-params";

test("parseStringListParam accepts repeated and comma separated values", () => {
  const params = new URLSearchParams("category=war,finance&category=tech&category=");

  assert.deepEqual(parseStringListParam(params, "category"), ["war", "finance", "tech"]);
});

test("parseStringListParam omits empty values", () => {
  const params = new URLSearchParams("tag=,%20,AI");

  assert.deepEqual(parseStringListParam(params, "tag"), ["AI"]);
  assert.equal(parseStringListParam(params, "missing"), undefined);
});
