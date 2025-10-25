import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export interface ContentItem {
  id: string;
  content_type: 'reel' | 'post' | 'ocr';
  source_url?: string;
  video_url?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  content_item_id: string;
  text: string;
  language?: string;
  segments?: any;
  created_at: string;
}

export interface Summary {
  id: string;
  content_item_id: string;
  title: string;
  tldr: string;
  bullets: string[];
  entities: string[];
  key_moments: Array<{ time: string; description: string }>;
  created_at: string;
}

export interface OCRExtraction {
  id: string;
  content_item_id: string;
  extracted_text: string;
  image_path: string;
  metadata: any;
  created_at: string;
}

export interface ContentMetadata {
  id: string;
  content_item_id: string;
  caption?: string;
  likes_count?: number;
  comments_count?: number;
  duration?: number;
  additional_data?: any;
  created_at: string;
}

export async function createContentItem(data: {
  content_type: 'reel' | 'post' | 'ocr';
  source_url?: string;
  video_url?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
}): Promise<ContentItem> {
  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      content_type: data.content_type,
      source_url: data.source_url,
      video_url: data.video_url,
      status: data.status || 'queued'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create content item: ${error.message}`);
  return item;
}

export async function updateContentItem(id: string, data: {
  status?: string;
  video_url?: string;
  error_message?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to update content item: ${error.message}`);
}

export async function createTranscript(data: {
  content_item_id: string;
  text: string;
  language?: string;
  segments?: any;
}): Promise<Transcript> {
  const { data: transcript, error } = await supabase
    .from('transcripts')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create transcript: ${error.message}`);
  return transcript;
}

export async function createSummary(data: {
  content_item_id: string;
  title: string;
  tldr: string;
  bullets: string[];
  entities: string[];
  key_moments?: Array<{ time: string; description: string }>;
}): Promise<Summary> {
  const { data: summary, error } = await supabase
    .from('summaries')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create summary: ${error.message}`);
  return summary;
}

export async function createOCRExtraction(data: {
  content_item_id: string;
  extracted_text: string;
  image_path: string;
  metadata?: any;
}): Promise<OCRExtraction> {
  const { data: extraction, error } = await supabase
    .from('ocr_extractions')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create OCR extraction: ${error.message}`);
  return extraction;
}

export async function createContentMetadata(data: {
  content_item_id: string;
  caption?: string;
  likes_count?: number;
  comments_count?: number;
  duration?: number;
  additional_data?: any;
}): Promise<ContentMetadata> {
  const { data: metadata, error } = await supabase
    .from('content_metadata')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`Failed to create content metadata: ${error.message}`);
  return metadata;
}

export async function createProcessingMetrics(data: {
  content_item_id: string;
  resolve_ms?: number;
  download_ms?: number;
  transcribe_ms?: number;
  summarize_ms?: number;
  ocr_ms?: number;
  model_info?: any;
}): Promise<void> {
  const { error } = await supabase
    .from('processing_metrics')
    .insert(data);

  if (error) throw new Error(`Failed to create processing metrics: ${error.message}`);
}

export async function getContentItemWithDetails(id: string): Promise<any> {
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (itemError) throw new Error(`Failed to get content item: ${itemError.message}`);
  if (!item) return null;

  const { data: transcript } = await supabase
    .from('transcripts')
    .select('*')
    .eq('content_item_id', id)
    .maybeSingle();

  const { data: summary } = await supabase
    .from('summaries')
    .select('*')
    .eq('content_item_id', id)
    .maybeSingle();

  const { data: ocr } = await supabase
    .from('ocr_extractions')
    .select('*')
    .eq('content_item_id', id)
    .maybeSingle();

  const { data: metadata } = await supabase
    .from('content_metadata')
    .select('*')
    .eq('content_item_id', id)
    .maybeSingle();

  const { data: metrics } = await supabase
    .from('processing_metrics')
    .select('*')
    .eq('content_item_id', id)
    .maybeSingle();

  return {
    ...item,
    transcript,
    summary,
    ocr,
    metadata,
    metrics
  };
}

export async function listContentItems(filters?: {
  content_type?: 'reel' | 'post' | 'ocr';
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total: number }> {
  let query = supabase
    .from('content_items')
    .select('*, summaries(*), transcripts(*), ocr_extractions(*), content_metadata(*)', { count: 'exact' });

  if (filters?.content_type) {
    query = query.eq('content_type', filters.content_type);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list content items: ${error.message}`);

  return {
    items: data || [],
    total: count || 0
  };
}

export async function deleteContentItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Failed to delete content item ${id}:`, error);
    return false;
  }

  return true;
}

export { supabase };
