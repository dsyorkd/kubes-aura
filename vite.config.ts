import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy Socket.io requests to pi-controller backend
      "/socket.io": {
        target: process.env.VITE_PI_CONTROLLER_URL || "http://localhost:8765",
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
      // Proxy API requests to pi-controller backend
      "/api": {
        target: process.env.VITE_PI_CONTROLLER_URL || "http://localhost:8765",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Socket.io into its own chunk for better caching
          socket: ["socket.io-client"],
          // Separate state management libraries
          state: ["zustand", "@tanstack/react-query"],
          // Separate utility libraries
          utils: ["axios", "framer-motion"],
          // Separate error tracking
          monitoring: ["@sentry/react"],
        },
      },
    },
  },
  // Optimize deps for better development experience
  optimizeDeps: {
    include: ["socket.io-client", "zustand", "axios", "framer-motion"],
  },
}));
