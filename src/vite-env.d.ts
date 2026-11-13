/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SIGNUP_WEBHOOK_URL?: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'html2pdf.js';
