// Roofing pricing data - 2025 industry averages
// All costs are per "square" (100 sq ft) unless otherwise noted

import { MaterialPricing, PitchMultipliers, RegionalPricing } from './types';

// Pitch multipliers - accounts for increased roof area due to slope
export const PITCH_MULTIPLIERS: PitchMultipliers = {
  '3/12': 1.03,
  '4/12': 1.05,
  '5/12': 1.08,
  '6/12': 1.12,
  '7/12': 1.16,
  '8/12': 1.20,
  '9/12': 1.25,
  '10/12': 1.30,
  '11/12': 1.36,
  '12/12': 1.41,
  'flat': 1.00,
  'low': 1.05,      // 4/12 equivalent
  'standard': 1.08, // 5/12 equivalent
  'moderate': 1.12, // 6/12 equivalent
  'steep': 1.25,    // 9/12 equivalent
  'very steep': 1.35,
};

// Material and labor pricing per square (installed)
export const SHINGLE_PRICING: Record<string, MaterialPricing> = {
  'three-tab': {
    material: 100,  // $80-130 average
    labor: 200,     // Installation labor per square
    installed: {
      low: 250,
      mid: 350,
      high: 450,
    },
  },
  'architectural': {
    material: 175,  // $100-250 average
    labor: 275,     // Higher labor due to heavier shingles
    installed: {
      low: 400,
      mid: 500,
      high: 600,
    },
  },
  'premium': {
    material: 215,  // $150-280 average
    labor: 350,     // Premium installation requires more skill
    installed: {
      low: 500,
      mid: 600,
      high: 700,
    },
  },
};

// Additional costs
export const ADDITIONAL_COSTS = {
  // Tear-off and disposal per square, per layer
  tearOffPerLayer: 150,

  // Underlayment per square
  underlayment: {
    synthetic: 25,
    feltPaper: 15,
  },

  // Flashing base cost (lot)
  flashingBase: 200,

  // Per-feature flashing costs
  chimneyFlashing: 150,
  skylightFlashing: 100,
  valleyFlashing: 75,

  // Drip edge per linear foot
  dripEdge: 2.50,

  // Permit allowance (varies by municipality)
  permitAllowance: 400,

  // Disposal fee per square (included in tear-off, but listed separately)
  disposalPerSquare: 25,
};

// Complexity multipliers for labor
export const COMPLEXITY_MULTIPLIERS = {
  singleStory: 1.0,
  twoStory: 1.15,
  threeStory: 1.30,
  steepPitch: 1.20,    // Applied when pitch >= 8/12
  verysteepPitch: 1.35, // Applied when pitch >= 10/12
};

// Regional pricing adjustments
export const REGIONAL_PRICING: RegionalPricing[] = [
  {
    region: 'Northeast',
    states: ['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
    multiplier: 1.15,
  },
  {
    region: 'Southeast',
    states: ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
    multiplier: 0.95,
  },
  {
    region: 'Midwest',
    states: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
    multiplier: 1.00,
  },
  {
    region: 'Southwest',
    states: ['AZ', 'NM', 'OK', 'TX'],
    multiplier: 0.95,
  },
  {
    region: 'West',
    states: ['CA', 'CO', 'NV', 'UT'],
    multiplier: 1.20,
  },
  {
    region: 'Pacific Northwest',
    states: ['OR', 'WA', 'ID', 'MT', 'WY'],
    multiplier: 1.10,
  },
  {
    region: 'Alaska/Hawaii',
    states: ['AK', 'HI'],
    multiplier: 1.40,
  },
];

// Default waste factor (10-15%)
export const DEFAULT_WASTE_FACTOR = 0.10;

// Helper function to get regional multiplier from state code or city/state string
export function getRegionalMultiplier(location: string): number {
  const upperLocation = location.toUpperCase();

  for (const region of REGIONAL_PRICING) {
    for (const state of region.states) {
      if (upperLocation.includes(state)) {
        return region.multiplier;
      }
    }
  }

  // Default to national average
  return 1.00;
}

// Helper to get pitch multiplier from description or ratio
export function getPitchMultiplier(pitch: string): number {
  const normalizedPitch = pitch.toLowerCase().trim();

  // Direct lookup
  if (PITCH_MULTIPLIERS[normalizedPitch]) {
    return PITCH_MULTIPLIERS[normalizedPitch];
  }

  // Try to parse ratio format (e.g., "6/12" or "6:12")
  const ratioMatch = normalizedPitch.match(/(\d+)[/:]12/);
  if (ratioMatch) {
    const rise = parseInt(ratioMatch[1]);
    const key = `${rise}/12`;
    if (PITCH_MULTIPLIERS[key]) {
      return PITCH_MULTIPLIERS[key];
    }
  }

  // Default to moderate if unknown
  return PITCH_MULTIPLIERS['moderate'];
}
