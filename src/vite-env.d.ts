/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface SentinelDesktop {
  isElectron: true;
  toggleWidget: () => Promise<boolean>;
  openWidget: () => Promise<boolean>;
  closeWidget: () => Promise<boolean>;
  isWidgetOpen: () => Promise<boolean>;
  onWidgetState?: (cb: (open: boolean) => void) => () => void;
}

interface Window {
  sentinel?: SentinelDesktop;
}
