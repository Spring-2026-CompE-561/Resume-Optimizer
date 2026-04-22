import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PublicNav } from '../components/PublicNav';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { Shield } from 'lucide-react';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signup } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Signup failed. Please try again.';
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
            <h1 className="text-3xl mb-2 text-center">Create Your Account</h1>
            <p className="text-muted-foreground text-center mb-8">
              Start optimizing your resumes today
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground -mt-2">
                Password must be at least 8 characters (same as the server).
              </p>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {error && (
                <p className="text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              )}
            </form>

            <div className="mt-6 flex items-center gap-2 p-4 bg-secondary/30 rounded-xl">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Your documents are stored securely and never shared with third parties.
              </p>
            </div>

            <p className="mt-6 text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
