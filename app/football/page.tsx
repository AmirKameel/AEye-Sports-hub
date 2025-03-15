'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoUploader from '@/components/VideoUploader';
import VideoAnalyzer from '@/components/VideoAnalyzer';
import { v4 as uuidv4 } from 'uuid';

export default function FootballAnalysisPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);

  const handleUploadComplete = (url: string, name: string) => {
    setVideoUrl(url);
    setFileName(name);
  };

  const startAnalysis = async () => {
    if (!videoUrl) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setProcessingMessage("Preparing to analyze video...");
    
    // Generate a unique ID for this analysis
    const newAnalysisId = `football-${uuidv4()}`;
    setAnalysisId(newAnalysisId);
    
    // Show the analyzer component
    setShowAnalyzer(true);
  };
  
  const handleAnalysisProgress = (progress: number) => {
    setProgress(progress);
    
    // Update processing message based on progress
    if (progress < 10) {
      setProcessingMessage("Initializing video analysis...");
    } else if (progress < 30) {
      setProcessingMessage("Extracting video frames...");
    } else if (progress < 50) {
      setProcessingMessage("Detecting players and ball...");
    } else if (progress < 70) {
      setProcessingMessage("Tracking player movements...");
    } else if (progress < 90) {
      setProcessingMessage("Analyzing player performance...");
    } else {
      setProcessingMessage("Finalizing analysis results...");
    }
  };
  
  const handleAnalysisComplete = (result: any) => {
    // Navigate to the results page with the video URL and analysis result
    if (analysisId) {
      // Store the result in localStorage for the results page to access
      localStorage.setItem(`analysis-${analysisId}`, JSON.stringify(result));
      
      // Navigate to the results page
      router.push(`/football/results/${analysisId}?videoUrl=${encodeURIComponent(videoUrl!)}`);
    }
  };
  
  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setIsAnalyzing(false);
    setShowAnalyzer(false);
    setProcessingMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Football Video Analysis</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Football Video</h2>
        <p className="text-gray-600 mb-4">
          Upload a football video for AI analysis. For best results, use a video that clearly shows the players and the field.
          <br />
          <strong>Note:</strong> For testing purposes, we recommend using a short video (10-30 seconds) to speed up processing.
        </p>
        <VideoUploader 
          sportType="football"
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {videoUrl && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video Preview</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full"
              poster="/football-placeholder.jpg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-gray-600 mb-4">
            File: {fileName}
          </p>
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              isAnalyzing 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
          
          {isAnalyzing && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                {processingMessage} ({Math.round(progress)}%)
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}
      
      {/* Hidden video analyzer component */}
      {showAnalyzer && videoUrl && (
        <VideoAnalyzer
          videoUrl={videoUrl}
          sportType="football"
          onProgress={handleAnalysisProgress}
          onComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">How Football Analysis Works</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</div>
            <div>
              <h3 className="font-medium">Player & Ball Detection</h3>
              <p className="text-gray-600">Our AI models detect and track all players and the ball in each frame of your video using the Roboflow API.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</div>
            <div>
              <h3 className="font-medium">Event Recognition</h3>
              <p className="text-gray-600">The system identifies key events like passes, shots, tackles, and crosses based on player and ball movement.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</div>
            <div>
              <h3 className="font-medium">Tactical Analysis</h3>
              <p className="text-gray-600">Advanced AI analyzes team formations, player positioning, and tactical patterns throughout the match.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</div>
            <div>
              <h3 className="font-medium">Comprehensive Report</h3>
              <p className="text-gray-600">Receive a detailed report with statistics, event timelines, and tactical insights to improve performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 