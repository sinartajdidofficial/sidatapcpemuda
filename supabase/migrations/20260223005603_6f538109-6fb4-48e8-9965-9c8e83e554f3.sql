
-- Drop restrictive policies on pengurus
DROP POLICY IF EXISTS "Auth can insert pengurus " ON public.pengurus;
DROP POLICY IF EXISTS "Auth can update pengurus " ON public.pengurus;
DROP POLICY IF EXISTS "Auth can delete pengurus " ON public.pengurus;

-- Drop restrictive policies on anggota
DROP POLICY IF EXISTS "Auth can insert anggota " ON public.anggota;
DROP POLICY IF EXISTS "Auth can update anggota " ON public.anggota;
DROP POLICY IF EXISTS "Auth can delete anggota " ON public.anggota;

-- Drop restrictive policies on pj
DROP POLICY IF EXISTS "Auth can insert pj " ON public.pj;
DROP POLICY IF EXISTS "Auth can update pj " ON public.pj;
DROP POLICY IF EXISTS "Auth can delete pj " ON public.pj;

-- Recreate with public access (matching surat/keuangan/program_kerja pattern)
CREATE POLICY "Public can insert pengurus" ON public.pengurus FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update pengurus" ON public.pengurus FOR UPDATE USING (true);
CREATE POLICY "Public can delete pengurus" ON public.pengurus FOR DELETE USING (true);

CREATE POLICY "Public can insert anggota" ON public.anggota FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update anggota" ON public.anggota FOR UPDATE USING (true);
CREATE POLICY "Public can delete anggota" ON public.anggota FOR DELETE USING (true);

CREATE POLICY "Public can insert pj" ON public.pj FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update pj" ON public.pj FOR UPDATE USING (true);
CREATE POLICY "Public can delete pj" ON public.pj FOR DELETE USING (true);
