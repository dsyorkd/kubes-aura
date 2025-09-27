import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Sparkles, 
  Settings, 
  Shield,
  Zap,
  Server,
  HardDrive,
  Cpu
} from "lucide-react";

interface CreateClusterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

const regions = {
  AWS: ["us-west-1", "us-west-2", "us-east-1", "us-east-2", "eu-central-1", "eu-west-1", "ap-southeast-1"],
  GCP: ["us-central1", "us-west1", "us-east1", "europe-west1", "asia-southeast1"],
  Azure: ["eastus", "westus", "centralus", "northeurope", "westeurope", "southeastasia"],
};

const versions = ["1.29.0", "1.28.5", "1.27.8", "1.26.11"];

export function CreateClusterDialog({ open, onOpenChange, onSubmit }: CreateClusterDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    provider: "AWS",
    region: "us-west-2",
    version: "1.29.0",
    nodes: 3,
    nodeType: "t3.medium",
    autoScale: true,
    monitoring: true,
    backup: false,
  });

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      name: "",
      provider: "AWS",
      region: "us-west-2",
      version: "1.29.0",
      nodes: 3,
      nodeType: "t3.medium",
      autoScale: true,
      monitoring: true,
      backup: false,
    });
  };

  const nodeTypes = {
    AWS: [
      { name: "t3.medium", cpu: 2, memory: 4, cost: "$0.042/hr" },
      { name: "t3.large", cpu: 2, memory: 8, cost: "$0.084/hr" },
      { name: "t3.xlarge", cpu: 4, memory: 16, cost: "$0.168/hr" },
      { name: "m5.large", cpu: 2, memory: 8, cost: "$0.096/hr" },
      { name: "m5.xlarge", cpu: 4, memory: 16, cost: "$0.192/hr" },
    ],
    GCP: [
      { name: "e2-medium", cpu: 2, memory: 4, cost: "$0.034/hr" },
      { name: "e2-standard-2", cpu: 2, memory: 8, cost: "$0.067/hr" },
      { name: "e2-standard-4", cpu: 4, memory: 16, cost: "$0.134/hr" },
    ],
    Azure: [
      { name: "Standard_B2s", cpu: 2, memory: 4, cost: "$0.042/hr" },
      { name: "Standard_B2ms", cpu: 2, memory: 8, cost: "$0.084/hr" },
      { name: "Standard_B4ms", cpu: 4, memory: 16, cost: "$0.168/hr" },
    ],
  };

  const selectedNodeType = nodeTypes[formData.provider as keyof typeof nodeTypes].find(
    (nt) => nt.name === formData.nodeType
  ) || nodeTypes[formData.provider as keyof typeof nodeTypes][0];

  const estimatedCost = (
    parseFloat(selectedNodeType.cost.replace("$", "").replace("/hr", "")) * 
    formData.nodes * 
    730
  ).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Create New Cluster
          </DialogTitle>
          <DialogDescription>
            Deploy a new Kubernetes cluster with your preferred configuration
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-2">
              <Settings className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="compute" className="gap-2">
              <Cpu className="h-4 w-4" />
              Compute
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Shield className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cluster Name</Label>
              <Input
                id="name"
                placeholder="my-cluster"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Cloud Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => {
                    const firstRegion = regions[value as keyof typeof regions][0];
                    const firstNodeType = nodeTypes[value as keyof typeof nodeTypes][0].name;
                    setFormData({ 
                      ...formData, 
                      provider: value, 
                      region: firstRegion,
                      nodeType: firstNodeType 
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AWS">☁️ AWS</SelectItem>
                    <SelectItem value="GCP">🔷 Google Cloud</SelectItem>
                    <SelectItem value="Azure">⚡ Azure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions[formData.provider as keyof typeof regions].map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Kubernetes Version</Label>
              <Select
                value={formData.version}
                onValueChange={(value) => setFormData({ ...formData, version: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version} value={version}>
                      v{version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="compute" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="nodes">Number of Nodes</Label>
                <span className="text-sm font-medium">{formData.nodes}</span>
              </div>
              <Slider
                id="nodes"
                min={1}
                max={20}
                step={1}
                value={[formData.nodes]}
                onValueChange={([value]) => setFormData({ ...formData, nodes: value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nodeType">Node Type</Label>
              <Select
                value={formData.nodeType}
                onValueChange={(value) => setFormData({ ...formData, nodeType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes[formData.provider as keyof typeof nodeTypes].map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{type.name}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{type.cpu} vCPU</span>
                          <span>{type.memory}GB RAM</span>
                          <Badge variant="secondary">{type.cost}</Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Resource Summary</span>
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total vCPUs</div>
                  <div className="font-semibold">{selectedNodeType.cpu * formData.nodes}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Memory</div>
                  <div className="font-semibold">{selectedNodeType.memory * formData.nodes}GB</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Est. Monthly</div>
                  <div className="font-semibold text-primary">${estimatedCost}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoScale">Auto-scaling</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically scale nodes based on demand
                  </p>
                </div>
                <Switch
                  id="autoScale"
                  checked={formData.autoScale}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoScale: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="monitoring">Monitoring & Logging</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable Prometheus and Grafana monitoring
                  </p>
                </div>
                <Switch
                  id="monitoring"
                  checked={formData.monitoring}
                  onCheckedChange={(checked) => setFormData({ ...formData, monitoring: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="backup">Automated Backups</Label>
                  <p className="text-xs text-muted-foreground">
                    Daily automated backup of cluster state
                  </p>
                </div>
                <Switch
                  id="backup"
                  checked={formData.backup}
                  onCheckedChange={(checked) => setFormData({ ...formData, backup: checked })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.name}
            className="bg-gradient-primary text-white hover:opacity-90"
          >
            Create Cluster
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}