CREATE TABLE public.notulensi_rapat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nama_rapat TEXT NOT NULL,
  tanggal_rapat TEXT NOT NULL,
  tempat_rapat TEXT NOT NULL DEFAULT '',
  hasil_rapat TEXT NOT NULL DEFAULT '',
  notulis TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.notulensi_rapat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view notulensi_rapat" ON public.notulensi_rapat FOR SELECT USING (true);
CREATE POLICY "Public can insert notulensi_rapat" ON public.notulensi_rapat FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update notulensi_rapat" ON public.notulensi_rapat FOR UPDATE USING (true);
CREATE POLICY "Public can delete notulensi_rapat" ON public.notulensi_rapat FOR DELETE USING (true);