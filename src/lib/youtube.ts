/** Cliente YouTube Data API v3 vía proxy Vite (/api/yt → www.googleapis.com) */

export type YtChannelStats = {
  channelId: string;
  title: string;
  customUrl: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  hiddenSubscriberCount: boolean;
  viewCount: number;
  videoCount: number;
  fetchedAt: string;
};

export type YtVideoStat = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

async function ytFetch(pathAndQuery: string) {
  const res = await fetch(`/api/yt${pathAndQuery}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `YouTube API ${res.status}`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      if (j.error?.message) msg = j.error.message;
    } catch {
      if (text) msg = text.slice(0, 200);
    }
    if (res.status === 403) {
      msg +=
        " — Revisá que la API key tenga YouTube Data API v3 habilitada y cuota.";
    }
    throw new Error(msg);
  }
  return res.json();
}

function parseHandle(input: string): string {
  let s = input.trim();
  if (s.startsWith("https://") || s.startsWith("http://")) {
    try {
      const u = new URL(s);
      const parts = u.pathname.split("/").filter(Boolean);
      // /@handle or /channel/UCxxx or /c/name
      if (parts[0] === "channel" && parts[1]) return parts[1];
      if (parts[0]?.startsWith("@")) return parts[0].slice(1);
      if (parts[0] === "c" || parts[0] === "user") return parts[1] ?? s;
      if (parts[0]) return parts[0].replace(/^@/, "");
    } catch {
      /* fallthrough */
    }
  }
  return s.replace(/^@/, "");
}

/**
 * Resuelve canal por handle (@nombre), channel ID (UC…) o URL.
 * Requiere API key de Google Cloud con YouTube Data API v3.
 */
export async function fetchChannelStats(
  apiKey: string,
  channelOrHandle: string,
): Promise<YtChannelStats> {
  const key = apiKey.trim();
  if (!key) throw new Error("Falta la API key de YouTube en Ajustes.");

  const raw = channelOrHandle.trim();
  if (!raw) throw new Error("Indicá el handle (@canal) o el Channel ID (UC…).");

  const parsed = parseHandle(raw);
  let data: {
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        description?: string;
        customUrl?: string;
        thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
      };
      statistics?: {
        viewCount?: string;
        subscriberCount?: string;
        hiddenSubscriberCount?: boolean;
        videoCount?: string;
      };
    }>;
  };

  if (parsed.startsWith("UC") && parsed.length >= 20) {
    data = await ytFetch(
      `/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(parsed)}&key=${encodeURIComponent(key)}`,
    );
  } else {
    // forHandle (sin @)
    data = await ytFetch(
      `/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(parsed)}&key=${encodeURIComponent(key)}`,
    );
    if (!data.items?.length) {
      // fallback search
      const search = await ytFetch(
        `/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(parsed)}&key=${encodeURIComponent(key)}`,
      );
      const id = search.items?.[0]?.snippet?.channelId ?? search.items?.[0]?.id?.channelId;
      if (!id) throw new Error(`No se encontró el canal "${parsed}". Probá con el Channel ID (UC…).`);
      data = await ytFetch(
        `/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}`,
      );
    }
  }

  const item = data.items?.[0];
  if (!item?.id) throw new Error("Canal no encontrado. Revisá handle o Channel ID.");

  const stats = item.statistics ?? {};
  const sn = item.snippet ?? {};

  return {
    channelId: item.id,
    title: sn.title ?? "",
    customUrl: sn.customUrl ?? "",
    description: (sn.description ?? "").slice(0, 280),
    thumbnailUrl:
      sn.thumbnails?.medium?.url ?? sn.thumbnails?.default?.url ?? "",
    subscriberCount: Number(stats.subscriberCount ?? 0),
    hiddenSubscriberCount: !!stats.hiddenSubscriberCount,
    viewCount: Number(stats.viewCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    fetchedAt: new Date().toISOString(),
  };
}

/** Últimos N videos públicos del canal con stats */
export async function fetchRecentVideos(
  apiKey: string,
  channelId: string,
  max = 6,
): Promise<YtVideoStat[]> {
  const key = apiKey.trim();
  const search = await ytFetch(
    `/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&order=date&type=video&maxResults=${max}&key=${encodeURIComponent(key)}`,
  );
  const ids: string[] = (search.items ?? [])
    .map((it: { id?: { videoId?: string } }) => it.id?.videoId)
    .filter(Boolean);

  if (ids.length === 0) return [];

  const videos = await ytFetch(
    `/youtube/v3/videos?part=snippet,statistics&id=${ids.map(encodeURIComponent).join(",")}&key=${encodeURIComponent(key)}`,
  );

  return (videos.items ?? []).map(
    (v: {
      id: string;
      snippet?: {
        title?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }) => ({
      id: v.id,
      title: v.snippet?.title ?? "",
      publishedAt: v.snippet?.publishedAt ?? "",
      thumbnailUrl:
        v.snippet?.thumbnails?.medium?.url ??
        v.snippet?.thumbnails?.default?.url ??
        "",
      viewCount: Number(v.statistics?.viewCount ?? 0),
      likeCount: Number(v.statistics?.likeCount ?? 0),
      commentCount: Number(v.statistics?.commentCount ?? 0),
    }),
  );
}
