/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string
  readonly PRIVY_APP_SECRET: string
  readonly VITE_NODE_ENV: string
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
