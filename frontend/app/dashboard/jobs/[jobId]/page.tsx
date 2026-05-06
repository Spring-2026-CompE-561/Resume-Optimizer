import { DashboardJobDetailPage } from "@/components/dashboard-job-detail-page";

export default async function DashboardJobDetailRoute({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return <DashboardJobDetailPage jobId={Number.parseInt(jobId, 10)} />;
}
