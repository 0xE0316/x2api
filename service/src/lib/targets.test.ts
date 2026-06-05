import assert from "node:assert/strict";
import test from "node:test";

import { formatTarget, parseTarget, parseTargets } from "@/lib/targets";

test("parseTarget understands user targets", () => {
  assert.deepEqual(parseTarget("OpenAI"), {
    source: "twitter",
    kind: "user",
    value: "OpenAI",
    normalizedValue: "openai",
    tags: [],
  });
});

test("parseTarget understands keyword targets", () => {
  assert.deepEqual(parseTarget("search:AI Safety"), {
    source: "twitter",
    kind: "keyword",
    value: "AI Safety",
    normalizedValue: "ai safety",
    tags: [],
  });
});

test("parseTarget understands YouTube channel targets", () => {
  assert.deepEqual(parseTarget("youtube:UCE_M8A5yxnLfW0KghEeajjw"), {
    source: "youtube",
    kind: "channel",
    value: "UCE_M8A5yxnLfW0KghEeajjw",
    normalizedValue: "uce_m8a5yxnlfw0kgheeajjw",
    tags: [],
  });
});

test("parseTarget understands YouTube feed URLs", () => {
  assert.deepEqual(parseTarget("youtube:https://www.youtube.com/feeds/videos.xml?channel_id=UC1QxOK5YpyAyFCN_xiPfgHw"), {
    source: "youtube",
    kind: "channel",
    value: "UC1QxOK5YpyAyFCN_xiPfgHw",
    normalizedValue: "uc1qxok5ypyayfcn_xipfghw",
    tags: [],
  });
});

test("parseTarget understands plain YouTube feed URLs", () => {
  assert.deepEqual(parseTarget("https://www.youtube.com/feeds/videos.xml?user=CaspianReport"), {
    source: "youtube",
    kind: "channel",
    value: "https://www.youtube.com/feeds/videos.xml?user=CaspianReport",
    normalizedValue: "https://www.youtube.com/feeds/videos.xml?user=caspianreport",
    tags: [],
  });
});

test("parseTarget understands Heiliao site targets", () => {
  assert.deepEqual(parseTarget("heiliao:https://among.uvsoskqus.cc/"), {
    source: "heiliao",
    kind: "site",
    value: "https://among.uvsoskqus.cc",
    normalizedValue: "among.uvsoskqus.cc",
    tags: [],
  });
});

test("parseTarget understands 91cg site targets", () => {
  assert.deepEqual(parseTarget("cg91:https://www.91cg1.com/"), {
    source: "cg91",
    kind: "site",
    value: "https://www.91cg1.com",
    normalizedValue: "www.91cg1.com",
    tags: [],
  });
});

test("parseTarget understands 51baoliao site targets", () => {
  assert.deepEqual(parseTarget("baoliao51:https://www.51baoliao01.com/"), {
    source: "baoliao51",
    kind: "site",
    value: "https://www.51baoliao01.com",
    normalizedValue: "www.51baoliao01.com",
    tags: [],
  });
});

test("parseTarget understands Douyin site targets", () => {
  assert.deepEqual(parseTarget("douyin:https://xygrfrfb3g.b2h7y8w.com/"), {
    source: "douyin",
    kind: "site",
    value: "https://xygrfrfb3g.b2h7y8w.com",
    normalizedValue: "xygrfrfb3g.b2h7y8w.com",
    tags: [],
  });
});

test("parseTargets deduplicates normalized values", () => {
  const targets = parseTargets(["OpenAI", "openai", "search:AI", "search:ai", "youtube:UCE_M8A5yxnLfW0KghEeajjw"]);
  assert.equal(targets.length, 3);
  assert.equal(formatTarget(targets[0]), "OpenAI");
  assert.equal(formatTarget(targets[1]), "search:AI");
  assert.equal(formatTarget(targets[2]), "youtube:UCE_M8A5yxnLfW0KghEeajjw");
});

