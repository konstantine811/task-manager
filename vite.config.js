import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: false,
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            includeAssets: [
                "favicon.svg",
                "apple-touch-icon.png",
                "pwa-192x192.png",
                "pwa-512x512.png",
            ],
            manifest: {
                name: "Chrono Task Manager",
                short_name: "Chrono",
                description: "Daily tasks, analytics, and reminders in one focused planner.",
                theme_color: "#000000",
                background_color: "#000000",
                display: "standalone",
                start_url: "/",
                scope: "/",
                lang: "uk",
                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            devOptions: {
                enabled: true,
                type: "module",
            },
            injectManifest: {
                globPatterns: ["**/*.{js,css,html,svg,png}"],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@config": path.resolve(__dirname, "src/config"),
            "@storage": path.resolve(__dirname, "src/storage"),
            "@custom-types": path.resolve(__dirname, "src/types"),
        },
    },
    worker: {
        format: "es",
    },
    server: {
        host: "0.0.0.0",
        port: 5174,
    },
});
