type AuthorPresentationInput = {
  source: string;
  target: string | null;
  author?: string | null;
  fullname?: string | null;
  xUrl?: string | null;
  link?: string | null;
};

export type AuthorPresentation = {
  displayAuthor: string;
  displayHandle: string | null;
  authorProfileUrl: string | null;
  authorProfilePlatform: string | null;
};

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

export function buildAuthorPresentation(input: AuthorPresentationInput): AuthorPresentation {
  const source = normalizePresentationSource(input.source);
  const profile = authorProfile(source, input);
  const displayAuthor =
    nonEmpty(input.fullname) ??
    nonEmpty(input.author) ??
    displayTarget(input.target) ??
    sourceDisplayName(source);

  return {
    displayAuthor,
    displayHandle: source === "twitter" && nonEmpty(input.fullname) ? twitterHandle(input.author) : null,
    authorProfileUrl: profile?.url ?? null,
    authorProfilePlatform: profile?.platform ?? null,
  };
}

export function resolveAuthorPresentation(
  input: AuthorPresentationInput & Partial<AuthorPresentation>,
): AuthorPresentation {
  const built = buildAuthorPresentation(input);
  return {
    displayAuthor: nonEmpty(input.displayAuthor) ?? built.displayAuthor,
    displayHandle: nonEmpty(input.displayHandle) ?? built.displayHandle,
    authorProfileUrl: nonEmpty(input.authorProfileUrl) ?? built.authorProfileUrl,
    authorProfilePlatform: nonEmpty(input.authorProfilePlatform) ?? built.authorProfilePlatform,
  };
}

export function normalizePresentationSource(value: string) {
  const source = value.trim().toLowerCase();
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
    default:
      return source;
  }
}

function authorProfile(source: string, input: AuthorPresentationInput) {
  if (source === "youtube") {
    const url = youtubeProfileUrl(input.target) ?? youtubeProfileUrl(input.link);
    return url ? { url, platform: "YouTube" } : null;
  }

  if (source === "twitter") {
    const username =
      twitterUsername(input.author) ??
      twitterUsername(input.target) ??
      twitterUsername(input.xUrl) ??
      twitterUsername(input.link);
    return username ? { url: `https://x.com/${username}`, platform: "X" } : null;
  }

  return null;
}

function sourceDisplayName(source: string) {
  switch (source) {
    case "twitter":
      return "X";
    case "youtube":
      return "YouTube";
    case "heiliao":
      return "黑料";
    case "cg91":
      return "91吃瓜";
    case "baoliao51":
      return "51爆料";
    case "douyin":
      return "抖阴";
    default:
      return source || "X";
  }
}

function displayTarget(value: string | null | undefined) {
  let target = nonEmpty(value);
  if (!target) {
    return null;
  }

  const separatorIndex = target.indexOf(":");
  if (separatorIndex > 0) {
    target = target.slice(separatorIndex + 1);
  }
  return nonEmpty(target);
}

function twitterHandle(value: string | null | undefined) {
  const username = twitterUsername(value);
  return username ? `@${username}` : null;
}

function twitterUsername(value: string | null | undefined) {
  let username = nonEmpty(value);
  if (!username) {
    return null;
  }

  username = username
    .replace(/^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\//i, "")
    .replace(/^@+/, "")
    .trim();
  const slashIndex = username.indexOf("/");
  if (slashIndex >= 0) {
    username = username.slice(0, slashIndex);
  }
  username = nonEmpty(username) ?? "";
  return /^[A-Za-z0-9_]{1,15}$/.test(username) ? username : null;
}

function youtubeProfileUrl(value: string | null | undefined) {
  let raw = nonEmpty(value);
  if (!raw) {
    return null;
  }

  raw = raw.replace(/^youtube:/i, "");
  const channelID = youtubeChannelID(raw);
  if (channelID) {
    return `https://www.youtube.com/channel/${channelID}`;
  }

  if (raw.startsWith("@")) {
    return `https://www.youtube.com/${raw}`;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const user = nonEmpty(url.searchParams.get("user"));
  if (user) {
    return `https://www.youtube.com/user/${user}`;
  }

  const playlistID = nonEmpty(url.searchParams.get("playlist_id"));
  if (playlistID) {
    return `https://www.youtube.com/playlist?list=${playlistID}`;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts.length >= 2 && ["channel", "user", "c"].includes(pathParts[0]!.toLowerCase())) {
    return `https://www.youtube.com/${pathParts[0]}/${pathParts[1]}`;
  }
  const first = pathParts[0];
  if (first?.startsWith("@")) {
    return `https://www.youtube.com/${first}`;
  }
  return null;
}

function youtubeChannelID(value: string | null | undefined) {
  let channelID = nonEmpty(value);
  if (!channelID) {
    return null;
  }

  try {
    const url = new URL(channelID);
    if (YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
      channelID = nonEmpty(url.searchParams.get("channel_id")) ?? channelID;
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0]?.toLowerCase() === "channel") {
        channelID = pathParts[1]!;
      }
    }
  } catch {
    // Plain channel IDs are expected here.
  }

  return channelID.startsWith("UC") ? channelID : null;
}

function nonEmpty(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}
