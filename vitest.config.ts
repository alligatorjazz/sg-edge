import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	test: {
		clearMocks: true,
		globals: true,
		setupFiles: ["dotenv/config"] //this line,
	},
	resolve: {
		alias: [{ find: "~", replacement: resolve(__dirname, "src") }],
	},
});