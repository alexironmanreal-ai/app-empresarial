/** GitHub API vía proxy Vite (/api/gh → api.github.com) */

export type GhCommit = {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
};

export type GhRepoSummary = {
  fullName: string;
  description: string;
  stars: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string;
  htmlUrl: string;
};

function parseRepo(input: string): { owner: string; repo: string } | null {
  const s = input.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  const parts = s.split("/").filter(Boolean);
  if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
  return null;
}

async function ghFetch(path: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token?.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  const res = await fetch(`/api/gh${path}`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 404
        ? "Repo no encontrado (¿público? ¿nombre bien escrito?)."
        : res.status === 401
          ? "Token inválido."
          : `GitHub ${res.status}: ${text.slice(0, 160)}`,
    );
  }
  return res.json();
}

export async function fetchRepoSummary(
  repoInput: string,
  token?: string,
): Promise<GhRepoSummary> {
  const parsed = parseRepo(repoInput);
  if (!parsed) throw new Error("Usá owner/repo o URL de GitHub.");
  const data = await ghFetch(`/repos/${parsed.owner}/${parsed.repo}`, token);
  return {
    fullName: data.full_name,
    description: data.description ?? "",
    stars: data.stargazers_count ?? 0,
    openIssues: data.open_issues_count ?? 0,
    defaultBranch: data.default_branch ?? "main",
    pushedAt: data.pushed_at ?? "",
    htmlUrl: data.html_url ?? "",
  };
}

export async function fetchRecentCommits(
  repoInput: string,
  token?: string,
  limit = 12,
): Promise<GhCommit[]> {
  const parsed = parseRepo(repoInput);
  if (!parsed) throw new Error("Usá owner/repo o URL de GitHub.");
  const data = await ghFetch(
    `/repos/${parsed.owner}/${parsed.repo}/commits?per_page=${limit}`,
    token,
  );
  if (!Array.isArray(data)) return [];
  return data.map(
    (c: {
      sha: string;
      html_url?: string;
      commit?: {
        message?: string;
        author?: { name?: string; date?: string };
      };
    }) => ({
      sha: (c.sha ?? "").slice(0, 7),
      message: (c.commit?.message ?? "").split("\n")[0] ?? "",
      author: c.commit?.author?.name ?? "",
      date: c.commit?.author?.date ?? "",
      url: c.html_url ?? "",
    }),
  );
}

export async function fetchAuthorActivity(
  repoInput: string,
  authorLogin: string,
  token?: string,
  limit = 30,
): Promise<{ commits: GhCommit[]; lastCommitAt: string | null; count7d: number }> {
  const all = await fetchRecentCommits(repoInput, token, limit);
  const login = authorLogin.trim().toLowerCase();
  const commits = login
    ? all.filter(
        (c) =>
          c.author.toLowerCase() === login ||
          c.author.toLowerCase().includes(login) ||
          login.includes(c.author.toLowerCase()),
      )
    : all;
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const count7d = commits.filter((c) => {
    const t = new Date(c.date).getTime();
    return Number.isFinite(t) && now - t <= week;
  }).length;
  const lastCommitAt = commits[0]?.date ?? null;
  return { commits, lastCommitAt, count7d };
}
