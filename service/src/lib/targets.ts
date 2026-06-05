export type TargetSource = "twitter" | "youtube" | "heiliao" | "cg91" | "baoliao51" | "douyin";
export type TargetKind = "user" | "keyword" | "channel" | "site";

export type ParsedTarget = {
  source: TargetSource;
  kind: TargetKind;
  value: string;
  normalizedValue: string;
  category?: string | null;
  tags: string[];
};

const MAX_TARGET_TAGS = 12;
const MAX_TARGET_TAG_LENGTH = 40;
const MAX_TARGET_CATEGORY_LENGTH = 80;
const YOUTUBE_CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{20,}$/;
const YOUTUBE_FEED_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const HEILIAO_DEFAULT_URL = "https://among.uvsoskqus.cc";
const CG91_DEFAULT_URL = "https://www.91cg1.com";
const BAOLIAO51_DEFAULT_URL = "https://www.51baoliao01.com";
const DOUYIN_DEFAULT_URL = "https://xygrfrfb3g.b2h7y8w.com";

function normalizeHeiliaoTargetValue(raw: string) {
  const value = (raw.trim() || HEILIAO_DEFAULT_URL).replace(/\/+$/, "");
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  return `${url.protocol}//${url.host.toLowerCase()}`;
}

function normalizeHeiliaoTargetKey(value: string) {
  return new URL(value).host.toLowerCase();
}

function isHeiliaoTargetURL(raw: string) {
  try {
    const value = raw.trim();
    if (!value) {
      return false;
    }
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    const host = url.host.toLowerCase();
    return host === "among.uvsoskqus.cc" || host.endsWith(".uvsoskqus.cc");
  } catch {
    return false;
  }
}

function normalizeCg91TargetValue(raw: string) {
  const value = (raw.trim() || CG91_DEFAULT_URL).replace(/\/+$/, "");
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  return `${url.protocol}//${url.host.toLowerCase()}`;
}

function isCg91TargetURL(raw: string) {
  try {
    const value = raw.trim();
    if (!value) {
      return false;
    }
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.host.toLowerCase() === "91cg1.com" || url.host.toLowerCase() === "www.91cg1.com";
  } catch {
    return false;
  }
}

function normalizeBaoliao51TargetValue(raw: string) {
  const value = (raw.trim() || BAOLIAO51_DEFAULT_URL).replace(/\/+$/, "");
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  return `${url.protocol}//${url.host.toLowerCase()}`;
}

function isBaoliao51TargetURL(raw: string) {
  try {
    const value = raw.trim();
    if (!value) {
      return false;
    }
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.host.toLowerCase() === "51baoliao01.com" || url.host.toLowerCase() === "www.51baoliao01.com";
  } catch {
    return false;
  }
}

function normalizeDouyinTargetValue(raw: string) {
  const value = (raw.trim() || DOUYIN_DEFAULT_URL).replace(/\/+$/, "");
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  return `${url.protocol}//${url.host.toLowerCase()}`;
}

function isDouyinTargetURL(raw: string) {
  try {
    const value = raw.trim();
    if (!value) {
      return false;
    }
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.host.toLowerCase() === new URL(DOUYIN_DEFAULT_URL).host.toLowerCase();
  } catch {
    return false;
  }
}

function normalizeYouTubeChannelID(raw: string) {
  const value = raw.trim();
  if (!value) {
    throw new Error("YouTube channel target cannot be empty.");
  }

  let channelID = value;
  try {
    const url = new URL(value);
    const host = url.host.toLowerCase();
    if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      const feedChannelID = url.searchParams.get("channel_id")?.trim();
      if (feedChannelID) {
        channelID = feedChannelID;
      } else {
        const components = url.pathname.split("/").filter(Boolean);
        if (components[0]?.toLowerCase() === "channel" && components[1]) {
          channelID = components[1];
        }
      }
    }
  } catch {
    if (value.toLowerCase().startsWith("/channel/")) {
      channelID = value.split("/").filter(Boolean)[1] ?? value;
    }
  }

  if (!YOUTUBE_CHANNEL_ID_PATTERN.test(channelID)) {
    throw new Error("YouTube channel target must be a channel ID or /channel/UC... URL.");
  }
  return channelID;
}

