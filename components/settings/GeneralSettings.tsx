'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPreferences, PITCH_OPTIONS, SHINGLE_TYPE_OPTIONS } from '@/lib/preferences';

interface GeneralSettingsProps {
  preferences: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

export function GeneralSettings({ preferences, onUpdate }: GeneralSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate Defaults</CardTitle>
        <CardDescription>
          Set default values for new estimates to save time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Location */}
        <div className="space-y-2">
          <Label htmlFor="defaultLocation">Default Location</Label>
          <Input
            id="defaultLocation"
            placeholder="e.g., Austin, TX"
            value={preferences.defaultLocation}
            onChange={(e) => onUpdate('defaultLocation', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pre-fill location for new estimates
          </p>
        </div>

        {/* Default Shingle Type */}
        <div className="space-y-2">
          <Label htmlFor="defaultShingleType">Default Shingle Type</Label>
          <Select
            value={preferences.defaultShingleType}
            onValueChange={(value) => onUpdate('defaultShingleType', value as UserPreferences['defaultShingleType'])}
          >
            <SelectTrigger id="defaultShingleType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHINGLE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Pitch */}
        <div className="space-y-2">
          <Label htmlFor="defaultPitch">Default Roof Pitch</Label>
          <Select
            value={preferences.defaultPitch}
            onValueChange={(value) => onUpdate('defaultPitch', value)}
          >
            <SelectTrigger id="defaultPitch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PITCH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-save Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="autoSave">Auto-save Estimates</Label>
            <p className="text-xs text-muted-foreground">
              Automatically save estimates when generated
            </p>
          </div>
          <Switch
            id="autoSave"
            checked={preferences.autoSaveEstimates}
            onCheckedChange={(checked) => onUpdate('autoSaveEstimates', checked)}
          />
        </div>

        {/* Show Welcome Screen Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showWelcome">Show Welcome Screen</Label>
            <p className="text-xs text-muted-foreground">
              Display tips and example prompts for new chats
            </p>
          </div>
          <Switch
            id="showWelcome"
            checked={preferences.showWelcomeScreen}
            onCheckedChange={(checked) => onUpdate('showWelcomeScreen', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
