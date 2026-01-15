'use client';

import { useState, useCallback } from 'react';

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

interface UploadedPhoto {
  id: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
}

interface PhotoState {
  photo: UploadedPhoto | null;
  status: 'idle' | 'uploading' | 'pending' | 'analyzing' | 'completed' | 'failed';
  analysis: RoofAnalysis | null;
  error: string | null;
}

export function usePhotoAnalysis() {
  const [state, setState] = useState<PhotoState>({
    photo: null,
    status: 'idle',
    analysis: null,
    error: null,
  });

  const handleUploadComplete = useCallback((photo: UploadedPhoto) => {
    setState(prev => ({
      ...prev,
      photo,
      status: 'pending',
      analysis: null,
      error: null,
    }));
  }, []);

  const analyze = useCallback(async (photoId: string, imageUrl: string) => {
    setState(prev => ({ ...prev, status: 'analyzing' }));

    try {
      const response = await fetch('/api/photos/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId, imageUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        status: 'completed',
        analysis: data.analysis,
        error: null,
      }));

      return data.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      photo: null,
      status: 'idle',
      analysis: null,
      error: null,
    });
  }, []);

  // Helper to format analysis as text for chat
  const getAnalysisSummary = useCallback((): string | null => {
    if (!state.analysis) return null;

    const { analysis } = state;
    let summary = `**Roof Analysis Results**\n\n`;
    summary += `**Material:** ${analysis.material} (${Math.round(analysis.materialConfidence * 100)}% confidence)\n`;
    summary += `**Condition:** ${analysis.condition} (${analysis.conditionScore}/10)\n`;
    summary += `**Estimated Age:** ${analysis.ageEstimate}\n`;

    if (analysis.estimatedAreaSqft) {
      summary += `**Estimated Area:** ${analysis.estimatedAreaSqft.toLocaleString()} sq ft\n`;
    }

    summary += `\n${analysis.overallAssessment}\n`;

    if (analysis.damageDetected && analysis.damageDetails.length > 0) {
      summary += `\n**Damage Detected:**\n`;
      analysis.damageDetails.forEach(detail => {
        summary += `- ${detail}\n`;
      });
    }

    if (analysis.recommendations.length > 0) {
      summary += `\n**Recommendations:**\n`;
      analysis.recommendations.forEach(rec => {
        summary += `- ${rec}\n`;
      });
    }

    return summary;
  }, [state.analysis]);

  return {
    photo: state.photo,
    status: state.status,
    analysis: state.analysis,
    error: state.error,
    handleUploadComplete,
    analyze,
    reset,
    getAnalysisSummary,
    isAnalyzing: state.status === 'analyzing' || state.status === 'pending',
    hasResult: state.status === 'completed' && state.analysis !== null,
  };
}
