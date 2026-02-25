import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import Dashboard from "./pages/Dashboard";
import SuratPage from "./pages/SuratPage";
import KeuanganPage from "./pages/KeuanganPage";
import ProkerPage from "./pages/ProkerPage";
import DataPCPage from "./pages/DataPCPage";
import PengurusPage from "./pages/PengurusPage";
import AnggotaPage from "./pages/AnggotaPage";
import PJPage from "./pages/PJPage";
import NotulensiPage from "./pages/NotulensiPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ReadOnlyWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <ReadOnlyProvider value={location.pathname.startsWith('/view')}>{children}</ReadOnlyProvider>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ReadOnlyWrapper>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/surat" element={<SuratPage />} />
            <Route path="/keuangan" element={<KeuanganPage />} />
            <Route path="/proker" element={<ProkerPage />} />
            <Route path="/data-pc" element={<DataPCPage />} />
            <Route path="/data-pc/pengurus" element={<PengurusPage />} />
            <Route path="/data-pc/anggota" element={<AnggotaPage />} />
            <Route path="/data-pc/pj" element={<PJPage />} />
            <Route path="/data-pc/notulensi" element={<NotulensiPage />} />
            <Route path="/view" element={<Dashboard />} />
            <Route path="/view/surat" element={<SuratPage />} />
            <Route path="/view/keuangan" element={<KeuanganPage />} />
            <Route path="/view/proker" element={<ProkerPage />} />
            <Route path="/view/data-pc" element={<DataPCPage />} />
            <Route path="/view/data-pc/pengurus" element={<PengurusPage />} />
            <Route path="/view/data-pc/anggota" element={<AnggotaPage />} />
            <Route path="/view/data-pc/pj" element={<PJPage />} />
            <Route path="/view/data-pc/notulensi" element={<NotulensiPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ReadOnlyWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
