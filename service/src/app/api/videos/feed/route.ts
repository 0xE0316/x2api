import { requireClient } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { PaginationInputError } from "@/lib/pagination";
import { parseStringListParam } from "@/lib/query-params";
import { listVideoFeed, parseVideoFeedSource } from "@/lib/video-feed-service";

function parsePositiveInt(raw: string | null, field: string) {
  if (raw === null) {
    return undefined;
  }

  if (!/^\d+$/.test(raw)) {
    throw new Error(`Invalid ${field}. Expected a positive integer.`);
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid ${field}. Expected a positive integer.`);
  }

  return value;
}

export async function GET(request: Request) {
  try {
    const client = await requireClient();
    const { searchParams } = new URL(request.url);
    const result = await listVideoFeed({
      clientId: client.id,
      limit: parsePositiveInt(searchParams.get("limit"), "limit"),
      cursor: searchParams.get("cursor"),
      tags: parseStringListParam(searchParams, "tag"),
      categories: parseStringListParam(searchParams, "category"),
      source: parseVideoFeedSource(searchParams.get("source")),
    });

    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query video feed.";
    if (message === "Missing API key." || message === "Invalid API key.") {
      return jsonError(message, 401);
    }
    if (error instanceof PaginationInputError || message.startsWith("Invalid ")) {
      return jsonError(message, 400);
    }
    return jsonError(message, 500);
  }
}
