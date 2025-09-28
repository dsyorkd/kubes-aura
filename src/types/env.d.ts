/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Pi-Controller Integration
  readonly VITE_PI_CONTROLLER_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_IO_URL: string;

  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: "development" | "staging" | "production";

  // Security Configuration
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_TOKEN_REFRESH_INTERVAL: string;

  // Feature Flags
  readonly VITE_ENABLE_GPIO_CONTROLS: string;
  readonly VITE_ENABLE_CLUSTER_MANAGEMENT: string;
  readonly VITE_ENABLE_MONITORING: string;
  readonly VITE_ENABLE_SENTRY: string;

  // Sentry Configuration
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}