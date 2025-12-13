import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import NewClusterDialog from "@/components/NewClusterDialog";
import { useClusters } from "@/api/hooks";
import {
  Plus,
  Search,
  Network,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Container,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface Cluster {
  id: number | string;
  name: string;
  description?: string;
  type?: "kubernetes" | "docker" | "nomad" | "custom" | "k3s";
  status: string;
  node_count?: number;
  nodeCount?: number;
  online_nodes?: number;
  onlineNodes?: number;
  region?: string;
  created_at?: string;
  createdAt?: string;
}

const Clusters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewClusterOpen, setIsNewClusterOpen] = useState(false);

  // Fetch clusters from API
  const { data: clustersResponse, isLoading, isError, error, refetch } = useClusters();

  // Extract clusters from response
  const clusters: Cluster[] = clustersResponse?.data || [];

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "healthy":
      case "running":
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "provisioning":
      case "pending":
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "kubernetes":
      case "k3s":
        return <Network className="h-4 w-4" />;
      case "docker":
        return <Container className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const normalizeClusterType = (type?: string): string => {
    if (!type) return "custom";
    const lower = type.toLowerCase();
    if (lower === "k3s") return "kubernetes";
    return lower;
  };

  const filteredClusters = (type?: string) => {
    let filtered = clusters;
    if (type) {
      filtered = filtered.filter(c => normalizeClusterType(c.type) === type);
    }
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const getNodeCount = (cluster: Cluster) => cluster.node_count ?? cluster.nodeCount ?? 0;
  const getOnlineNodes = (cluster: Cluster) => cluster.online_nodes ?? cluster.onlineNodes ?? 0;

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
                <CardDescription>{cluster.description || "No description"}</CardDescription>
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
                <span className="ml-2 font-semibold">{getOnlineNodes(cluster)}/{getNodeCount(cluster)}</span>
              </div>
              <Badge variant="outline">{cluster.type || "k3s"}</Badge>
            </div>
            <span className="text-muted-foreground">{cluster.region || "local"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const ClusterCardSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  const countByType = (type?: string) => {
    if (!type) return clusters.length;
    return clusters.filter(c => normalizeClusterType(c.type) === type).length;
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clusters</h1>
            <p className="text-muted-foreground">Manage all your compute clusters</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading clusters</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : "Failed to fetch clusters from API"}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NewClusterDialog open={isNewClusterOpen} onOpenChange={setIsNewClusterOpen} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clusters</h1>
          <p className="text-muted-foreground">
            Manage all your compute clusters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsNewClusterOpen(true)} className="bg-gradient-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Cluster
          </Button>
        </div>
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
          <TabsTrigger value="all">All ({isLoading ? "..." : countByType()})</TabsTrigger>
          <TabsTrigger value="kubernetes">
            Kubernetes ({isLoading ? "..." : countByType("kubernetes")})
          </TabsTrigger>
          <TabsTrigger value="docker">
            Docker ({isLoading ? "..." : countByType("docker")})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Custom ({isLoading ? "..." : countByType("custom")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                <ClusterCardSkeleton />
                <ClusterCardSkeleton />
                <ClusterCardSkeleton />
              </>
            ) : filteredClusters().length > 0 ? (
              filteredClusters().map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {searchTerm ? "No clusters match your search" : "No clusters found. Create your first cluster to get started."}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="kubernetes" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                <ClusterCardSkeleton />
                <ClusterCardSkeleton />
              </>
            ) : filteredClusters("kubernetes").length > 0 ? (
              filteredClusters("kubernetes").map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No Kubernetes clusters found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docker" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <ClusterCardSkeleton />
            ) : filteredClusters("docker").length > 0 ? (
              filteredClusters("docker").map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No Docker clusters found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <ClusterCardSkeleton />
            ) : filteredClusters("custom").length > 0 ? (
              filteredClusters("custom").map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No custom clusters found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clusters;
