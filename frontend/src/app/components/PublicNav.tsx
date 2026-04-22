import React from 'react';
import { Link } from 'react-router';
import { Button } from './Button';

export function PublicNav() {
  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg"></div>
          <span className="font-heading text-xl text-foreground">Resume Optimizer</span>
        </Link>

        <div className="flex items-center gap-6">
          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            className="text-foreground hover:text-primary transition-colors"
          >
            How It Works
          </a>
          <Link to="/login">
            <Button variant="secondary">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
