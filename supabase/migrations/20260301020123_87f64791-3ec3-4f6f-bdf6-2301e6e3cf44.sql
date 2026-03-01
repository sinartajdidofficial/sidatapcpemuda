
-- Create kepengurusan table for grouping pengurus into named cards
CREATE TABLE public.kepengurusan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kepengurusan ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "Anyone can view kepengurusan" ON public.kepengurusan FOR SELECT USING (true);
CREATE POLICY "Anyone can insert kepengurusan" ON public.kepengurusan FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update kepengurusan" ON public.kepengurusan FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete kepengurusan" ON public.kepengurusan FOR DELETE USING (true);

-- Add kepengurusan_id to pengurus table (nullable for backward compat)
ALTER TABLE public.pengurus ADD COLUMN kepengurusan_id UUID REFERENCES public.kepengurusan(id) ON DELETE CASCADE;