function normalizeYouTubeFeedURL(raw: string) {
  const value = raw.trim();
  if (!value) {
    throw new Error("YouTube feed target cannot be empty.");
  }

  const url = new URL(value);
  const host = url.host.toLowerCase();
  if (!YOUTUBE_FEED_HOSTS.has(host) || url.pathname !== "/feeds/videos.xml") {
    throw new Error("YouTube feed target must be a YouTube feed URL.");
  }

  const channelID = url.searchParams.get("channel_id")?.trim();
  if (channelID && YOUTUBE_CHANNEL_ID_PATTERN.test(channelID)) {
    return channelID;
  }

  const user = url.searchParams.get("user")?.trim();
  if (user) {
    const normalized = new URL("https://www.youtube.com/feeds/videos.xml");
    normalized.searchParams.set("user", user);
    return normalized.toString();
  }

  const playlistID = url.searchParams.get("playlist_id")?.trim();
  if (playlistID) {
    const normalized = new URL("https://www.youtube.com/feeds/videos.xml");
    normalized.searchParams.set("playlist_id", playlistID);
    return normalized.toString();
  }

  throw new Error("YouTube feed target must include channel_id, user, or playlist_id.");
}

function isYouTubeTargetURL(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.host.toLowerCase();
    return YOUTUBE_FEED_HOSTS.has(host) && (url.pathname === "/feeds/videos.xml" || url.pathname.startsWith("/channel/"));
  } catch {
    return value.trim().toLowerCase().startsWith("/channel/") || value.trim().toLowerCase().startsWith("/feeds/videos.xml");
  }
}

function normalizeYouTubeTargetValue(raw: string) {
  const value = raw.trim();
  if (!value) {
    throw new Error("YouTube target cannot be empty.");
  }

  if (value.toLowerCase().startsWith("/channel/")) {
    const parts = value.split("/").filter(Boolean);
    const channelID = parts[1];
    if (!channelID) {
      throw new Error("YouTube channel target cannot be empty.");
    }
    return normalizeYouTubeChannelID(channelID);
  }

  if (value.toLowerCase().startsWith("/feeds/videos.xml") || value.includes("youtube.com/feeds/videos.xml")) {
    return normalizeYouTubeFeedURL(value);
  }

  if (value.includes("youtube.com")) {
    const url = new URL(value);
    const host = url.host.toLowerCase();
    if (!YOUTUBE_FEED_HOSTS.has(host)) {
      throw new Error("YouTube target must be a YouTube URL.");
    }
    if (url.pathname === "/feeds/videos.xml") {
      return normalizeYouTubeFeedURL(value);
    }
    return normalizeYouTubeChannelID(value);
  }

  return normalizeYouTubeChannelID(value);
}

export function parseTarget(raw: string): ParsedTarget {
  const value = raw.trim();
  if (!value) {
    throw new Error("Target cannot be empty.");
  }

  if (value.toLowerCase().startsWith("douyin:")) {
    const normalized = normalizeDouyinTargetValue(value.slice("douyin:".length));
    return { source: "douyin", kind: "site", value: normalized, normalizedValue: normalizeHeiliaoTargetKey(normalized), tags: [] };
  }

  if (isDouyinTargetURL(value)) {
    const normalized = normalizeDouyinTargetValue(value);
    return { source: "douyin", kind: "site", value: normalized, normalizedValue: normalizeHeiliaoTargetKey(normalized), tags: [] };
  }

  if (value.toLowerCase().startsWith("baoliao51:")) {
    const normalized = normalizeBaoliao51TargetValue(value.slice("baoliao51:".length));
    return { source: "baoliao51", kind: "site", value: normalized, normalizedValue: normalizeHeiliaoTargetKey(normalized), tags: [] };
  }

  if (isBaoliao51TargetURL(value)) {
    const normalized = normalizeBaoliao51TargetValue(value);
    return { source: "baoliao51", kind: "site", value: normalized, normalizedValue: normalizeHeiliaoTargetKey(normalized), tags: [] };
  }

  if (value.toLowerCase().startsWith("cg91:")) {
    const normalized = normalizeCg91TargetValue(value.slice("cg91:".length));
    return {
      source: "cg91",
      kind: "site",
      value: normalized,
      normalizedValue: normalizeHeiliaoTargetKey(normalized),
      tags: [],
    };
  }

  if (isCg91TargetURL(value)) {
    const normalized = normalizeCg91TargetValue(value);
    return {
      source: "cg91",
      kind: "site",
      value: normalized,
      normalizedValue: normalizeHeiliaoTargetKey(normalized),
      tags: [],
    };
  }

  if (value.toLowerCase().startsWith("heiliao:")) {
    const normalized = normalizeHeiliaoTargetValue(value.slice("heiliao:".length));
    return {
      source: "heiliao",
      kind: "site",
      value: normalized,
      normalizedValue: normalizeHeiliaoTargetKey(normalized),
      tags: [],
    };
  }

  if (isHeiliaoTargetURL(value)) {
    const normalized = normalizeHeiliaoTargetValue(value);
    return {
      source: "heiliao",
      kind: "site",
      value: normalized,
      normalizedValue: normalizeHeiliaoTargetKey(normalized),
      tags: [],
    };
  }

  if (value.toLowerCase().startsWith("youtube:")) {
    const normalized = normalizeYouTubeTargetValue(value.slice("youtube:".length));
    return {
      source: "youtube",
      kind: "channel",
      value: normalized,
      normalizedValue: normalized.toLowerCase(),
      tags: [],
    };
  }

  if (isYouTubeTargetURL(value)) {
    const normalized = normalizeYouTubeTargetValue(value);
    return {
      source: "youtube",
      kind: "channel",
      value: normalized,
      normalizedValue: normalized.toLowerCase(),
      tags: [],
    };
  }

  if (value.startsWith("search:")) {
    const keyword = value.slice("search:".length).trim();
    if (!keyword) {
      throw new Error("Keyword target cannot be empty.");
    }
    return {
      source: "twitter",
      kind: "keyword",
      value: keyword,
      normalizedValue: keyword.toLowerCase(),
      tags: [],
    };
  }

  return {
    source: "twitter",
    kind: "user",
    value,
    normalizedValue: value.toLowerCase(),
    tags: [],
  };
}

