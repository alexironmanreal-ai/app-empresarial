/**
 * Mail importante — solo emisores de negocio / plataforma.
 */

export type MailSource = {
  id: string;
  label: string;
  patterns: string[];
  category: "ai" | "infra" | "money" | "social" | "productivity" | "dev" | "cloud";
  priority: number;
};

export const MAIL_SOURCES: MailSource[] = [
  {
    id: "mercadopago",
    label: "Mercado Pago",
    patterns: ["mercadopago.com", "mercadolibre.com", "mpago.la"],
    category: "money",
    priority: 1,
  },
  {
    id: "supabase",
    label: "Supabase",
    patterns: ["supabase.io", "supabase.com"],
    category: "infra",
    priority: 1,
  },
  {
    id: "grok",
    label: "Grok / xAI",
    patterns: ["x.ai", "x.com", "noreply@x.ai"],
    category: "ai",
    priority: 2,
  },
  {
    id: "notion",
    label: "Notion",
    patterns: ["notion.so", "makenotion.com", "notion.com"],
    category: "productivity",
    priority: 2,
  },
  {
    id: "instagram",
    label: "Instagram / Meta",
    patterns: ["instagram.com", "mail.instagram.com", "facebookmail.com", "meta.com"],
    category: "social",
    priority: 3,
  },
  {
    id: "github",
    label: "GitHub",
    patterns: ["github.com", "notifications@github.com"],
    category: "dev",
    priority: 2,
  },
  {
    id: "google",
    label: "Google Cloud / Workspace",
    patterns: ["google.com", "googlemail.com", "gcp-noreply"],
    category: "cloud",
    priority: 2,
  },
  {
    id: "microsoft",
    label: "Microsoft / OneDrive",
    patterns: ["microsoft.com", "office365.com", "live.com", "onedrive"],
    category: "cloud",
    priority: 3,
  },
  {
    id: "canva",
    label: "Canva",
    patterns: ["canva.com"],
    category: "productivity",
    priority: 4,
  },
  {
    id: "figma",
    label: "Figma",
    patterns: ["figma.com"],
    category: "productivity",
    priority: 4,
  },
  {
    id: "stripe",
    label: "Stripe",
    patterns: ["stripe.com"],
    category: "money",
    priority: 1,
  },
  {
    id: "openai",
    label: "OpenAI / ChatGPT",
    patterns: ["openai.com", "chatgpt.com"],
    category: "ai",
    priority: 3,
  },
  {
    id: "anthropic",
    label: "Anthropic / Claude",
    patterns: ["anthropic.com"],
    category: "ai",
    priority: 3,
  },
];

export type ImportantMail = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  sourceId: string | null;
  sourceLabel: string;
  priority: number;
  link: string;
};

export function matchSource(from: string, subject = ""): MailSource | null {
  const hay = `${from} ${subject}`.toLowerCase();
  let best: MailSource | null = null;
  for (const s of MAIL_SOURCES) {
    if (s.patterns.some((p) => hay.includes(p.toLowerCase()))) {
      if (!best || s.priority < best.priority) best = s;
    }
  }
  return best;
}

export function buildGmailQuery(enabledIds: string[], days = 30): string {
  const sources = MAIL_SOURCES.filter((s) => enabledIds.includes(s.id));
  const parts: string[] = [];
  for (const s of sources) {
    for (const p of s.patterns) {
      const d = p.includes("@") ? p.split("@").pop()! : p;
      parts.push(`from:${d}`);
    }
  }
  if (parts.length === 0) return `newer_than:${days}d`;
  return `(${parts.join(" OR ")}) newer_than:${days}d`;
}

export function gmailWebSearchUrl(enabledIds: string[], days = 30): string {
  const q = buildGmailQuery(enabledIds, days);
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(q)}`;
}

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
};

type GmailMessage = {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: { headers?: { name: string; value: string }[] };
  internalDate?: string;
};

function header(msg: GmailMessage, name: string): string {
  const h = msg.payload?.headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

export async function fetchImportantMails(
  accessToken: string,
  enabledIds: string[],
  max = 25,
): Promise<ImportantMail[]> {
  const q = buildGmailQuery(enabledIds, 45);
  const listUrl =
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?` +
    `q=${encodeURIComponent(q)}&maxResults=${max}`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    const t = await listRes.text();
    throw new Error(
      listRes.status === 401
        ? "Token inválido o vencido. Regenerá el access token de Gmail."
        : `Gmail API ${listRes.status}: ${t.slice(0, 200)}`,
    );
  }
  const list = (await listRes.json()) as GmailListResponse;
  const ids = list.messages ?? [];
  if (ids.length === 0) return [];

  const out: ImportantMail[] = [];
  for (let i = 0; i < ids.length; i += 8) {
    const chunk = ids.slice(i, i + 8);
    const details = await Promise.all(
      chunk.map(async (m) => {
        const r = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!r.ok) return null;
        return (await r.json()) as GmailMessage;
      }),
    );
    for (const msg of details) {
      if (!msg) continue;
      const from = header(msg, "From");
      const subject = header(msg, "Subject") || "(sin asunto)";
      const date = header(msg, "Date") || new Date(Number(msg.internalDate || 0)).toISOString();
      const src = matchSource(from, subject);
      if (!src || !enabledIds.includes(src.id)) continue;
      out.push({
        id: msg.id,
        threadId: msg.threadId,
        subject,
        from,
        snippet: msg.snippet || "",
        date,
        sourceId: src.id,
        sourceLabel: src.label,
        priority: src.priority,
        link: `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`,
      });
    }
  }
  out.sort((a, b) => a.priority - b.priority || b.date.localeCompare(a.date));
  return out;
}
