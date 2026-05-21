import assert from "node:assert/strict";
import test from "node:test";

import { decodeCursor, encodeCursor } from "@/lib/pagination";

type FeedCursor = {
  sortTime: string;
  storedAt: string;
  id: string;
};

type RankedItem = FeedCursor & {
  score: number;
};

function isFeedCursor(value: unknown): value is FeedCursor {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<FeedCursor>;
  return (
    typeof candidate.sortTime === "string" &&
    typeof candidate.storedAt === "string" &&
    typeof candidate.id === "string"
  );
}

function keysetAfter(items: RankedItem[], cursor: FeedCursor | null) {
  if (!cursor) {
    return items;
  }

  return items.filter((item) => {
    if (item.sortTime !== cursor.sortTime) {
      return item.sortTime < cursor.sortTime;
    }

    if (item.storedAt !== cursor.storedAt) {
      return item.storedAt < cursor.storedAt;
    }

    return item.id < cursor.id;
  });
}

test("video feed pagination remains stable when scores differ", () => {
  const items: RankedItem[] = [
    {
      id: "b",
      sortTime: "2026-05-21T10:00:00.000Z",
      storedAt: "2026-05-21T10:00:00.000Z",
      score: 1,
    },
    {
      id: "a",
      sortTime: "2026-05-21T10:00:00.000Z",
      storedAt: "2026-05-21T10:00:00.000Z",
      score: 999,
    },
    {
      id: "9",
      sortTime: "2026-05-21T09:59:00.000Z",
      storedAt: "2026-05-21T09:59:00.000Z",
      score: 0,
    },
  ].sort((left, right) => {
    if (left.sortTime !== right.sortTime) {
      return right.sortTime.localeCompare(left.sortTime);
    }

    if (left.storedAt !== right.storedAt) {
      return right.storedAt.localeCompare(left.storedAt);
    }

    return right.id.localeCompare(left.id);
  });

  const firstPage = items.slice(0, 2);
  const cursor = decodeCursor(
    encodeCursor({
      sortTime: firstPage[1]!.sortTime,
      storedAt: firstPage[1]!.storedAt,
      id: firstPage[1]!.id,
    }),
    isFeedCursor,
  );

  const secondPage = keysetAfter(items, cursor);

  assert.deepEqual(
    firstPage.map((item) => item.id),
    ["b", "a"],
  );
  assert.deepEqual(
    secondPage.map((item) => item.id),
    ["9"],
  );
  assert.equal(secondPage.some((item) => item.id === "b" || item.id === "a"), false);
});
