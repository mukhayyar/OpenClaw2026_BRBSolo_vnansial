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
  {
    type: 'function',
    function: {
      name: 'score_financial_health',
      description:
        'Hitung skor kesehatan finansial 0-100 dari empat pilar: anggaran, dana darurat, hutang, dan tabungan. Kembalikan skor + rekomendasi praktis.',
      parameters: {
        type: 'object',
        properties: {
          monthlyIncome: { type: 'number', description: 'Penghasilan bulanan dalam Rupiah' },
          monthlyExpense: { type: 'number', description: 'Pengeluaran bulanan total dalam Rupiah' },
          emergencyFund: { type: 'number', description: 'Saldo dana darurat saat ini dalam Rupiah' },
          totalDebt: { type: 'number', description: 'Total hutang aktif dalam Rupiah' },
          monthlySavings: { type: 'number', description: 'Berapa Rupiah yang ditabung per bulan' },
        },
        required: ['monthlyIncome', 'monthlyExpense'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_idx_company',
      description: 'Ambil overview perusahaan IDX (profil, dividen tunai/saham, ESG, pemegang saham, pengumuman) berdasarkan KodeEmiten 4 huruf.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'KodeEmiten, misal BBCA, GOTO, AADI' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_idx_dividen',
      description: 'Ambil riwayat dividen tunai perusahaan IDX tahun tertentu.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          year: { type: 'integer' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_idx_financial',
      description: 'Ambil laporan keuangan IDX (TW1/TW2/TW3/audit) per emiten dan tahun.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          periode: { type: 'string', enum: ['TW1', 'TW2', 'TW3', 'audit'] },
          year: { type: 'integer' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_idx_emiten',
      description: 'Daftar emiten yang terdaftar di IDX (atau curated fallback).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crypto_quote',
      description: 'Ambil detail crypto dari CoinGecko (harga, market cap, perubahan).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'CoinGecko id, misal bitcoin, ethereum, solana' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assess_crypto_scam_risk',
      description: 'Skor risiko scam/penipuan crypto 0-100 dari heuristik (umur, market cap, volume, daftar scam terkenal).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'CoinGecko id' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_insurance_companies',
      description: 'Daftar perusahaan asuransi Indonesia (BPJS, Prudential, AIA, Allianz, Manulife, dll.) dengan plan & estimasi premi.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['kesehatan', 'jiwa', 'kendaraan', 'pendidikan', 'unitlink'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_insurance_premium',
      description: 'Hitung estimasi premi asuransi per bulan berdasarkan tipe, coverage, usia, dan status perokok.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['kesehatan', 'jiwa', 'kendaraan', 'pendidikan', 'unitlink'] },
          coverage: { type: 'number', description: 'Sum insured dalam Rupiah' },
          age: { type: 'integer' },
          smoker: { type: 'boolean' },
        },
        required: ['type', 'coverage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_insurance',
      description: 'Beri rekomendasi asuransi berdasarkan profil user: usia, penghasilan, tanggungan, status asuransi & mobil.',
      parameters: {
        type: 'object',
        properties: {
          age: { type: 'integer' },
          monthlyIncome: { type: 'number' },
          dependents: { type: 'integer' },
          hasHealth: { type: 'boolean' },
          hasCar: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_portfolio',
      description:
        'Ambil portofolio (holding + buffer) milik user yang sedang login. Wajib `pin` yang valid (cocok dengan VNANSIAL_PIN). Jika PIN salah, beri tahu user untuk membuka halaman Portofolio & unlock.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string', description: 'PIN user yang sudah dimasukkan di UI' },
        },
        required: ['pin'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_portfolio_holding',
      description:
        'Tambah atau update satu holding di portofolio user (saham, crypto, reksadana, obligasi, logam). Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          kind: { type: 'string', enum: ['saham', 'crypto', 'reksadana', 'obligasi', 'logam'] },
          symbol: { type: 'string', description: 'Kode/ticker — BBCA, bitcoin, RDPU, FR0096, ANTAM' },
          amount: { type: 'number', description: 'Jumlah unit/lembar/gram' },
          costBasis: { type: 'number', description: 'Harga beli per unit dalam Rupiah (opsional)' },
        },
        required: ['pin', 'kind', 'symbol', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_portfolio_holding',
      description: 'Hapus satu holding dari portofolio user. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          kind: { type: 'string', enum: ['saham', 'crypto', 'reksadana', 'obligasi', 'logam'] },
          symbol: { type: 'string' },
        },
        required: ['pin', 'kind', 'symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_money_buffer',
      description:
        'Set saldo & target dana darurat / money buffer / tabungan tujuan. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          kind: { type: 'string', enum: ['emergency', 'money_buffer', 'savings'] },
          amount: { type: 'number' },
          target: { type: 'number' },
        },
        required: ['pin', 'kind', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_health_score',
      description:
        'Hitung & simpan skor kesehatan finansial untuk user. Butuh PIN + input keuangan (income, expense, dst).',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          monthlyIncome: { type: 'number' },
          monthlyExpense: { type: 'number' },
          emergencyFund: { type: 'number' },
          totalDebt: { type: 'number' },
          monthlySavings: { type: 'number' },
        },
        required: ['pin', 'monthlyIncome', 'monthlyExpense'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_health_history',
      description: 'Daftar skor kesehatan finansial historis user (paling baru dulu). Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          limit: { type: 'integer' },
        },
        required: ['pin'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_bank_account_report',
      description:
        'Cek apakah nomor rekening pernah dilaporkan sebagai penipuan di database cekrekening.id (Kementerian Kominfo). Gunakan kapan pun user mengirim nomor rekening yang mencurigakan.',
      parameters: {
        type: 'object',
        properties: {
          accountNumber: { type: 'string', description: 'Nomor rekening (angka)' },
          bankCode: {
            type: 'string',
            description: 'Kode bank: BCA, BRI, BNI, MANDIRI, CIMB, BSI, PERMATA, DANAMON, MEGA, BTN, dll.',
          },
        },
        required: ['accountNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_phone_number_report',
      description:
        'Cek apakah nomor HP pernah dilaporkan sebagai penipuan di database aduannomor.id (Kementerian Kominfo / BRTI). Gunakan kapan pun user mengirim nomor HP yang mencurigakan.',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Nomor HP — format 08xx, +62xx, atau 62xx' },
        },
        required: ['phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_chart',
      description:
        'Minta UI menampilkan grafik harga interaktif di dalam jawaban chat. Setelah memanggil tool ini, sertakan field "marker" dari hasilnya di jawabanmu agar UI render grafik di tempat itu.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['saham', 'crypto'] },
          symbol: { type: 'string', description: 'Ticker atau coin id, contoh BBCA atau bitcoin' },
          range: { type: 'string', enum: ['1mo', '3mo', '6mo', '1y'], description: 'Rentang waktu, default 3mo' },
        },
        required: ['kind', 'symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_price_alert',
      description: 'Buat alert harga (saham/crypto) yang akan diperiksa setiap menit dan dinotifikasi via Telegram bila kondisi tercapai. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          kind: { type: 'string', enum: ['saham', 'crypto'] },
          symbol: { type: 'string' },
          condition: { type: 'string', enum: ['above', 'below'] },
          target: { type: 'number' },
        },
        required: ['pin', 'kind', 'symbol', 'condition', 'target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_price_alerts',
      description: 'Daftar alert aktif user. Butuh PIN.',
      parameters: { type: 'object', properties: { pin: { type: 'string' } }, required: ['pin'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_price_alert',
      description: 'Hapus alert berdasarkan id. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: { pin: { type: 'string' }, id: { type: 'integer' } },
        required: ['pin', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ask_other_agent',
      description: 'Delegasi pertanyaan ke agent preset lain (misal "investor", "penipuan", "asuransi"). Berguna ketika spesialis akan menjawab lebih akurat.',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Salah satu: generalis, pemula, investor, penipuan, asuransi, wellness' },
          question: { type: 'string' },
        },
        required: ['agentId', 'question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_dex_token',
      description: 'Cari token DEX (termasuk meme coin / degen / low-cap) di DexScreener berdasarkan nama atau simbol. Mencakup token yang belum ada di CoinGecko.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assess_dex_token',
      description: 'Cari token DEX + skor risiko (likuiditas, umur pair, FDV, volatilitas 24j) untuk meme coin. Wajib dipakai sebelum bahas potensi return meme coin.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description:
        'Jadwalkan pengingat (notifikasi via Telegram saat waktunya tiba). Wajib PIN. Pilih salah satu cara penentuan waktu: minutesFromNow, secondsFromNow, fireAtMs (unix ms), atau fireAtISO. Contoh: user bilang "ingatkan saya bayar tagihan 5 menit lagi" → minutesFromNow=5, message="Bayar tagihan".',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          message: { type: 'string', description: 'Pesan reminder' },
          minutesFromNow: { type: 'number' },
          secondsFromNow: { type: 'number' },
          fireAtISO: { type: 'string', description: 'ISO timestamp eg 2026-05-15T20:00:00+07:00' },
          fireAtMs: { type: 'number' },
          channel: { type: 'string', enum: ['telegram', 'app'], description: 'Default telegram' },
        },
        required: ['pin', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_reminders',
      description: 'Daftar reminder user (default hanya yang belum terkirim). Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          includeFired: { type: 'boolean' },
        },
        required: ['pin'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_reminder',
      description: 'Hapus reminder berdasarkan id. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: { pin: { type: 'string' }, id: { type: 'integer' } },
        required: ['pin', 'id'],
      },
    },
  },
]
