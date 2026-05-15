import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import CekInvestasi from './pages/CekInvestasi'
import KalkulatorPinjaman from './pages/KalkulatorPinjaman'
import Edukasi from './pages/Edukasi'
import LaporPenipuan from './pages/LaporPenipuan'
import AsistenAI from './pages/AsistenAI'
import RencanaInvestasi from './pages/RencanaInvestasi'
import KesehatanFinansial from './pages/KesehatanFinansial'
import CekEmiten from './pages/CekEmiten'
import CryptoWatch from './pages/CryptoWatch'
import Asuransi from './pages/Asuransi'
import Portofolio from './pages/Portofolio'
import SettingsPage from './pages/Settings'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/kesehatan" element={<KesehatanFinansial />} />
          <Route path="/cek-investasi" element={<CekInvestasi />} />
          <Route path="/emiten" element={<CekEmiten />} />
          <Route path="/crypto" element={<CryptoWatch />} />
          <Route path="/asuransi" element={<Asuransi />} />
          <Route path="/portofolio" element={<Portofolio />} />
          <Route path="/kalkulator" element={<KalkulatorPinjaman />} />
          <Route path="/edukasi" element={<Edukasi />} />
          <Route path="/lapor" element={<LaporPenipuan />} />
          <Route path="/asisten" element={<AsistenAI />} />
          <Route path="/rencana-investasi" element={<RencanaInvestasi />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
