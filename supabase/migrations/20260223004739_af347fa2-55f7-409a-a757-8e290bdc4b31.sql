
-- Table: pengurus
CREATE TABLE public.pengurus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  bidang TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL DEFAULT '',
  tanggal_lahir TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  pendidikan_terakhir TEXT NOT NULL DEFAULT '',
  no_whatsapp TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pengurus" ON public.pengurus FOR SELECT USING (true);
CREATE POLICY "Auth can insert pengurus" ON public.pengurus FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth can update pengurus" ON public.pengurus FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth can delete pengurus" ON public.pengurus FOR DELETE USING (auth.uid() IS NOT NULL);

-- Table: anggota
CREATE TABLE public.anggota (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL DEFAULT '',
  tanggal_lahir TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  pendidikan_terakhir TEXT NOT NULL DEFAULT '',
  no_whatsapp TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view anggota" ON public.anggota FOR SELECT USING (true);
CREATE POLICY "Auth can insert anggota" ON public.anggota FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth can update anggota" ON public.anggota FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth can delete anggota" ON public.anggota FOR DELETE USING (auth.uid() IS NOT NULL);

-- Table: pj (Pimpinan Jamaah)
CREATE TABLE public.pj (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_pj TEXT NOT NULL,
  ketua TEXT NOT NULL DEFAULT '',
  sekretaris TEXT NOT NULL DEFAULT '',
  bendahara TEXT NOT NULL DEFAULT '',
  nomor_sk TEXT NOT NULL DEFAULT '',
  alamat TEXT NOT NULL DEFAULT '',
  no_whatsapp TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.pj ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pj" ON public.pj FOR SELECT USING (true);
CREATE POLICY "Auth can insert pj" ON public.pj FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth can update pj" ON public.pj FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth can delete pj" ON public.pj FOR DELETE USING (auth.uid() IS NOT NULL);
