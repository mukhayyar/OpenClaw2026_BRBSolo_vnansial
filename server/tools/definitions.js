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
        'Tambah atau update satu holding di portofolio user (saham, crypto, reksadana, obligasi, logam). Butuh PIN. PENTING: untuk saham IDX, 1 LOT = 100 LEMBAR. Kalau user sebut "50 lot BBCA", amount = 5000 (50×100). Jangan simpan angka lot mentah.',
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
      name: 'render_technical_analysis',
      description:
        'Minta UI menampilkan grafik analisa teknikal lengkap dengan indikator MA20, MA50, dan Bollinger Bands. Gunakan saat user minta analisa teknikal, chart pattern, support/resistance. Hasilnya adalah grafik interaktif dengan garis MA, Bollinger Bands, dan volume. Wajib sertakan field "marker" dari hasilnya di jawabanmu.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['saham', 'crypto'] },
          symbol: { type: 'string', description: 'Ticker atau coin id, contoh BBCA atau bitcoin' },
          range: { type: 'string', enum: ['1mo', '3mo', '6mo', '1y'], description: 'Rentang waktu, default 3mo' },
          indicators: { type: 'array', items: { type: 'string', enum: ['ma', 'bollinger', 'volume'] }, description: 'Indikator yang diinginkan, default ["ma","bollinger","volume"]' },
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
  {
    type: 'function',
    function: {
      name: 'list_debts',
      description: 'Daftar hutang aktif user + total sisa dan total cicilan bulanan. Butuh PIN.',
      parameters: { type: 'object', properties: { pin: { type: 'string' } }, required: ['pin'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_debt',
      description: 'Tambah hutang ke portofolio user. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          name: { type: 'string', description: 'Nama hutang (mis. KPR BCA, pinjol dana cepat)' },
          kind: { type: 'string', description: 'pinjaman, kpr, kartu_kredit, pinjol, dll.' },
          principal: { type: 'number', description: 'Pokok awal hutang dalam Rupiah' },
          remaining: { type: 'number', description: 'Sisa hutang saat ini' },
          monthlyPayment: { type: 'number', description: 'Cicilan per bulan' },
          annualRate: { type: 'number', description: 'Bunga tahunan dalam %' },
          dueDay: { type: 'integer', description: 'Tanggal jatuh tempo bulanan (1-31)' },
        },
        required: ['pin', 'name', 'principal'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_debt',
      description: 'Update hutang user. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          id: { type: 'integer' },
          name: { type: 'string' },
          remaining: { type: 'number' },
          monthlyPayment: { type: 'number' },
        },
        required: ['pin', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_debt',
      description: 'Hapus hutang. Butuh PIN.',
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
      name: 'list_cashflow_rules',
      description: 'Daftar aturan auto-cashflow (gaji, cicilan, tagihan rutin). Butuh PIN.',
      parameters: { type: 'object', properties: { pin: { type: 'string' } }, required: ['pin'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_cashflow_rule',
      description:
        'Buat aturan auto-cashflow yang akan otomatis menambah entri pemasukan/pengeluaran pada jadwalnya. Cron daemon akan eksekusi + notifikasi via Telegram. Contoh: gaji bulanan tanggal 25, tagihan listrik tanggal 20.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          kind: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string', description: 'Mis. Gaji, Listrik, Internet, Kos' },
          amount: { type: 'number' },
          schedule: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          dayOfMonth: { type: 'integer', description: '1-31 untuk schedule monthly' },
          dayOfWeek: { type: 'integer', description: '0=Sun..6=Sat untuk schedule weekly' },
          note: { type: 'string' },
        },
        required: ['pin', 'kind', 'category', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_cashflow_rule',
      description: 'Aktifkan / non-aktifkan aturan auto-cashflow. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          id: { type: 'integer' },
          active: { type: 'boolean' },
        },
        required: ['pin', 'id', 'active'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_cashflow_rule',
      description: 'Hapus aturan auto-cashflow. Butuh PIN.',
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
      name: 'get_token_whitepaper',
      description: 'Ambil link whitepaper / fundamentals untuk satu aset (crypto id atau kode emiten IDX).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upsert_token_whitepaper',
      description: 'Tambah / update whitepaper untuk satu aset. Disimpan di SQLite (cross-user).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['crypto', 'saham', 'komoditas'] },
          name: { type: 'string' },
          url: { type: 'string' },
          summary: { type: 'string' },
        },
        required: ['id', 'url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_token_whitepapers',
      description: 'Daftar semua whitepaper yang sudah ada (curated + override SQLite).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_asset',
      description:
        'Mulai analisis lengkap satu aset (saham/crypto/komoditas) dengan framework makro+mikro+sentimen+risiko. Hasil = kerangka faktor yang harus kamu isi dengan tool calls data + pengetahuan domain.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['saham', 'crypto', 'komoditas'] },
          symbol: { type: 'string' },
        },
        required: ['kind', 'symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'db_list_tables',
      description: 'Daftar semua tabel di SQLite dengan flag apakah tergolong tabel inti (tidak boleh di-DROP).',
      parameters: { type: 'object', properties: { pin: { type: 'string' } }, required: ['pin'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'db_describe_table',
      description: 'Ambil skema kolom + index + 3 sample row dari satu tabel SQLite.',
      parameters: {
        type: 'object',
        properties: { pin: { type: 'string' }, table: { type: 'string' } },
        required: ['pin', 'table'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'db_execute',
      description:
        'Eksekusi SQL pada SQLite. Allowed: SELECT/PRAGMA/EXPLAIN, CREATE TABLE, CREATE INDEX, ALTER TABLE, DROP, DELETE (with WHERE), UPDATE (with WHERE). DROP/DELETE butuh confirm=true dan tidak boleh menyentuh core table.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          sql: { type: 'string', description: 'SQL statement (tanpa multiple statements terpisah ;)' },
          confirm: { type: 'boolean', description: 'Wajib true untuk DROP/DELETE' },
        },
        required: ['pin', 'sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'install_package',
      description:
        'Install paket npm dari allowlist di server runtime. Restart server diperlukan agar module di-load. Allowlist: sharp, pdfkit, qrcode, chartjs-node-canvas, @sparticuz/chromium, puppeteer-core, node-cron, csv-parser, cheerio, rss-parser, sanitize-html, date-fns, fast-xml-parser.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          name: { type: 'string' },
          save: { type: 'boolean' },
        },
        required: ['pin', 'name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_cashflow_entry',
      description:
        'Simpan satu entri cashflow (pemasukan atau pengeluaran) ke database user. Pakai ini setiap kali user menyebut nominal transaksi, gaji, pengeluaran, atau minta mencatat keuangan. Wajib PIN. Contoh: user bilang "gajian 14.3 juta tgl 25" → simpan sebagai income.',
      parameters: {
        type: 'object',
        properties: {
          pin: { type: 'string' },
          date: { type: 'string', description: 'Tanggal transaksi (YYYY-MM-DD)' },
          category: { type: 'string', description: 'Kategori — Gaji, Makan, Transport, Listrik, Internet, dll.' },
          type: { type: 'string', enum: ['income', 'expense'] },
          amount: { type: 'number', description: 'Nominal dalam Rupiah' },
          note: { type: 'string' },
        },
        required: ['pin', 'date', 'category', 'type', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_cashflow_entries',
      description: 'Lihat daftar entri cashflow user (yang sudah tercatat). Butuh PIN.',
      parameters: {
        type: 'object',
        properties: { pin: { type: 'string' }, limit: { type: 'integer' } },
        required: ['pin'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_cashflow_entry',
      description: 'Hapus satu entri cashflow berdasarkan id. Butuh PIN.',
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
      name: 'find_user_data',
      description:
        'Ambil snapshot lengkap data keuangan user: holding, buffer, hutang, aturan cashflow, dan entri cashflow terbaru. Pakai ini untuk memahami kondisi finansial user secara menyeluruh sebelum memberi advice. Butuh PIN.',
      parameters: {
        type: 'object',
        properties: { pin: { type: 'string' } },
        required: ['pin'],
      },
    },
  },
]
