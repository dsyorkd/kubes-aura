/**
 * Mock Data and Type Definitions for Pi-Controller E2E Tests
 *
 * Types match the actual API wire format from src/api/hooks.ts.
 * All mock data uses realistic values for Raspberry Pi cluster scenarios.
 */

// ── Type Definitions (matching src/api/hooks.ts wire format) ──────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface HealthResponse {
  status: string;
  version?: string;
  uptime?: number;
}

export interface Cluster {
  id: number | string;
  name: string;
  status: string;
  type?: string;
  node_count?: number;
  online_nodes?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Node {
  id: number | string;
  hostname?: string;
  name?: string;
  ip_address?: string;
  status: string;
  role?: string;
  cpu_usage?: number;
  memory_usage?: number;
  memory_total?: number;
  memory_used?: number;
  disk_usage?: number;
  disk_total?: number;
  disk_used?: number;
  temperature?: number;
  uptime?: number;
  gpio_pins?: GpioPin[];
  network_rx?: number;
  network_tx?: number;
  cluster_id?: number;
}

export interface GpioPin {
  id: number;
  pin_number?: number;
  name: string;
  direction: string;
  value: boolean;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
  created_at: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export const mockHealthResponse: HealthResponse = {
  status: 'healthy',
  version: '1.0.0',
  uptime: 86400,
};

export const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-test-token';

export const mockClusters: Cluster[] = [
  {
    id: 1,
    name: 'pi-k3s-cluster',
    status: 'healthy',
    type: 'k3s',
    node_count: 3,
    online_nodes: 3,
    description: 'Primary K3s cluster on Raspberry Pi 4 nodes',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T12:00:00Z',
  },
  {
    id: 2,
    name: 'dev-kubernetes',
    status: 'degraded',
    type: 'kubernetes',
    node_count: 2,
    online_nodes: 1,
    description: 'Development Kubernetes cluster',
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2025-02-10T08:30:00Z',
  },
  {
    id: 3,
    name: 'docker-swarm',
    status: 'healthy',
    type: 'docker',
    node_count: 2,
    online_nodes: 2,
    description: 'Docker Swarm cluster for lightweight services',
    created_at: '2025-03-01T00:00:00Z',
    updated_at: '2025-03-05T16:45:00Z',
  },
  {
    id: 4,
    name: 'custom-iot',
    status: 'unhealthy',
    type: 'custom',
    node_count: 4,
    online_nodes: 0,
    description: 'Custom IoT cluster for sensor aggregation',
    created_at: '2025-04-01T00:00:00Z',
    updated_at: '2025-04-01T00:00:00Z',
  },
];

export const mockNodes: Node[] = [
  {
    id: 1,
    hostname: 'pi-master-01',
    name: 'pi-master-01',
    ip_address: '192.168.1.100',
    status: 'online',
    role: 'master',
    cpu_usage: 42.5,
    memory_usage: 65.3,
    memory_total: 4096,
    memory_used: 2674,
    disk_usage: 35.0,
    disk_total: 32000,
    disk_used: 11200,
    temperature: 52.3,
    uptime: 604800,
    network_rx: 1048576,
    network_tx: 524288,
    cluster_id: 1,
  },
  {
    id: 2,
    hostname: 'pi-worker-01',
    name: 'pi-worker-01',
    ip_address: '192.168.1.101',
    status: 'online',
    role: 'worker',
    cpu_usage: 78.2,
    memory_usage: 85.1,
    memory_total: 2048,
    memory_used: 1743,
    disk_usage: 60.0,
    disk_total: 16000,
    disk_used: 9600,
    temperature: 67.8,
    uptime: 259200,
    network_rx: 2097152,
    network_tx: 1048576,
    cluster_id: 1,
  },
  {
    id: 3,
    hostname: 'pi-worker-02',
    name: 'pi-worker-02',
    ip_address: '192.168.1.102',
    status: 'offline',
    role: 'worker',
    cpu_usage: 0,
    memory_usage: 0,
    memory_total: 2048,
    memory_used: 0,
    disk_usage: 45.0,
    disk_total: 16000,
    disk_used: 7200,
    temperature: 0,
    uptime: 0,
    cluster_id: 1,
  },
  {
    id: 4,
    hostname: 'pi-dev-01',
    name: 'pi-dev-01',
    ip_address: '192.168.1.200',
    status: 'degraded',
    role: 'master',
    cpu_usage: 95.0,
    memory_usage: 92.4,
    memory_total: 8192,
    memory_used: 7569,
    disk_usage: 88.5,
    disk_total: 64000,
    disk_used: 56640,
    temperature: 80.1,
    uptime: 43200,
    network_rx: 4194304,
    network_tx: 2097152,
    cluster_id: 2,
  },
  {
    id: 5,
    hostname: 'pi-standalone',
    name: 'pi-standalone',
    ip_address: '192.168.1.50',
    status: 'online',
    role: 'worker',
    cpu_usage: 12.0,
    memory_usage: 30.0,
    memory_total: 4096,
    memory_used: 1229,
    disk_usage: 20.0,
    disk_total: 32000,
    disk_used: 6400,
    temperature: 45.0,
    uptime: 1209600,
    network_rx: 524288,
    network_tx: 262144,
  },
];

export const mockGpioPins: GpioPin[] = [
  {
    id: 1,
    pin_number: 17,
    name: 'status-led',
    direction: 'output',
    value: true,
    description: 'System status LED indicator',
  },
  {
    id: 2,
    pin_number: 27,
    name: 'power-button',
    direction: 'input',
    value: false,
    description: 'External power button',
  },
  {
    id: 3,
    pin_number: 22,
    name: 'temp-sensor',
    direction: 'input',
    value: true,
    description: 'DS18B20 temperature sensor data line',
  },
  {
    id: 4,
    pin_number: 23,
    name: 'relay-ctrl',
    direction: 'output',
    value: false,
    description: 'Fan relay control',
  },
  {
    id: 5,
    pin_number: 18,
    name: 'pwm-fan',
    direction: 'output',
    value: true,
    description: 'PWM-controlled cooling fan',
  },
  {
    id: 6,
    pin_number: 24,
    name: 'motion-sensor',
    direction: 'input',
    value: false,
    description: 'PIR motion sensor',
  },
];

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@pi-controller.local',
    role: 'admin',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'operator',
    email: 'operator@pi-controller.local',
    role: 'user',
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 3,
    username: 'viewer',
    email: 'viewer@pi-controller.local',
    role: 'readonly',
    created_at: '2025-02-01T00:00:00Z',
  },
];

// ── Factory Functions ─────────────────────────────────────────────────────────

export function createPaginatedResponse<T>(data: T[]): PaginatedResponse<T> {
  return { data, total: data.length };
}

export function createMockNode(overrides: Partial<Node> = {}): Node {
  return {
    id: Math.floor(Math.random() * 10000),
    hostname: 'pi-test-node',
    name: 'pi-test-node',
    ip_address: '192.168.1.99',
    status: 'online',
    role: 'worker',
    cpu_usage: 50.0,
    memory_usage: 50.0,
    memory_total: 4096,
    memory_used: 2048,
    disk_usage: 50.0,
    disk_total: 32000,
    disk_used: 16000,
    temperature: 55.0,
    uptime: 86400,
    network_rx: 1048576,
    network_tx: 524288,
    ...overrides,
  };
}

export function createMockCluster(overrides: Partial<Cluster> = {}): Cluster {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'test-cluster',
    status: 'healthy',
    type: 'k3s',
    node_count: 1,
    online_nodes: 1,
    description: 'Test cluster',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: Math.floor(Math.random() * 10000),
    username: 'test-user',
    email: 'test@pi-controller.local',
    role: 'user',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
