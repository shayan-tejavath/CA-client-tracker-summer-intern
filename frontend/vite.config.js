import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "url"; // Use this instead of 'path' for ES modules

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 plugin is perfectly placed
  ],

  resolve: {
    alias: {
      // Modern, ESM-safe way to resolve the shadcn src folder
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    proxy: {
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
    },
  },
});