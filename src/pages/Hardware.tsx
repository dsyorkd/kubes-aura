import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useNode, useNodes } from "@/api/hooks";
import {
  Cpu,
  Thermometer,
  HardDrive,
  Wifi,
  Zap,
  Activity,
  AlertCircle,
  Power,
  Edit,
  Plus,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GPIOPin {
  id: number;
  pin_number?: number;
  name: string;
  mode?: string;
  direction?: string;
  value: boolean;
  description?: string;
  category?: string;
}

interface NetworkInterface {
  name: string;
  address?: string;
  ip_address?: string;
  netmask?: string;
  family?: string;
  mac?: string;
  mac_address?: string;
  internal?: boolean;
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
  memory_free?: number;
  disk_usage?: number;
  disk_total?: number;
  disk_used?: number;
  temperature?: number;
  uptime?: number;
  gpio_pins?: GPIOPin[];
  network_interfaces?: NetworkInterface[];
  platform?: string;
  architecture?: string;
  cpu_model?: string;
  load_average?: number[];
}

const categoryColors: Record<string, string> = {
  led: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  button: "bg-green-500/10 text-green-500 border-green-500/20",
  sensor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  relay: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  custom: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function Hardware() {
  const { nodeId, clusterId } = useParams<{ nodeId: string; clusterId: string }>();
  const navigate = useNavigate();

  // Fetch node data with GPIO pins
  const {
    data: nodeData,
    isLoading,
    isError,
    error,
    refetch
  } = useNode(nodeId || "", {
    enabled: !!nodeId
  });

  // If no nodeId but we're on the hardware page, show node selection
  const { data: nodesResponse, isLoading: isLoadingNodes } = useNodes({ includeGpio: true }, {
    enabled: !nodeId
  });

  const nodes = nodesResponse?.data || [];

  // Redirect if no nodeId is provided and we have a clusterId
  useEffect(() => {
    if (!nodeId && clusterId) {
      navigate(`/pi-controller/clusters/${clusterId}`);
    }
  }, [nodeId, clusterId, navigate]);

  const togglePin = async (pinId: number) => {
    try {
      // TODO: Implement GPIO write API call
      toast.success(`GPIO Pin ${pinId} toggled`);
      refetch();
    } catch {
      toast.error("Failed to toggle pin");
    }
  };

  const refreshData = async () => {
    await refetch();
    toast.success("Hardware data refreshed");
  };

  // If no nodeId, show node selection
  if (!nodeId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hardware Control</h2>
          <p className="text-sm text-muted-foreground">Select a node to manage GPIO pins and hardware</p>
        </div>

        {isLoadingNodes ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : nodes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node: NodeData) => (
              <Card
                key={node.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/pi-controller/hardware/${node.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{node.hostname || node.name || `Node ${node.id}`}</h3>
                      <p className="text-sm text-muted-foreground">{node.ip_address || "N/A"}</p>
                    </div>
                    <Badge variant={node.status?.toLowerCase() === "online" ? "default" : "secondary"}>
                      {node.status || "Unknown"}
                    </Badge>
                  </div>
                  {node.gpio_pins && node.gpio_pins.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {node.gpio_pins.length} GPIO pins configured
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No nodes found. Add nodes to your cluster to manage hardware.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading hardware data</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : "Failed to fetch node data"}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !nodeData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
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

  const node = nodeData as NodeData;
  const pins: GPIOPin[] = node.gpio_pins || [];
  const networkInterfaces: NetworkInterface[] = node.network_interfaces || [];

  const memoryUsage = node.memory_usage ?? (
    node.memory_total && node.memory_free
      ? ((node.memory_total - node.memory_free) / node.memory_total) * 100
      : 0
  );

  const cpuTemp = node.temperature ?? 0;
  const loadAverage = node.load_average || [0, 0, 0];
  const uptime = node.uptime || 0;

  const getNodeName = () => node.hostname || node.name || `Node ${node.id}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => clusterId
              ? navigate(`/pi-controller/clusters/${clusterId}/nodes/${nodeId}`)
              : navigate(-1)
            }
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Node
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Hardware Control - {getNodeName()}</h2>
          <p className="text-sm text-muted-foreground">GPIO pins, system resources, and hardware monitoring</p>
        </div>
        <Button onClick={refreshData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cpuTemp > 0 ? `${cpuTemp}°C` : "N/A"}</div>
            {cpuTemp > 0 && <Progress value={(cpuTemp / 85) * 100} className="mt-2" />}
            <p className="text-xs text-muted-foreground mt-2">
              {cpuTemp === 0 ? "No data" : cpuTemp < 60 ? "Normal" : cpuTemp < 75 ? "Warm" : "Hot"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryUsage.toFixed(1)}%</div>
            <Progress value={memoryUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {node.memory_free ? `${node.memory_free}MB free` : `${memoryUsage.toFixed(0)}% used`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{node.cpu_usage?.toFixed(1) || loadAverage[0]?.toFixed(2) || "0"}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {loadAverage.length > 0
                ? `1m: ${loadAverage[0]?.toFixed(2)} | 5m: ${loadAverage[1]?.toFixed(2)} | 15m: ${loadAverage[2]?.toFixed(2)}`
                : "No load data"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uptime > 0 ? `${Math.floor(uptime / 86400)}d` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {uptime > 0
                ? `${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
                : "No uptime data"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gpio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gpio">GPIO Pins</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="gpio" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>GPIO Pin Control</CardTitle>
                  <CardDescription>Manage and monitor GPIO pins</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Pin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pins.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {pins.map((pin) => (
                      <Card key={pin.id} className="hover-scale">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                <Zap className={`h-5 w-5 ${pin.value ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                                <span className="text-xs font-mono font-bold">GPIO {pin.pin_number || pin.id}</span>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{pin.name}</h4>
                                  {pin.category && (
                                    <Badge variant="outline" className={categoryColors[pin.category] || categoryColors.custom}>
                                      {pin.category}
                                    </Badge>
                                  )}
                                  <Badge variant="outline">
                                    {pin.mode || pin.direction || "unknown"}
                                  </Badge>
                                </div>
                                {pin.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{pin.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {(pin.mode === "output" || pin.direction === "output") ? (
                                <Switch
                                  checked={pin.value}
                                  onCheckedChange={() => togglePin(pin.id)}
                                  disabled={isLoading}
                                />
                              ) : (
                                <Badge variant={pin.value ? "default" : "secondary"}>
                                  {pin.value ? "HIGH" : "LOW"}
                                </Badge>
                              )}
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center">
                    <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No GPIO pins configured</p>
                    <p className="text-sm">Add GPIO pin configurations to control hardware</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hostname:</span>
                  <span className="font-mono font-medium">{node.hostname || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-mono">{node.platform || "linux"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Architecture:</span>
                  <span className="font-mono">{node.architecture || "arm64"}</span>
                </div>
                {node.cpu_model && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CPU Model:</span>
                    <span className="font-mono">{node.cpu_model}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-mono">{node.ip_address || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Memory Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {node.memory_total && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Memory:</span>
                    <span className="font-mono font-medium">{node.memory_total} MB</span>
                  </div>
                )}
                {node.memory_free !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Free Memory:</span>
                    <span className="font-mono">{node.memory_free} MB</span>
                  </div>
                )}
                {node.memory_used !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used Memory:</span>
                    <span className="font-mono">{node.memory_used} MB</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage:</span>
                  <span className="font-mono">{memoryUsage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No system alerts</p>
                  <p className="text-sm">All systems operating normally</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Interfaces
              </CardTitle>
              <CardDescription>Active network connections</CardDescription>
            </CardHeader>
            <CardContent>
              {networkInterfaces.length > 0 ? (
                <div className="space-y-4">
                  {networkInterfaces.map((iface, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold font-mono">{iface.name}</h4>
                              <Badge variant={iface.internal ? "secondary" : "default"}>
                                {iface.internal ? "Internal" : "External"}
                              </Badge>
                              {iface.family && <Badge variant="outline">{iface.family}</Badge>}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">IP Address:</span>
                                <span className="font-mono">{iface.address || iface.ip_address || "N/A"}</span>
                              </div>
                              {iface.netmask && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Netmask:</span>
                                  <span className="font-mono">{iface.netmask}</span>
                                </div>
                              )}
                              {(iface.mac || iface.mac_address) && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">MAC Address:</span>
                                  <span className="font-mono">{iface.mac || iface.mac_address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Wifi className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No network interface data</p>
                    <p className="text-sm">Network information unavailable</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
