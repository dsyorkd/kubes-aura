import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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
} from "lucide-react";
import { GPIOPin, SystemInfo } from "@/types/pi-controller";
import { Progress } from "@/components/ui/progress";

// Mock data - replace with actual API calls
const mockGPIOPins: GPIOPin[] = [
  { id: 2, name: "LED Red", mode: "output", value: false, description: "Status LED", category: "led" },
  { id: 3, name: "LED Green", mode: "output", value: true, description: "Power LED", category: "led" },
  { id: 4, name: "LED Blue", mode: "output", value: false, description: "Activity LED", category: "led" },
  { id: 17, name: "Button 1", mode: "input", value: false, description: "Emergency stop", category: "button" },
  { id: 27, name: "Relay 1", mode: "output", value: false, description: "Main power relay", category: "relay" },
  { id: 22, name: "Temp Sensor", mode: "input", value: true, description: "DHT22 sensor", category: "sensor" },
  { id: 10, name: "Fan Control", mode: "output", value: true, description: "Cooling fan", category: "custom" },
  { id: 9, name: "Water Pump", mode: "output", value: false, description: "Cooling pump", category: "relay" },
];

const mockSystemInfo: SystemInfo = {
  hostname: "pi-controller-01",
  platform: "linux",
  architecture: "arm64",
  cpuModel: "ARM Cortex-A72",
  totalMemory: 4096,
  freeMemory: 2048,
  uptime: 345600,
  loadAverage: [0.5, 0.7, 0.9],
  networkInterfaces: [
    { name: "eth0", address: "192.168.1.100", netmask: "255.255.255.0", family: "IPv4", mac: "b8:27:eb:aa:bb:cc", internal: false },
    { name: "wlan0", address: "192.168.1.101", netmask: "255.255.255.0", family: "IPv4", mac: "b8:27:eb:dd:ee:ff", internal: false },
  ],
  processes: [],
};

const categoryColors = {
  led: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  button: "bg-green-500/10 text-green-500 border-green-500/20",
  sensor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  relay: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  custom: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function Hardware() {
  const [pins, setPins] = useState<GPIOPin[]>(mockGPIOPins);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>(mockSystemInfo);
  const [cpuTemp, setCpuTemp] = useState(45.2);
  const [isLoading, setIsLoading] = useState(false);

  const togglePin = async (pinId: number) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPins(prev => prev.map(pin => 
        pin.id === pinId && pin.mode === "output" 
          ? { ...pin, value: !pin.value }
          : pin
      ));
      
      toast.success(`GPIO Pin ${pinId} toggled`);
    } catch (error) {
      toast.error("Failed to toggle pin");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Hardware data refreshed");
    } finally {
      setIsLoading(false);
    }
  };

  const memoryUsage = ((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hardware Control</h2>
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
            <div className="text-2xl font-bold">{cpuTemp}°C</div>
            <Progress value={(cpuTemp / 85) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {cpuTemp < 60 ? "Normal" : cpuTemp < 75 ? "Warm" : "Hot"}
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
              {systemInfo.freeMemory}MB / {systemInfo.totalMemory}MB free
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.loadAverage[0].toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              1m: {systemInfo.loadAverage[0].toFixed(2)} | 5m: {systemInfo.loadAverage[1].toFixed(2)} | 15m: {systemInfo.loadAverage[2].toFixed(2)}
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
              {Math.floor(systemInfo.uptime / 86400)}d
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.floor((systemInfo.uptime % 86400) / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m
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
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {pins.map((pin) => (
                    <Card key={pin.id} className="hover-scale">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex flex-col items-center gap-1 min-w-[60px]">
                              <Zap className={`h-5 w-5 ${pin.value ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                              <span className="text-xs font-mono font-bold">GPIO {pin.id}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{pin.name}</h4>
                                <Badge variant="outline" className={categoryColors[pin.category]}>
                                  {pin.category}
                                </Badge>
                                <Badge variant="outline">
                                  {pin.mode}
                                </Badge>
                              </div>
                              {pin.description && (
                                <p className="text-sm text-muted-foreground mt-1">{pin.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {pin.mode === "output" ? (
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
                  <span className="font-mono font-medium">{systemInfo.hostname}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="font-mono">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Architecture:</span>
                  <span className="font-mono">{systemInfo.architecture}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU Model:</span>
                  <span className="font-mono">{systemInfo.cpuModel}</span>
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Memory:</span>
                  <span className="font-mono font-medium">{systemInfo.totalMemory} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Free Memory:</span>
                  <span className="font-mono">{systemInfo.freeMemory} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used Memory:</span>
                  <span className="font-mono">{systemInfo.totalMemory - systemInfo.freeMemory} MB</span>
                </div>
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
              <div className="space-y-4">
                {systemInfo.networkInterfaces.map((iface, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold font-mono">{iface.name}</h4>
                            <Badge variant={iface.internal ? "secondary" : "default"}>
                              {iface.internal ? "Internal" : "External"}
                            </Badge>
                            <Badge variant="outline">{iface.family}</Badge>
                          </div>
                          <div className="grid gap-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IP Address:</span>
                              <span className="font-mono">{iface.address}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Netmask:</span>
                              <span className="font-mono">{iface.netmask}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">MAC Address:</span>
                              <span className="font-mono">{iface.mac}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
