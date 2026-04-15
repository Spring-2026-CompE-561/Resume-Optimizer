import React from 'react';
import { Link, useLocation } from 'react-router';
import { PublicNav } from '../components/PublicNav';
import { Button } from '../components/Button';
import { CheckCircle } from 'lucide-react';

type LocationState = {
  email?: string;
};

export function ResetLinkSentPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const email = state?.email;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[20px] shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-3xl mb-3">Check Your Email</h1>
            <p className="text-muted-foreground mb-8">
              We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
            </p>
            {email && (
              <p className="text-sm text-muted-foreground mb-8">
                Reset email sent to <span className="font-medium">{email}</span>.
              </p>
            )}

            <Link to="/login">
              <Button variant="primary" className="w-full mb-4">
                Back to Log In
              </Button>
            </Link>

            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Try Another Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
