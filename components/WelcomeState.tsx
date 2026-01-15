'use client';

import { Home } from 'lucide-react';

interface WelcomeStateProps {
  onPromptClick: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  'I need a roof estimate for my 2,000 sq ft home',
  'How much would it cost to replace a 30-square roof?',
  'Estimate for architectural shingles on a two-story house',
  'What factors affect roofing costs?',
];

export function WelcomeState({ onPromptClick }: WelcomeStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 animate-in fade-in duration-500">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
        <Home className="w-8 h-8 text-accent" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
        Roofing Estimator
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Get an instant estimate for your roofing project. Just describe your home and I&apos;ll calculate material and labor costs.
      </p>

      {/* Example Prompts */}
      <div className="w-full max-w-md space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">
          Try an example
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(prompt)}
              className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm text-foreground"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
