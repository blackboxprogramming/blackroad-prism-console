/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANVIL_RPC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
