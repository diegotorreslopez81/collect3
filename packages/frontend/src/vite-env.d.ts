/// <reference types="vite/client" />
import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_ENV: 'prod' | 'dev'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

