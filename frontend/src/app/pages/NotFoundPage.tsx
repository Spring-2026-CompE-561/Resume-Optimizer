import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[20px] shadow-lg p-12 text-center">
          <div className="text-8xl mb-4 text-primary">404</div>
          <h1 className="text-3xl mb-3">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            <Link to="/">
              <Button variant="primary">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