export function formatTarget(target: ParsedTarget | { source?: TargetSource; kind: TargetKind; value: string }): string {
  if (target.source === "douyin") {
    return `douyin:${target.value}`;
  }
  if (target.source === "heiliao") {
    return `heiliao:${target.value}`;
  }
  if (target.source === "cg91") {
    return `cg91:${target.value}`;
  }
  if (target.source === "baoliao51") {
    return `baoliao51:${target.value}`;
  }
  if (target.source === "youtube") {
    return `youtube:${target.value}`;
  }
  return target.kind === "keyword" ? `search:${target.value}` : target.value;
}

function normalizeTargetTag(rawTag: unknown) {
  if (typeof rawTag !== "string") {
    throw new Error("Each target tag must be a string.");
  }

  const tag = rawTag.trim();
  if (!tag) {
    return null;
  }
  if (tag.length > MAX_TARGET_TAG_LENGTH) {
    throw new Error(`Target tag cannot exceed ${MAX_TARGET_TAG_LENGTH} characters.`);
  }

  return tag;
}

function normalizeTargetTags(rawTags: unknown) {
  if (rawTags === undefined || rawTags === null) {
    return [];
  }
  if (!Array.isArray(rawTags)) {
    throw new Error("Target tags must be an array.");
  }

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const rawTag of rawTags) {
    const tag = normalizeTargetTag(rawTag);
    if (!tag) {
      continue;
    }

    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(tag);
    if (tags.length > MAX_TARGET_TAGS) {
      throw new Error(`Each target can have at most ${MAX_TARGET_TAGS} tags.`);
    }
  }

  return tags;
}

function normalizeTargetCategory(rawCategory: unknown) {
  if (typeof rawCategory !== "string") {
    throw new Error("Target category must be a string.");
  }

  const category = rawCategory.trim();
  if (!category) {
    throw new Error("Target category is required.");
  }
  if (category.length > MAX_TARGET_CATEGORY_LENGTH) {
    throw new Error(`Target category cannot exceed ${MAX_TARGET_CATEGORY_LENGTH} characters.`);
  }

  return category;
}

function normalizeTargetSource(rawSource: unknown): TargetSource {
  if (rawSource === undefined || rawSource === null) {
    return "twitter";
  }
  if (typeof rawSource !== "string") {
    throw new Error("Target source must be a string.");
  }
  const source = rawSource.trim().toLowerCase();
  switch (source) {
    case "x":
    case "twitter":
      return "twitter";
    case "yt":
    case "youtube":
      return "youtube";
    case "91":
    case "cg91":
      return "cg91";
    case "51":
    case "baoliao51":
      return "baoliao51";
    case "heiliao":
    case "douyin":
      return source;
    default:
      throw new Error("Unsupported target source.");
  }
}

