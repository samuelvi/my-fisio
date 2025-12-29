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
                app: "./assets/app.tsx",
                login: "./assets/login.tsx"
            },
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
                    fullcalendar: ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
                    ui: ['@headlessui/react', '@heroicons/react', 'react-datepicker']
                }
            }
        }
    },
});