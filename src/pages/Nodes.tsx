import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  name: string;
  ip: string;
  status: "online" | "offline" | "warning";
  role: "master" | "worker" | "storage";
  clusterId: string;
  clusterName: string;
  cpu: number;
  memory: number;
  disk: number;
  temperature: number;
  uptime: number;
  discoveryMethod: "mdns" | "manual" | "dhcp";
}

const Nodes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Mock nodes data - in real app this would come from API
  const [nodes] = useState<Node[]>([
    {
      id: "node-1",
      name: "Pi Master",
      ip: "192.168.1.100",
      status: "online",
      role: "master",
      clusterId: "k8s-prod",
      clusterName: "Kubernetes Production",
      cpu: 45,
      memory: 62,
      disk: 40,
      temperature: 52,
      uptime: 86400,
      discoveryMethod: "mdns"
    },
    {
      id: "node-2",
      name: "Pi Worker 1",
      ip: "192.168.1.101",
      status: "online",
      role: "worker",
      clusterId: "k8s-prod",
      clusterName: "Kubernetes Production",
      cpu: 78,
      memory: 45,
      disk: 35,
      temperature: 58,
      uptime: 86400,
      discoveryMethod: "mdns"
    },
    {
      id: "node-3",
      name: "Pi Worker 2",
      ip: "192.168.1.102",
      status: "warning",
      role: "worker",
      clusterId: "k8s-prod",
      clusterName: "Kubernetes Production",
      cpu: 92,
      memory: 88,
      disk: 78,
      temperature: 68,
      uptime: 43200,
      discoveryMethod: "mdns"
    },
    {
      id: "node-4",
      name: "Pi Storage",
      ip: "192.168.1.103",
      status: "online",
      role: "storage",
      clusterId: "docker-1",
      clusterName: "Docker Swarm",
      cpu: 25,
      memory: 30,
      disk: 85,
      temperature: 45,
      uptime: 172800,
      discoveryMethod: "manual"
    },
    {
      id: "node-5",
      name: "Pi Dev",
      ip: "192.168.1.104",
      status: "offline",
      role: "worker",
      clusterId: "nomad-cluster",
      clusterName: "Nomad Cluster",
      cpu: 0,
      memory: 0,
      disk: 0,
      temperature: 0,
      uptime: 0,
      discoveryMethod: "dhcp"
    }
  ]);

  // Filter nodes
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         node.ip.includes(searchQuery) ||
                         node.clusterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || node.status === statusFilter;
    const matchesRole = roleFilter === "all" || node.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "default";
      case "warning": return "secondary";
      case "offline": return "destructive";
      default: return "outline";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "master": return "default";
      case "worker": return "secondary";
      case "storage": return "outline";
      default: return "outline";
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "Offline";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const onlineCount = nodes.filter(n => n.status === "online").length;
  const warningCount = nodes.filter(n => n.status === "warning").length;
  const offlineCount = nodes.filter(n => n.status === "offline").length;

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

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodes.length}</div>
            <p className="text-xs text-muted-foreground">Across all clusters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {onlineCount}
            </div>
            <p className="text-xs text-muted-foreground">Healthy nodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {warningCount}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {offlineCount}
            </div>
            <p className="text-xs text-muted-foreground">Unavailable</p>
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
        {filteredNodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No nodes found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNodes.map((node) => (
            <Card key={node.id} className="border-border/30 shadow-soft hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Node Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(node.status)}
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{node.name}</h3>
                        <Badge variant={getStatusColor(node.status)}>
                          {node.status}
                        </Badge>
                        <Badge variant={getRoleColor(node.role)}>
                          {node.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Network className="h-3.5 w-3.5" />
                          {node.ip}
                        </span>
                        <span>•</span>
                        <Link 
                          to={`/pi-controller/clusters/${node.clusterId}`}
                          className="hover:text-primary transition-colors"
                        >
                          {node.clusterName}
                        </Link>
                        <span>•</span>
                        <span>Uptime: {formatUptime(node.uptime)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {node.discoveryMethod}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Node Metrics */}
                  {node.status !== "offline" && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{node.cpu}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">CPU</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{node.memory}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Memory</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{node.disk}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Disk</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <Thermometer className={cn(
                            "h-3.5 w-3.5",
                            node.temperature >= 70 ? "text-red-500" : 
                            node.temperature >= 60 ? "text-yellow-500" : 
                            "text-muted-foreground"
                          )} />
                          <span className="font-medium">{node.temperature}°C</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Temp</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link to={`/pi-controller/clusters/${node.clusterId}/nodes/${node.id}`}>
                      <Button size="sm" variant="outline">
                        <Activity className="h-3.5 w-3.5 mr-1.5" />
                        Monitor
                      </Button>
                    </Link>
                    
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Nodes;