import './globals.css'

export const metadata = {
  title: 'JokiKode >_ Jasa Joki Coding UKK & TA SMK RPL',
  description: 'Mentok sama bug atau pusing mikirin deadline Tugas Akhir dan UKK? JokiKode siap bantu kerjain aplikasi web, database, sampai tuntas. Solusi andalan anak SMK RPL!',
  icons: {
    icon: '/icon.svg', // Memastikan logo baru yang kita buat tadi terbaca
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
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