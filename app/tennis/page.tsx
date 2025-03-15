'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoUploader from '@/components/VideoUploader';
import VideoAnalyzer from '@/components/VideoAnalyzer';
import BoundingBoxSelector from '@/components/BoundingBoxSelector';
import { v4 as uuidv4 } from 'uuid';
import { BoundingBox, initializeTennisTracker, trackFrame, generateAnalysisResult } from '@/lib/tennis-tracker';

export default function TennisAnalysisPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [showBoundingBoxSelector, setShowBoundingBoxSelector] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<BoundingBox[] | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{width: number, height: number, duration: number} | null>(null);

  const handleUploadComplete = (url: string, name: string) => {
    setVideoUrl(url);
    setFileName(name);
  };

  const startAnalysis = async () => {
    if (!videoUrl) {
      setError('Please upload a video first');
      return;
    }

    if (!videoMetadata) {
      setError('Video metadata not loaded. Please try again.');
      return;
    }

    // Show bounding box selector first
    setError(null);
    setShowBoundingBoxSelector(true);
  };
  
  const handleBoxesSelected = (boxes: BoundingBox[]) => {
    if (!boxes.some(box => box.label === 'player') || !boxes.some(box => box.label === 'ball')) {
      setError('Please draw bounding boxes for both the player and the ball.');
      return;
    }

    setSelectedBoxes(boxes);
    setShowBoundingBoxSelector(false);
    
    // Now start the actual analysis
    startTennisAnalysis(boxes);
  };
  
  const handleBoxSelectorCancel = () => {
    setShowBoundingBoxSelector(false);
  };
  
  const startTennisAnalysis = async (boxes: BoundingBox[]) => {
    if (!videoUrl || !videoMetadata) {
      setError('Video not properly loaded. Please try again.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setProcessingMessage("Initializing tennis analysis...");
    
    // Generate a unique ID for this analysis
    const newAnalysisId = `tennis-${uuidv4()}`;
    setAnalysisId(newAnalysisId);
    
    try {
      // Initialize tennis tracker with the selected bounding boxes
      const { initialFrame, pixelsToMeters } = initializeTennisTracker(
        boxes,
        videoMetadata.width,
        videoMetadata.height
      );
      
      // Create a video element to extract frames
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      
      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
        video.load();
      });
      
      // Set video duration
      const duration = video.duration;
      
      // Calculate total frames to process (2 frames per second)
      const frameRate = 2;
      const totalFrames = Math.floor(duration * frameRate);
      
      // Store all frames
      const frames = [initialFrame];
      
      // Process frames
      for (let frameIndex = 1; frameIndex < totalFrames; frameIndex++) {
        // Calculate timestamp
        const timestamp = frameIndex / frameRate;
        
        // Update progress message
        if (frameIndex < totalFrames * 0.3) {
          setProcessingMessage("Extracting video frames...");
        } else if (frameIndex < totalFrames * 0.6) {
          setProcessingMessage("Tracking player and ball...");
        } else {
          setProcessingMessage("Analyzing player performance...");
        }
        
        try {
          // Seek to timestamp
          video.currentTime = timestamp;
          
          // Wait for seeking to complete
          await new Promise<void>((resolve) => {
            const handleSeeked = () => {
              video.removeEventListener('seeked', handleSeeked);
              resolve();
            };
            video.addEventListener('seeked', handleSeeked);
          });
          
          // Extract frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Could not get canvas context');
          }
          
          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64
          const frameBase64 = canvas.toDataURL('image/jpeg');
          
          // Track objects in this frame
          const frame = await trackFrame(
            frameBase64,
            frameIndex,
            timestamp,
            frames[frames.length - 1],
            pixelsToMeters
          );
          
          // Add frame to collection
          frames.push(frame);
          
          // Update progress
          setProgress((frameIndex / totalFrames) * 100);
        } catch (error) {
          console.error(`Error processing frame at ${timestamp}s:`, error);
          // Continue with next frame
        }
      }
      
      // Generate final analysis result
      const analysisResult = generateAnalysisResult(
        frames,
        {
          duration,
          width: videoMetadata.width,
          height: videoMetadata.height,
          fps: 30
        },
        pixelsToMeters
      );
      
      // Store result in localStorage
      localStorage.setItem(`analysis-${newAnalysisId}`, JSON.stringify(analysisResult));
      
      // Navigate to results page
      router.push(`/tennis/results/${newAnalysisId}?videoUrl=${encodeURIComponent(videoUrl)}`);
    } catch (error: any) {
      console.error('Error analyzing tennis video:', error);
      setError(error.message || 'Error analyzing video');
      setIsAnalyzing(false);
    }
  };
  
  // Get video metadata when video URL changes
  useEffect(() => {
    if (!videoUrl) return;
    
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    
    video.onloadedmetadata = () => {
      setVideoMetadata({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
    };
    
    video.onerror = () => {
      setError('Error loading video metadata');
    };
    
    video.load();
    
    return () => {
      video.src = '';
    };
  }, [videoUrl]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tennis Video Analysis</h1>
      
      {!showBoundingBoxSelector && !isAnalyzing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Tennis Video</h2>
          <p className="text-gray-600 mb-4">
            Upload a tennis video for AI analysis. For best results, use a video that clearly shows the player and the ball.
            <br />
            <strong>Note:</strong> For testing purposes, we recommend using a short video (10-30 seconds) to speed up processing.
          </p>
          <VideoUploader 
            sportType="tennis"
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {videoUrl && !showBoundingBoxSelector && !isAnalyzing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Video Preview</h2>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full"
              poster="/tennis-placeholder.jpg"
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
                ? 'bg-orange-400 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </div>
      )}
      
      {showBoundingBoxSelector && videoUrl && (
        <div className="mb-8">
          <BoundingBoxSelector 
            videoUrl={videoUrl}
            onBoxesSelected={handleBoxesSelected}
            onCancel={handleBoxSelectorCancel}
          />
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Analyzing Tennis Video</h2>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {processingMessage} ({Math.round(progress)}%)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-orange-500 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">
          {error}
        </div>
      )}

      {!showBoundingBoxSelector && !isAnalyzing && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">How Tennis Analysis Works</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</div>
              <div>
                <h3 className="font-medium">Select Player & Ball</h3>
                <p className="text-gray-600">Draw bounding boxes around the player and ball to initialize tracking.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</div>
              <div>
                <h3 className="font-medium">AI Tracking</h3>
                <p className="text-gray-600">Our AI models track the player and ball throughout the video using the Roboflow API.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</div>
              <div>
                <h3 className="font-medium">Shot Detection</h3>
                <p className="text-gray-600">The system detects shots by analyzing player and ball positions and movements.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</div>
              <div>
                <h3 className="font-medium">Performance Analysis</h3>
                <p className="text-gray-600">Receive detailed analysis with player speed, shot types, court coverage, and tactical insights.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 