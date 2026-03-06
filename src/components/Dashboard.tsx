import { KubernetesMetrics } from "@/components/KubernetesMetrics";

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <KubernetesMetrics />
    </div>
  );
}
