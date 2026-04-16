import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");

export default defineConfig({
  plugins: [react()],
  // Load env files from monorepo root (where .env currently lives)
  envDir: rootDir,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lh/shared": path.resolve(__dirname, "../../packages/shared"),
    },
  },
  server: {
    port: 3001,
    headers: {
      // Required for OAuth popups in modern browsers
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          charts: ['recharts'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable'],
        },
      },
    },
  },
});
