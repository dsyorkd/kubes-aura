import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Network,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Container
} from "lucide-react";

interface Cluster {
  id: string;
  name: string;
  description: string;
  type: "kubernetes" | "docker" | "nomad" | "custom";
  status: "healthy" | "warning" | "critical" | "provisioning";
  nodeCount: number;
  onlineNodes: number;
  region: string;
  createdAt: string;
}

const mockClusters: Cluster[] = [
  {
    id: "k8s-1",
    name: "Production K8s",
    description: "Main Kubernetes production cluster",
    type: "kubernetes",
    status: "healthy",
    nodeCount: 12,
    onlineNodes: 12,
    region: "us-west-2",
    createdAt: "2024-01-15"
  },
  {
    id: "k8s-2",
    name: "Staging K8s",
    description: "Kubernetes staging environment",
    type: "kubernetes",
    status: "warning",
    nodeCount: 6,
    onlineNodes: 5,
    region: "us-east-1",
    createdAt: "2024-02-01"
  },
  {
    id: "docker-1",
    name: "Docker Swarm",
    description: "Docker Swarm for microservices",
    type: "docker",
    status: "healthy",
    nodeCount: 8,
    onlineNodes: 8,
    region: "eu-central-1",
    createdAt: "2024-01-20"
  },
  {
    id: "pi-1",
    name: "Home Lab Cluster",
    description: "Raspberry Pi development cluster",
    type: "custom",
    status: "healthy",
    nodeCount: 4,
    onlineNodes: 3,
    region: "local",
    createdAt: "2024-03-01"
  }
];

const Clusters = () => {
  const [clusters] = useState<Cluster[]>(mockClusters);
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "provisioning":
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "kubernetes":
        return <Network className="h-4 w-4" />;
      case "docker":
        return <Container className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const filteredClusters = (type?: string) => {
    let filtered = clusters;
    if (type) {
      filtered = filtered.filter(c => c.type === type);
    }
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const ClusterCard = ({ cluster }: { cluster: Cluster }) => (
    <Link to={`/pi-controller/clusters/${cluster.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getTypeIcon(cluster.type)}
              </div>
              <div>
                <CardTitle className="text-lg">{cluster.name}</CardTitle>
                <CardDescription>{cluster.description}</CardDescription>
              </div>
            </div>
            {getStatusIcon(cluster.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground">Nodes:</span>
                <span className="ml-2 font-semibold">{cluster.onlineNodes}/{cluster.nodeCount}</span>
              </div>
              <Badge variant="outline">{cluster.type}</Badge>
            </div>
            <span className="text-muted-foreground">{cluster.region}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clusters</h1>
          <p className="text-muted-foreground">
            Manage all your compute clusters
          </p>
        </div>
        <Button className="bg-gradient-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Cluster
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clusters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({clusters.length})</TabsTrigger>
          <TabsTrigger value="kubernetes">
            Kubernetes ({clusters.filter(c => c.type === "kubernetes").length})
          </TabsTrigger>
          <TabsTrigger value="docker">
            Docker ({clusters.filter(c => c.type === "docker").length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Custom ({clusters.filter(c => c.type === "custom").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClusters().map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kubernetes" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClusters("kubernetes").map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="docker" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClusters("docker").map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClusters("custom").map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clusters;
