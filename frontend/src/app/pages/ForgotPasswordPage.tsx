import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PublicNav } from '../components/PublicNav';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      navigate('/reset-link-sent', { state: { email } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[20px] shadow-lg p-8">
            <h1 className="text-3xl mb-2 text-center">Reset Your Password</h1>
            <p className="text-muted-foreground text-center mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <p className="text-sm text-muted-foreground text-center mb-6">
              For your security, you will see the same confirmation after you submit, whether or not that
              email is registered.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              {error && (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Back to Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
