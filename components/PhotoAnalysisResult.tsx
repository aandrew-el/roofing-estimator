'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Home,
  Wrench,
  Calendar,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoofAnalysis {
  material: string;
  materialConfidence: number;
  condition: string;
  conditionScore: number;
  damageDetected: boolean;
  damageDetails: string[];
  estimatedAreaSqft: number | null;
  ageEstimate: string;
  recommendations: string[];
  overallAssessment: string;
}

interface PhotoAnalysisResultProps {
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  analysis?: RoofAnalysis | null;
  error?: string | null;
  imageUrl?: string;
}

const conditionColors: Record<string, string> = {
  excellent: 'bg-green-500',
  good: 'bg-green-400',
  fair: 'bg-yellow-500',
  poor: 'bg-orange-500',
  critical: 'bg-red-500',
  unknown: 'bg-gray-400',
};

const conditionTextColors: Record<string, string> = {
  excellent: 'text-green-600',
  good: 'text-green-500',
  fair: 'text-yellow-600',
  poor: 'text-orange-600',
  critical: 'text-red-600',
  unknown: 'text-gray-500',
};

export function PhotoAnalysisResult({
  status,
  analysis,
  error,
  imageUrl,
}: PhotoAnalysisResultProps) {
  if (status === 'pending' || status === 'analyzing') {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-accent" />
            <p className="text-sm font-medium">
              {status === 'pending' ? 'Preparing analysis...' : 'Analyzing roof photo...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AI is examining the roof for material, condition, and damage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive">Analysis Failed</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error || 'Unable to analyze the photo. Please try again.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const conditionColor = conditionColors[analysis.condition] || conditionColors.unknown;
  const conditionTextColor = conditionTextColors[analysis.condition] || conditionTextColors.unknown;

  return (
    <Card className="overflow-hidden">
      {/* Image preview */}
      {imageUrl && (
        <div className="aspect-video relative">
          <img
            src={imageUrl}
            alt="Analyzed roof"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {analysis.damageDetected ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Damage Detected
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 bg-green-500 text-white">
                <CheckCircle className="h-3 w-3" />
                No Damage
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5" />
          Roof Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Assessment */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm">{analysis.overallAssessment}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Material */}
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Material</p>
            <p className="font-medium capitalize">{analysis.material}</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={analysis.materialConfidence * 100}
                className="h-1 flex-1"
              />
              <span className="text-xs text-muted-foreground">
                {Math.round(analysis.materialConfidence * 100)}%
              </span>
            </div>
          </div>

          {/* Condition */}
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Condition</p>
            <div className="flex items-center gap-2">
              <span className={cn('font-medium capitalize', conditionTextColor)}>
                {analysis.condition}
              </span>
              <div className={cn('w-3 h-3 rounded-full', conditionColor)} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Score: {analysis.conditionScore}/10
            </p>
          </div>

          {/* Age Estimate */}
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              Age Estimate
            </div>
            <p className="font-medium">{analysis.ageEstimate}</p>
          </div>

          {/* Area Estimate */}
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Ruler className="h-3 w-3" />
              Estimated Area
            </div>
            <p className="font-medium">
              {analysis.estimatedAreaSqft
                ? `${analysis.estimatedAreaSqft.toLocaleString()} sq ft`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Damage Details */}
        {analysis.damageDetected && analysis.damageDetails.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium">Damage Observations</p>
            </div>
            <ul className="space-y-1">
              {analysis.damageDetails.map((detail, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">Recommendations</p>
            </div>
            <ul className="space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-accent">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
