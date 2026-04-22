// i added this tmp page so the shared /optimize route compiles for now
import React from 'react';
import { AuthLayout } from '../components/AuthLayout';

export function OptimizePage() {
  return (
    <AuthLayout title="Optimize">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[20px] p-8 shadow-md">
          <h2 className="text-2xl mb-3">Optimize</h2>
          <p className="text-muted-foreground">
            this page is just a temporary placeholder so the shared route list compiles.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
