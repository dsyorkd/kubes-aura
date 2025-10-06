import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Cpu, Server, Network, Shield, GraduationCap, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

const GettingStarted = () => {
  const [hideFromNav, setHideFromNav] = useState(() => {
    return localStorage.getItem("hideGettingStarted") === "true";
  });

  useEffect(() => {
    localStorage.setItem("hideGettingStarted", hideFromNav.toString());
    // Dispatch event to notify sidebar
    window.dispatchEvent(new Event("gettingStartedVisibilityChanged"));
  }, [hideFromNav]);

  const useCases = [
    { icon: Cpu, title: "Homelabbing", description: "Build your personal cloud infrastructure" },
    { icon: GraduationCap, title: "Education", description: "Learn distributed systems hands-on" },
    { icon: Building2, title: "Industrial IoT", description: "Edge computing for industrial automation" },
    { icon: Shield, title: "Medical", description: "Private, HIPAA-compliant data processing" },
  ];

  const examples = [
    {
      title: "Kubernetes Cluster",
      difficulty: "Advanced",
      description: "Deploy a production-ready K8s cluster across your Raspberry Pis using pi-controller for orchestration and node management.",
      steps: [
        "Install pi-controller binary on all nodes",
        "Create a new cluster with type 'Kubernetes'",
        "Select discovered nodes or add manually",
        "Configure resource allocation per node",
        "Deploy your first pod with kubectl"
      ]
    },
    {
      title: "Docker Swarm",
      difficulty: "Intermediate",
      description: "Set up a Docker Swarm cluster for containerized applications with automatic load balancing and service discovery.",
      steps: [
        "Install pi-controller on manager and worker nodes",
        "Create a Docker Swarm cluster type",
        "Add nodes through mDNS discovery",
        "Deploy services with docker stack",
        "Monitor with pi-controller dashboard"
      ]
    },
    {
      title: "Simple File Server",
      difficulty: "Beginner",
      description: "Create a distributed file server using NFS or Samba across multiple Pi nodes for shared storage.",
      steps: [
        "Install pi-controller on your Pis",
        "Create a custom cluster configuration",
        "Configure shared storage paths",
        "Set up automatic synchronization",
        "Access files from any device on your network"
      ]
    },
    {
      title: "Media Server Cluster",
      difficulty: "Beginner",
      description: "Build a redundant media streaming setup with Plex or Jellyfin distributed across nodes.",
      steps: [
        "Deploy pi-controller across your nodes",
        "Create a media cluster configuration",
        "Configure storage and transcoding resources",
        "Set up load balancing",
        "Stream from anywhere on your network"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Getting Started</h1>
          <p className="text-muted-foreground">
            Welcome to Pi Controller! Learn how to build powerful Raspberry Pi clusters for any purpose.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox 
            id="hide-getting-started" 
            checked={hideFromNav}
            onCheckedChange={(checked) => setHideFromNav(checked as boolean)}
          />
          <label
            htmlFor="hide-getting-started"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Hide from main navigation
          </label>
        </div>
      </div>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            What Can You Build?
          </CardTitle>
          <CardDescription>
            Pi Controller enables clustering and management for diverse applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="flex items-start gap-3 p-4 rounded-lg border border-border/40 bg-card/50">
                <div className="p-2 rounded-md bg-primary/10">
                  <useCase.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Quick Start Examples
        </h2>
        <div className="grid gap-6">
          {examples.map((example) => (
            <Card key={example.title}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{example.title}</CardTitle>
                    <CardDescription className="mt-2">{example.description}</CardDescription>
                  </div>
                  <Badge variant={
                    example.difficulty === "Beginner" ? "default" :
                    example.difficulty === "Intermediate" ? "secondary" : "outline"
                  }>
                    {example.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3">Steps:</h4>
                  <ol className="space-y-2">
                    {example.steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {index + 1}
                        </span>
                        <span className="text-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Help */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Ready to Get Started?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Install the pi-controller binary on your Raspberry Pis, then create your first cluster from the Clusters page. 
            Our node discovery system will automatically find Pi Controllers on your network.
          </p>
          <p className="text-sm text-muted-foreground">
            Need more help? Check out the Documentation in the Help section of the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GettingStarted;
