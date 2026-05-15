import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AgentTicker from './AgentTicker'
import ToolToastStack from './ToolToastStack'
import FloatingChat from './FloatingChat'
import NavigatorModal from './NavigatorModal'

const navItems = [
  { path: '/kesehatan', label: 'Kesehatan' },
  { path: '/emiten', label: 'Saham IDX' },
  { path: '/crypto', label: 'Crypto' },
  { path: '/asuransi', label: 'Asuransi' },
  { path: '/portofolio', label: 'Portofolio' },
  { path: '/edukasi', label: 'Edukasi' },
  { path: '/lapor', label: 'Lapor' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setNavOpen(false)
  }, [location.pathname])

  // First-time visitor: auto-open the navigator once so they see all features.
  useEffect(() => {
    if (location.pathname !== '/') return
    if (localStorage.getItem('vnansial-tour-seen')) return
    const t = setTimeout(() => {
      setNavOpen(true)
      localStorage.setItem('vnansial-tour-seen', '1')
    }, 2200)
    return () => clearTimeout(t)
  }, [location.pathname])

  const isHome = location.pathname === '/'

  function Logo({ compact = false }: { compact?: boolean }) {
    return (
      <button
        type="button"
        onClick={() => {
          if (isHome) setNavOpen(true)
          else if (location.pathname === '/' && !navOpen) navigate('/')
          else setNavOpen(true)
        }}
        className={`flex items-center gap-2 group ${compact ? 'px-3.5 py-2 rounded-full bg-white/85 backdrop-blur-xl border border-[var(--vn-line)]' : ''}`}
        style={compact ? { boxShadow: 'var(--vn-shadow-sm)' } : undefined}
        aria-label="Buka menu navigasi Vnansial"
      >
        <span
          aria-hidden
          className={`rounded-xl flex items-center justify-center ${compact ? 'w-7 h-7' : 'w-8 h-8'}`}
          style={{ background: 'linear-gradient(140deg, #2f7d3a 0%, #86c294 100%)' }}
        >
          <svg viewBox="0 0 24 24" className={compact ? 'w-3.5 h-3.5 text-white' : 'w-4 h-4 text-white'} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21c-4-3-7-6-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5-3 8-7 11Z" />
            <path d="M12 13v-2" />
          </svg>
        </span>
        <span className={`vn-headline ${compact ? 'text-[15px]' : 'text-[19px]'}`}>Vnansial</span>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[var(--vn-muted)] group-hover:text-[var(--vn-forest)] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[var(--vn-ink)]">
      <ToolToastStack />
      <NavigatorModal open={navOpen} onClose={() => setNavOpen(false)} />

      {isHome ? (
        <div className="fixed top-4 left-4 z-50">
          <Logo compact />
        </div>
      ) : (
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-white/85 backdrop-blur-xl border-b border-[var(--vn-line)]'
              : 'bg-white/0'
          }`}
        >
          <AgentTicker />
          <div className="vn-container h-16 flex items-center justify-between">
            <Logo />

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(n => (
                <NavLink
                  key={n.path}
                  to={n.path}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-full text-[14px] font-medium transition-colors ${
                      isActive
                        ? 'text-[var(--vn-forest-dark)] bg-[var(--vn-cream)]'
                        : 'text-[var(--vn-ink-soft)] hover:text-[var(--vn-forest)]'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <button
                onClick={() => navigate('/asisten')}
                className="ml-2 vn-btn vn-btn-primary !py-2 !px-4 text-[14px]"
              >
                Tanya Asisten
              </button>
            </nav>

            <div className="lg:hidden flex items-center gap-2">
              <button onClick={() => navigate('/asisten')} className="vn-btn vn-btn-primary !py-2 !px-4 text-[13px]">
                Asisten
              </button>
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-label="Menu"
                className="w-10 h-10 rounded-full bg-[var(--vn-bg-deep)] grid place-items-center text-[var(--vn-ink)]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  {open ? (
                    <>
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="6" y1="18" x2="18" y2="6" />
                    </>
                  ) : (
                    <>
                      <line x1="4" y1="7" x2="20" y2="7" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="17" x2="20" y2="17" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {open && (
            <div className="lg:hidden border-t border-[var(--vn-line)] bg-white">
              <div className="vn-container py-3 grid grid-cols-2 gap-2">
                {navItems.map(n => (
                  <NavLink
                    key={n.path}
                    to={n.path}
                    className={({ isActive }) =>
                      `px-3.5 py-2.5 rounded-2xl text-[14px] font-medium ${
                        isActive
                          ? 'bg-[var(--vn-cream)] text-[var(--vn-forest-dark)]'
                          : 'bg-[var(--vn-bg-soft)] text-[var(--vn-ink-soft)]'
                      }`
                    }
                  >
                    {n.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--vn-line)] bg-[var(--vn-bg-soft)] py-12">
        <div className="vn-container grid sm:grid-cols-3 gap-8 text-[13px] text-[var(--vn-ink-soft)]">
          <div>
            <p className="vn-headline text-[16px] mb-1.5">Vnansial</p>
            <p className="text-[var(--vn-muted)] leading-relaxed">
              Alat literasi keuangan yang tenang, jelas, dan gratis untuk
              semua orang Indonesia.
            </p>
            <p className="mt-2 text-[12px] text-[var(--vn-muted)]">
              Demo: <a className="underline text-[var(--vn-forest)]" href="https://vnansial.mukhayyar.my.id/">vnansial.mukhayyar.my.id</a>
            </p>
          </div>
          <div>
            <p className="vn-eyebrow mb-2">Bantuan cepat</p>
            <ul className="space-y-1.5">
              <li>OJK · <strong>157</strong></li>
              <li>BI · <strong>131</strong></li>
              <li>Patroli Siber · <strong>(021) 7218-0885</strong></li>
            </ul>
          </div>
          <div>
            <p className="vn-eyebrow mb-2">Catatan</p>
            <p className="text-[var(--vn-muted)] leading-relaxed">
              Bukan penasihat keuangan berlisensi. Verifikasi di{' '}
              <a className="text-[var(--vn-forest)] underline" href="https://ojk.go.id">ojk.go.id</a>{' '}
              sebelum berinvestasi.
            </p>
          </div>
        </div>
        <div className="vn-container mt-8 text-[12px] text-[var(--vn-faint)]">
          © 2026 Vnansial · OpenClaw Agenthon · BRBSolo · Apache 2.0
        </div>
      </footer>

      <FloatingChat />
    </div>
  )
}
