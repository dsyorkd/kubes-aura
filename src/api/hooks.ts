/**
 * React Query Hooks for API
 *
 * Custom hooks that wrap the generated API client with React Query
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
// TODO: Uncomment when API client is generated
// import { DefaultService } from './generated/services/DefaultService';

// TODO: Implement hooks when API client is generated

// Health hooks
// export function useHealth(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
//   return useQuery({
//     queryKey: ['health'],
//     queryFn: () => DefaultService.health(),
//     ...options,
//   });
// }

// export function useReadiness(options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
//   return useQuery({
//     queryKey: ['ready'],
//     queryFn: () => DefaultService.ready(),
//     ...options,
//   });
// }

// Cluster hooks
// export function useClusters(params?: { limit?: number; offset?: number }) {
//   return useQuery({
//     queryKey: ['clusters', params],
//     queryFn: () => DefaultService.clusters(params?.limit, params?.offset),
//   });
// }

// export function useCluster(id: string) {
//   return useQuery({
//     queryKey: ['clusters', id],
//     queryFn: () => DefaultService.clusters1(id),
//     enabled: !!id,
//   });
// }

// export function useCreateCluster() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (cluster: any) => DefaultService.clusters2(cluster),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['clusters'] });
//     },
//   });
// }

// Node hooks
// export function useNodes(params?: {
//   limit?: number;
//   offset?: number;
//   includeGpio?: boolean;
//   clusterId?: number;
//   status?: string;
//   role?: string;
//   discoveryMethod?: string;
//   nodeType?: string;
// }) {
//   return useQuery({
//     queryKey: ['nodes', params],
//     queryFn: () =>
//       DefaultService.nodes(
//         params?.limit,
//         params?.offset,
//         params?.includeGpio,
//         params?.clusterId,
//         params?.status,
//         params?.role,
//         params?.discoveryMethod,
//         params?.nodeType
//       ),
//   });
// }

// export function useNode(id: string) {
//   return useQuery({
//     queryKey: ['nodes', id],
//     queryFn: () => DefaultService.nodes1(id),
//     enabled: !!id,
//   });
// }

// Add more hooks as needed for other endpoints
