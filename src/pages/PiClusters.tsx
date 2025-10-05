import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainNavigation } from "@/components/MainNavigation";
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



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  All Pi Nodes
                </h1>
                <p className="text-sm text-muted-foreground">
                  {clusters.reduce((acc, c) => acc + c.nodes.length, 0)} nodes across {clusters.length} clusters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MainNavigation />
              
              <Button size="sm" className="bg-gradient-primary text-white hover:opacity-90 h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Remove sidebar, show all nodes in grid format */}
        <div className="space-y-6">
          {clusters.map((cluster) => (
            <Card key={cluster.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {cluster.name}
                      <Badge variant={cluster.status === 'healthy' ? 'default' : 'destructive'}>
                        {cluster.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {cluster.nodes.length} nodes • {cluster.nodes.filter(n => n.status === 'online').length} online
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cluster.nodes.map((node) => (
                    <Card key={node.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(node.status)}
                            <div>
                              <h3 className="font-semibold">{node.name}</h3>
                              <p className="text-sm text-muted-foreground">{node.ipAddress}</p>
                            </div>
                          </div>
                          <Badge variant={node.role === 'master' ? 'default' : 'secondary'}>
                            {node.role}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>CPU: {node.cpuUsage}%</span>
                            <span>Mem: {node.memoryUsage}%</span>
                          </div>
                          <Progress value={node.cpuUsage} className="h-1" />
                        </div>
                        
                        <Link to={`/pi-controller/node/${node.id}`}>
                          <Button size="sm" className="w-full">
                            <Activity className="h-3 w-3 mr-2" />
                            Monitor
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PiClusters;