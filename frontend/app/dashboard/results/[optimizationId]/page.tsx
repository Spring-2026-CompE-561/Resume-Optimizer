import { DashboardResultPage } from "@/components/dashboard-result-page";

export default async function DashboardResultRoute({
  params,
}: {
  params: Promise<{ optimizationId: string }>;
}) {
  const { optimizationId } = await params;

  return <DashboardResultPage optimizationId={Number.parseInt(optimizationId, 10)} />;
}
