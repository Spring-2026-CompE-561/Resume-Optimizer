import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PublicNav } from '../components/PublicNav';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
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
            <h1 className="text-3xl mb-2 text-center">Welcome Back</h1>
            <p className="text-muted-foreground text-center mb-8">
              Log in to access your resumes and optimizations
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>

              {error && (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-muted-foreground">
              Need an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Create One
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
