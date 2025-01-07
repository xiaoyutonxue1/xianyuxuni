/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_ENV: 'development' | 'test' | 'production'
  readonly VITE_APP_DEBUG: string
  readonly VITE_UPLOAD_URL: string
  readonly VITE_MAX_UPLOAD_SIZE: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 