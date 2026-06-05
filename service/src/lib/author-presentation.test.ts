import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthorPresentation, resolveAuthorPresentation } from "@/lib/author-presentation";

test("buildAuthorPresentation returns X profile only for twitter sources", () => {
  assert.deepEqual(
    buildAuthorPresentation({
      source: "twitter",
      target: "search:AI",
      author: "@openai",
      fullname: "OpenAI",
      xUrl: "https://x.com/openai/status/1",
    }),
    {
      displayAuthor: "OpenAI",
      displayHandle: "@openai",
      authorProfileUrl: "https://x.com/openai",
      authorProfilePlatform: "X",
    },
  );

  assert.deepEqual(
    buildAuthorPresentation({
      source: "cg91",
      target: "cg91:https://www.91cg1.com",
      author: "@not_x",
      fullname: null,
    }),
    {
      displayAuthor: "@not_x",
      displayHandle: null,
      authorProfileUrl: null,
      authorProfilePlatform: null,
    },
  );
});

test("buildAuthorPresentation returns YouTube profile for YouTube sources", () => {
  assert.deepEqual(
    buildAuthorPresentation({
      source: "youtube",
      target: "youtube:https://www.youtube.com/feeds/videos.xml?channel_id=UC12345678901234567890",
      author: "Channel",
      fullname: "Channel",
      link: "https://www.youtube.com/watch?v=abc123",
    }),
    {
      displayAuthor: "Channel",
      displayHandle: null,
      authorProfileUrl: "https://www.youtube.com/channel/UC12345678901234567890",
      authorProfilePlatform: "YouTube",
    },
  );
});

test("buildAuthorPresentation normalizes source aliases before presentation", () => {
  assert.deepEqual(
    buildAuthorPresentation({
      source: "x",
      target: "search:AI",
      author: "@openai",
      fullname: "OpenAI",
    }),
    {
      displayAuthor: "OpenAI",
      displayHandle: "@openai",
      authorProfileUrl: "https://x.com/openai",
      authorProfilePlatform: "X",
    },
  );

  assert.deepEqual(
    buildAuthorPresentation({
      source: "yt",
      target: "youtube:UC12345678901234567890",
      author: "Channel",
      fullname: "Channel",
    }),
    {
      displayAuthor: "Channel",
      displayHandle: null,
      authorProfileUrl: "https://www.youtube.com/channel/UC12345678901234567890",
      authorProfilePlatform: "YouTube",
    },
  );
});

test("resolveAuthorPresentation prefers stored presentation fields", () => {
  assert.deepEqual(
    resolveAuthorPresentation({
      source: "twitter",
      target: "search:AI",
      author: "@openai",
      fullname: "OpenAI",
      displayAuthor: "Stored Author",
      displayHandle: "@stored",
      authorProfileUrl: "https://x.com/stored",
      authorProfilePlatform: "Stored",
    }),
    {
      displayAuthor: "Stored Author",
      displayHandle: "@stored",
      authorProfileUrl: "https://x.com/stored",
      authorProfilePlatform: "Stored",
    },
  );
});
