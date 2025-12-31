-- Create support tables for bug reports and feature suggestions

-- Table for bug reports
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  browser_info TEXT,
  device_info TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for feature suggestions
CREATE TABLE IF NOT EXISTS public.feature_suggestions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'planned', 'in_progress', 'completed', 'rejected')),
  upvotes INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports("userId");
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports("createdAt");

CREATE INDEX IF NOT EXISTS idx_feature_suggestions_user_id ON public.feature_suggestions("userId");
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_status ON public.feature_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_created_at ON public.feature_suggestions("createdAt");

-- Enable RLS (Row Level Security)
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bug_reports
-- Users can insert their own bug reports
CREATE POLICY "Users can insert their own bug reports"
  ON public.bug_reports
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT "openId" FROM public.users WHERE id = "userId")::text);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports
  FOR SELECT
  USING (auth.uid()::text = (SELECT "openId" FROM public.users WHERE id = "userId")::text);

-- Users can update their own bug reports (only if status is 'open')
CREATE POLICY "Users can update their own open bug reports"
  ON public.bug_reports
  FOR UPDATE
  USING (
    auth.uid()::text = (SELECT "openId" FROM public.users WHERE id = "userId")::text
    AND status = 'open'
  );

-- RLS Policies for feature_suggestions
-- Users can insert their own feature suggestions
CREATE POLICY "Users can insert their own feature suggestions"
  ON public.feature_suggestions
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT "openId" FROM public.users WHERE id = "userId")::text);

-- Users can view all feature suggestions (public)
CREATE POLICY "Users can view all feature suggestions"
  ON public.feature_suggestions
  FOR SELECT
  USING (true);

-- Users can update their own feature suggestions (only if status is 'open')
CREATE POLICY "Users can update their own open feature suggestions"
  ON public.feature_suggestions
  FOR UPDATE
  USING (
    auth.uid()::text = (SELECT "openId" FROM public.users WHERE id = "userId")::text
    AND status = 'open'
  );

-- Grant permissions
GRANT USAGE ON SEQUENCE public.bug_reports_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.feature_suggestions_id_seq TO authenticated;
GRANT ALL ON public.bug_reports TO authenticated;
GRANT ALL ON public.feature_suggestions TO authenticated;

