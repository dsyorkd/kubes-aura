/**
 * Application configuration utility
 * Provides type-safe access to environment variables with validation and defaults
 */

interface AppConfig {
  // Pi-Controller Integration
  piController: {
    url: string;
    apiBaseUrl: string;
    socketIoUrl: string;
  };

  // Application Configuration
  app: {
    name: string;
    version: string;
    environment: "development" | "staging" | "production";
  };

  // Security Configuration
  security: {
    sessionTimeout: number;
    tokenRefreshInterval: number;
  };

  // Feature Flags
  features: {
    gpioControls: boolean;
    clusterManagement: boolean;
    monitoring: boolean;
    sentry: boolean;
  };

  // Sentry Configuration
  sentry: {
    dsn: string;
    environment: string;
  };
}

/**
 * Validates and returns a boolean from a string environment variable
 */
function getBooleanEnv(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

/**
 * Validates and returns a number from a string environment variable
 */
function getNumberEnv(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validates environment variable exists and returns it
 */
function getRequiredEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Required environment variable ${key} is not defined`);
  }
  return value;
}

/**
 * Application configuration object with validated environment variables
 */
export const config: AppConfig = {
  piController: {
    url: import.meta.env.VITE_PI_CONTROLLER_URL || "http://localhost:8765",
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8765/api",
    socketIoUrl: import.meta.env.VITE_SOCKET_IO_URL || "http://localhost:8765",
  },

  app: {
    name: import.meta.env.VITE_APP_NAME || "Kubes Aura",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    environment: (import.meta.env.VITE_ENVIRONMENT as AppConfig["app"]["environment"]) || "development",
  },

  security: {
    sessionTimeout: getNumberEnv(import.meta.env.VITE_SESSION_TIMEOUT, 3600000), // 1 hour
    tokenRefreshInterval: getNumberEnv(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL, 300000), // 5 minutes
  },

  features: {
    gpioControls: getBooleanEnv(import.meta.env.VITE_ENABLE_GPIO_CONTROLS, true),
    clusterManagement: getBooleanEnv(import.meta.env.VITE_ENABLE_CLUSTER_MANAGEMENT, true),
    monitoring: getBooleanEnv(import.meta.env.VITE_ENABLE_MONITORING, true),
    sentry: getBooleanEnv(import.meta.env.VITE_ENABLE_SENTRY, false),
  },

  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "development",
  },
};

/**
 * Validates that all required configuration is present
 */
export function validateConfig(): void {
  // Validate pi-controller URLs are properly formatted
  try {
    new URL(config.piController.url);
    new URL(config.piController.apiBaseUrl);
    new URL(config.piController.socketIoUrl);
  } catch (error) {
    throw new Error("Invalid pi-controller URL configuration");
  }

  // Validate environment
  if (!["development", "staging", "production"].includes(config.app.environment)) {
    throw new Error(`Invalid environment: ${config.app.environment}`);
  }

  // Validate Sentry configuration if enabled
  if (config.features.sentry && !config.sentry.dsn) {
    throw new Error("Sentry is enabled but VITE_SENTRY_DSN is not configured");
  }
}

/**
 * Returns true if the application is running in development mode
 */
export const isDevelopment = config.app.environment === "development";

/**
 * Returns true if the application is running in production mode
 */
export const isProduction = config.app.environment === "production";

/**
 * Returns true if the application is running in staging mode
 */
export const isStaging = config.app.environment === "staging";