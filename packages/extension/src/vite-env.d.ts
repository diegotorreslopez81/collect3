/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_STORAGE_API: string
  readonly VITE_MINT_PAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

