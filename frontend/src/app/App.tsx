import { BrowserRouter, Route, Routes } from 'react-router';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetLinkSentPage } from './pages/ResetLinkSentPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumesPage } from './pages/ResumesPage';
import { ResumeDetailPage } from './pages/ResumeDetailPage';
import { JobPostingsPage } from './pages/JobPostingsPage';
import { JobPostingDetailPage } from './pages/JobPostingDetailPage';
import { OptimizePage } from './pages/OptimizePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-link-sent" element={<ResetLinkSentPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
