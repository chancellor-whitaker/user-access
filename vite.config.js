import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { patch } from "./src/utilities/patch";

// https://vite.dev/config/
export default defineConfig(
  patch({
    plugins: [react()],
  })
);
