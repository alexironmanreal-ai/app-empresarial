import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), react()],
  server: {
    host: true,
    port: 8080,
    proxy: {
      "/api/mp": {
        target: "https://api.mercadopago.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/mp/, ""),
      },
      "/api/yt": {
        target: "https://www.googleapis.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/yt/, ""),
      },
      "/api/gh": {
        target: "https://api.github.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/gh/, ""),
      },
    },
  },
});
