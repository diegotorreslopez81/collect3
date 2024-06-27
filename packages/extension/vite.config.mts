import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import htmlPurge from 'vite-plugin-html-purgecss'
import manifest from "./src/manifest";

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const outDir = resolve(__dirname, "build");
const publicDir = resolve(__dirname, "public");

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    solidPlugin(),
    crx({ manifest }),
    nodePolyfills({
      include: [
        'buffer',
        'stream',
        '_stream_duplex',
        '_stream_passthrough',
        '_stream_readable',
        '_stream_transform',
        '_stream_writable',
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // @ts-ignore
    htmlPurge.default,
  ],
  resolve: {
    alias: {
      "@src": root,
      "@pages": pagesDir,
    },
  },
  publicDir,
  root: process.cwd(),
  build: {
    outDir,
    sourcemap: isDev,
    rollupOptions: {
      input: {
        contentScript: resolve(root, 'contentScript.ts'),
        background: resolve(root, 'background.ts'),
        popup: resolve(pagesDir, 'popup', 'popup.tsx'),
        preview: resolve(pagesDir, 'preview', 'preview.html'),
        articles: resolve(pagesDir, 'articles', 'articles.html'),
        storage: resolve(pagesDir, 'storage', 'storage.html'),
        share: resolve(pagesDir, 'share', 'share.html'),
        received: resolve(pagesDir, 'received', 'received.html'),
      },
      //   output: {
      //     entryFileNames: "src/pages/[name]/index.js",
      //     chunkFileNames: isDev
      //       ? "[name].js"
      //       : "[name].[hash].js",
      //   },
    },
  },
  server: {
    port: 5000,
    warmup: {
      clientFiles: ['./src/pages/popup/popup.html'],
    },
  },
});
