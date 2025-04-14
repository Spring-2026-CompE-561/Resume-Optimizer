import { BrowserRouter, Route, Routes } from 'react-router';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetLinkSentPage } from './pages/ResetLinkSentPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ResumesPage } from './pages/ResumesPage';
import { ResumeDetailPage } from './pages/ResumeDetailPage';
import { JobPostingsPage } from './pages/JobPostingsPage';
import { JobPostingDetailPage } from './pages/JobPostingDetailPage';
import { OptimizePage } from './pages/OptimizePage';

function PendingSharedPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-white rounded-[20px] shadow-lg p-8 text-center max-w-md w-full">
        <h1 className="text-2xl mb-3">{title}</h1>
        <p className="text-muted-foreground">
          Remington added this temporary placeholder so the shared route shell can compile
          before the matching page file lands in the next planned commit.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PendingSharedPage title="Landing Page" />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-link-sent" element={<ResetLinkSentPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PendingSharedPage title="Dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <ResumesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes/:id"
            element={
              <ProtectedRoute>
                <ResumeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-postings"
            element={
              <ProtectedRoute>
                <JobPostingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-postings/:id"
            element={
              <ProtectedRoute>
                <JobPostingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/optimize"
            element={
              <ProtectedRoute>
                <OptimizePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PendingSharedPage title="Page Not Found" />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
