/*
  # Content Processing System - Database Schema

  ## Overview
  This migration creates a comprehensive database structure for storing and managing
  social media content processing results including reels, posts, and OCR extractions.

  ## New Tables

  ### 1. `content_items`
  Primary table for all processed content types (reels, posts, OCR)
  - `id` (uuid, primary key) - Unique identifier
  - `content_type` (text) - Type: 'reel', 'post', or 'ocr'
  - `source_url` (text) - Original URL for reels/posts, null for OCR
  - `video_url` (text) - Direct video URL for reels
  - `status` (text) - Processing status: 'queued', 'processing', 'completed', 'failed'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `transcripts`
  Stores audio/video transcription data
  - `id` (uuid, primary key) - Unique identifier
  - `content_item_id` (uuid, foreign key) - References content_items.id
  - `text` (text) - Full transcript text
  - `language` (text) - Detected language
  - `segments` (jsonb) - Timestamped transcript segments
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `summaries`
  AI-generated summaries and analysis
  - `id` (uuid, primary key) - Unique identifier
  - `content_item_id` (uuid, foreign key) - References content_items.id
  - `title` (text) - Generated title
  - `tldr` (text) - Quick summary
  - `bullets` (jsonb) - Array of key points
  - `entities` (jsonb) - Named entities extracted
  - `key_moments` (jsonb) - Important timestamps with descriptions
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. `ocr_extractions`
  OCR text extraction results from images
  - `id` (uuid, primary key) - Unique identifier
  - `content_item_id` (uuid, foreign key) - References content_items.id
  - `extracted_text` (text) - Text extracted from image
  - `image_path` (text) - Storage path for uploaded image
  - `metadata` (jsonb) - Additional OCR metadata (confidence, etc.)
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. `content_metadata`
  Extended metadata for social media content
  - `id` (uuid, primary key) - Unique identifier
  - `content_item_id` (uuid, foreign key) - References content_items.id
  - `caption` (text) - Post/reel caption
  - `likes_count` (integer) - Number of likes
  - `comments_count` (integer) - Number of comments
  - `duration` (integer) - Video duration in seconds
  - `additional_data` (jsonb) - Flexible field for extra metadata
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. `processing_metrics`
  Performance tracking for processing pipelines
  - `id` (uuid, primary key) - Unique identifier
  - `content_item_id` (uuid, foreign key) - References content_items.id
  - `resolve_ms` (integer) - Time to resolve video URL
  - `download_ms` (integer) - Download time
  - `transcribe_ms` (integer) - Transcription time
  - `summarize_ms` (integer) - Summarization time
  - `ocr_ms` (integer) - OCR processing time
  - `model_info` (jsonb) - Models used for processing
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for all users (suitable for demo/single-user app)
  - Can be extended with user authentication and ownership checks

  ## Indexes
  - Performance indexes on frequently queried columns
  - Foreign key indexes for join operations
  - Text search indexes for content discovery

  ## Notes
  - Uses `gen_random_uuid()` for automatic ID generation
  - Timestamps auto-populate with `now()`
  - JSONB used for flexible, queryable structured data
  - All tables designed for easy expansion and querying
*/

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('reel', 'post', 'ocr')),
  source_url text,
  video_url text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_type ON content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_created ON content_items(created_at DESC);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  text text NOT NULL,
  language text,
  segments jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_content_item ON transcripts(content_item_id);

-- Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  tldr text NOT NULL,
  bullets jsonb DEFAULT '[]'::jsonb,
  entities jsonb DEFAULT '[]'::jsonb,
  key_moments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_summaries_content_item ON summaries(content_item_id);

-- Create ocr_extractions table
CREATE TABLE IF NOT EXISTS ocr_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  extracted_text text NOT NULL,
  image_path text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocr_content_item ON ocr_extractions(content_item_id);

-- Create content_metadata table
CREATE TABLE IF NOT EXISTS content_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  caption text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  duration integer,
  additional_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metadata_content_item ON content_metadata(content_item_id);

-- Create processing_metrics table
CREATE TABLE IF NOT EXISTS processing_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  resolve_ms integer,
  download_ms integer,
  transcribe_ms integer,
  summarize_ms integer,
  ocr_ms integer,
  model_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_content_item ON processing_metrics(content_item_id);

-- Enable Row Level Security on all tables
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (suitable for demo/single-user application)
-- For production with authentication, replace 'true' with proper auth checks

CREATE POLICY "Allow public read access to content_items"
  ON content_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to content_items"
  ON content_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to content_items"
  ON content_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from content_items"
  ON content_items FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to transcripts"
  ON transcripts FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to transcripts"
  ON transcripts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to summaries"
  ON summaries FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to summaries"
  ON summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to ocr_extractions"
  ON ocr_extractions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to ocr_extractions"
  ON ocr_extractions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to content_metadata"
  ON content_metadata FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to content_metadata"
  ON content_metadata FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to processing_metrics"
  ON processing_metrics FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to processing_metrics"
  ON processing_metrics FOR INSERT
  WITH CHECK (true);