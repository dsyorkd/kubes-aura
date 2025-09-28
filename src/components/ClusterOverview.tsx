import { Card } from "@/components/ui/card";
import { 
  Activity, 
  Server, 
  Box, 
  AlertTriangle,
  TrendingUp,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClusterOverviewProps {
  clusters: Array<{
    status: "healthy" | "warning" | "critical" | "provisioning";
    nodes: number;
    pods: number;
    region: string;
  }>;
}

export function ClusterOverview({ clusters }: ClusterOverviewProps) {
  const totalNodes = clusters.reduce((acc, c) => acc + c.nodes, 0);
  const totalPods = clusters.reduce((acc, c) => acc + c.pods, 0);
  const healthyClusters = clusters.filter(c => c.status === "healthy").length;
  const regions = new Set(clusters.map(c => c.region)).size;
  const issues = clusters.filter(c => c.status === "warning" || c.status === "critical").length;
  
  const stats = [
    {
      label: "Total Clusters",
      value: clusters.length,
      change: "+2",
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Nodes",
      value: totalNodes,
      change: "+15%",
      icon: Server,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Pods",
      value: totalPods.toLocaleString(),
      change: "+23%",
      icon: Box,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Healthy",
      value: `${healthyClusters}/${clusters.length}`,
      change: "100%",
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Regions",
      value: regions,
      change: "Active",
      icon: Globe,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Issues",
      value: issues,
      change: issues > 0 ? "Attention" : "None",
      icon: AlertTriangle,
      color: issues > 0 ? "text-warning" : "text-muted-foreground",
      bg: issues > 0 ? "bg-warning/10" : "bg-muted/10",
    },
  ];
  
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-3 border-border/30 shadow-soft hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}