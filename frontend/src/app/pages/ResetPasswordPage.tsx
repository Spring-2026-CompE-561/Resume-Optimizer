import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { PublicNav } from '../components/PublicNav';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useApp();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') ?? '';

  const [manualToken, setManualToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = queryToken || manualToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="flex items-center justify-center py-12 px-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-[20px] shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl mb-3">Password Reset Successful</h1>
              <p className="text-muted-foreground mb-8">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[20px] shadow-lg p-8">
            <h1 className="text-3xl mb-2 text-center">Create New Password</h1>
            <p className="text-muted-foreground text-center mb-8">Enter your new password below</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!queryToken && (
                <Input
                  label="Reset Token"
                  type="text"
                  placeholder="Paste reset token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  required
                />
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
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
