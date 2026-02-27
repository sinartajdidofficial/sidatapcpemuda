
-- Drop all existing restrictive policies and recreate as permissive for all tables

-- === SURAT ===
DROP POLICY IF EXISTS "Anyone can view surat" ON public.surat;
DROP POLICY IF EXISTS "Auth can delete surat" ON public.surat;
DROP POLICY IF EXISTS "Auth can insert surat" ON public.surat;
DROP POLICY IF EXISTS "Auth can update surat" ON public.surat;

CREATE POLICY "Anyone can view surat" ON public.surat FOR SELECT USING (true);
CREATE POLICY "Anyone can insert surat" ON public.surat FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update surat" ON public.surat FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete surat" ON public.surat FOR DELETE USING (true);

-- === KEUANGAN ===
DROP POLICY IF EXISTS "Anyone can view keuangan" ON public.keuangan;
DROP POLICY IF EXISTS "Auth can delete keuangan" ON public.keuangan;
DROP POLICY IF EXISTS "Auth can insert keuangan" ON public.keuangan;
DROP POLICY IF EXISTS "Auth can update keuangan" ON public.keuangan;

CREATE POLICY "Anyone can view keuangan" ON public.keuangan FOR SELECT USING (true);
CREATE POLICY "Anyone can insert keuangan" ON public.keuangan FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update keuangan" ON public.keuangan FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete keuangan" ON public.keuangan FOR DELETE USING (true);

-- === PROGRAM_KERJA ===
DROP POLICY IF EXISTS "Anyone can view program_kerja" ON public.program_kerja;
DROP POLICY IF EXISTS "Auth can delete program_kerja" ON public.program_kerja;
DROP POLICY IF EXISTS "Auth can insert program_kerja" ON public.program_kerja;
DROP POLICY IF EXISTS "Auth can update program_kerja" ON public.program_kerja;

CREATE POLICY "Anyone can view program_kerja" ON public.program_kerja FOR SELECT USING (true);
CREATE POLICY "Anyone can insert program_kerja" ON public.program_kerja FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update program_kerja" ON public.program_kerja FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete program_kerja" ON public.program_kerja FOR DELETE USING (true);

-- === NOTULENSI_RAPAT ===
DROP POLICY IF EXISTS "Public can view notulensi_rapat" ON public.notulensi_rapat;
DROP POLICY IF EXISTS "Public can delete notulensi_rapat" ON public.notulensi_rapat;
DROP POLICY IF EXISTS "Public can insert notulensi_rapat" ON public.notulensi_rapat;
DROP POLICY IF EXISTS "Public can update notulensi_rapat" ON public.notulensi_rapat;

CREATE POLICY "Anyone can view notulensi_rapat" ON public.notulensi_rapat FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notulensi_rapat" ON public.notulensi_rapat FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notulensi_rapat" ON public.notulensi_rapat FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete notulensi_rapat" ON public.notulensi_rapat FOR DELETE USING (true);

-- === ANGGOTA ===
DROP POLICY IF EXISTS "Anyone can view anggota" ON public.anggota;
DROP POLICY IF EXISTS "Auth can delete anggota" ON public.anggota;
DROP POLICY IF EXISTS "Auth can insert anggota" ON public.anggota;
DROP POLICY IF EXISTS "Auth can update anggota" ON public.anggota;
DROP POLICY IF EXISTS "Public can delete anggota" ON public.anggota;
DROP POLICY IF EXISTS "Public can insert anggota" ON public.anggota;
DROP POLICY IF EXISTS "Public can update anggota" ON public.anggota;

CREATE POLICY "Anyone can view anggota" ON public.anggota FOR SELECT USING (true);
CREATE POLICY "Anyone can insert anggota" ON public.anggota FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update anggota" ON public.anggota FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete anggota" ON public.anggota FOR DELETE USING (true);

-- === PENGURUS ===
DROP POLICY IF EXISTS "Anyone can view pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Auth can delete pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Auth can insert pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Auth can update pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Public can delete pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Public can insert pengurus" ON public.pengurus;
DROP POLICY IF EXISTS "Public can update pengurus" ON public.pengurus;

CREATE POLICY "Anyone can view pengurus" ON public.pengurus FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pengurus" ON public.pengurus FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pengurus" ON public.pengurus FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pengurus" ON public.pengurus FOR DELETE USING (true);

-- === PJ ===
DROP POLICY IF EXISTS "Anyone can view pj" ON public.pj;
DROP POLICY IF EXISTS "Auth can delete pj" ON public.pj;
DROP POLICY IF EXISTS "Auth can insert pj" ON public.pj;
DROP POLICY IF EXISTS "Auth can update pj" ON public.pj;
DROP POLICY IF EXISTS "Public can delete pj" ON public.pj;
DROP POLICY IF EXISTS "Public can insert pj" ON public.pj;
DROP POLICY IF EXISTS "Public can update pj" ON public.pj;

CREATE POLICY "Anyone can view pj" ON public.pj FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pj" ON public.pj FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pj" ON public.pj FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pj" ON public.pj FOR DELETE USING (true);