function normalizeTargetKind(rawKind: unknown, source: TargetSource): TargetKind | null {
  if (rawKind === undefined || rawKind === null) {
    return null;
  }
  if (typeof rawKind !== "string") {
    throw new Error("Target kind must be a string.");
  }
  const kind = rawKind.trim().toLowerCase();
  if (source === "youtube") {
    if (kind === "channel") {
      return "channel";
    }
    throw new Error("YouTube targets must use channel kind.");
  }
  if (source === "heiliao") {
    if (kind === "site") {
      return "site";
    }
    throw new Error("Heiliao targets must use site kind.");
  }
  if (source === "cg91") {
    if (kind === "site") {
      return "site";
    }
    throw new Error("91cg targets must use site kind.");
  }
  if (source === "baoliao51") {
    if (kind === "site") {
      return "site";
    }
    throw new Error("51baoliao targets must use site kind.");
  }
  if (source === "douyin") {
    if (kind === "site") {
      return "site";
    }
    throw new Error("Douyin targets must use site kind.");
  }
  if (kind === "user" || kind === "keyword") {
    return kind;
  }
  throw new Error("Twitter targets must use user or keyword kind.");
}

function parseObjectTarget(candidate: { source?: unknown; kind?: unknown; target?: unknown; category?: unknown; tags?: unknown }) {
  if (typeof candidate.target !== "string") {
    throw new Error("Each target object must include a string target.");
  }
  if (candidate.category === undefined || candidate.category === null) {
    throw new Error("Target category is required.");
  }

  const source = normalizeTargetSource(candidate.source);
  const explicitKind = normalizeTargetKind(candidate.kind, source);
  let parsed: ParsedTarget;
  if (source === "youtube") {
    const normalized = normalizeYouTubeTargetValue(candidate.target);
    parsed = {
      source,
      kind: "channel",
      value: normalized,
      normalizedValue: normalized.toLowerCase(),
      tags: [],
    };
  } else if (source === "heiliao") {
    const normalized = normalizeHeiliaoTargetValue(candidate.target);
    parsed = {
      source,
      kind: "site",
      value: normalized,
      normalizedValue: normalizeHeiliaoTargetKey(normalized),
      tags: [],
    };
  } else if (source === "cg91") {
    const normalized = normalizeCg91TargetValue(candidate.target);
    parsed = {
      source,
      kind: "site",
      value: normalized,
      normalizedValue: normalizeHeiliaoTargetKey(normalized),
      tags: [],
    };
  } else if (source === "baoliao51") {
    const normalized = normalizeBaoliao51TargetValue(candidate.target);
    parsed = { source, kind: "site", value: normalized, normalizedValue: normalizeHeiliaoTargetKey(normalized), tags: [] };
  } else if (source === "douyin") {
    const normalized = normalizeDouyinTargetValue(candidate.target);
    parsed = { source, kind: "site", value: normalized, normalizedValue: normalizeHeiliaoTargetKey(normalized), tags: [] };
  } else if (explicitKind === "keyword") {
    parsed = parseTarget(candidate.target.toLowerCase().startsWith("search:") ? candidate.target : `search:${candidate.target}`);
  } else if (explicitKind === "user") {
    parsed = parseTarget(candidate.target);
  } else {
    parsed = parseTarget(candidate.target);
  }

  if (explicitKind && parsed.kind !== explicitKind) {
    throw new Error("Target kind does not match target value.");
  }
  if (parsed.source !== source) {
    throw new Error("Target source does not match target value.");
  }

  return {
    ...parsed,
    category: normalizeTargetCategory(candidate.category),
    tags: normalizeTargetTags(candidate.tags),
  };
}

function parseTargetInput(rawTarget: unknown) {
  if (typeof rawTarget === "string") {
    return parseTarget(rawTarget);
  }

  if (!rawTarget || typeof rawTarget !== "object" || Array.isArray(rawTarget)) {
    throw new Error("Each target must be a string or an object.");
  }

  return parseObjectTarget(rawTarget as { source?: unknown; kind?: unknown; target?: unknown; category?: unknown; tags?: unknown });
}

export function parseTargets(rawTargets: unknown): ParsedTarget[] {
  if (!Array.isArray(rawTargets)) {
    throw new Error("Expected an array of targets.");
  }

  const seen = new Set<string>();
  const parsed: ParsedTarget[] = [];

  for (const rawTarget of rawTargets) {
    const target = parseTargetInput(rawTarget);
    const key = `${target.source}:${target.kind}:${target.normalizedValue}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    parsed.push(target);
  }

  return parsed;
}
