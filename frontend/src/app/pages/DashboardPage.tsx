import React from 'react';
import { Link } from 'react-router';
import { FileText, Briefcase, Sparkles, Upload, Plus, Play } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';

export function DashboardPage() {
  const { user, resumes, jobPostings } = useApp();

  const stats = [
    {
      label: 'Saved Resumes',
      value: resumes.length,
      icon: FileText,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Saved Job Postings',
      value: jobPostings.length,
      icon: Briefcase,
      color: 'bg-accent/20 text-accent',
    },
    {
      label: 'Ready to Optimize',
      value: resumes.length > 0 && jobPostings.length > 0 ? 'Yes' : 'No',
      icon: Sparkles,
      color: 'bg-secondary text-primary',
    },
  ];

  const quickActions = [
    {
      title: 'Upload Resume',
      description: 'Add a new resume to your library',
      icon: Upload,
      link: '/resumes',
      color: 'bg-primary',
    },
    {
      title: 'Add Job Posting',
      description: 'Save a job posting URL',
      icon: Plus,
      link: '/job-postings',
      color: 'bg-accent',
    },
    {
      title: 'Run Optimization',
      description: 'Optimize a resume for a job',
      icon: Play,
      link: '/optimize',
      color: 'bg-primary',
    },
  ];

  return (
    <AuthLayout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-[20px] p-8 shadow-md">
          <h2 className="text-3xl mb-2">Welcome back, {user?.name ?? 'there'}!</h2>
          <p className="text-muted-foreground">
            Ready to optimize your resume for your next opportunity?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-[20px] p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl">{stat.value}</span>
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-xl mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={action.link}>
                  <div className="bg-white rounded-[20px] p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group">
                    <div
                      className={`w-12 h-12 ${action.color} text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="mb-2">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {resumes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Recent Resumes</h3>
              <Link to="/resumes">
                <Button variant="secondary">View All</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {resumes.slice(0, 2).map((resume) => (
                <Link key={resume.id} to={`/resumes/${resume.id}`}>
                  <div className="bg-white rounded-[20px] p-6 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 truncate">{resume.fileName}</h4>
                        <p className="text-sm text-muted-foreground">Uploaded {resume.uploadDate}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {resume.preview}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {jobPostings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Recent Job Postings</h3>
              <Link to="/job-postings">
                <Button variant="secondary">View All</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {jobPostings.slice(0, 2).map((job) => (
                <Link key={job.id} to={`/job-postings/${job.id}`}>
                  <div className="bg-white rounded-[20px] p-6 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 truncate">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
