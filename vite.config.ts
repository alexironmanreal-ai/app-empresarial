import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = (env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");

  if (supabaseUrl) {
    console.log(`[vite] proxy /api/supabase → ${supabaseUrl}`);
  } else {
    console.warn("[vite] VITE_SUPABASE_URL vacío: sin proxy a Supabase");
  }

  return {
    base: "./",
    plugins: [tsconfigPaths(), tailwindcss(), react()],
    server: {
      host: true,
      port: 8080,
      proxy: {
        ...(supabaseUrl
          ? {
              "/api/supabase": {
                target: supabaseUrl,
                changeOrigin: true,
                secure: true,
                rewrite: (path: string) =>
                  path.replace(/^\/api\/supabase/, ""),
                configure: (proxy) => {
                  proxy.on("error", (err, _req, res) => {
                    console.error("[vite] proxy Supabase error:", err.message);
                    if (res && !res.headersSent) {
                      res.writeHead(502, { "Content-Type": "application/json" });
                      res.end(
                        JSON.stringify({
                          message: "Proxy a Supabase falló",
                          detail: err.message,
                          target: supabaseUrl,
                        }),
                      );
                    }
                  });
                  proxy.on("proxyReq", (proxyReq, req) => {
                    // Asegura Host del proyecto Supabase
                    try {
                      const host = new URL(supabaseUrl).host;
                      proxyReq.setHeader("host", host);
                    } catch {
                      /* ignore */
                    }
                    console.log(
                      `[vite] → ${req.method} ${req.url} → ${supabaseUrl}`,
                    );
                  });
                  proxy.on("proxyRes", (proxyRes, req) => {
                    console.log(
                      `[vite] ← ${proxyRes.statusCode} ${req.method} ${req.url}`,
                    );
                  });
                },
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
