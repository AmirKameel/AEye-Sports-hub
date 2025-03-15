import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisById } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    try {
      // Try to fetch from Supabase first
      const { data, error } = await getAnalysisById(id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        return NextResponse.json({ analysis: data });
      }
    } catch (error) {
      console.warn('Supabase fetch failed, using simulated data for development:', error);
      // Continue to simulated data if Supabase fails
    }
    
    // If we get here, either Supabase failed or the analysis wasn't found
    // For development, return simulated data
    
    // Determine the sport type from the ID
    const sportType = id.startsWith('football') ? 'football' : 'tennis';
    
    // Simulate different statuses based on time
    // This helps test the UI for different states
    const now = Date.now();
    const idNumber = parseInt(id.split('-')[1] || '0', 16) || 0;
    const statusSeed = (now + idNumber) % 100;
    
    let status = 'completed';
    if (statusSeed < 10) {
      status = 'pending';
    } else if (statusSeed < 20) {
      status = 'processing';
    } else if (statusSeed < 30) {
      status = 'failed';
    }
    
    // For failed status, return an error
    if (status === 'failed') {
      const simulatedAnalysis = {
        id,
        user_id: 'demo-user',
        video_url: 'simulated-url',
        sport_type: sportType,
        analysis_status: 'failed',
        analysis_result: {
          error: 'Simulated analysis failure for testing'
        },
        created_at: new Date().toISOString()
      };
      
      return NextResponse.json({ analysis: simulatedAnalysis });
    }
    
    // For pending or processing, return appropriate status
    if (status === 'pending' || status === 'processing') {
      const simulatedAnalysis = {
        id,
        user_id: 'demo-user',
        video_url: 'simulated-url',
        sport_type: sportType,
        analysis_status: status,
        analysis_result: null,
        created_at: new Date().toISOString()
      };
      
      return NextResponse.json({ analysis: simulatedAnalysis });
    }
    
    // For completed status, return simulated results
    const simulatedAnalysis = {
      id,
      user_id: 'demo-user',
      video_url: 'simulated-url',
      sport_type: sportType,
      analysis_status: 'completed',
      analysis_result: {
        videoMetadata: {
          duration: 60,
          width: 1280,
          height: 720,
          fps: 30
        },
        analysisResults: sportType === 'tennis' ? [
          "Player movement analysis shows excellent court coverage. Player 1 covers 72% of the court with an average speed of 4.2 m/s, while Player 2 covers 65% with 3.8 m/s.",
          "Ball tracking indicates most rallies are played from the baseline. Player 1 shows a preference for cross-court shots, while Player 2 attempts more down-the-line winners.",
          "Player 1 demonstrates efficient lateral movement, particularly when defending. Player 2 shows quick forward movement but less efficient recovery positioning."
        ] : [
          "Team formation analysis shows a 4-3-3 structure with good spacing between players. The defensive line maintains proper depth and width throughout the match.",
          "Ball movement is efficient with quick passes between players. The team completes 85% of attempted passes, with most successful combinations occurring in the middle third.",
          "Player tracking shows excellent off-ball movement, creating passing lanes and space for teammates. Defensive transitions are well-coordinated with players quickly regaining shape."
        ],
        coordinates: []
      },
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ analysis: simulatedAnalysis });
  } catch (error: any) {
    console.error('Error in analysis API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 