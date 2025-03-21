import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisById } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing analysis ID' },
        { status: 400 }
      );
    }
    
    // Fetch the analysis from the database
    const { data: analysis, error } = await getAnalysisById(id);
    
    if (error || !analysis) {
      return NextResponse.json(
        { error: error?.message || 'Analysis not found' },
        { status: 404 }
      );
    }
    
    // You can access searchParams via: request.nextUrl.searchParams if needed.
    // Return the analysis data
    return NextResponse.json({
      analysis,
      status: analysis.analysis_status,
      result: analysis.analysis_result,
    });
    
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
