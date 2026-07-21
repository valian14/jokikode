export default function robots() {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: '/admin/', // Melarang Google membaca halaman admin
      },
      sitemap: 'https://jokikode.vercel.app/sitemap.xml', // Ganti dengan domain aslimu
    }
  }