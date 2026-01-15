// User preferences types and localStorage utilities

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultLocation: string;
  defaultShingleType: 'three-tab' | 'architectural' | 'premium';
  defaultPitch: string;
  autoSaveEstimates: boolean;
  showWelcomeScreen: boolean;
}

const PREFERENCES_KEY = 'roofing-estimator-preferences';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultLocation: '',
  defaultShingleType: 'architectural',
  defaultPitch: '6/12',
  autoSaveEstimates: true,
  showWelcomeScreen: true,
};

/**
 * Get preferences from localStorage
 */
export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);
    // Merge with defaults to handle any missing keys from older versions
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    console.warn('Failed to parse preferences from localStorage');
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

/**
 * Update a single preference
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): UserPreferences {
  const current = getPreferences();
  const updated = { ...current, [key]: value };
  savePreferences(updated);
  return updated;
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): UserPreferences {
  savePreferences(DEFAULT_PREFERENCES);
  return DEFAULT_PREFERENCES;
}

// Pitch options for dropdown
export const PITCH_OPTIONS = [
  { value: '2/12', label: '2/12 (Low)' },
  { value: '4/12', label: '4/12 (Low-Medium)' },
  { value: '6/12', label: '6/12 (Medium)' },
  { value: '8/12', label: '8/12 (Medium-High)' },
  { value: '10/12', label: '10/12 (High)' },
  { value: '12/12', label: '12/12 (Very High)' },
];

// Shingle type options for dropdown
export const SHINGLE_TYPE_OPTIONS = [
  { value: 'three-tab', label: '3-Tab Asphalt', description: 'Basic, most affordable option' },
  { value: 'architectural', label: 'Architectural', description: 'Popular mid-range choice with better aesthetics' },
  { value: 'premium', label: 'Premium Designer', description: 'High-end option with longest warranty' },
] as const;
