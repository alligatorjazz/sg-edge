"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = require("path");
exports.default = (0, config_1.defineConfig)({
    test: {
        clearMocks: true,
        globals: true,
        setupFiles: ['dotenv/config'] //this line,
    },
    resolve: {
        alias: [{ find: '~', replacement: (0, path_1.resolve)(__dirname, 'src') }],
    },
});
