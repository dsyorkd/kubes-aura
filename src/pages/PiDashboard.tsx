import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useClusters, useNodes, useNode, useHealth } from "@/api/hooks";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Wifi,
  Power,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Server,
  Network,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GpioPin {
  id: number;
  pin_number?: number;
  name: string;
  direction: string;
  value: boolean;
  description?: string;
}

interface NodeData {
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
}

const PiDashboard = () => {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(nodeId);

  // Fetch health status
  const { data: healthData, isLoading: isLoadingHealth } = useHealth();

  // Fetch clusters for overview
  const { data: clustersResponse, isLoading: isLoadingClusters, refetch: refetchClusters } = useClusters();

  // Fetch all nodes for overview and selector
  const { data: nodesResponse, isLoading: isLoadingNodes, refetch: refetchNodes } = useNodes({ includeGpio: true });

  // Fetch specific node if nodeId is present
  const { data: nodeData, isLoading: isLoadingNode, refetch: refetchNode } = useNode(nodeId || "", {
    enabled: !!nodeId
  });

  const clusters = clustersResponse?.data || [];
  const nodes: NodeData[] = nodesResponse?.data || [];

  // Calculate overview stats
  const totalNodes = nodesResponse?.total || nodes.length;
  const onlineNodes = nodes.filter(n =>
    ["online", "ready", "running"].includes(n.status?.toLowerCase())
  ).length;
  const offlineNodes = totalNodes - onlineNodes;

  const avgCpu = nodes.length > 0
    ? Math.round(nodes.reduce((acc, n) => acc + (n.cpu_usage ?? 0), 0) / nodes.length)
    : 0;

  const avgTemp = nodes.length > 0
    ? Math.round(nodes.reduce((acc, n) => acc + (n.temperature ?? 0), 0) / nodes.filter(n => n.temperature).length) || 0
    : 0;

  const isRefreshing = isLoadingNodes || isLoadingClusters || isLoadingNode;

  const refreshAll = async () => {
    await Promise.all([refetchClusters(), refetchNodes(), nodeId ? refetchNode() : Promise.resolve()]);
  };

  // If no nodeId, show overview dashboard
  if (!nodeId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pi Controller Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your Raspberry Pi infrastructure
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalNodes}</div>
                  <p className="text-xs text-muted-foreground">{onlineNodes} online, {offlineNodes} offline</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingClusters ? (
                <>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{clustersResponse?.total || clusters.length}</div>
                  <p className="text-xs text-muted-foreground">All types</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{avgCpu}%</div>
                  <Progress value={avgCpu} className="mt-2" />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNodes ? (
                <>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{avgTemp > 0 ? `${avgTemp}°C` : "N/A"}</div>
                  <p className="text-xs text-muted-foreground">
                    {avgTemp > 0 && avgTemp < 70 ? "Normal range" : avgTemp >= 70 ? "High" : "No data"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nodes List */}
        {nodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nodes</CardTitle>
              <CardDescription>Click on a node to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {nodes.slice(0, 5).map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/pi-controller/dashboard/${node.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        ["online", "ready", "running"].includes(node.status?.toLowerCase()) && "bg-green-500",
                        node.status?.toLowerCase() === "warning" && "bg-yellow-500",
                        ["offline", "error"].includes(node.status?.toLowerCase()) && "bg-red-500"
                      )} />
                      <div>
                        <div className="font-medium">{node.hostname || node.name || `Node ${node.id}`}</div>
                        <div className="text-sm text-muted-foreground">{node.ip_address || "N/A"}</div>
                      </div>
                    </div>
                    <Badge variant="outline">{node.role || "worker"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and navigation</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link to="/pi-controller/clusters">
              <Button className="w-full" variant="outline">
                <Network className="h-4 w-4 mr-2" />
                View All Clusters
              </Button>
            </Link>
            <Link to="/pi-controller/hardware">
              <Button className="w-full" variant="outline">
                <Server className="h-4 w-4 mr-2" />
                Hardware Control
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Health Status */}
        {healthData && (
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {healthData.status === "healthy" || healthData.status === "ok" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="capitalize">{healthData.status || "Unknown"}</span>
                {healthData.version && (
                  <Badge variant="outline" className="ml-2">v{healthData.version}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Node Detail View
  const currentNode = nodeData || nodes.find(n => String(n.id) === nodeId);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 B";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const getNodeName = (node?: NodeData) => node?.hostname || node?.name || `Node ${node?.id}`;
  const getNodeIp = (node?: NodeData) => node?.ip_address || "N/A";

  const handleNodeChange = (newNodeId: string) => {
    setSelectedNode(newNodeId);
    navigate(`/pi-controller/dashboard/${newNodeId}`);
  };

  if (isLoadingNode && !currentNode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Node not found</AlertTitle>
          <AlertDescription>
            The requested node could not be found.
            <Link to="/pi-controller/dashboard" className="ml-2 underline">
              Go back to dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const gpioPins: GpioPin[] = currentNode.gpio_pins || [];

  return (
    <div className="space-y-6">
      {/* Node Selector and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Node Dashboard</h1>
            <p className="text-muted-foreground">
              {getNodeName(currentNode)} - {getNodeIp(currentNode)}
            </p>
          </div>

          {/* Node Selector */}
          <Select value={selectedNode} onValueChange={handleNodeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      ["online", "ready", "running"].includes(node.status?.toLowerCase()) && "bg-green-500",
                      node.status?.toLowerCase() === "warning" && "bg-yellow-500",
                      ["offline", "error"].includes(node.status?.toLowerCase()) && "bg-red-500"
                    )} />
                    <span>{getNodeName(node)}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {node.role || "worker"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchNode()}
            disabled={isLoadingNode}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingNode && "animate-spin")} />
            Refresh
          </Button>

          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div>
        {/* Node Status Badge */}
        <div className="mb-6 flex items-center gap-4">
          <Badge
            variant={
              ["online", "ready", "running"].includes(currentNode.status?.toLowerCase())
                ? "default"
                : currentNode.status?.toLowerCase() === "warning"
                  ? "secondary"
                  : "destructive"
            }
            className="px-3 py-1"
          >
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              ["online", "ready", "running"].includes(currentNode.status?.toLowerCase()) && "bg-green-500",
              currentNode.status?.toLowerCase() === "warning" && "bg-yellow-500",
              ["offline", "error"].includes(currentNode.status?.toLowerCase()) && "bg-red-500"
            )} />
            {currentNode.status || "Unknown"}
          </Badge>
          <Badge variant="outline">{currentNode.role || "worker"}</Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Node Overview</TabsTrigger>
            <TabsTrigger value="gpio">GPIO Control</TabsTrigger>
            <TabsTrigger value="monitoring">Node Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* CPU Card */}
              <Card className="border-border/30 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentNode.cpu_usage?.toFixed(1) || 0}%</div>
                  <Progress value={currentNode.cpu_usage || 0} className="mt-2" />
                  {currentNode.temperature && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Temp: {currentNode.temperature}°C
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Memory Card */}
              <Card className="border-border/30 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentNode.memory_usage?.toFixed(1) || 0}%</div>
                  <Progress value={currentNode.memory_usage || 0} className="mt-2" />
                  {currentNode.memory_total && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatBytes(currentNode.memory_used)} / {formatBytes(currentNode.memory_total)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Disk Card */}
              <Card className="border-border/30 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentNode.disk_usage?.toFixed(1) || 0}%</div>
                  <Progress value={currentNode.disk_usage || 0} className="mt-2" />
                  {currentNode.disk_total && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatBytes(currentNode.disk_used)} / {formatBytes(currentNode.disk_total)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Network Card */}
              <Card className="border-border/30 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getNodeIp(currentNode)}</div>
                  {(currentNode.network_rx !== undefined || currentNode.network_tx !== undefined) && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>↓ {formatBytes(currentNode.network_rx)}/s</span>
                      <span>↑ {formatBytes(currentNode.network_tx)}/s</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>Node Information</CardTitle>
                <CardDescription>Status and metrics for {getNodeName(currentNode)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Power className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Uptime: {formatUptime(currentNode.uptime)}</span>
                  </div>
                  {currentNode.temperature && (
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">CPU Temp: {currentNode.temperature}°C</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Status: {currentNode.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gpio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GPIO Pin Control - {getNodeName(currentNode)}</CardTitle>
                <CardDescription>
                  Control and monitor GPIO pins on {getNodeName(currentNode)} ({getNodeIp(currentNode)})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gpioPins.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {gpioPins.map((pin) => (
                      <Card key={pin.id} className="border border-border/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium">{pin.name}</h3>
                              <p className="text-sm text-muted-foreground">Pin {pin.pin_number || pin.id}</p>
                            </div>
                            <Badge variant={pin.direction === 'output' ? 'default' : 'secondary'}>
                              {pin.direction}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {pin.value ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-sm">
                                {pin.value ? 'HIGH' : 'LOW'}
                              </span>
                            </div>

                            {pin.direction === 'output' && (
                              <Button
                                size="sm"
                                variant={pin.value ? "default" : "outline"}
                              >
                                Toggle
                              </Button>
                            )}
                          </div>

                          {pin.description && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {pin.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No GPIO pins configured for this node
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Node Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{getNodeName(currentNode)} running normally</span>
                  </div>
                  {currentNode.status?.toLowerCase() === "warning" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">High resource usage detected on this node</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Power className="h-4 w-4 mr-2" />
                    System Reboot
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Services
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    System Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PiDashboard;