test("parseTargets accepts object targets with category and free tags", () => {
  const targets = parseTargets([
    {
      target: "search:AI coding",
      category: "tech",
      tags: ["AI", " 编程 ", "ai", "", "Claude Code"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      kind: "keyword",
      source: "twitter",
      value: "AI coding",
      normalizedValue: "ai coding",
      category: "tech",
      tags: ["AI", "编程", "Claude Code"],
    },
  ]);
});

test("parseTargets accepts explicit YouTube object targets", () => {
  const targets = parseTargets([
    {
      source: "youtube",
      kind: "channel",
      target: "https://www.youtube.com/channel/UCE_M8A5yxnLfW0KghEeajjw",
      category: "tech",
      tags: ["YouTube"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      source: "youtube",
      kind: "channel",
      value: "UCE_M8A5yxnLfW0KghEeajjw",
      normalizedValue: "uce_m8a5yxnlfw0kgheeajjw",
      category: "tech",
      tags: ["YouTube"],
    },
  ]);
});

test("parseTargets normalizes explicit source aliases", () => {
  assert.deepEqual(parseTargets([{ source: "x", kind: "user", target: "OpenAI", category: "tech" }]), [
    {
      source: "twitter",
      kind: "user",
      value: "OpenAI",
      normalizedValue: "openai",
      category: "tech",
      tags: [],
    },
  ]);

  assert.deepEqual(parseTargets([{ source: "yt", kind: "channel", target: "UCE_M8A5yxnLfW0KghEeajjw", category: "tech" }]), [
    {
      source: "youtube",
      kind: "channel",
      value: "UCE_M8A5yxnLfW0KghEeajjw",
      normalizedValue: "uce_m8a5yxnlfw0kgheeajjw",
      category: "tech",
      tags: [],
    },
  ]);

  assert.deepEqual(parseTargets([{ source: "91", kind: "site", target: "www.91cg1.com", category: "adult" }]), [
    {
      source: "cg91",
      kind: "site",
      value: "https://www.91cg1.com",
      normalizedValue: "www.91cg1.com",
      category: "adult",
      tags: [],
    },
  ]);

  assert.deepEqual(parseTargets([{ source: "51", kind: "site", target: "www.51baoliao01.com", category: "adult" }]), [
    {
      source: "baoliao51",
      kind: "site",
      value: "https://www.51baoliao01.com",
      normalizedValue: "www.51baoliao01.com",
      category: "adult",
      tags: [],
    },
  ]);
});

test("parseTargets accepts explicit YouTube feed URL object targets", () => {
  const targets = parseTargets([
    {
      source: "youtube",
      kind: "channel",
      target: "https://www.youtube.com/feeds/videos.xml?channel_id=UC1QxOK5YpyAyFCN_xiPfgHw",
      category: "tech",
      tags: ["YouTube"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      source: "youtube",
      kind: "channel",
      value: "UC1QxOK5YpyAyFCN_xiPfgHw",
      normalizedValue: "uc1qxok5ypyayfcn_xipfghw",
      category: "tech",
      tags: ["YouTube"],
    },
  ]);
});

test("parseTargets accepts explicit Heiliao object targets", () => {
  const targets = parseTargets([
    {
      source: "heiliao",
      kind: "site",
      target: "among.uvsoskqus.cc",
      category: "adult",
      tags: ["黑料", "视频"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      source: "heiliao",
      kind: "site",
      value: "https://among.uvsoskqus.cc",
      normalizedValue: "among.uvsoskqus.cc",
      category: "adult",
      tags: ["黑料", "视频"],
    },
  ]);
});

test("parseTargets accepts explicit 91cg object targets", () => {
  const targets = parseTargets([
    {
      source: "cg91",
      kind: "site",
      target: "www.91cg1.com",
      category: "adult",
      tags: ["91吃瓜", "视频"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      source: "cg91",
      kind: "site",
      value: "https://www.91cg1.com",
      normalizedValue: "www.91cg1.com",
      category: "adult",
      tags: ["91吃瓜", "视频"],
    },
  ]);
});

test("parseTargets accepts explicit 51baoliao object targets", () => {
  const targets = parseTargets([
    {
      source: "baoliao51",
      kind: "site",
      target: "www.51baoliao01.com",
      category: "adult",
      tags: ["51爆料", "视频"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      source: "baoliao51",
      kind: "site",
      value: "https://www.51baoliao01.com",
      normalizedValue: "www.51baoliao01.com",
      category: "adult",
      tags: ["51爆料", "视频"],
    },
  ]);
});

test("parseTargets accepts explicit Douyin object targets", () => {
  const targets = parseTargets([
    {
      source: "douyin",
      kind: "site",
      target: "xygrfrfb3g.b2h7y8w.com",
      category: "adult",
      tags: ["抖阴", "视频"],
    },
  ]);

  assert.deepEqual(targets, [
    {
      source: "douyin",
      kind: "site",
      value: "https://xygrfrfb3g.b2h7y8w.com",
      normalizedValue: "xygrfrfb3g.b2h7y8w.com",
      category: "adult",
      tags: ["抖阴", "视频"],
    },
  ]);
});

test("parseTargets rejects invalid target metadata", () => {
  assert.throws(
    () =>
      parseTargets([
        {
          target: "search:AI",
          tags: ["AI"],
        },
      ]),
    /Target category is required/,
  );

  assert.throws(
    () =>
      parseTargets([
        {
          target: "search:AI",
          category: 1,
        },
      ]),
    /Target category must be a string/,
  );

  assert.throws(
    () =>
      parseTargets([
        {
          target: "search:AI",
          category: "tech",
          tags: "AI",
        },
      ]),
    /Target tags must be an array/,
  );
});
