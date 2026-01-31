/**
 * Type definitions for Pi-Controller integration
 * Provides TypeScript interfaces for authentication, GPIO controls, and Pi cluster management
 */

// Authentication Types
export interface User {
  id: string;
  username: string;
  email?: string;
  role: "admin" | "user" | "readonly";
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// GPIO Control Types
export interface GPIOPin {
  id: number;
  name: string;
  mode: "input" | "output";
  value: boolean;
  description?: string;
  category: "led" | "button" | "sensor" | "relay" | "custom";
}

export interface GPIOState {
  pins: GPIOPin[];
  lastUpdated: string;
}

export interface GPIOUpdateRequest {
  pinId: number;
  value: boolean;
}

export interface GPIOResponse {
  success: boolean;
  pin?: GPIOPin;
  message?: string;
}

// Pi Node Types
export interface PiNode {
  id: string;
  hostname: string;
  ipAddress: string;
  status: "online" | "offline" | "error" | "maintenance";
  role: "master" | "worker" | "storage" | "edge";
  resources: {
    cpu: {
      usage: number; // percentage
      cores: number;
      temperature: number; // celsius
    };
    memory: {
      usage: number; // percentage
      total: number; // MB
      available: number; // MB
    };
    storage: {
      usage: number; // percentage
      total: number; // GB
      available: number; // GB
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      packetsIn: number;
      packetsOut: number;
    };
  };
  services: PiService[];
  lastSeen: string;
  uptime: number; // seconds
  version: string;
  location?: string;
  tags: string[];
}

export interface PiService {
  name: string;
  status: "running" | "stopped" | "error" | "starting" | "stopping";
  port?: number;
  description?: string;
  autoRestart: boolean;
  restartCount: number;
  lastRestart?: string;
}

export interface PiCluster {
  id: string;
  name: string;
  description?: string;
  nodes: PiNode[];
  status: "healthy" | "warning" | "critical" | "deploying";
  createdAt: string;
  updatedAt: string;
  metadata: {
    totalNodes: number;
    onlineNodes: number;
    masterNodes: number;
    workerNodes: number;
    totalCpu: number;
    totalMemory: number;
    totalStorage: number;
  };
}

// System Information Types
export interface SystemInfo {
  hostname: string;
  platform: string;
  architecture: string;
  cpuModel: string;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  loadAverage: number[];
  networkInterfaces: NetworkInterface[];
  processes: ProcessInfo[];
}

export interface NetworkInterface {
  name: string;
  address: string;
  netmask: string;
  family: "IPv4" | "IPv6";
  mac: string;
  internal: boolean;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  command: string;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: "gpio_update" | "node_status" | "service_update" | "system_alert" | "cluster_update";
  data: unknown;
  timestamp: string;
}

export interface NodeStatusEvent {
  nodeId: string;
  status: PiNode["status"];
  resources?: PiNode["resources"];
  services?: PiService[];
}

export interface GPIOUpdateEvent {
  pinId: number;
  value: boolean;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  level: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// Dashboard Types
export interface DashboardStats {
  totalNodes: number;
  onlineNodes: number;
  totalServices: number;
  runningServices: number;
  totalAlerts: number;
  criticalAlerts: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  totalUptime: number;
  networkTraffic: {
    in: number;
    out: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: "chart" | "stat" | "list" | "custom";
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
  config: Record<string, unknown>;
  data?: unknown;
}

// Node Discovery Types
export type NodeDiscoveryMethod = "mdns" | "dhcp" | "manual" | "api";

export type NodeDiscoveryStatus = 
  | "discovered"           // Found via mDNS/DHCP but not contacted
  | "identified"          // Successfully communicated and identified as pi-controller
  | "unresponsive"        // Discovered but not responding
  | "manual"              // Manually added by user
  | "connected";          // Actively connected to cluster

export interface DiscoveredNode {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress?: string;
  discoveryMethod: NodeDiscoveryMethod;
  discoveryStatus: NodeDiscoveryStatus;
  discoveredAt: string;
  lastSeen: string;
  
  // Only available if pi-controller is running on the node
  piControllerInfo?: {
    version: string;
    apiPort: number;
    isHealthy: boolean;
    capabilities: string[];
  };
  
  // System information (if available)
  systemInfo?: {
    model: string;
    osVersion: string;
    architecture: string;
    cpuCores: number;
    totalMemory: number;
    totalStorage: number;
  };
  
  // Network information
  networkInfo?: {
    openPorts: number[];
    services: string[];
    latency: number; // ms
  };
  
  // User-provided information (for manual entries)
  metadata?: {
    label?: string;
    location?: string;
    notes?: string;
    tags?: string[];
  };
}

export interface NodeDiscoveryResult {
  success: boolean;
  nodes: DiscoveredNode[];
  discoveryMethod: NodeDiscoveryMethod;
  timestamp: string;
  error?: string;
}

export interface ManualNodeEntry {
  hostname: string;
  ipAddress: string;
  port?: number;
  username?: string;
  password?: string;
  sshKey?: string;
  label?: string;
  location?: string;
  notes?: string;
}

// Configuration Types
export interface PiControllerConfig {
  general: {
    hostname: string;
    timezone: string;
    logLevel: "debug" | "info" | "warn" | "error";
  };
  auth: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  gpio: {
    enableControls: boolean;
    defaultMode: "safe" | "expert";
    maxToggleFrequency: number;
  };
  monitoring: {
    updateInterval: number;
    retentionDays: number;
    enableAlerts: boolean;
  };
  cluster: {
    discoveryEnabled: boolean;
    healthCheckInterval: number;
    autoFailover: boolean;
  };
}