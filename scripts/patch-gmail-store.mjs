#!/usr/bin/env node
/**
 * Aplica campos Gmail / Mail importante al store.ts
 * Uso: node scripts/patch-gmail-store.mjs
 */
import fs from "fs";

const path = "src/lib/store.ts";
let t = fs.readFileSync(path, "utf8");
if (t.includes("gmailAccessToken") && t.includes("setImportantMails")) {
  console.log("store ya tiene gmail/mail");
  process.exit(0);
}

if (!t.includes('from "./mail-important"')) {
  t = t.replace(
    'import type { TeamMember } from "./team";',
    'import type { TeamMember } from "./team";\nimport type { ImportantMail } from "./mail-important";',
  );
  if (!t.includes('from "./mail-important"')) {
    t = t.replace(
      'import type { GhCommit, GhRepoSummary } from "./github";',
      'import type { GhCommit, GhRepoSummary } from "./github";\nimport type { ImportantMail } from "./mail-important";',
    );
  }
}

if (!t.includes("gmailAccessToken: string")) {
  t = t.replace(
    "  ghToken: string;\n",
    `  ghToken: string;
  gmailAccessToken: string;
  mailEnabledSources: string[];
  importantMails: ImportantMail[];
  mailLastSyncAt: string | null;
`,
  );
}

if (!t.includes("setGmailAccessToken")) {
  t = t.replace(
    "  setGhToken: (v: string) => void;\n",
    `  setGhToken: (v: string) => void;
  setGmailAccessToken: (v: string) => void;
  setMailEnabledSources: (ids: string[]) => void;
  setImportantMails: (mails: ImportantMail[]) => void;
`,
  );
}

if (!t.includes('gmailAccessToken: ""')) {
  t = t.replace(
    '  ghToken: "",\n',
    `  ghToken: "",
  gmailAccessToken: "",
  mailEnabledSources: [
    "mercadopago",
    "supabase",
    "grok",
    "notion",
    "instagram",
    "github",
    "stripe",
    "openai",
    "anthropic",
  ],
  importantMails: [] as ImportantMail[],
  mailLastSyncAt: null as string | null,
`,
  );
}

if (!t.includes("setGmailAccessToken: (gmailAccessToken)")) {
  t = t.replace(
    "      setGhToken: (ghToken) => set({ ghToken }),\n",
    `      setGhToken: (ghToken) => set({ ghToken }),
      setGmailAccessToken: (gmailAccessToken) => set({ gmailAccessToken }),
      setMailEnabledSources: (mailEnabledSources) => set({ mailEnabledSources }),
      setImportantMails: (importantMails) =>
        set({ importantMails, mailLastSyncAt: new Date().toISOString() }),
`,
  );
}

if (!t.includes('"gmailAccessToken"')) {
  t = t.replace(
    '"ghToken"',
    '"ghToken", "gmailAccessToken", "mailEnabledSources", "importantMails", "mailLastSyncAt"',
  );
}

fs.writeFileSync(path, t);
console.log("OK Gmail/mail fields aplicados a", path);
