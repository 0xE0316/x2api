import { requireClient } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { removeVideoFeedItemAfterPlaybackFailure } from "@/lib/video-feed-service";

function parseItemId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid itemId.");
  }

  return value.trim();
}

function parseOptionalText(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNonNegativeInteger(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${field}.`);
  }

  return Math.floor(value);
}

function parseMetadata(value: unknown) {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid metadata.");
  }

  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const client = await requireClient();
    const body = (await request.json()) as Record<string, unknown>;
    const result = await removeVideoFeedItemAfterPlaybackFailure({
      clientId: client.id,
      itemId: parseItemId(body.itemId),
      reason: parseOptionalText(body.reason, "reason"),
      retryCount: parseNonNegativeInteger(body.retryCount, "retryCount"),
      watchMs: parseNonNegativeInteger(body.watchMs, "watchMs"),
      metadata: parseMetadata(body.metadata),
    });

    return jsonOk({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to report playback failure.";
    if (message === "Missing API key." || message === "Invalid API key.") {
      return jsonError(message, 401);
    }
    if (message.startsWith("Invalid ")) {
      return jsonError(message, 400);
    }
    return jsonError(message, 500);
  }
}
