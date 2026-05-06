import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Sparkles,
} from "lucide-react";

import { SiteNavbar } from "@/components/site-navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    title: "Upload your resume",
    description: "Start with the version you already use.",
    icon: FileText,
  },
  {
    title: "Add your target role",
    description: "Paste the job you want to apply for.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Get an optimized draft",
    description: "Download a cleaner, stronger version fast.",
    icon: Sparkles,
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen">
      <SiteNavbar />

      <section className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-14 lg:px-8 lg:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.08em] text-foreground sm:text-6xl lg:text-[5rem] lg:leading-[1]">
                AI-optimized resumes.
                <br />
                More interviews.
              </h1>
              <p className="max-w-xl text-lg leading-8 tracking-[-0.03em] text-muted-foreground sm:text-xl">
                Tailor your resume to the job you want with a calmer workflow and a cleaner final
                draft.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/auth?mode=signup">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth?mode=signin">Sign in</Link>
              </Button>
            </div>
          </div>

          <Card
            className="relative overflow-hidden rounded-[36px] border-white bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-8 lg:p-9"
            id="features"
          >
            <div className="absolute inset-x-16 top-0 h-28 rounded-full bg-[rgba(47,99,255,0.12)] blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium tracking-[-0.03em] text-muted-foreground">
                    Optimized Resume
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-foreground">
                    Alex Johnson
                  </h2>
                  <p className="mt-1 text-lg font-medium tracking-[-0.03em] text-foreground">
                    Senior Product Manager
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 rounded-full bg-[rgba(43,193,122,0.12)] px-4 py-2 text-sm font-semibold tracking-[-0.03em] text-[var(--color-success)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-current" />
                  ATS Score 93
                </div>
              </div>

              <div className="rounded-[28px] border border-[rgba(176,190,235,0.45)] bg-white p-7">
                <div className="space-y-6">
                  <div className="border-b border-border pb-5">
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>San Francisco, CA</span>
                      <span>&bull;</span>
                      <span>alex.johnson@gmail.com</span>
                      <span>&bull;</span>
                      <span>(415) 555-0100</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold tracking-[-0.03em] text-foreground">
                      Professional Summary
                    </p>
                    <div className="space-y-3">
                      <div className="h-2.5 w-[92%] rounded-full bg-[#dbe2f2]" />
                      <div className="h-2.5 w-[82%] rounded-full bg-[#dbe2f2]" />
                      <div className="h-2.5 w-[56%] rounded-full bg-[#dbe2f2]" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold tracking-[-0.03em] text-foreground">
                      Experience
                    </p>
                    <div className="space-y-3">
                      {[86, 80, 68].map((width, index) => (
                        <div className="flex items-center gap-3" key={`${width}-${index}`}>
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          <div
                            className="h-2.5 rounded-full bg-[#dbe2f2]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-6 pb-28 lg:px-8" id="how-it-works">
        <div className="space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-[-0.06em] text-foreground sm:text-4xl">
              How it works in 3 simple steps
            </h2>
            <p className="text-lg tracking-[-0.03em] text-muted-foreground">
              A focused flow built for one goal: sending a better application faster.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <Card key={title} className="rounded-[32px] p-7">
                <div className="space-y-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold tracking-[0.12em] text-primary">
                      0{index + 1}
                    </p>
                    <h3 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                      {title}
                    </h3>
                    <p className="text-base leading-7 tracking-[-0.02em] text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
