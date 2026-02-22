
-- Create surat table
CREATE TABLE public.surat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  nama TEXT NOT NULL,
  nomor TEXT NOT NULL,
  waktu TEXT NOT NULL,
  pengirim TEXT NOT NULL,
  penerima TEXT NOT NULL,
  keterangan TEXT NOT NULL DEFAULT '',
  file_pdf TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create keuangan table
CREATE TABLE public.keuangan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  nama_kegiatan TEXT NOT NULL,
  waktu TEXT NOT NULL,
  nominal NUMERIC NOT NULL DEFAULT 0,
  keterangan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program_kerja table
CREATE TABLE public.program_kerja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  bidang TEXT NOT NULL,
  waktu_pelaksanaan TEXT NOT NULL,
  tujuan TEXT NOT NULL DEFAULT '',
  tempat TEXT NOT NULL DEFAULT '',
  realisasi TEXT NOT NULL DEFAULT 'Belum Terlaksana' CHECK (realisasi IN ('Terlaksana', 'Belum Terlaksana')),
  kendala TEXT NOT NULL DEFAULT '',
  solusi TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_kerja ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read
CREATE POLICY "Anyone can view surat" ON public.surat FOR SELECT USING (true);
CREATE POLICY "Anyone can view keuangan" ON public.keuangan FOR SELECT USING (true);
CREATE POLICY "Anyone can view program_kerja" ON public.program_kerja FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: only authenticated users
CREATE POLICY "Auth can insert surat" ON public.surat FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update surat" ON public.surat FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete surat" ON public.surat FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth can insert keuangan" ON public.keuangan FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update keuangan" ON public.keuangan FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete keuangan" ON public.keuangan FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth can insert program_kerja" ON public.program_kerja FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update program_kerja" ON public.program_kerja FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete program_kerja" ON public.program_kerja FOR DELETE TO authenticated USING (true);
