import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lh/shared": path.resolve(__dirname, "../../packages/shared"),
    },
    extensions: ['.js', '.jsx'],
  },
  build: {
    target: ['es2020', 'edge90', 'firefox88', 'chrome90', 'safari14'],
    minify: 'esbuild',
    cssCodeSplit: true,
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
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to reduce warnings
  },
}));
