export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'check_investment_company',
      description:
        'Cek apakah nama perusahaan/platform investasi ada di database demo OJK Vnansial (legal vs ilegal).',
      parameters: {
        type: 'object',
        properties: {
          companyName: { type: 'string', description: 'Nama perusahaan atau platform, misal Binomo' },
        },
        required: ['companyName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_loan',
      description: 'Hitung cicilan pinjaman (anuitas atau flat) dan beri verdict risiko bunga.',
      parameters: {
        type: 'object',
        properties: {
          principal: { type: 'number', description: 'Pokok pinjaman dalam Rupiah' },
          annualRatePercent: { type: 'number', description: 'Bunga tahunan dalam persen' },
          months: { type: 'number', description: 'Tenor dalam bulan' },
          method: { type: 'string', enum: ['anuitas', 'flat'], description: 'Metode perhitungan' },
        },
        required: ['principal', 'annualRatePercent', 'months'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assess_investment_red_flags',
      description: 'Nilai risiko dari checklist red flag investasi bodong (indeks 0-7).',
      parameters: {
        type: 'object',
        properties: {
          checkedIndices: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Indeks red flag yang dicentang user (0-7)',
          },
        },
        required: ['checkedIndices'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fraud_report_guide',
      description: 'Panduan langkah melapor penipuan ke OJK, polisi, dan platform.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_market_quote',
      description: 'Ambil harga pasar real-time (delayed) dari Yahoo Finance untuk simbol saham/ETF/indeks.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Ticker, misal AAPL, BBCA.JK, ^JKSE',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_market_symbols',
      description: 'Cari simbol Yahoo Finance berdasarkan nama perusahaan atau ticker.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_investment_goal',
      description:
        'Simulasi edukasi: target tabungan/investasi, bulan, iuran bulanan, return tahunan asumsi.',
      parameters: {
        type: 'object',
        properties: {
          targetAmount: { type: 'number' },
          months: { type: 'number' },
          monthlyContribution: { type: 'number' },
          expectedAnnualReturnPercent: { type: 'number' },
          currentSavings: { type: 'number' },
        },
        required: ['targetAmount', 'months'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_asset_allocation',
      description: 'Saran alokasi aset edukasi: conservative, balanced, aggressive.',
      parameters: {
        type: 'object',
        properties: {
          riskProfile: {
            type: 'string',
            enum: ['conservative', 'balanced', 'aggressive'],
          },
        },
        required: ['riskProfile'],
      },
    },
  },
]
