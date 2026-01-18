/**
 * React Query Hooks for API
 *
 * Custom hooks that use axios to fetch data from the pi-controller API
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import axios from 'axios';

// API Base URL - the proxy is configured in vite.config.ts to forward /api to the backend
const API_BASE = '/api/v1';

// Types for API responses
interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

interface HealthResponse {
  status: string;
  version?: string;
  uptime?: number;
}

interface Cluster {
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

interface Node {
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

interface GpioPin {
  id: number;
  pin_number?: number;
  name: string;
  direction: string;
  value: boolean;
  description?: string;
}

// Health hooks
export function useHealth(options?: Omit<UseQueryOptions<HealthResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await axios.get<HealthResponse>(`${API_BASE}/health`);
      return response.data;
    },
    ...options,
  });
}

export function useReadiness(options?: Omit<UseQueryOptions<{ status: string }>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['ready'],
    queryFn: async () => {
      const response = await axios.get<{ status: string }>(`${API_BASE}/ready`);
      return response.data;
    },
    ...options,
  });
}

// Cluster hooks
export function useClusters(params?: { limit?: number; offset?: number; type?: string }) {
  return useQuery({
    queryKey: ['clusters', params],
    queryFn: async () => {
      const response = await axios.get<PaginatedResponse<Cluster>>(`${API_BASE}/clusters`, { params });
      return response.data;
    },
  });
}

export function useCluster(id: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['clusters', id],
    queryFn: async () => {
      const response = await axios.get<Cluster>(`${API_BASE}/clusters/${id}`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

export function useClusterNodes(clusterId: string | number, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['clusters', clusterId, 'nodes', params],
    queryFn: async () => {
      const response = await axios.get<PaginatedResponse<Node>>(`${API_BASE}/clusters/${clusterId}/nodes`, { params });
      return response.data;
    },
    enabled: !!clusterId,
  });
}

// Node hooks
export function useNodes(params?: {
  limit?: number;
  offset?: number;
  includeGpio?: boolean;
  clusterId?: number;
  status?: string;
  role?: string;
}) {
  return useQuery({
    queryKey: ['nodes', params],
    queryFn: async () => {
      const response = await axios.get<PaginatedResponse<Node>>(`${API_BASE}/nodes`, { params });
      return response.data;
    },
  });
}

export function useNode(id: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['nodes', id],
    queryFn: async () => {
      const response = await axios.get<Node>(`${API_BASE}/nodes/${id}`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

// Provisioning hooks
export function useProvisionCluster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; type: string; nodes?: string[] }) => {
      const response = await axios.post(`${API_BASE}/clusters/provision`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useProvisionNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cluster_id: number; node_ids: number[] }) => {
      const response = await axios.post(`${API_BASE}/clusters/nodes/provision`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useDeprovisionNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { node_id: number }) => {
      const response = await axios.post(`${API_BASE}/nodes/deprovision`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

// GPIO hooks
export function useNodeGpioPins(nodeId: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['nodes', nodeId, 'gpio'],
    queryFn: async () => {
      const response = await axios.get<PaginatedResponse<GpioPin>>(`${API_BASE}/nodes/${nodeId}/gpio`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!nodeId,
  });
}

export function useSetGpioPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, pinId, value }: { nodeId: string | number; pinId: number; value: boolean }) => {
      const response = await axios.put(`${API_BASE}/nodes/${nodeId}/gpio/${pinId}`, { value });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['nodes', variables.nodeId, 'gpio'] });
    },
  });
}

// System info hook
export function useSystemInfo(nodeId: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['nodes', nodeId, 'system'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/nodes/${nodeId}/system`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!nodeId,
  });
}

// Node registration hook
export function useRegisterNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      hostname?: string;
      ip_address: string;
      mac_address?: string;
      role: 'master' | 'worker';
      cluster_id?: number;
      discovery_method: 'manual' | 'mdns' | 'network_scan';
      node_type: 'raspberry_pi' | 'generic';
      controller_version?: string;
      agent_port?: number;
      architecture?: string;
      model?: string;
      serial_number?: string;
      cpu_cores?: number;
      memory?: number;
    }) => {
      const response = await axios.post(`${API_BASE}/nodes`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

// Node adoption hook
export function useAdoptNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nodeId: number | string;
      trust_token: string;
      cluster_id?: number;
    }) => {
      const response = await axios.post(`${API_BASE}/nodes/${data.nodeId}/adopt`, {
        trust_token: data.trust_token,
        cluster_id: data.cluster_id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}
