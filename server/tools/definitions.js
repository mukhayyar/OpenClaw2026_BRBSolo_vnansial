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
      name: 'repliz_list_accounts',
      description:
        'Daftar akun media sosial terhubung di Repliz (Instagram, TikTok, Facebook, dll). Butuh kredensial Repliz.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          type: { type: 'string', description: 'Filter tipe platform jika didukung API' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'repliz_list_schedules',
      description: 'Lihat jadwal posting yang sudah diatur di Repliz.',
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          status: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'repliz_schedule_literacy_post',
      description:
        'Jadwalkan posting edukasi literasi keuangan ke akun sosial via Repliz. Gunakan setelah user setuju dan accountId diketahui.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'ID akun Repliz dari repliz_list_accounts' },
          title: { type: 'string' },
          caption: { type: 'string', description: 'Caption/teks posting' },
          topic: { type: 'string' },
          scheduleAt: { type: 'string', description: 'ISO 8601 datetime, default +1 jam' },
          linkUrl: { type: 'string', description: 'URL link preview jika perlu' },
        },
        required: ['accountId', 'title', 'caption'],
      },
    },
  },
]
