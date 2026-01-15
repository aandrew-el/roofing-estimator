'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoUpload } from './LogoUpload';
import { useContractor } from '@/hooks/useContractor';
import { Loader2, Check } from 'lucide-react';

export function BrandingForm() {
  const { contractor, isLoading, updateContractor, uploadLogo, removeLogo } =
    useContractor();

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f4c75');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current values when contractor data loads
  useEffect(() => {
    if (contractor) {
      setCompanyName(contractor.company_name || '');
      setPhone(contractor.phone || '');
      setWebsite(contractor.website || '');
      setPrimaryColor(contractor.primary_color || '#0f4c75');
      setAccentColor(contractor.accent_color || '#3b82f6');
    }
  }, [contractor]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);

    const success = await updateContractor({
      company_name: companyName || null,
      phone: phone || null,
      website: website || null,
      primary_color: primaryColor,
      accent_color: accentColor,
    });

    setIsSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Logo Upload */}
      <LogoUpload
        currentLogo={contractor?.logo_url || null}
        onUpload={uploadLogo}
        onRemove={removeLogo}
      />

      {/* Company Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Company Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Roofing Company"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
            />
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Brand Colors</h3>
        <p className="text-sm text-muted-foreground">
          These colors will be used on your shared estimate pages.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <div
                className="h-10 w-10 rounded border cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                onClick={() =>
                  document.getElementById('primaryColorInput')?.click()
                }
              />
              <Input
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#0f4c75"
              />
              <input
                id="primaryColorInput"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex gap-2">
              <div
                className="h-10 w-10 rounded border cursor-pointer"
                style={{ backgroundColor: accentColor }}
                onClick={() =>
                  document.getElementById('accentColorInput')?.click()
                }
              />
              <Input
                id="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#3b82f6"
              />
              <input
                id="accentColorInput"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
