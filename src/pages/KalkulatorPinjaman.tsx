import PageShell from '../components/PageShell'
import KalkulatorPanel from './KalkulatorPanel'

/**
 * Legacy route — kalkulator now lives inside Edukasi as a tab. This shell
 * keeps the old URL working but visually points users at the new home.
 */
export default function KalkulatorPinjaman() {
  return (
    <PageShell
      eyebrow="Edukasi · Kalkulator"
      title="Bunga jujur, sebelum kamu menandatangani."
      subtitle="Kalkulator pinjaman sekarang ada di halaman Edukasi sebagai bagian dari kurikulum literasi."
    >
      <KalkulatorPanel />
    </PageShell>
  )
}
