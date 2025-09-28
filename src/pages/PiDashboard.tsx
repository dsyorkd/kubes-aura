import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ArrowLeft,
  Users,
  Server,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemStats {
  cpu: { usage: number; temperature: number; frequency: number; };
  memory: { total: number; used: number; free: number; percentage: number; };
  disk: { total: number; used: number; free: number; percentage: number; };
  network: { rx: number; tx: number; speed: number; };
  uptime: number;
  timestamp: string;
}

interface GpioPin {
  id: number;
  name: string;
  direction: 'input' | 'output';
  value: boolean;
  description?: string;
}

const PiDashboard = () => {
  const { nodeId } = useParams();
  const [selectedNode, setSelectedNode] = useState(nodeId || "node-1");
  
  // Mock node data - in real app this would come from API
  const nodes = [
    { id: "node-1", name: "Pi Master", ip: "192.168.1.100", status: "online", role: "master" },
    { id: "node-2", name: "Pi Worker 1", ip: "192.168.1.101", status: "online", role: "worker" },
    { id: "node-3", name: "Pi Worker 2", ip: "192.168.1.102", status: "warning", role: "worker" },
    { id: "node-4", name: "Pi Storage", ip: "192.168.1.103", status: "online", role: "storage" },
  ];
  
  const currentNode = nodes.find(n => n.id === selectedNode) || nodes[0];
  
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: { usage: 45, temperature: 52, frequency: 1500 },
    memory: { total: 4096, used: 1842, free: 2254, percentage: 45 },
    disk: { total: 32000, used: 12800, free: 19200, percentage: 40 },
    network: { rx: 1024, tx: 512, speed: 1000 },
    uptime: 86400,
    timestamp: new Date().toISOString(),
  });

  const [gpioPins, setGpioPins] = useState<GpioPin[]>([
    { id: 2, name: "LED Red", direction: "output", value: false, description: "Status LED" },
    { id: 3, name: "LED Green", direction: "output", value: true, description: "Power LED" },
    { id: 4, name: "Button 1", direction: "input", value: false, description: "Reset Button" },
    { id: 17, name: "Relay 1", direction: "output", value: false, description: "Main Relay" },
    { id: 18, name: "Sensor", direction: "input", value: true, description: "Motion Sensor" },
    { id: 27, name: "Fan", direction: "output", value: false, description: "Cooling Fan" },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSystemStats(prev => ({
      ...prev,
      cpu: { ...prev.cpu, usage: Math.random() * 100 },
      memory: { ...prev.memory, percentage: Math.random() * 100 },
      timestamp: new Date().toISOString(),
    }));
    setIsRefreshing(false);
  };

  const toggleGpioPin = (pinId: number) => {
    setGpioPins(pins => pins.map(pin =>
      pin.id === pinId && pin.direction === 'output'
        ? { ...pin, value: !pin.value }
        : pin
    ));
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "destructive";
    if (value >= thresholds.warning) return "secondary";
    return "default";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Node Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentNode.name} - {currentNode.ip}
                  </p>
                </div>
              </div>
              
              {/* Node Selector */}
              <Select value={selectedNode} onValueChange={setSelectedNode}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          node.status === "online" && "bg-green-500",
                          node.status === "warning" && "bg-yellow-500",
                          node.status === "offline" && "bg-red-500"
                        )} />
                        <span>{node.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {node.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/pi-controller/clusters">
                <Button variant="outline" size="sm" className="h-9">
                  <Network className="h-4 w-4 mr-2" />
                  Cluster View
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="h-9"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>

              <Button size="sm" variant="outline" className="h-9">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Node Status Badge */}
        <div className="mb-6 flex items-center gap-4">
          <Badge 
            variant={currentNode.status === "online" ? "default" : currentNode.status === "warning" ? "secondary" : "destructive"}
            className="px-3 py-1"
          >
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              currentNode.status === "online" && "bg-green-500",
              currentNode.status === "warning" && "bg-yellow-500",
              currentNode.status === "offline" && "bg-red-500"
            )} />
            {currentNode.status === "online" ? "Online" : currentNode.status === "warning" ? "Warning" : "Offline"}
          </Badge>
          <Badge variant="outline">{currentNode.role}</Badge>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Node Overview</TabsTrigger>
            <TabsTrigger value="gpio">GPIO Control</TabsTrigger>
            <TabsTrigger value="monitoring">Node Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* CPU Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.cpu.usage.toFixed(1)}%</div>
                  <Progress value={systemStats.cpu.usage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Temp: {systemStats.cpu.temperature}°C
                  </p>
                </CardContent>
              </Card>

              {/* Memory Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory</CardTitle>
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.memory.percentage.toFixed(1)}%</div>
                  <Progress value={systemStats.memory.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatBytes(systemStats.memory.used)} / {formatBytes(systemStats.memory.total)}
                  </p>
                </CardContent>
              </Card>

              {/* Disk Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.disk.percentage.toFixed(1)}%</div>
                  <Progress value={systemStats.disk.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatBytes(systemStats.disk.used)} / {formatBytes(systemStats.disk.total)}
                  </p>
                </CardContent>
              </Card>

              {/* Network Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.network.speed} Mbps</div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>↓ {formatBytes(systemStats.network.rx)}/s</span>
                    <span>↑ {formatBytes(systemStats.network.tx)}/s</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>Node Information</CardTitle>
                <CardDescription>Status and metrics for {currentNode.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Power className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Uptime: {formatUptime(systemStats.uptime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">CPU Temp: {systemStats.cpu.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Frequency: {systemStats.cpu.frequency} MHz</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gpio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>GPIO Pin Control - {currentNode.name}</CardTitle>
                <CardDescription>
                  Control and monitor GPIO pins on {currentNode.name} ({currentNode.ip})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {gpioPins.map((pin) => (
                    <Card key={pin.id} className="border border-border/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{pin.name}</h3>
                            <p className="text-sm text-muted-foreground">Pin {pin.id}</p>
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
                              onClick={() => toggleGpioPin(pin.id)}
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
                    <span className="text-sm">{currentNode.name} running normally</span>
                  </div>
                  {currentNode.status === "warning" && (
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