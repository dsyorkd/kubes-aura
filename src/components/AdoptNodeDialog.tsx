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
import { useAdoptNode, useClusters } from "@/api/hooks";
import { Loader2, Lock } from "lucide-react";

const adoptNodeSchema = z.object({
  trust_token: z.string().min(1, "Trust token is required"),
  cluster_id: z.number().optional(),
});

type AdoptNodeFormData = z.infer<typeof adoptNodeSchema>;

interface AdoptNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: number | string;
  nodeName: string;
}

export default function AdoptNodeDialog({
  open,
  onOpenChange,
  nodeId,
  nodeName,
}: AdoptNodeDialogProps) {
  const adoptNode = useAdoptNode();
  const { data: clustersResponse } = useClusters();
  const clusters = clustersResponse?.data || [];

  const form = useForm<AdoptNodeFormData>({
    resolver: zodResolver(adoptNodeSchema),
    defaultValues: {
      trust_token: "",
      cluster_id: undefined,
    },
  });

  const onSubmit = async (data: AdoptNodeFormData) => {
    try {
      await adoptNode.mutateAsync({
        nodeId,
        trust_token: data.trust_token,
        cluster_id: data.cluster_id,
      });

      toast.success(`Node ${nodeName} adopted successfully`);
      onOpenChange(false);
      form.reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Failed to adopt node";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adopt Node</DialogTitle>
          <DialogDescription>
            Enter the trust token to adopt {nodeName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trust_token">Trust Token *</Label>
            <Input
              id="trust_token"
              type="password"
              placeholder="Enter trust token"
              {...form.register("trust_token")}
            />
            {form.formState.errors.trust_token && (
              <p className="text-sm text-destructive">
                {form.formState.errors.trust_token.message}
              </p>
            )}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                The trust token must match the value configured in the pi-controller's
                discovery.trust_token setting.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cluster_id">Cluster (optional)</Label>
            <Select
              value={form.watch("cluster_id")?.toString() || ""}
              onValueChange={(value) =>
                form.setValue("cluster_id", value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cluster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {clusters.map((cluster: { id: number | string; name: string }) => (
                  <SelectItem key={cluster.id} value={cluster.id.toString()}>
                    {cluster.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optionally assign this node to a cluster upon adoption
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adoptNode.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={adoptNode.isPending}>
              {adoptNode.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adopt Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
