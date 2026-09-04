import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // types.ts and styles.ts live one level up and are shared with the other app.
    alias: { "@shared": path.resolve(__dirname, "../shared") },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
