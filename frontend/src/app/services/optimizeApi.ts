export interface OptimizationRunOut {
    id: number;
    user_id: number;
    resume_id: number | null;
    job_posting_id: number | null;
    optimized_resume_text: string;
    suggestions: string[];
    provider_name: string | null;
    latency_ms: number | null;
    created_at: string;
  }
  
  export async function runOptimization(
    resumeId: number,
    jobPostingId: number,
    accessToken: string
  ): Promise<OptimizationRunOut> {
    const response = await fetch('/api/v1/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        resume_id: resumeId,
        job_posting_id: jobPostingId,
      }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw { status: response.status, detail: error.detail };
    }
  
    return response.json();
  }