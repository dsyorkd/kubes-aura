import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCluster, useClusterNodes } from "@/api/hooks";
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  Terminal,
  MoreHorizontal,
  Power,
  AlertCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  id: number | string;
  hostname?: string;
  name?: string;
  ip_address?: string;
  ip?: string;
  status: string;
  role?: string;
  cpu_usage?: number;
  cpu?: number;
  memory_usage?: number;
  memory?: number;
  disk_usage?: number;
  disk?: number;
  temperature?: number;
  uptime?: number;
  last_seen?: string;
}

interface Cluster {
  id: number | string;
  name: string;
  description?: string;
  status: string;
  region?: string;
  provider?: string;
  k3s_version?: string;
  version?: string;
  created_at?: string;
  node_count?: number;
  online_nodes?: number;
}

const ClusterDetails = () => {
  const { clusterId } = useParams();

  // Fetch cluster details
  const {
    data: cluster,
    isLoading: isLoadingCluster,
    isError: isClusterError,
    error: clusterError,
    refetch: refetchCluster
  } = useCluster(clusterId || "");

  // Fetch cluster nodes
  const {
    data: nodesResponse,
    isLoading: isLoadingNodes,
    isError: isNodesError,
    refetch: refetchNodes
  } = useClusterNodes(cluster?.id ? parseInt(String(cluster.id)) : 0, {
    enabled: !!cluster?.id
  });

  const nodes: Node[] = nodesResponse?.data || [];
  const isLoading = isLoadingCluster || isLoadingNodes;
  const isRefreshing = isLoading;

  const refreshData = async () => {
    await Promise.all([refetchCluster(), refetchNodes()]);
  };

  // Calculate aggregated metrics
  const onlineNodes = nodes.filter(n =>
    ["online", "ready", "running"].includes(n.status?.toLowerCase())
  ).length;

  const avgCpu = nodes.length > 0
    ? Math.round(nodes.reduce((acc, n) => acc + (n.cpu_usage ?? n.cpu ?? 0), 0) / nodes.length)
    : 0;
  const avgMemory = nodes.length > 0
    ? Math.round(nodes.reduce((acc, n) => acc + (n.memory_usage ?? n.memory ?? 0), 0) / nodes.length)
    : 0;
  const avgDisk = nodes.length > 0
    ? Math.round(nodes.reduce((acc, n) => acc + (n.disk_usage ?? n.disk ?? 0), 0) / nodes.length)
    : 0;

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const getStatusIcon = (status?: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "online":
      case "ready":
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline":
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      case "provisioning":
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Power className="h-4 w-4 text-gray-500" />;
    }
  };

  const getClusterStatusIcon = (status?: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "healthy":
      case "ready":
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "master":
      case "server":
      case "control-plane":
        return "default";
      case "worker":
      case "agent":
        return "secondary";
      case "storage":
        return "outline";
      default:
        return "outline";
    }
  };

  const getNodeName = (node: Node) => node.hostname || node.name || `Node ${node.id}`;
  const getNodeIp = (node: Node) => node.ip_address || node.ip || "N/A";
  const getNodeCpu = (node: Node) => node.cpu_usage ?? node.cpu ?? 0;
  const getNodeMemory = (node: Node) => node.memory_usage ?? node.memory ?? 0;
  const getNodeDisk = (node: Node) => node.disk_usage ?? node.disk ?? 0;

  if (isClusterError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/pi-controller/clusters">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Clusters
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading cluster</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{clusterError instanceof Error ? clusterError.message : "Failed to fetch cluster details"}</span>
            <Button variant="outline" size="sm" onClick={() => refetchCluster()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cluster Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/pi-controller/clusters">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Clusters
            </Button>
          </Link>

          <div>
            {isLoadingCluster ? (
              <>
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{cluster?.name || "Cluster"}</h1>
                <p className="text-muted-foreground">
                  {cluster?.region || "local"} • {nodes.length} nodes
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div>
        {/* Cluster Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCluster ? (
                <>
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {getClusterStatusIcon(cluster?.status)}
                    <span className="text-lg font-semibold capitalize">{cluster?.status || "Unknown"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {onlineNodes}/{nodes.length} nodes online
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-1.5 w-full" />
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold">{avgCpu}%</div>
                  <Progress value={avgCpu} className="mt-2 h-1.5" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-1.5 w-full" />
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold">{avgMemory}%</div>
                  <Progress value={avgMemory} className="mt-2 h-1.5" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-1.5 w-full" />
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold">{avgDisk}%</div>
                  <Progress value={avgDisk} className="mt-2 h-1.5" />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="nodes" className="space-y-4 mt-6">
          <TabsList>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
            <TabsTrigger value="workloads">Workloads</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="nodes" className="space-y-4">
            {isNodesError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error loading nodes</AlertTitle>
                <AlertDescription>
                  <Button variant="outline" size="sm" onClick={() => refetchNodes()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : isLoadingNodes ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/30 shadow-soft">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : nodes.length > 0 ? (
              <div className="grid gap-4">
                {nodes.map((node) => (
                  <Card key={node.id} className="border-border/30 shadow-soft hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {getStatusIcon(node.status)}

                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{getNodeName(node)}</h3>
                              <Badge variant={getRoleColor(node.role)} className="text-xs">
                                {node.role || "worker"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getNodeIp(node)} • Uptime: {formatUptime(node.uptime)}
                            </p>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-sm">
                                <Cpu className="h-3.5 w-3.5" />
                                <span className="font-medium">{getNodeCpu(node)}%</span>
                              </div>
                              <Progress value={getNodeCpu(node)} className="mt-1 h-1 w-16" />
                            </div>

                            <div className="text-center">
                              <div className="flex items-center gap-1 text-sm">
                                <MemoryStick className="h-3.5 w-3.5" />
                                <span className="font-medium">{getNodeMemory(node)}%</span>
                              </div>
                              <Progress value={getNodeMemory(node)} className="mt-1 h-1 w-16" />
                            </div>

                            <div className="text-center">
                              <div className="flex items-center gap-1 text-sm">
                                <HardDrive className="h-3.5 w-3.5" />
                                <span className="font-medium">{getNodeDisk(node)}%</span>
                              </div>
                              <Progress value={getNodeDisk(node)} className="mt-1 h-1 w-16" />
                            </div>

                            {node.temperature !== undefined && (
                              <div className="text-sm text-muted-foreground">
                                {node.temperature}°C
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to={`/pi-controller/clusters/${clusterId}/nodes/${node.id}`}>
                              <Button size="sm" variant="outline" className="h-8">
                                <Activity className="h-3.5 w-3.5 mr-1.5" />
                                Monitor
                              </Button>
                            </Link>

                            <Button size="sm" variant="outline" className="h-8">
                              <Terminal className="h-3.5 w-3.5 mr-1.5" />
                              SSH
                            </Button>

                            <Button size="sm" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border/30 shadow-soft">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No nodes found in this cluster
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="workloads">
            <Card className="border-border/30 shadow-soft">
              <CardHeader>
                <CardTitle>Workloads</CardTitle>
                <CardDescription>Manage applications and services running on this cluster</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No workloads configured yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card className="border-border/30 shadow-soft">
              <CardHeader>
                <CardTitle>Cluster Monitoring</CardTitle>
                <CardDescription>Overall cluster health and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Monitoring dashboard coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-border/30 shadow-soft">
              <CardHeader>
                <CardTitle>Cluster Settings</CardTitle>
                <CardDescription>Configure cluster parameters and policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Settings panel coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClusterDetails;
