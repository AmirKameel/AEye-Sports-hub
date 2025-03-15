'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VideoAnalysis } from '@/lib/supabase';
import TennisAnalysisReport from '@/components/TennisAnalysisReport';
import { TennisAnalysisResult } from '@/lib/tennis-tracker';

export default function TennisResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  // Get the video URL from the query parameters if available
  const videoUrlFromQuery = searchParams.get('videoUrl');
  
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [tennisAnalysis, setTennisAnalysis] = useState<TennisAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        // First, try to get the analysis from localStorage
        const localStorageKey = `analysis-${id}`;
        const storedAnalysis = localStorage.getItem(localStorageKey);
        
        if (storedAnalysis) {
          // If we have the analysis in localStorage, use it
          const parsedAnalysis = JSON.parse(storedAnalysis);
          
          // Create a VideoAnalysis object from the stored data
          const analysisObj: VideoAnalysis = {
            id,
            user_id: 'client-user',
            video_url: videoUrlFromQuery || '',
            sport_type: 'tennis',
            analysis_status: 'completed',
            analysis_result: parsedAnalysis,
            created_at: new Date().toISOString()
          };
          
          setAnalysis(analysisObj);
          setTennisAnalysis(parsedAnalysis);
          setLoading(false);
          return;
        }
        
        // If not in localStorage, try to fetch from the API
        const response = await fetch(`/api/analysis/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch analysis');
        }
        
        // If we have a video URL from the query parameters, use it
        if (videoUrlFromQuery && data.analysis) {
          data.analysis.video_url = videoUrlFromQuery;
        }
        
        setAnalysis(data.analysis);
        
        // Check if the analysis result is a TennisAnalysisResult
        if (data.analysis.analysis_result && 
            data.analysis.analysis_result.frames && 
            data.analysis.analysis_result.playerStats) {
          setTennisAnalysis(data.analysis.analysis_result);
        }
      } catch (error: any) {
        console.error('Error fetching analysis:', error);
        setError(error.message || 'Error fetching analysis');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [id, videoUrlFromQuery]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-xl">Loading analysis results...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'Analysis not found'}</p>
        </div>
        <Link 
          href="/tennis" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
        >
          Back to Tennis Analysis
        </Link>
      </div>
    );
  }

  // Handle different analysis statuses
  if (analysis.analysis_status === 'pending' || analysis.analysis_status === 'processing') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Analysis in Progress</h2>
        <p className="text-gray-600 mb-6">
          Your tennis video is currently being analyzed. This may take a few minutes.
        </p>
        <Link 
          href="/tennis" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
        >
          Back to Tennis Analysis
        </Link>
      </div>
    );
  }

  if (analysis.analysis_status === 'failed') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
          <p>
            {analysis.analysis_result?.error || 'There was an error processing your video. Please try again.'}
          </p>
        </div>
        <Link 
          href="/tennis" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
        >
          Back to Tennis Analysis
        </Link>
      </div>
    );
  }

  // Display completed analysis results
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tennis Analysis Results</h1>
        <Link 
          href="/tennis" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded"
        >
          New Analysis
        </Link>
      </div>

      {videoUrlFromQuery && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              src={videoUrlFromQuery} 
              controls 
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
      
      {tennisAnalysis ? (
        <TennisAnalysisReport result={tennisAnalysis} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Analysis Summary</h2>
          <p className="text-gray-600">
            The analysis was completed, but the detailed tennis analysis format is not available.
            This may be because the analysis was performed with an older version of the system.
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg mt-4 overflow-auto max-h-96">
            {JSON.stringify(analysis.analysis_result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 