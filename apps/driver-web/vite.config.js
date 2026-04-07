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
        manualChunks: (id) => {
          // Only process node_modules to avoid source file issues
          if (id.includes('node_modules')) {
            // Firebase chunks
            if (id.includes('firebase/auth')) return 'firebase-auth';
            if (id.includes('firebase/firestore')) return 'firebase-firestore';
            if (id.includes('firebase/app')) return 'firebase-app';

            // Keep all React-dependent libraries together to avoid circular deps
            // (react-router-dom, react-hook-form, react-query all depend on React)

            // UI libraries
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('lucide-react')) return 'lucide-react';

            // Recharts also depends on React, so it stays in main vendor chunk
          }

          // Let Vite handle source files and other modules automatically
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to reduce warnings
  },
}));
