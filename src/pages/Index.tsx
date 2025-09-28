import { useState } from "react";
import { Link } from "react-router-dom";
import { ClusterCard } from "@/components/ClusterCard";
import { ClusterOverview } from "@/components/ClusterOverview";
import { CreateClusterDialog } from "@/components/CreateClusterDialog";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3, List, Activity, Settings, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cluster {
  id: string;
  name: string;
  region: string;
  provider: string;
  status: "healthy" | "warning" | "critical" | "provisioning";
  nodes: number;
  pods: number;
  cpu: number;
  memory: number;
  version: string;
  createdAt: string;
}

const mockClusters: Cluster[] = [
  {
    id: "1",
    name: "production-us-west",
    region: "us-west-2",
    provider: "AWS",
    status: "healthy",
    nodes: 12,
    pods: 247,
    cpu: 72,
    memory: 85,
    version: "1.28.5",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "staging-eu",
    region: "eu-central-1",
    provider: "AWS",
    status: "warning",
    nodes: 8,
    pods: 156,
    cpu: 89,
    memory: 67,
    version: "1.28.5",
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "dev-cluster",
    region: "us-east-1",
    provider: "GCP",
    status: "healthy",
    nodes: 4,
    pods: 43,
    cpu: 45,
    memory: 52,
    version: "1.29.0",
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "analytics-cluster",
    region: "asia-southeast-1",
    provider: "Azure",
    status: "critical",
    nodes: 16,
    pods: 312,
    cpu: 95,
    memory: 92,
    version: "1.27.8",
    createdAt: "2023-12-10",
  },
  {
    id: "5",
    name: "ml-training",
    region: "us-west-1",
    provider: "GCP",
    status: "provisioning",
    nodes: 24,
    pods: 0,
    cpu: 0,
    memory: 0,
    version: "1.29.0",
    createdAt: "2024-03-01",
  },
];

const Index = () => {
  const [clusters, setClusters] = useState<Cluster[]>(mockClusters);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateCluster = (data: any) => {
    const newCluster: Cluster = {
      id: String(clusters.length + 1),
      name: data.name,
      region: data.region,
      provider: data.provider,
      status: "provisioning",
      nodes: 0,
      pods: 0,
      cpu: 0,
      memory: 0,
      version: data.version,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setClusters([...clusters, newCluster]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Cluster Manager
                </h1>
                <p className="text-sm text-muted-foreground">
                  {clusters.length} clusters across {new Set(clusters.map(c => c.region)).size} regions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/pi-controller">
                <Button variant="outline" size="sm" className="h-9">
                  <Cpu className="h-4 w-4 mr-2" />
                  Pi Controller
                </Button>
              </Link>

              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-primary text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Cluster
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <ClusterOverview clusters={clusters} />

      {/* Clusters Grid/List */}
      <div className="container mx-auto px-4 py-6">
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {clusters.map((cluster) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              viewMode={viewMode}
              isSelected={selectedCluster === cluster.id}
              onClick={() => setSelectedCluster(cluster.id === selectedCluster ? null : cluster.id)}
            />
          ))}
        </div>
      </div>

      <CreateClusterDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateCluster}
      />
    </div>
  );
};

export default Index;