import './globals.css'

export const metadata = {
  title: 'JokiKode - Jasa Joki Tugas Coding & UKK SMK Terpercaya',
  description: 'Pusing mikirin tugas coding UKK atau TA? JokiKode siap bantu kerjain aplikasi lengkap dengan harga pelajar. Joki tugas coding Laravel, React, PHP, Node.js terpercaya.',
  keywords: [
    'jasa joki coding', 
    'joki tugas it', 
    'joki ukk rpl', 
    'joki coding smk', 
    'jasa pembuatan website tugas', 
    'joki laravel', 
    'joki react',
    'joki tugas akhir it'
  ],
  authors: [{ name: 'JokiKode' }],
  openGraph: {
    title: 'JokiKode - Jasa Joki Tugas Coding & UKK SMK',
    description: 'Biar urusan kodingan, database, dan error merah-merah kami yang kerjain. Fokus aja belajar presentasi!',
    url: 'https://jokikode.vercel.app',
    siteName: 'JokiKode',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JokiKode Banner',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        {/* Verifikasi Google Search Console */}
        <meta name="google-site-verification" content="2RICpC0xrJ4LuLhWhMzuE0c57lpn-sVtY27nxzWhqZA" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Caveat:wght@600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}