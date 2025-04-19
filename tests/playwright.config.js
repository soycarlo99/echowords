import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    headless: false, // run headed
    slowMo: 500, // slow down each action
    viewport: { width: 1280, height: 720 },
  },
});
