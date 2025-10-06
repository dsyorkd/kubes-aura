import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Server, Network, Shield, Terminal, Wifi } from "lucide-react";

const Documentation = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Documentation</h1>
        <p className="text-muted-foreground">
          Complete reference guide for Pi Controller
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                What is Pi Controller?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Pi Controller is a comprehensive management platform for Raspberry Pi clusters. It enables you to discover, 
                configure, and orchestrate multiple Pi devices from a single interface.
              </p>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Key Features:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Network className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Auto Discovery:</strong> mDNS and DHCP-based node detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Server className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Cluster Management:</strong> Create and manage K8s, Docker Swarm, or custom clusters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Terminal className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Hardware Monitoring:</strong> Real-time system metrics and GPIO control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-primary" />
                    <span><strong>Secure Access:</strong> SSH key or password-based authentication</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Installing Pi Controller
              </CardTitle>
              <CardDescription>Step-by-step installation guide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. Download the Binary</h3>
                <div className="bg-muted/50 rounded-md p-4 font-mono text-sm">
                  wget https://github.com/your-repo/pi-controller/releases/latest/download/pi-controller-arm64
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">2. Make it Executable</h3>
                <div className="bg-muted/50 rounded-md p-4 font-mono text-sm">
                  chmod +x pi-controller-arm64
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">3. Run the Service</h3>
                <div className="bg-muted/50 rounded-md p-4 font-mono text-sm">
                  sudo ./pi-controller-arm64 --config /etc/pi-controller/config.yaml
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">4. Access the Web Interface</h3>
                <p className="text-muted-foreground">
                  Open your browser and navigate to <code className="text-primary">http://&lt;raspberry-pi-ip&gt;:8080</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                API Reference
              </CardTitle>
              <CardDescription>REST API endpoints and WebSocket connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Pi Controller exposes a RESTful API for programmatic access. The OpenAPI specification 
                is available in the <code className="text-primary">api-spec</code> folder of your installation.
              </p>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Common Endpoints:</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-muted/50 rounded-md p-3">
                    <code className="text-primary">GET /api/v1/clusters</code>
                    <p className="text-muted-foreground mt-1">List all clusters</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    <code className="text-primary">POST /api/v1/clusters</code>
                    <p className="text-muted-foreground mt-1">Create a new cluster</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    <code className="text-primary">GET /api/v1/nodes/discover</code>
                    <p className="text-muted-foreground mt-1">Discover nodes on the network</p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    <code className="text-primary">WS /api/v1/hardware/metrics</code>
                    <p className="text-muted-foreground mt-1">WebSocket for real-time metrics</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Troubleshooting
              </CardTitle>
              <CardDescription>Common issues and solutions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Nodes Not Discovered</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Ensure all Pis are on the same network subnet</li>
                  <li>Check that mDNS/Avahi is enabled on each node</li>
                  <li>Verify firewall rules allow UDP port 5353</li>
                  <li>Try manual node entry with IP address</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Connection Failed</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Verify SSH is enabled on the target Pi</li>
                  <li>Check authentication credentials (password or SSH key)</li>
                  <li>Ensure pi-controller binary is running on the node</li>
                  <li>Check network connectivity with ping</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">High Resource Usage</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Review resource allocation in cluster configuration</li>
                  <li>Monitor individual node metrics on Hardware page</li>
                  <li>Consider reducing polling frequency for metrics</li>
                  <li>Upgrade to Raspberry Pi 4 or 5 for better performance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documentation;
