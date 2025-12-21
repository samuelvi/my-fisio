import { defineConfig } from "vite";
import symfonyPlugin from "vite-plugin-symfony";
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react(),
        symfonyPlugin(),
    ],
    server: {
        host: true,
        port: 5173,
    },
    build: {
        rollupOptions: {
            input: {
                app: "./assets/app.jsx"
            },
        }
    },
});