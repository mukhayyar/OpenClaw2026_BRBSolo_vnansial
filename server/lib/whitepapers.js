/**
 * Curated whitepaper / fundamentals links for major assets.
 *
 * Stored in code + augmented at runtime via the `upsert_whitepaper`
 * agent tool, which writes to the `token_whitepaper` SQLite table.
 *
 * Lookup priority: SQLite override → this curated map → null.
 */

import { getWhitepaper, upsertWhitepaper, listWhitepapers } from './db.js'

export const CURATED = {
  // Crypto
  'bitcoin': { kind: 'crypto', name: 'Bitcoin', url: 'https://bitcoin.org/bitcoin.pdf', summary: 'Peer-to-peer electronic cash system (Satoshi Nakamoto, 2008).' },
  'ethereum': { kind: 'crypto', name: 'Ethereum', url: 'https://ethereum.org/en/whitepaper/', summary: 'Programmable blockchain with smart contracts (Vitalik Buterin).' },
  'solana': { kind: 'crypto', name: 'Solana', url: 'https://solana.com/solana-whitepaper.pdf', summary: 'High-throughput L1 using Proof-of-History.' },
  'cardano': { kind: 'crypto', name: 'Cardano', url: 'https://docs.cardano.org/', summary: 'Research-driven PoS L1 (Ouroboros).' },
  'binancecoin': { kind: 'crypto', name: 'BNB', url: 'https://www.binance.com/en/whitepaper', summary: 'Native token of Binance ecosystem.' },
  'ripple': { kind: 'crypto', name: 'XRP', url: 'https://ripple.com/files/ripple_consensus_whitepaper.pdf', summary: 'Cross-border payments via consensus ledger.' },
  'tron': { kind: 'crypto', name: 'TRON', url: 'https://tron.network/static/doc/white_paper_v_2_0.pdf', summary: 'Content-sharing & dApp platform.' },
  'avalanche-2': { kind: 'crypto', name: 'Avalanche', url: 'https://www.avalabs.org/whitepapers', summary: 'Snowman consensus, three-chain architecture.' },
  'chainlink': { kind: 'crypto', name: 'Chainlink', url: 'https://chain.link/whitepaper', summary: 'Decentralized oracle network for smart contracts.' },
  'dogecoin': { kind: 'crypto', name: 'Dogecoin', url: 'https://github.com/dogecoin/dogecoin', summary: 'Meme coin fork of Litecoin (2013).' },
  'tether': { kind: 'crypto', name: 'USDT', url: 'https://tether.to/en/whitepaper/', summary: 'USD-pegged stablecoin issued by Tether Ltd.' },
  'usd-coin': { kind: 'crypto', name: 'USDC', url: 'https://www.centre.io/usdc-transparency', summary: 'USD-pegged stablecoin issued by Circle.' },

  // IDX saham — link to IDX listed-company profile
  'BBCA': { kind: 'saham', name: 'Bank Central Asia', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/BBCA/', summary: 'Bank swasta terbesar Indonesia, retail banking dominan.' },
  'BBRI': { kind: 'saham', name: 'Bank Rakyat Indonesia', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/BBRI/', summary: 'Bank pemerintah terbesar, fokus mikro/UMKM.' },
  'BMRI': { kind: 'saham', name: 'Bank Mandiri', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/BMRI/', summary: 'Bank korporasi besar pemerintah.' },
  'TLKM': { kind: 'saham', name: 'Telkom Indonesia', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/TLKM/', summary: 'BUMN telekomunikasi terintegrasi.' },
  'ASII': { kind: 'saham', name: 'Astra International', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/ASII/', summary: 'Konglomerat otomotif, alat berat, agribisnis.' },
  'UNVR': { kind: 'saham', name: 'Unilever Indonesia', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/UNVR/', summary: 'FMCG consumer staples.' },
  'GOTO': { kind: 'saham', name: 'GoTo Gojek Tokopedia', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/GOTO/', summary: 'Super-app ride-hailing + e-commerce + fintech.' },
  'AADI': { kind: 'saham', name: 'Adaro Andalan Indonesia', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/AADI/', summary: 'Spin-off batubara dari grup Adaro.' },
  'ADRO': { kind: 'saham', name: 'Adaro Energy', url: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/ADRO/', summary: 'Produsen batubara terintegrasi.' },
}

export function lookupWhitepaper(id) {
  if (!id) return null
  // 1. SQLite override
  try {
    const row = getWhitepaper(id)
    if (row) return row
  } catch {}
  // 2. Curated fallback
  const c = CURATED[id]
  if (c) return { id, ...c, source: 'curated' }
  // Case-insensitive lookup
  const key = Object.keys(CURATED).find(k => k.toLowerCase() === String(id).toLowerCase())
  return key ? { id: key, ...CURATED[key], source: 'curated' } : null
}

export function addWhitepaper(args) {
  return upsertWhitepaper({ ...args, updated_by_agent: 'agent' })
}

export function listAllWhitepapers() {
  const sqliteRows = listWhitepapers()
  const overrideIds = new Set(sqliteRows.map(r => r.id))
  const curated = Object.entries(CURATED)
    .filter(([id]) => !overrideIds.has(id))
    .map(([id, c]) => ({ id, ...c, source: 'curated' }))
  return [...sqliteRows.map(r => ({ ...r, source: 'sqlite' })), ...curated]
}
