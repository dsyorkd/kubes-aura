import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNodes } from "@/api/hooks";
import ManualNodeEntryDialog from "@/components/ManualNodeEntryDialog";
import AdoptNodeDialog from "@/components/AdoptNodeDialog";
import {
  Server,
  Search,
  Plus,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Thermometer,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Network,
  Settings,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeData {
  id: number | string;
  hostname?: string;
  name?: string;
  ip_address?: string;
  status: string;
  role?: string;
  cluster_id?: number | string;
  cluster_name?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  temperature?: number;
  uptime?: number;
  discovery_method?: string;
}

const Nodes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddNodeDialog, setShowAddNodeDialog] = useState(false);
  const [adoptNodeId, setAdoptNodeId] = useState<number | string | null>(null);
  const [adoptNodeName, setAdoptNodeName] = useState<string>("");

  const { data: nodesResponse, isLoading, isError, error, refetch } = useNodes({ includeGpio: false });

  const nodes: NodeData[] = nodesResponse?.data || [];

  // Filter nodes
  const filteredNodes = nodes.filter(node => {
    const nodeName = node.hostname || node.name || `Node ${node.id}`;
    const nodeIp = node.ip_address || "";
    const clusterName = node.cluster_name || "";

    const matchesSearch = nodeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nodeIp.includes(searchQuery) ||
                         clusterName.toLowerCase().includes(searchQuery.toLowerCase());

    const nodeStatus = node.status?.toLowerCase() || "unknown";
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "online" && ["online", "ready", "running"].includes(nodeStatus)) ||
                         (statusFilter === "warning" && ["warning", "degraded"].includes(nodeStatus)) ||
                         (statusFilter === "offline" && ["offline", "disconnected", "error"].includes(nodeStatus));

    const nodeRole = node.role?.toLowerCase() || "worker";
    const matchesRole = roleFilter === "all" || nodeRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusFromString = (status: string): "online" | "warning" | "offline" => {
    const s = status?.toLowerCase() || "unknown";
    if (["online", "ready", "running", "healthy"].includes(s)) return "online";
    if (["warning", "degraded"].includes(s)) return "warning";
    return "offline";
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = getStatusFromString(status);
    switch (normalizedStatus) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = getStatusFromString(status);
    switch (normalizedStatus) {
      case "online": return "default";
      case "warning": return "secondary";
      case "offline": return "destructive";
      default: return "outline";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "master":
      case "control-plane":
      case "server":
        return "default";
      case "worker":
      case "agent":
        return "secondary";
      case "storage": return "outline";
      default: return "outline";
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds || seconds === 0) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const onlineCount = nodes.filter(n => ["online", "ready", "running", "healthy"].includes(n.status?.toLowerCase())).length;
  const warningCount = nodes.filter(n => ["warning", "degraded"].includes(n.status?.toLowerCase())).length;
  const offlineCount = nodes.length - onlineCount - warningCount;

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Nodes</h1>
            <p className="text-muted-foreground">
              Manage all Raspberry Pi nodes across clusters
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading nodes</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : "Failed to fetch nodes"}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Nodes</h1>
          <p className="text-muted-foreground">
            Manage all Raspberry Pi nodes across clusters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddNodeDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{nodesResponse?.total || nodes.length}</div>
                <p className="text-xs text-muted-foreground">Across all clusters</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {onlineCount}
                </div>
                <p className="text-xs text-muted-foreground">Healthy nodes</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  {warningCount}
                </div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                  {offlineCount}
                </div>
                <p className="text-xs text-muted-foreground">Unavailable</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Nodes</CardTitle>
          <CardDescription>Search and filter by status or role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, IP, or cluster..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Nodes List */}
      <div className="grid gap-4">
        {isLoading ? (
          // Loading skeletons
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  <div className="flex gap-6">
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredNodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No nodes found</h3>
              <p className="text-muted-foreground mb-4">
                {nodes.length === 0
                  ? "No nodes have been registered yet. Nodes will appear here once they connect to the controller."
                  : "Try adjusting your search or filters"
                }
              </p>
              {nodes.length === 0 && (
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for nodes
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredNodes.map((node) => {
            const nodeName = node.hostname || node.name || `Node ${node.id}`;
            const nodeIp = node.ip_address || "N/A";
            const nodeStatus = getStatusFromString(node.status);
            const nodeRole = node.role || "worker";
            const clusterName = node.cluster_name || "Unassigned";

            return (
              <Card key={node.id} className="border-border/30 shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    {/* Node Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(node.status)}

                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{nodeName}</h3>
                          <Badge variant={getStatusColor(node.status)}>
                            {node.status || "unknown"}
                          </Badge>
                          <Badge variant={getRoleColor(nodeRole)}>
                            {nodeRole}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Network className="h-3.5 w-3.5" />
                            {nodeIp}
                          </span>
                          <span>•</span>
                          {node.cluster_id ? (
                            <Link
                              to={`/pi-controller/clusters/${node.cluster_id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {clusterName}
                            </Link>
                          ) : (
                            <span>{clusterName}</span>
                          )}
                          <span>•</span>
                          <span>Uptime: {formatUptime(node.uptime)}</span>
                          {node.discovery_method && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {node.discovery_method}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Node Metrics */}
                    {nodeStatus !== "offline" && (
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{node.cpu_usage ?? 0}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">CPU</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{node.memory_usage ?? 0}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Memory</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{node.disk_usage ?? 0}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Disk</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-sm mb-1">
                            <Thermometer className={cn(
                              "h-3.5 w-3.5",
                              (node.temperature ?? 0) >= 70 ? "text-red-500" :
                              (node.temperature ?? 0) >= 60 ? "text-yellow-500" :
                              "text-muted-foreground"
                            )} />
                            <span className="font-medium">{node.temperature ?? 0}°C</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Temp</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Monitor and hardware buttons always available for ready/adopted nodes */}
                      {node.status === 'ready' || node.status === 'not_ready' || node.cluster_id ? (
                        <>
                          <Link to={node.cluster_id ? `/pi-controller/clusters/${node.cluster_id}/nodes/${node.id}` : `/pi-controller/nodes/${node.id}`}>
                            <Button size="sm" variant="outline">
                              <Activity className="h-3.5 w-3.5 mr-1.5" />
                              Monitor
                            </Button>
                          </Link>

                          <Link to={`/pi-controller/hardware/${node.id}`}>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      ) : null}

                      {/* Adoption button for discovered nodes */}
                      {node.status === 'discovered' && (node.discovery_method === 'mdns' || node.discovery_method === 'network_scan') && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setAdoptNodeId(node.id);
                              setAdoptNodeName(node.hostname || node.name || `Node ${node.id}`);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Adopt Node
                          </Button>
                          <Badge variant="secondary" className="text-xs">
                            Discovered
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ManualNodeEntryDialog
        open={showAddNodeDialog}
        onOpenChange={setShowAddNodeDialog}
      />

      {adoptNodeId && (
        <AdoptNodeDialog
          open={!!adoptNodeId}
          onOpenChange={(open) => {
            if (!open) {
              setAdoptNodeId(null);
              setAdoptNodeName("");
            }
          }}
          nodeId={adoptNodeId}
          nodeName={adoptNodeName}
        />
      )}
    </div>
  );
};

export default Nodes;
