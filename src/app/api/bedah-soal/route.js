import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Menangkap data yang dikirim dari Frontend (halaman web)
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Soal tidak boleh kosong!" }, { status: 400 });
    }

    // 2. Mengambil API Key Rahasia dari server (Aman dari publik)
    const apiKey = process.env.GEMINI_API_KEY;

    // 3. Prompt Sistem / Kepribadian AI JokiKode (Prompt Andalan)
    const systemPrompt = `Kamu adalah Senior IT / Kakak Tingkat di JokiKode, layanan joki coding untuk anak SMK RPL. 
Tugasmu membedah soal UKK/TA siswa dengan gaya asik, tunjukkan kalau kamu paham banget teknisnya, lalu arahkan mereka untuk pakai jasa JokiKode dengan merekomendasikan paket yang PALING TEPAT sesuai kesulitan soal.

ATURAN KERAS: 
- Bersikaplah layaknya programmer senior yang sedang nongkrong bareng junior. Santai, logis, dan suportif.
- JANGAN berikan kode sama sekali. Jangan berikan skema database lengkap. Cukup berikan gambaran high-level.

Balas dengan format markdown berikut (maksimal 150 kata):

1. **Gambaran Teknis Singkat** 🔍: (Tunjukkan kamu paham soalnya. Sebutkan konsep utama yang harus mereka buat. Misal: "Oh, aplikasi kasir ya? Berarti butuh state management yang rapi dan relasi tabel transaksi...").
2. **Realita Pengerjaan** ⏱️: (Kasih tahu tantangan aslinya secara realistis sesuai soal).
3. **Saran Senior & Rekomendasi Paket** 💡: (Berikan saran logis dan WAJIB sebutkan salah satu nama paket JokiKode yang cocok:
   - Jika project skala kecil/sederhana (HTML/CSS, CRUD dasar, masalah database biasa): Suruh ambil **Paket Tolongin Bang**.
   - Jika project rumit menengah (Kasir, E-commerce, Perpus, butuh fungsional lengkap & UI rapi): Suruh ambil **Paket Terima Beres** (karena ini Best Seller).
   - Jika project butuh desain mewah, grafik chart, fitur AI, atau ngincar nilai sempurna: Suruh ambil **Paket Nilai A+**.
   
   Contoh penyampaian: "Mengingat fitur kasir ini lumayan ribet di kalkulasi stoknya, mending lu ambil **Paket Terima Beres** aja bro. Udah dapet aplikasi fungsional lengkap plus UI responsive. Tinggal klik logo WA di pojok kanan bawah ya, kita gas!")

PENTING: Gunakan bahasa santai tapi tetap berwibawa (kayak mentor). Jangan lebay, biarkan mereka merasa butuh sendiri.`;
    
    const fullPrompt = `${systemPrompt}\n\nSoal dari klien:\n${prompt}`;

    // 4. Server kita diam-diam berkomunikasi dengan Server Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Jika Google sedang overload/error
      return NextResponse.json({ error: data.error?.message || "Google Gemini sedang sibuk." }, { status: response.status });
    }

    // 5. Mengirim jawaban kembali ke Frontend
    const aiText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ result: aiText }, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan di server internal." }, { status: 500 });
  }
}