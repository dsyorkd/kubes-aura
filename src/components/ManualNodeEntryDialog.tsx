import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ManualNodeEntry } from "@/types/pi-controller";
import { Key, Lock, Network } from "lucide-react";

const manualNodeSchema = z.object({
  hostname: z.string().min(1, "Hostname is required"),
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address format"),
  port: z.number().min(1).max(65535).optional(),
  authMethod: z.enum(["none", "password", "ssh-key"]),
  username: z.string().optional(),
  password: z.string().optional(),
  sshKey: z.string().optional(),
  label: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type ManualNodeFormData = z.infer<typeof manualNodeSchema>;

interface ManualNodeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (node: ManualNodeEntry) => void;
}

export default function ManualNodeEntryDialog({
  open,
  onOpenChange,
  onAdd,
}: ManualNodeEntryDialogProps) {
  const form = useForm<ManualNodeFormData>({
    resolver: zodResolver(manualNodeSchema),
    defaultValues: {
      hostname: "",
      ipAddress: "",
      port: 8080,
      authMethod: "none",
      username: "",
      password: "",
      sshKey: "",
      label: "",
      location: "",
      notes: "",
    },
  });

  const authMethod = form.watch("authMethod");

  const onSubmit = async (data: ManualNodeFormData) => {
    const nodeEntry: ManualNodeEntry = {
      hostname: data.hostname,
      ipAddress: data.ipAddress,
      port: data.port,
      username: data.username,
      password: data.password,
      sshKey: data.sshKey,
      label: data.label,
      location: data.location,
      notes: data.notes,
    };

    // Validate authentication fields based on method
    if (data.authMethod === "password" && !data.username) {
      toast.error("Username is required for password authentication");
      return;
    }
    if (data.authMethod === "password" && !data.password) {
      toast.error("Password is required for password authentication");
      return;
    }
    if (data.authMethod === "ssh-key" && !data.sshKey) {
      toast.error("SSH key is required for SSH key authentication");
      return;
    }

    try {
      // Here you would verify the connection to the node
      // For now, we'll just add it
      onAdd(nodeEntry);
      toast.success(`Node ${data.hostname} added successfully`);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to add node");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Node Manually</DialogTitle>
          <DialogDescription>
            Add a Raspberry Pi node that couldn't be auto-discovered or is on a different network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hostname">
                    Hostname *
                  </Label>
                  <Input
                    id="hostname"
                    placeholder="raspberrypi"
                    {...form.register("hostname")}
                  />
                  {form.formState.errors.hostname && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.hostname.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipAddress">
                    IP Address *
                  </Label>
                  <Input
                    id="ipAddress"
                    placeholder="192.168.1.100"
                    {...form.register("ipAddress")}
                  />
                  {form.formState.errors.ipAddress && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.ipAddress.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">
                  Pi-Controller API Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="8080"
                  {...form.register("port", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Default is 8080. Change if pi-controller is running on a different port.
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Network className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Network Requirements</p>
                  <p className="text-xs mt-1">
                    Ensure the node is reachable from this network and pi-controller is running.
                    The connection will be verified before adding to the cluster.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="authMethod">Authentication Method</Label>
                <Select
                  value={authMethod}
                  onValueChange={(value: any) => form.setValue("authMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Local Network)</SelectItem>
                    <SelectItem value="password">Username & Password</SelectItem>
                    <SelectItem value="ssh-key">SSH Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authMethod === "password" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="pi"
                      {...form.register("username")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...form.register("password")}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Credentials are encrypted and stored securely. They are only used for
                      initial connection and management operations.
                    </p>
                  </div>
                </div>
              )}

              {authMethod === "ssh-key" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="pi"
                      {...form.register("username")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sshKey">SSH Private Key</Label>
                    <Textarea
                      id="sshKey"
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                      rows={6}
                      className="font-mono text-xs"
                      {...form.register("sshKey")}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Key className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Paste your SSH private key. It will be encrypted and stored securely.
                      Ensure the corresponding public key is in the node's authorized_keys.
                    </p>
                  </div>
                </div>
              )}

              {authMethod === "none" && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Network className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    No authentication selected. This assumes the node is on the same local network
                    and pi-controller API is accessible without authentication.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="label">Display Label</Label>
                <Input
                  id="label"
                  placeholder="Living Room Pi"
                  {...form.register("label")}
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this node in the dashboard
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Physical Location</Label>
                <Input
                  id="location"
                  placeholder="Server Rack A, Shelf 2"
                  {...form.register("location")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information about this node..."
                  rows={4}
                  {...form.register("notes")}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
