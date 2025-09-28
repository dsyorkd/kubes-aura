import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Server,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  Terminal,
  MoreHorizontal,
  Power,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  name: string;
  ip: string;
  status: "online" | "offline" | "warning";
  role: "master" | "worker" | "storage";
  cpu: number;
  memory: number;
  disk: number;
  temperature: number;
  uptime: number;
}

const ClusterDetails = () => {
  const { clusterId } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mock cluster data
  const cluster = {
    id: clusterId,
    name: "Production Cluster",
    status: "healthy",
    region: "us-west-2",
    provider: "On-Premise",
    version: "1.28.2",
    createdAt: "2024-01-15",
  };
  
  // Mock nodes data
  const [nodes, setNodes] = useState<Node[]>([
    { id: "node-1", name: "Pi Master", ip: "192.168.1.100", status: "online", role: "master", cpu: 45, memory: 62, disk: 40, temperature: 52, uptime: 86400 },
    { id: "node-2", name: "Pi Worker 1", ip: "192.168.1.101", status: "online", role: "worker", cpu: 78, memory: 45, disk: 35, temperature: 48, uptime: 86400 },
    { id: "node-3", name: "Pi Worker 2", ip: "192.168.1.102", status: "warning", role: "worker", cpu: 92, memory: 88, disk: 78, temperature: 65, uptime: 43200 },
    { id: "node-4", name: "Pi Storage", ip: "192.168.1.103", status: "online", role: "storage", cpu: 25, memory: 30, disk: 85, temperature: 45, uptime: 172800 },
  ]);
  
  const onlineNodes = nodes.filter(n => n.status === "online").length;
  const totalCpu = Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length);
  const totalMemory = Math.round(nodes.reduce((acc, n) => acc + n.memory, 0) / nodes.length);
  const totalDisk = Math.round(nodes.reduce((acc, n) => acc + n.disk, 0) / nodes.length);
  
  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };
  
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline": return <Power className="h-4 w-4 text-red-500" />;
      default: return null;
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
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm" className="h-8">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Clusters
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {cluster.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {cluster.region} • {nodes.length} nodes
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="h-8"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              
              <Button size="sm" variant="outline" className="h-8">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        {/* Cluster Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-lg font-semibold">Healthy</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {onlineNodes}/{nodes.length} nodes online
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{totalCpu}%</div>
              <Progress value={totalCpu} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          
          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{totalMemory}%</div>
              <Progress value={totalMemory} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          
          <Card className="border-border/30 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{totalDisk}%</div>
              <Progress value={totalDisk} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="nodes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
            <TabsTrigger value="workloads">Workloads</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nodes" className="space-y-4">
            <div className="grid gap-4">
              {nodes.map((node) => (
                <Card key={node.id} className="border-border/30 shadow-soft hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(node.status)}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{node.name}</h3>
                            <Badge variant={getRoleColor(node.role)} className="text-xs">
                              {node.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {node.ip} • Uptime: {formatUptime(node.uptime)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm">
                              <Cpu className="h-3.5 w-3.5" />
                              <span className="font-medium">{node.cpu}%</span>
                            </div>
                            <Progress value={node.cpu} className="mt-1 h-1 w-16" />
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm">
                              <MemoryStick className="h-3.5 w-3.5" />
                              <span className="font-medium">{node.memory}%</span>
                            </div>
                            <Progress value={node.memory} className="mt-1 h-1 w-16" />
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm">
                              <HardDrive className="h-3.5 w-3.5" />
                              <span className="font-medium">{node.disk}%</span>
                            </div>
                            <Progress value={node.disk} className="mt-1 h-1 w-16" />
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {node.temperature}°C
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link to={`/clusters/${clusterId}/nodes/${node.id}`}>
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