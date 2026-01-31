import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Upload, Save, RefreshCw } from "lucide-react";
import { PiControllerConfig } from "@/types/pi-controller";

const configSchema = z.object({
  general: z.object({
    hostname: z.string().min(1, "Hostname is required"),
    timezone: z.string().min(1, "Timezone is required"),
    logLevel: z.enum(["debug", "info", "warn", "error"]),
  }),
  auth: z.object({
    sessionTimeout: z.number().min(60, "Minimum 60 seconds"),
    maxLoginAttempts: z.number().min(1),
    lockoutDuration: z.number().min(60),
  }),
  gpio: z.object({
    enableControls: z.boolean(),
    defaultMode: z.enum(["safe", "expert"]),
    maxToggleFrequency: z.number().min(1),
  }),
  monitoring: z.object({
    updateInterval: z.number().min(1000, "Minimum 1000ms"),
    retentionDays: z.number().min(1),
    enableAlerts: z.boolean(),
  }),
  cluster: z.object({
    discoveryEnabled: z.boolean(),
    healthCheckInterval: z.number().min(1000),
    autoFailover: z.boolean(),
  }),
});

type ConfigFormData = z.infer<typeof configSchema>;

const defaultConfig: ConfigFormData = {
  general: {
    hostname: "pi-controller",
    timezone: "UTC",
    logLevel: "info",
  },
  auth: {
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    lockoutDuration: 300,
  },
  gpio: {
    enableControls: true,
    defaultMode: "safe",
    maxToggleFrequency: 10,
  },
  monitoring: {
    updateInterval: 5000,
    retentionDays: 30,
    enableAlerts: true,
  },
  cluster: {
    discoveryEnabled: true,
    healthCheckInterval: 10000,
    autoFailover: true,
  },
};

