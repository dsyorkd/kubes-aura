import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Wifi,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Radio,
  Network,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  MapPin,
} from "lucide-react";
import { DiscoveredNode, NodeDiscoveryStatus, NodeDiscoveryMethod } from "@/types/pi-controller";
import { toast } from "sonner";

interface NodeDiscoveryPanelProps {
  selectedNodes: string[];
  onSelectionChange: (nodeIds: string[]) => void;
  onManualAdd: () => void;
}

// Mock discovery function - replace with actual API call
const discoverNodes = async (method: NodeDiscoveryMethod): Promise<DiscoveredNode[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock data - replace with actual mDNS/DHCP discovery
  const mockNodes: DiscoveredNode[] = [
    {
      id: "node-1",
      hostname: "pi-controller-01",
      ipAddress: "192.168.1.101",
      macAddress: "b8:27:eb:a1:b2:c3",
      discoveryMethod: "mdns",
      discoveryStatus: "identified",
      discoveredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      piControllerInfo: {
        version: "1.2.3",
        apiPort: 8080,
        isHealthy: true,
        capabilities: ["gpio", "cluster", "monitoring"],
      },
      systemInfo: {
        model: "Raspberry Pi 4 Model B",
        osVersion: "Raspbian GNU/Linux 11",
        architecture: "aarch64",
        cpuCores: 4,
        totalMemory: 8192,
        totalStorage: 128,
      },
      networkInfo: {
        openPorts: [22, 80, 8080],
        services: ["ssh", "http", "pi-controller"],
        latency: 2,
      },
    },
    {
      id: "node-2",
      hostname: "pi-worker-02",
      ipAddress: "192.168.1.102",
      macAddress: "b8:27:eb:d4:e5:f6",
      discoveryMethod: "mdns",
      discoveryStatus: "identified",
      discoveredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      piControllerInfo: {
        version: "1.2.3",
        apiPort: 8080,
        isHealthy: true,
        capabilities: ["gpio", "cluster"],
      },
      systemInfo: {
        model: "Raspberry Pi 4 Model B",
        osVersion: "Raspbian GNU/Linux 11",
        architecture: "aarch64",
        cpuCores: 4,
        totalMemory: 4096,
        totalStorage: 64,
      },
      networkInfo: {
        openPorts: [22, 8080],
        services: ["ssh", "pi-controller"],
        latency: 3,
      },
    },
    {
      id: "node-3",
      hostname: "raspberrypi",
      ipAddress: "192.168.1.105",
      macAddress: "b8:27:eb:12:34:56",
      discoveryMethod: "dhcp",
      discoveryStatus: "discovered",
      discoveredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      systemInfo: {
        model: "Raspberry Pi 3 Model B+",
        osVersion: "Unknown",
        architecture: "Unknown",
        cpuCores: 4,
        totalMemory: 1024,
        totalStorage: 32,
      },
      networkInfo: {
        openPorts: [22],
        services: ["ssh"],
        latency: 5,
      },
    },
  ];
  
  return mockNodes;
};

const getStatusIcon = (status: NodeDiscoveryStatus) => {
  switch (status) {
    case "identified":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "discovered":
      return <Radio className="h-4 w-4 text-blue-500" />;
    case "unresponsive":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "manual":
      return <Plus className="h-4 w-4 text-purple-500" />;
    case "connected":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
};

const getStatusLabel = (status: NodeDiscoveryStatus) => {
  switch (status) {
    case "identified":
      return "Pi-Controller Active";
    case "discovered":
      return "Discovered";
    case "unresponsive":
      return "Unresponsive";
    case "manual":
      return "Manual Entry";
    case "connected":
      return "Connected";
  }
};

const getStatusVariant = (status: NodeDiscoveryStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "identified":
    case "connected":
      return "default";
    case "discovered":
      return "secondary";
    case "unresponsive":
      return "destructive";
    case "manual":
      return "outline";
  }
};

