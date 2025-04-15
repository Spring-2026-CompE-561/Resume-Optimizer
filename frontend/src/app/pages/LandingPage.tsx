import React from 'react';
import { Link } from 'react-router';
import { FileText, Link as LinkIcon, Sparkles, CheckCircle, Users, Shield } from 'lucide-react';
import { PublicNav } from '../components/PublicNav';
import { Button } from '../components/Button';

export function LandingPage() {
  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl mb-6 text-foreground">
              Tailor every resume to the job in minutes.
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload your resume, paste a job posting link, and generate a cleaner, more targeted
              version using extracted keywords and AI-assisted suggestions.
            </p>
            <div className="flex gap-4">
              <Link to="/signup">
                <Button variant="primary" className="text-lg px-8 py-4">
                  Get Started
                </Button>
              </Link>
              <a href="#how-it-works" onClick={scrollToHowItWorks}>
                <Button variant="secondary" className="text-lg px-8 py-4">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-lg p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
                <FileText className="text-primary" />
                <span className="text-foreground">Resume uploaded: Backend_API_Resume.pdf</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
                <LinkIcon className="text-primary" />
                <span className="text-foreground">Job: Backend Engineer @ Signal Forge</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-accent/20 rounded-xl">
                <Sparkles className="text-accent" />
                <span className="text-foreground">Optimized with 5 targeted keywords</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4 text-foreground">Professional Resume Optimization</h2>
            <p className="text-xl text-muted-foreground">
              Transform your resume to match each opportunity perfectly
            </p>
          </div>
          <div className="bg-background rounded-[20px] p-8 shadow-lg">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-border">
                <h3 className="mb-2">Your Resume</h3>
                <p className="text-sm text-muted-foreground">Upload PDF or DOCX files</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-border">
                <h3 className="mb-2">Job Posting</h3>
                <p className="text-sm text-muted-foreground">Paste any job URL</p>
              </div>
              <div className="bg-primary/10 p-6 rounded-xl border border-primary">
                <h3 className="mb-2">Optimized Result</h3>
                <p className="text-sm text-muted-foreground">Tailored &amp; ready to send</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to a better resume</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[20px] shadow-md">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-4 text-xl">
                1
              </div>
              <h3 className="mb-3">Upload Your Resume</h3>
              <p className="text-muted-foreground">
                Upload your existing resume in PDF or DOCX format. We&apos;ll automatically parse
                and store it securely.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[20px] shadow-md">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-4 text-xl">
                2
              </div>
              <h3 className="mb-3">Add Job Postings</h3>
              <p className="text-muted-foreground">
                Paste the URL of any job posting. Our system extracts key requirements, skills,
                and keywords.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[20px] shadow-md">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-4 text-xl">
                3
              </div>
              <h3 className="mb-3">Get Optimized Resume</h3>
              <p className="text-muted-foreground">
                Receive a tailored version highlighting relevant experience and matching job
                keywords.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-foreground">Everything You Need</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 border border-border rounded-xl">
              <CheckCircle className="w-8 h-8 text-primary mb-3" />
              <h4 className="mb-2">Keyword Extraction</h4>
              <p className="text-sm text-muted-foreground">
                Automatically identify critical keywords from job postings
              </p>
            </div>
            <div className="p-6 border border-border rounded-xl">
              <CheckCircle className="w-8 h-8 text-primary mb-3" />
              <h4 className="mb-2">Resume Library</h4>
              <p className="text-sm text-muted-foreground">
                Save and manage multiple resume versions in one place
              </p>
            </div>
            <div className="p-6 border border-border rounded-xl">
              <CheckCircle className="w-8 h-8 text-primary mb-3" />
              <h4 className="mb-2">Smart Suggestions</h4>
              <p className="text-sm text-muted-foreground">
                Get actionable tips to improve your resume for each position
              </p>
            </div>
            <div className="p-6 border border-border rounded-xl">
              <CheckCircle className="w-8 h-8 text-primary mb-3" />
              <h4 className="mb-2">Multiple Formats</h4>
              <p className="text-sm text-muted-foreground">
                Support for PDF and DOCX file formats
              </p>
            </div>
            <div className="p-6 border border-border rounded-xl">
              <CheckCircle className="w-8 h-8 text-primary mb-3" />
              <h4 className="mb-2">Job URL Import</h4>
              <p className="text-sm text-muted-foreground">
                Scrape job details from any posting URL
              </p>
            </div>
            <div className="p-6 border border-border rounded-xl">
              <CheckCircle className="w-8 h-8 text-primary mb-3" />
              <h4 className="mb-2">Copy &amp; Share</h4>
              <p className="text-sm text-muted-foreground">
                Easily copy optimized text to use anywhere
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white p-12 rounded-[20px] shadow-lg">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="flex items-start gap-4">
                <Users className="w-12 h-12 text-primary flex-shrink-0" />
                <div>
                  <h3 className="mb-2">Built for Job Seekers</h3>
                  <p className="text-muted-foreground">
                    Trusted by professionals to create targeted resumes that get noticed by hiring
                    managers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Shield className="w-12 h-12 text-primary flex-shrink-0" />
                <div>
                  <h3 className="mb-2">Secure &amp; Private</h3>
                  <p className="text-muted-foreground">
                    Your resumes and data are stored securely with industry-standard encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <span className="font-heading text-xl text-foreground">Resume Optimizer</span>
          </div>
          <p className="text-muted-foreground">Tailor every resume to the job in minutes.</p>
        </div>
      </footer>
    </div>
  );
}
