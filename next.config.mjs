/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // 🔥 TAMBAH BLOK REWRITES DI SINI BIAR GAK 404 PAS DI-REFRESH
  async rewrites() {
    return [
      {
        source: '/fitur',
        destination: '/', // Balikin ke halaman utama diem-diem
      },
      {
        source: '/ai-analyzer',
        destination: '/', // Balikin ke halaman utama diem-diem
      },
      {
        source: '/paket-harga',
        destination: '/', // Balikin ke halaman utama diem-diem
      },
      // Kalau mau bikin custom URL buat menu lain, tambahin juga di bawah sini. Contoh:
      // { source: '/alasan', destination: '/' },
      // { source: '/bedah-soal', destination: '/' },
    ];
  },

  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' }, // Mencegah klik tombol bayar di situs orang lain
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};

export default nextConfig;