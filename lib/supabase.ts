import { createClient } from '@supabase/supabase-js';
import { TennisAnalysisResult } from './tennis-tracker';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the VideoAnalysis type
export interface VideoAnalysis {
  id: string;
  user_id: string;
  video_url: string;
  sport_type: 'tennis' | 'football';
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_result: TennisAnalysisResult | any;
  created_at: string;
}

// Fetch analysis by ID
export async function getAnalysisById(id: string) {
  return supabase
    .from('video_analysis')
    .select('*')
    .eq('id', id)
    .single();
}

// Create a new analysis record
export async function createAnalysis(data: Omit<VideoAnalysis, 'id' | 'created_at'>) {
  return supabase
    .from('video_analysis')
    .insert(data)
    .select()
    .single();
}

// Update an existing analysis record
export async function updateAnalysis(id: string, data: Partial<Omit<VideoAnalysis, 'id' | 'created_at'>>) {
  return supabase
    .from('video_analysis')
    .update(data)
    .eq('id', id);
}

// Fetch analysis by user ID
export async function getAnalysesByUserId(userId: string) {
  return supabase
    .from('video_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export type Coordinates = {
  frame_id: number;
  timestamp: number;
  objects: {
    id: string;
    class: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}; 