export default function NodeDiscoveryPanel({
  selectedNodes,
  onSelectionChange,
  onManualAdd,
}: NodeDiscoveryPanelProps) {
  const [isDiscovering, setIsDiscovering] = useState(true);
  const [discoveredNodes, setDiscoveredNodes] = useState<DiscoveredNode[]>([]);

  useEffect(() => {
    performDiscovery();
  }, []);

  const performDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const nodes = await discoverNodes("mdns");
      setDiscoveredNodes(nodes);
      toast.success(`Discovered ${nodes.length} nodes`);
    } catch (error) {
      toast.error("Failed to discover nodes");
      console.error(error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleNodeToggle = (nodeId: string) => {
    const isSelected = selectedNodes.includes(nodeId);
    if (isSelected) {
      onSelectionChange(selectedNodes.filter(id => id !== nodeId));
    } else {
      onSelectionChange([...selectedNodes, nodeId]);
    }
  };

  const handleSelectAll = () => {
    // Only select nodes with pi-controller running
    const piControllerNodes = discoveredNodes
      .filter(node => node.piControllerInfo)
      .map(node => node.id);
    onSelectionChange(piControllerNodes);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const piControllerCount = discoveredNodes.filter(n => n.piControllerInfo).length;
  const discoveredCount = discoveredNodes.filter(n => !n.piControllerInfo).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discovered Nodes</h3>
          <p className="text-sm text-muted-foreground">
            Select Raspberry Pi nodes to add to your cluster
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={performDiscovery}
            disabled={isDiscovering}
          >
            {isDiscovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onManualAdd}>
            <Plus className="h-4 w-4" />
            <span className="ml-2">Add Manual</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Pi-Controller</span>
              </div>
              <span className="text-2xl font-bold">{piControllerCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Discovered</span>
              </div>
              <span className="text-2xl font-bold">{discoveredCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Selected</span>
              </div>
              <span className="text-2xl font-bold">{selectedNodes.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {discoveredNodes.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {selectedNodes.length} of {piControllerCount} Pi-Controller nodes selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              Select All Pi-Controller
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4 space-y-4">
          {isDiscovering && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Scanning network for Raspberry Pi nodes...
                </p>
              </div>
            </div>
          )}

          {!isDiscovering && discoveredNodes.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <Network className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No nodes discovered. Try refreshing or add manually.
                </p>
              </div>
            </div>
          )}

          {!isDiscovering && discoveredNodes.map((node, index) => (
            <Card
              key={node.id}
              className={`transition-all ${
                selectedNodes.includes(node.id)
                  ? "ring-2 ring-primary border-primary"
                  : ""
              } ${!node.piControllerInfo ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedNodes.includes(node.id)}
                      onCheckedChange={() => handleNodeToggle(node.id)}
                      disabled={!node.piControllerInfo}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{node.hostname}</CardTitle>
                        {getStatusIcon(node.discoveryStatus)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusVariant(node.discoveryStatus)}>
                          {getStatusLabel(node.discoveryStatus)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {node.discoveryMethod.toUpperCase()}
                        </Badge>
                        {node.piControllerInfo && (
                          <Badge variant="secondary" className="text-xs">
                            v{node.piControllerInfo.version}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Network className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-mono">{node.ipAddress}</span>
                  </div>
                  {node.networkInfo && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Latency:</span>
                      <span>{node.networkInfo.latency}ms</span>
                    </div>
                  )}
                </div>

                {node.systemInfo && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        System Information
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Server className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{node.systemInfo.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {node.systemInfo.cpuCores} cores
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {(node.systemInfo.totalMemory / 1024).toFixed(1)}GB RAM
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {node.systemInfo.totalStorage}GB Storage
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {node.piControllerInfo && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Pi-Controller Capabilities
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {node.piControllerInfo.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {!node.piControllerInfo && (
                  <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Pi-Controller not detected. This node can be added manually after cluster creation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
