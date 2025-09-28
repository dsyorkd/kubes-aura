import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Power,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PiNode {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'error';
  role: 'master' | 'worker';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  temperature: number;
  uptime: number;
  lastSeen: string;
}

interface PiCluster {
  id: string;
  name: string;
  description: string;
  status: 'healthy' | 'warning' | 'critical';
  nodes: PiNode[];
  masterNode: string;
  createdAt: string;
  totalCpu: number;
  totalMemory: number;
  totalStorage: number;
}

const PiClusters = () => {
  const [selectedCluster, setSelectedCluster] = useState<string>("cluster-1");
  const [searchTerm, setSearchTerm] = useState("");
  const [clusters] = useState<PiCluster[]>([
    {
      id: "cluster-1",
      name: "Home Lab Cluster",
      description: "Main development and testing cluster",
      status: "healthy",
      masterNode: "pi-master-01",
      createdAt: "2024-01-15",
      totalCpu: 16,
      totalMemory: 32,
      totalStorage: 256,
      nodes: [
        {
          id: "pi-master-01",
          name: "Pi Master 01",
          hostname: "pi-master-01",
          ipAddress: "192.168.1.100",
          status: "online",
          role: "master",
          cpuUsage: 45,
          memoryUsage: 62,
          diskUsage: 35,
          temperature: 52,
          uptime: 86400,
          lastSeen: "2024-03-15T10:30:00Z"
        },
        {
          id: "pi-worker-01",
          name: "Pi Worker 01",
          hostname: "pi-worker-01",
          ipAddress: "192.168.1.101",
          status: "online",
          role: "worker",
          cpuUsage: 78,
          memoryUsage: 45,
          diskUsage: 68,
          temperature: 58,
          uptime: 72000,
          lastSeen: "2024-03-15T10:29:00Z"
        },
        {
          id: "pi-worker-02",
          name: "Pi Worker 02",
          hostname: "pi-worker-02",
          ipAddress: "192.168.1.102",
          status: "error",
          role: "worker",
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 45,
          temperature: 0,
          uptime: 0,
          lastSeen: "2024-03-15T08:15:00Z"
        },
        {
          id: "pi-worker-03",
          name: "Pi Worker 03",
          hostname: "pi-worker-03",
          ipAddress: "192.168.1.103",
          status: "online",
          role: "worker",
          cpuUsage: 23,
          memoryUsage: 38,
          diskUsage: 52,
          temperature: 49,
          uptime: 95000,
          lastSeen: "2024-03-15T10:30:00Z"
        }
      ]
    },
    {
      id: "cluster-2",
      name: "Production Cluster",
      description: "Production workload cluster",
      status: "warning",
      masterNode: "pi-prod-master",
      createdAt: "2024-02-01",
      totalCpu: 24,
      totalMemory: 48,
      totalStorage: 512,
      nodes: [
        {
          id: "pi-prod-master",
          name: "Pi Production Master",
          hostname: "pi-prod-master",
          ipAddress: "192.168.1.200",
          status: "online",
          role: "master",
          cpuUsage: 67,
          memoryUsage: 89,
          diskUsage: 45,
          temperature: 61,
          uptime: 172800,
          lastSeen: "2024-03-15T10:30:00Z"
        }
      ]
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return 'Offline';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const currentCluster = clusters.find(c => c.id === selectedCluster);
  const filteredNodes = currentCluster?.nodes.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.ipAddress.includes(searchTerm)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Pi Clusters
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Raspberry Pi clusters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/pi-controller">
                <Button variant="outline" size="sm" className="h-9">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              <Button size="sm" variant="outline" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              <Button size="sm" className="bg-gradient-primary text-white hover:opacity-90 h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Cluster List Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clusters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      selectedCluster === cluster.id && "bg-accent border-primary"
                    )}
                    onClick={() => setSelectedCluster(cluster.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{cluster.name}</h3>
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(cluster.status))} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {cluster.nodes.length} nodes
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{cluster.nodes.filter(n => n.status === 'online').length} online</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{cluster.nodes.filter(n => n.status === 'error').length} error</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {currentCluster && (
              <>
                {/* Cluster Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {currentCluster.name}
                          <Badge variant={currentCluster.status === 'healthy' ? 'default' : 'destructive'}>
                            {currentCluster.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{currentCluster.description}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentCluster.nodes.length}</div>
                        <p className="text-sm text-muted-foreground">Total Nodes</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentCluster.totalCpu}</div>
                        <p className="text-sm text-muted-foreground">Total Cores</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentCluster.totalMemory}GB</div>
                        <p className="text-sm text-muted-foreground">Total RAM</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentCluster.totalStorage}GB</div>
                        <p className="text-sm text-muted-foreground">Total Storage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Search and Filter */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search nodes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Node List */}
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredNodes.map((node) => (
                    <Card key={node.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(node.status)}
                            <div>
                              <CardTitle className="text-base">{node.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {node.hostname} • {node.ipAddress}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={node.role === 'master' ? 'default' : 'secondary'}>
                            {node.role}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* System Stats */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">CPU</span>
                            </div>
                            <span className="text-sm font-medium">{node.cpuUsage}%</span>
                          </div>
                          <Progress value={node.cpuUsage} className="h-2" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MemoryStick className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Memory</span>
                            </div>
                            <span className="text-sm font-medium">{node.memoryUsage}%</span>
                          </div>
                          <Progress value={node.memoryUsage} className="h-2" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Storage</span>
                            </div>
                            <span className="text-sm font-medium">{node.diskUsage}%</span>
                          </div>
                          <Progress value={node.diskUsage} className="h-2" />
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Temp: {node.temperature}°C</span>
                          <span>Uptime: {formatUptime(node.uptime)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            Monitor
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            SSH
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PiClusters;