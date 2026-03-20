/*
  # Create Videos Table for Tutorial Scrapbook

  1. New Tables
    - `videos`
      - `id` (uuid, primary key) - Unique identifier for each video
      - `title` (text) - Title of the tutorial video
      - `url` (text) - Original URL (Instagram Reels or YouTube)
      - `thumbnail_url` (text) - Thumbnail image URL
      - `video_url` (text, optional) - Direct video file URL for preview
      - `category` (text) - Category (일러스트레이터, 포토샵, 영상편집, AI 아트, 누끼, 폰트, 레퍼런스)
      - `tags` (text array) - Array of tags for filtering
      - `created_at` (timestamptz) - Timestamp when the video was added

  2. Security
    - Enable RLS on `videos` table
    - Since this is a private app, we'll add a policy that allows all operations for now
    - In production, you would add proper authentication and restrict access
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  url text NOT NULL,
  thumbnail_url text NOT NULL,
  video_url text,
  category text NOT NULL DEFAULT '레퍼런스',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON videos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access for all"
  ON videos
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
