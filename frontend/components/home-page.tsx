import Link from "next/link";
import { ArrowRight, Bolt, FileText, LayoutDashboard, ShieldCheck } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Structured optimization pipeline",
    description:
      "Upload a resume, align it to the job description, and keep the generated LaTeX artifact available for later refinement.",
    icon: FileText,
  },
  {
    title: "Backend-connected workspace",
    description:
      "The dashboard talks directly to FastAPI endpoints for auth, resumes, job postings, and optimization history.",
    icon: LayoutDashboard,
  },
  {
    title: "Reviewable outputs",
    description:
      "Keep human-readable suggestions alongside the generated resume source so edits stay deliberate and auditable.",
    icon: ShieldCheck,
  },
];

const faqItems = [
  {
    value: "workflow",
    question: "What does the optimization flow cover?",
    answer:
      "The system ingests a resume, parses it into plaintext, compares it to the selected job description, and stores a generated LaTeX resume draft for review.",
  },
  {
    value: "auth",
    question: "How does authentication work?",
    answer:
      "The frontend uses the FastAPI auth endpoints for login, token refresh, and logout. The dashboard only loads after a valid session is available in the browser.",
  },
  {
    value: "stack",
    question: "What stack is this frontend built on?",
    answer:
      "This refactor moves the client to Next.js 16.2.4 with Tailwind CSS and ShadCN-style UI primitives so the product can support a richer workflow.",
  },
];

export function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-20 pt-8 lg:px-8">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-spotlight">
              <Bolt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Resume Optimizer
              </p>
              <p className="text-sm text-muted-foreground">
                Next.js frontend for a FastAPI optimization pipeline
              </p>
            </div>
          </div>

          <Button asChild variant="secondary">
            <Link href="/login">Log In</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <Badge>Patch 2 frontend foundation</Badge>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl">
                Build sharper resume drafts without losing control of the source.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                This frontend anchors the full-stack refactor: a Next.js 16 dashboard for
                authentication, backend visibility, and the optimization workspace that follows
                in later patches.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/login">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#faq">Review the flow</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map(({ title, description, icon: Icon }) => (
                <Card key={title} className="bg-white/75">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mb-2">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </Card>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden border-none bg-[radial-gradient(circle_at_top,_rgba(239,104,60,0.26),_rgba(255,255,255,0.96)_40%,_rgba(255,245,235,0.94)_100%)] p-8">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                  Dashboard snapshot
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                  Auth, counts, and backend wiring are in place.
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="rounded-3xl bg-slate-950 text-white shadow-none">
                  <CardTitle className="mb-2 text-white">FastAPI linked</CardTitle>
                  <CardDescription className="text-slate-300">
                    Login, session refresh, and dashboard data all come from the live API.
                  </CardDescription>
                </Card>
                <Card className="rounded-3xl bg-white shadow-none">
                  <CardTitle className="mb-2">Ready for workflow pages</CardTitle>
                  <CardDescription>
                    Resume upload, job posting creation, and optimization actions land in the next
                    implementation stage.
                  </CardDescription>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        <section id="faq" className="mt-20 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <Badge className="w-fit">FAQ</Badge>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">What this stage delivers</h2>
            <p className="text-muted-foreground">
              The homepage uses the ShadCN-style component layer in a way that is actually tied to
              the product goals instead of acting as generic decoration.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </section>
    </main>
  );
}
