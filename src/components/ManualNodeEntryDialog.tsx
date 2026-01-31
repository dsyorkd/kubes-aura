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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRegisterNode } from "@/api/hooks";
import { Loader2 } from "lucide-react";

const manualNodeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  hostname: z.string().optional(),
  ip_address: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address format"),
  mac_address: z.string().optional(),
  role: z.enum(["master", "worker"]),
  node_type: z.enum(["raspberry_pi", "generic"]),
  agent_port: z.number().min(1).max(65535).optional(),
});

type ManualNodeFormData = z.infer<typeof manualNodeSchema>;

interface ManualNodeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManualNodeEntryDialog({
  open,
  onOpenChange,
}: ManualNodeEntryDialogProps) {
  const registerNode = useRegisterNode();

  const form = useForm<ManualNodeFormData>({
    resolver: zodResolver(manualNodeSchema),
    defaultValues: {
      name: "",
      hostname: "",
      ip_address: "",
      mac_address: "",
      role: "worker",
      node_type: "raspberry_pi",
      agent_port: 8080,
    },
  });

  const onSubmit = async (data: ManualNodeFormData) => {
    try {
      await registerNode.mutateAsync({
        name: data.name,
        hostname: data.hostname,
        ip_address: data.ip_address,
        mac_address: data.mac_address,
        role: data.role,
        node_type: data.node_type,
        discovery_method: 'manual',
        agent_port: data.agent_port,
      });

      toast.success(`Node ${data.name} registered successfully`);
      onOpenChange(false);
      form.reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to register node");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Node Manually</DialogTitle>
          <DialogDescription>
            Register a node that wasn't auto-discovered
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="pi-node-01"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip_address">IP Address *</Label>
            <Input
              id="ip_address"
              placeholder="192.168.1.100"
              {...form.register("ip_address")}
            />
            {form.formState.errors.ip_address && (
              <p className="text-sm text-destructive">
                {form.formState.errors.ip_address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                placeholder="raspberrypi"
                {...form.register("hostname")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_port">Port</Label>
              <Input
                id="agent_port"
                type="number"
                placeholder="8080"
                {...form.register("agent_port", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value: "master" | "worker") => form.setValue("role", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="node_type">Type</Label>
              <Select
                value={form.watch("node_type")}
                onValueChange={(value: "raspberry_pi" | "generic") => form.setValue("node_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raspberry_pi">Raspberry Pi</SelectItem>
                  <SelectItem value="generic">Generic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mac_address">MAC Address (optional)</Label>
            <Input
              id="mac_address"
              placeholder="aa:bb:cc:dd:ee:ff"
              {...form.register("mac_address")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={registerNode.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={registerNode.isPending}>
              {registerNode.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
