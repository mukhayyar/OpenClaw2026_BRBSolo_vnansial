import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import AgentTicker from './AgentTicker'
import WalletModal from './WalletModal'
import ToolToastStack from './ToolToastStack'
import FloatingChat from './FloatingChat'

const navItems = [
  { path: '/asisten', label: 'Asisten AI', icon: '🤖' },
  { path: '/rencana-investasi', label: 'Rencana Investasi', icon: '📈' },
  { path: '/cek-investasi', label: 'Cek Investasi', icon: '🔍' },
  { path: '/kalkulator', label: 'Kalkulator', icon: '🧮' },
  { path: '/edukasi', label: 'Edukasi', icon: '📚' },
  { path: '/lapor', label: 'Lapor', icon: '🛡️' },
]

export default function Layout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="vn-mesh-bg" aria-hidden />
      <div className="vn-grid-overlay" aria-hidden />

      <ToolToastStack />

      <nav className="sticky top-0 z-50 glass-strong border-b border-white/10">
        <AgentTicker />
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight group">
            <span className="relative">
              <span className="text-2xl">💎</span>
              <span className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Vnansial
            </span>
            <span className="badge-onchain hidden sm:inline-flex text-[9px]">Web3</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(n => (
              <Link
                key={n.path}
                to={n.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === n.path
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white btn-glass border border-transparent'
                }`}
              >
                {n.icon} {n.label}
              </Link>
            ))}
            <Link
              to="/asisten"
              className="ml-1 px-4 py-2 rounded-lg text-sm font-bold btn-neon"
            >
              AI Chat
            </Link>
            <button
              type="button"
              onClick={() => setWalletOpen(true)}
              className="ml-1 px-3 py-2 rounded-lg text-xs font-semibold btn-glass border-violet-500/30 text-violet-300"
            >
              ◈ Wallet
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Link to="/asisten" className="px-3 py-2 rounded-lg text-sm btn-neon">
              AI
            </Link>
            <button type="button" className="p-2 text-slate-400" onClick={() => setOpen(!open)}>
              {open ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/10 glass px-4 py-3 space-y-1">
            {navItems.map(n => (
              <Link
                key={n.path}
                to={n.path}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === n.path
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {n.icon} {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setWalletOpen(true)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-violet-300"
            >
              ◈ Connect Wallet
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 relative z-0">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-8 px-4 glass relative z-0">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          <p className="mb-2 flex items-center justify-center gap-2 flex-wrap">
            <span className="badge-onchain">AI Agents</span>
            Vnansial — Platform helper literasi keuangan Indonesia
          </p>
          <p>Bukan penasihat keuangan. © 2026 · OpenClaw Agenthon</p>
        </div>
      </footer>

      <FloatingChat />
      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  )
}
