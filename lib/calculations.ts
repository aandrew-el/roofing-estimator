// Roofing calculation functions

import {
  Estimate,
  LineItem,
  RoofingProject
} from './types';
import {
  ADDITIONAL_COSTS,
  COMPLEXITY_MULTIPLIERS,
  DEFAULT_WASTE_FACTOR,
  getRegionalMultiplier,
  getPitchMultiplier,
  SHINGLE_PRICING,
} from './pricing';

/**
 * Calculate the actual roof area based on footprint and pitch
 */
export function calculateRoofArea(
  footprint: number,
  pitchMultiplier: number
): number {
  return Math.round(footprint * pitchMultiplier);
}

/**
 * Calculate the number of squares needed (1 square = 100 sq ft)
 * Includes waste factor
 */
export function calculateSquares(
  roofArea: number,
  wasteFactor: number = DEFAULT_WASTE_FACTOR
): number {
  return Math.ceil((roofArea * (1 + wasteFactor)) / 100);
}

/**
 * Estimate roof perimeter from area
 * Assumes roughly rectangular shape with 1.5:1 ratio
 */
export function estimateRoofPerimeter(roofArea: number): number {
  // For a rectangular roof with L = 1.5W
  // Area = L * W = 1.5W^2
  // W = sqrt(Area / 1.5)
  const width = Math.sqrt(roofArea / 1.5);
  const length = width * 1.5;
  return Math.round(2 * (width + length));
}

/**
 * Calculate complexity multiplier based on stories and pitch
 */
export function getComplexityMultiplier(
  stories: number,
  pitchMultiplier: number
): number {
  let multiplier = COMPLEXITY_MULTIPLIERS.singleStory;

  // Story complexity
  if (stories === 2) {
    multiplier = COMPLEXITY_MULTIPLIERS.twoStory;
  } else if (stories >= 3) {
    multiplier = COMPLEXITY_MULTIPLIERS.threeStory;
  }

  // Steep pitch additional complexity
  if (pitchMultiplier >= 1.30) {
    multiplier *= COMPLEXITY_MULTIPLIERS.verysteepPitch;
  } else if (pitchMultiplier >= 1.20) {
    multiplier *= COMPLEXITY_MULTIPLIERS.steepPitch;
  }

  return multiplier;
}

/**
 * Generate itemized line items for the estimate
 */
export function generateLineItems(
  project: RoofingProject,
  squares: number,
  roofPerimeter: number,
  regionalMultiplier: number
): LineItem[] {
  const items: LineItem[] = [];
  const pricing = SHINGLE_PRICING[project.shingleType];
  const complexityMultiplier = getComplexityMultiplier(
    project.stories,
    project.pitchMultiplier
  );

  // Shingles
  const shingleName = project.shingleType === 'three-tab'
    ? '3-Tab Asphalt Shingles'
    : project.shingleType === 'architectural'
    ? 'Architectural Shingles'
    : 'Premium Designer Shingles';

  items.push({
    name: shingleName,
    description: 'Including starter strips and ridge caps',
    quantity: squares,
    unit: 'sq',
    pricePerUnit: Math.round(pricing.material * regionalMultiplier),
    total: Math.round(squares * pricing.material * regionalMultiplier),
  });

  // Synthetic underlayment
  items.push({
    name: 'Synthetic Underlayment',
    description: 'Ice and water shield at eaves and valleys',
    quantity: squares,
    unit: 'sq',
    pricePerUnit: ADDITIONAL_COSTS.underlayment.synthetic,
    total: squares * ADDITIONAL_COSTS.underlayment.synthetic,
  });

  // Installation labor
  const laborCost = Math.round(
    pricing.labor * complexityMultiplier * regionalMultiplier
  );
  items.push({
    name: 'Installation Labor',
    description: `${project.stories}-story, ${project.pitch} pitch`,
    quantity: squares,
    unit: 'sq',
    pricePerUnit: laborCost,
    total: squares * laborCost,
  });

  // Tear-off if needed
  if (project.tearOffLayers > 0) {
    const tearOffCost = ADDITIONAL_COSTS.tearOffPerLayer * project.tearOffLayers;
    items.push({
      name: `Tear-Off and Disposal`,
      description: `Remove ${project.tearOffLayers} existing layer${project.tearOffLayers > 1 ? 's' : ''}`,
      quantity: squares,
      unit: 'sq',
      pricePerUnit: tearOffCost,
      total: squares * tearOffCost,
    });
  }

  // Flashing and sealants
  let flashingTotal = ADDITIONAL_COSTS.flashingBase;
  flashingTotal += project.chimneys * ADDITIONAL_COSTS.chimneyFlashing;
  flashingTotal += project.skylights * ADDITIONAL_COSTS.skylightFlashing;
  flashingTotal += project.valleys * ADDITIONAL_COSTS.valleyFlashing;

  const flashingDescription = [];
  if (project.chimneys > 0) {
    flashingDescription.push(`${project.chimneys} chimney${project.chimneys > 1 ? 's' : ''}`);
  }
  if (project.skylights > 0) {
    flashingDescription.push(`${project.skylights} skylight${project.skylights > 1 ? 's' : ''}`);
  }
  if (project.valleys > 0) {
    flashingDescription.push(`${project.valleys} valley${project.valleys > 1 ? 's' : ''}`);
  }

  items.push({
    name: 'Flashing and Sealants',
    description: flashingDescription.length > 0
      ? `Including ${flashingDescription.join(', ')}`
      : 'Standard flashing package',
    quantity: 1,
    unit: 'lot',
    pricePerUnit: flashingTotal,
    total: flashingTotal,
  });

  // Drip edge
  items.push({
    name: 'Drip Edge',
    description: 'Aluminum drip edge at all eaves and rakes',
    quantity: roofPerimeter,
    unit: 'lf',
    pricePerUnit: ADDITIONAL_COSTS.dripEdge,
    total: Math.round(roofPerimeter * ADDITIONAL_COSTS.dripEdge),
  });

  // Permit allowance
  items.push({
    name: 'Permit Allowance',
    description: 'Building permit fees (may vary by municipality)',
    quantity: 1,
    unit: 'ea',
    pricePerUnit: ADDITIONAL_COSTS.permitAllowance,
    total: ADDITIONAL_COSTS.permitAllowance,
  });

  return items;
}

/**
 * Generate a complete estimate from project data
 */
export function generateEstimate(project: RoofingProject): Estimate {
  // Calculate base metrics
  // For multi-story homes, roof footprint is approximately home sqft / stories
  // (since floors stack on top of each other)
  const roofFootprint = Math.round(project.roofSqft / project.stories);
  const roofArea = calculateRoofArea(roofFootprint, project.pitchMultiplier);
  const squares = calculateSquares(roofArea);
  const roofPerimeter = estimateRoofPerimeter(roofArea);
  const regionalMultiplier = getRegionalMultiplier(project.location);

  // Generate line items
  const lineItems = generateLineItems(
    project,
    squares,
    roofPerimeter,
    regionalMultiplier
  );

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  // Calculate estimate range (low/mid/high)
  // Low: -10%, Mid: subtotal, High: +15%
  const lowEstimate = Math.round(subtotal * 0.90);
  const midEstimate = subtotal;
  const highEstimate = Math.round(subtotal * 1.15);

  // Generate unique ID
  const id = `EST-${Date.now().toString(36).toUpperCase()}`;

  return {
    id,
    createdAt: new Date().toISOString(),
    project,
    roofArea,
    squares,
    roofPerimeter,
    lineItems,
    subtotal,
    lowEstimate,
    midEstimate,
    highEstimate,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
