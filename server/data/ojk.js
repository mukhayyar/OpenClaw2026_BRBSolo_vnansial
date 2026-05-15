export const OJK_LICENSED = new Map([
  ['pt manulife aset manajemen indonesia', { name: 'PT Manulife Aset Manajemen Indonesia', license: 'KEP-07/PM/MI/1996', type: 'Manajer Investasi', status: 'TERDAFTAR' }],
  ['pt mandiri manajemen investasi', { name: 'PT Mandiri Manajemen Investasi', license: 'KEP-11/PM/MI/2004', type: 'Manajer Investasi', status: 'TERDAFTAR' }],
  ['pt bank central asia tbk', { name: 'PT Bank Central Asia Tbk', license: 'No.275/KMK.013/1991', type: 'Perbankan', status: 'TERDAFTAR' }],
  ['pt bank rakyat indonesia tbk', { name: 'PT Bank Rakyat Indonesia (Persero) Tbk', license: 'No.S-48/MK.17/1992', type: 'Perbankan', status: 'TERDAFTAR' }],
  ['binomo', { name: 'Binomo', license: '-', type: 'Binary Options', status: 'ILEGAL' }],
  ['quotex', { name: 'Quotex', license: '-', type: 'Binary Options', status: 'ILEGAL' }],
  ['danamaster', { name: 'DanaMaster', license: '-', type: 'Robot Trading', status: 'ILEGAL' }],
  ['robot trading forex', { name: 'Robot Trading Forex (Umum)', license: '-', type: 'Robot Trading', status: 'ILEGAL' }],
])

export const RED_FLAGS = [
  'Menjanjikan return pasti >2%/bulan',
  'Tidak punya izin OJK/Bappebti',
  'Minta rekrut orang lain (skema ponzi)',
  'Tekanan untuk segera transfer',
  'Tidak bisa ditarik (withdrawal sulit)',
  'Pakai nama mirip perusahaan resmi',
  'Minta data pribadi berlebihan (KTP, selfie, PIN)',
  'Kantor tidak jelas / hanya online',
]
