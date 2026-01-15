'use client';

import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSettings, GeneralSettings } from '@/components/settings';
import { usePreferences } from '@/hooks/usePreferences';

export default function SettingsPage() {
  const { preferences, isLoaded, updatePreference, resetPreferences } = usePreferences();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to chat</span>
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetPreferences}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {!isLoaded ? (
          <div className="space-y-6">
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            <ThemeSettings />
            <GeneralSettings
              preferences={preferences}
              onUpdate={updatePreference}
            />
          </div>
        )}
      </main>
    </div>
  );
}
