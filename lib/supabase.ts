import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type VideoAnalysis = {
  id: string;
  user_id: string;
  video_url: string;
  sport_type: 'football' | 'tennis';
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_result: any;
  created_at: string;
};

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

export async function createAnalysis(userId: string, videoUrl: string, sportType: 'football' | 'tennis') {
  return await supabase
    .from('video_analysis')
    .insert({
      user_id: userId,
      video_url: videoUrl,
      sport_type: sportType,
      analysis_status: 'pending',
      analysis_result: null,
    })
    .select()
    .single();
}

export async function updateAnalysisStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed', result?: any) {
  const updateData: any = { analysis_status: status };
  if (result) {
    updateData.analysis_result = result;
  }
  
  return await supabase
    .from('video_analysis')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
}

export async function getAnalysisByUserId(userId: string) {
  return await supabase
    .from('video_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function getAnalysisById(id: string) {
  return await supabase
    .from('video_analysis')
    .select('*')
    .eq('id', id)
    .single();
} 