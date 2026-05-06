import { DashboardResumeDetailPage } from "@/components/dashboard-resume-detail-page";

export default async function DashboardResumeDetailRoute({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;

  return <DashboardResumeDetailPage resumeId={Number.parseInt(resumeId, 10)} />;
}
