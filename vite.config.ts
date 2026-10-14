import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");

  return {
    // Rutas relativas: sirve bien desde el server embebido de Electron
    base: "./",
    plugins: [tsconfigPaths(), tailwindcss(), react()],
    server: {
      host: true,
      port: 8080,
      proxy: {
        // Evita CORS en el navegador: el front llama a /api/supabase → Supabase
        ...(supabaseUrl
          ? {
              "/api/supabase": {
                target: supabaseUrl,
                changeOrigin: true,
                secure: true,
                rewrite: (path: string) =>
                  path.replace(/^\/api\/supabase/, ""),
              },
            }
          : {}),
        "/api/mp": {
          target: "https://api.mercadopago.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api\/mp/, ""),
        },
        "/api/yt": {
          target: "https://www.googleapis.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api\/yt/, ""),
        },
        "/api/gh": {
          target: "https://api.github.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(/^\/api\/gh/, ""),
        },
      },
    },
  };
});
