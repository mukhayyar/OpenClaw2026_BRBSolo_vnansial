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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/cek-investasi" element={<CekInvestasi />} />
          <Route path="/kalkulator" element={<KalkulatorPinjaman />} />
          <Route path="/edukasi" element={<Edukasi />} />
          <Route path="/lapor" element={<LaporPenipuan />} />
          <Route path="/asisten" element={<AsistenAI />} />
          <Route path="/rencana-investasi" element={<RencanaInvestasi />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
