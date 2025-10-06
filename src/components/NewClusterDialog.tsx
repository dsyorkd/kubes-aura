import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import NodeDiscoveryPanel from "@/components/NodeDiscoveryPanel";
import ManualNodeEntryDialog from "@/components/ManualNodeEntryDialog";
import { ManualNodeEntry, DiscoveredNode } from "@/types/pi-controller";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Network,
  Container,
  Server,
  Cloud,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Cpu,
  HardDrive,
  Zap,
} from "lucide-react";

const clusterSchema = z.object({
  type: z.enum(["kubernetes", "docker", "nomad", "custom"]),
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().max(200),
  region: z.string().min(1, "Region is required"),
  nodeCount: z.number().min(1).max(100),
  cpuPerNode: z.number().min(1).max(32),
  memoryPerNode: z.number().min(1).max(128),
  storagePerNode: z.number().min(10).max(1000),
  autoScaling: z.boolean(),
  highAvailability: z.boolean(),
});

type ClusterFormData = z.infer<typeof clusterSchema>;

const clusterTypes = [
  {
    id: "kubernetes",
    name: "Kubernetes",
    description: "Container orchestration platform for automated deployment and scaling",
    icon: Network,
    features: ["Auto-scaling", "Load balancing", "Self-healing", "Rolling updates"],
    difficulty: "Advanced",
  },
  {
    id: "docker",
    name: "Docker Swarm",
    description: "Native Docker clustering and orchestration solution",
    icon: Container,
    features: ["Simple setup", "Docker native", "Service discovery", "Load balancing"],
    difficulty: "Intermediate",
  },
  {
    id: "nomad",
    name: "HashiCorp Nomad",
    description: "Flexible workload orchestrator for containers and non-containerized apps",
    icon: Cloud,
    features: ["Multi-datacenter", "Flexible", "Lightweight", "VM support"],
    difficulty: "Intermediate",
  },
  {
    id: "custom",
    name: "Custom Cluster",
    description: "Configure your own custom cluster with specific requirements",
    icon: Server,
    features: ["Full control", "Custom config", "Flexible topology", "Any workload"],
    difficulty: "Expert",
  },
];

const regions = [
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "local", label: "Local Network" },
];

interface NewClusterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewClusterDialog({ open, onOpenChange }: NewClusterDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualNodes, setManualNodes] = useState<ManualNodeEntry[]>([]);

  const form = useForm<ClusterFormData>({
    resolver: zodResolver(clusterSchema),
    defaultValues: {
      type: "kubernetes",
      name: "",
      description: "",
      region: "",
      nodeCount: 3,
      cpuPerNode: 4,
      memoryPerNode: 8,
      storagePerNode: 100,
      autoScaling: true,
      highAvailability: false,
    },
  });

  const onSubmit = async (data: ClusterFormData) => {
    console.log("Creating cluster:", data);
    toast.success(`Creating ${data.name} cluster...`);
    
    // Simulate cluster creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Cluster created successfully!");
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType("");
    form.reset();
  };

  const handleNext = () => {
    if (step === 1 && !selectedType) {
      toast.error("Please select a cluster type");
      return;
    }
    if (step === 4 && selectedNodes.length === 0) {
      toast.error("Please select at least one node");
      return;
    }
    if (step < 5) setStep(step + 1);
  };

  const handleManualNodeAdd = (node: ManualNodeEntry) => {
    setManualNodes([...manualNodes, node]);
    toast.success("Manual node added successfully");
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    form.setValue("type", typeId as any);
  };

  const totalCpu = form.watch("nodeCount") * form.watch("cpuPerNode");
  const totalMemory = form.watch("nodeCount") * form.watch("memoryPerNode");
  const totalStorage = form.watch("nodeCount") * form.watch("storagePerNode");

  const progressPercentage = (step / 5) * 100;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Cluster</DialogTitle>
          <DialogDescription>
            Step {step} of 5: {
              step === 1 ? "Choose Type" : 
              step === 2 ? "Basic Information" : 
              step === 3 ? "Configuration" : 
              step === 4 ? "Select Nodes" :
              "Review"
            }
          </DialogDescription>
          <Progress value={progressPercentage} className="mt-2" />
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Select Cluster Type</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {clusterTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover-scale ${
                      selectedType === type.id
                        ? "ring-2 ring-primary border-primary"
                        : ""
                    }`}
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <type.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{type.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {type.difficulty}
                            </Badge>
                          </div>
                        </div>
                        {selectedType === type.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {type.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Cluster Name *</Label>
                  <Input
                    id="name"
                    placeholder="my-production-cluster"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this cluster..."
                    rows={3}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="region">Region *</Label>
                  <Select
                    value={form.watch("region")}
                    onValueChange={(value) => form.setValue("region", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.region && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.region.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Cluster Configuration</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nodeCount">Number of Nodes</Label>
                  <Input
                    id="nodeCount"
                    type="number"
                    min={1}
                    max={100}
                    {...form.register("nodeCount", { valueAsNumber: true })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cpuPerNode">CPU per Node (cores)</Label>
                  <Input
                    id="cpuPerNode"
                    type="number"
                    min={1}
                    max={32}
                    {...form.register("cpuPerNode", { valueAsNumber: true })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="memoryPerNode">Memory per Node (GB)</Label>
                  <Input
                    id="memoryPerNode"
                    type="number"
                    min={1}
                    max={128}
                    {...form.register("memoryPerNode", { valueAsNumber: true })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="storagePerNode">Storage per Node (GB)</Label>
                  <Input
                    id="storagePerNode"
                    type="number"
                    min={10}
                    max={1000}
                    {...form.register("storagePerNode", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Total Resources</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total CPU</span>
                    </div>
                    <span className="font-semibold">{totalCpu} cores</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Memory</span>
                    </div>
                    <span className="font-semibold">{totalMemory} GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Storage</span>
                    </div>
                    <span className="font-semibold">{totalStorage} GB</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Node Selection */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <NodeDiscoveryPanel
                selectedNodes={selectedNodes}
                onSelectionChange={setSelectedNodes}
                onManualAdd={() => setManualDialogOpen(true)}
              />
              
              {manualNodes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Manually Added Nodes</h4>
                  <div className="space-y-2">
                    {manualNodes.map((node, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{node.hostname}</p>
                          <p className="text-sm text-muted-foreground">{node.ipAddress}</p>
                        </div>
                        {node.label && (
                          <Badge variant="secondary">{node.label}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Review Configuration</h3>
              
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cluster Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{form.watch("type")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{form.watch("name")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span className="font-medium">
                        {regions.find(r => r.value === form.watch("region"))?.label}
                      </span>
                    </div>
                    {form.watch("description") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Description:</span>
                        <span className="font-medium">{form.watch("description")}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Selected Nodes</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Nodes:</span>
                      <span className="font-medium">{selectedNodes.length + manualNodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto-discovered:</span>
                      <span className="font-medium">{selectedNodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manual entries:</span>
                      <span className="font-medium">{manualNodes.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resource Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nodes:</span>
                      <span className="font-medium">{form.watch("nodeCount")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total CPU:</span>
                      <span className="font-medium">{totalCpu} cores</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Memory:</span>
                      <span className="font-medium">{totalMemory} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Storage:</span>
                      <span className="font-medium">{totalStorage} GB</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < 5 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit">
                Create Cluster
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </DialogFooter>
        </form>

        <ManualNodeEntryDialog
          open={manualDialogOpen}
          onOpenChange={setManualDialogOpen}
          onAdd={handleManualNodeAdd}
        />
      </DialogContent>
    </Dialog>
  );
}