export default function Settings() {
  const [yamlContent, setYamlContent] = useState("");
  const [activeTab, setActiveTab] = useState("form");

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: defaultConfig,
  });

  const convertToYAML = (data: ConfigFormData): string => {
    const yaml = `# Pi Controller Configuration
general:
  hostname: ${data.general.hostname}
  timezone: ${data.general.timezone}
  logLevel: ${data.general.logLevel}

auth:
  sessionTimeout: ${data.auth.sessionTimeout}
  maxLoginAttempts: ${data.auth.maxLoginAttempts}
  lockoutDuration: ${data.auth.lockoutDuration}

gpio:
  enableControls: ${data.gpio.enableControls}
  defaultMode: ${data.gpio.defaultMode}
  maxToggleFrequency: ${data.gpio.maxToggleFrequency}

monitoring:
  updateInterval: ${data.monitoring.updateInterval}
  retentionDays: ${data.monitoring.retentionDays}
  enableAlerts: ${data.monitoring.enableAlerts}

cluster:
  discoveryEnabled: ${data.cluster.discoveryEnabled}
  healthCheckInterval: ${data.cluster.healthCheckInterval}
  autoFailover: ${data.cluster.autoFailover}
`;
    return yaml;
  };

  const parseYAML = (yaml: string): ConfigFormData | null => {
    try {
      const lines = yaml.split("\n").filter(line => !line.trim().startsWith("#") && line.trim());
      const config: Record<string, Record<string, string | number | boolean>> = { general: {}, auth: {}, gpio: {}, monitoring: {}, cluster: {} };
      let currentSection = "";

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith(":") && !trimmed.includes(" ")) {
          currentSection = trimmed.slice(0, -1);
        } else if (trimmed.includes(":")) {
          const [key, ...valueParts] = trimmed.split(":");
          const value = valueParts.join(":").trim();
          if (currentSection && config[currentSection]) {
            if (value === "true" || value === "false") {
              config[currentSection][key.trim()] = value === "true";
            } else if (!isNaN(Number(value))) {
              config[currentSection][key.trim()] = Number(value);
            } else {
              config[currentSection][key.trim()] = value;
            }
          }
        }
      });

      return configSchema.parse(config);
    } catch (error) {
      console.error("Failed to parse YAML:", error);
      return null;
    }
  };

  const onSubmit = (data: ConfigFormData) => {
    console.log("Saving configuration:", data);
    toast.success("Configuration saved successfully");
    setYamlContent(convertToYAML(data));
  };

  const handleExport = () => {
    const data = form.getValues();
    const yaml = convertToYAML(data);
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pi-controller-config.yaml";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration exported");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseYAML(content);
        if (parsed) {
          form.reset(parsed);
          setYamlContent(content);
          toast.success("Configuration imported successfully");
        } else {
          toast.error("Invalid YAML format");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleApplyYAML = () => {
    const parsed = parseYAML(yamlContent);
    if (parsed) {
      form.reset(parsed);
      toast.success("YAML applied to form");
      setActiveTab("form");
    } else {
      toast.error("Invalid YAML format");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure Pi Controller system parameters</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export YAML
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import YAML
              </span>
            </Button>
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="form">Form Editor</TabsTrigger>
          <TabsTrigger value="yaml">YAML Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    {...form.register("general.hostname")}
                  />
                  {form.formState.errors.general?.hostname && (
                    <p className="text-sm text-destructive">{form.formState.errors.general.hostname.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    {...form.register("general.timezone")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select
                    value={form.watch("general.logLevel")}
                    onValueChange={(value) => form.setValue("general.logLevel", value as ConfigFormData["general"]["logLevel"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Security and session management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    {...form.register("auth.sessionTimeout", { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    {...form.register("auth.maxLoginAttempts", { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lockoutDuration">Lockout Duration (seconds)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    {...form.register("auth.lockoutDuration", { valueAsNumber: true })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GPIO Controls</CardTitle>
                <CardDescription>Hardware interface settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableControls">Enable GPIO Controls</Label>
                  <Switch
                    id="enableControls"
                    checked={form.watch("gpio.enableControls")}
                    onCheckedChange={(checked) => form.setValue("gpio.enableControls", checked)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="defaultMode">Default Mode</Label>
                  <Select
                    value={form.watch("gpio.defaultMode")}
                    onValueChange={(value) => form.setValue("gpio.defaultMode", value as ConfigFormData["gpio"]["defaultMode"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">Safe</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxToggleFrequency">Max Toggle Frequency (Hz)</Label>
                  <Input
                    id="maxToggleFrequency"
                    type="number"
                    {...form.register("gpio.maxToggleFrequency", { valueAsNumber: true })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring</CardTitle>
                <CardDescription>System monitoring configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="updateInterval">Update Interval (ms)</Label>
                  <Input
                    id="updateInterval"
                    type="number"
                    {...form.register("monitoring.updateInterval", { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="retentionDays">Data Retention (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    {...form.register("monitoring.retentionDays", { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableAlerts">Enable Alerts</Label>
                  <Switch
                    id="enableAlerts"
                    checked={form.watch("monitoring.enableAlerts")}
                    onCheckedChange={(checked) => form.setValue("monitoring.enableAlerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cluster Management</CardTitle>
                <CardDescription>Multi-node cluster settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="discoveryEnabled">Auto Discovery</Label>
                  <Switch
                    id="discoveryEnabled"
                    checked={form.watch("cluster.discoveryEnabled")}
                    onCheckedChange={(checked) => form.setValue("cluster.discoveryEnabled", checked)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="healthCheckInterval">Health Check Interval (ms)</Label>
                  <Input
                    id="healthCheckInterval"
                    type="number"
                    {...form.register("cluster.healthCheckInterval", { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoFailover">Auto Failover</Label>
                  <Switch
                    id="autoFailover"
                    checked={form.watch("cluster.autoFailover")}
                    onCheckedChange={(checked) => form.setValue("cluster.autoFailover", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="yaml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>YAML Configuration</CardTitle>
              <CardDescription>Edit configuration directly in YAML format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={yamlContent || convertToYAML(form.getValues())}
                onChange={(e) => setYamlContent(e.target.value)}
                className="font-mono text-sm min-h-[500px]"
                placeholder="Enter YAML configuration..."
              />
              <div className="flex gap-2">
                <Button onClick={handleApplyYAML} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply to Form
                </Button>
                <Button onClick={() => setYamlContent(convertToYAML(form.getValues()))} variant="outline">
                  Reset from Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
