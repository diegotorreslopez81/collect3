import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = "0"] = packageJson.version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/);

const manifest = defineManifest(async () => ({
  manifest_version: 3,
  name: packageJson.name,
  version: `${major}.${minor}.${patch}.${label}`,
  description: packageJson.description,
  action: {
    default_icon: "public/icon_32.png",
    default_title: "Collect3",
    default_popup: "./src/pages/popup/popup.html"
  },
  icons: {
    16: "public/icon_16.png",
    32: "public/icon_32.png",
    48: "public/icon_48.png",
    128: "public/icon_128.png"
  },
  background: {
    service_worker: "src/background.ts"
  },
  permissions: [
    "unlimitedStorage",
    "storage",
    "activeTab",
    "notifications"
  ],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  content_scripts: [
    {
      matches: [
        "<all_urls>"
      ],
      run_at: "document_idle",
      js: [
        "src/contentScript.ts"
      ]
    }
  ]
}));

export default manifest;
