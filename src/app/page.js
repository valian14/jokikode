"use client";
import React, { useState } from 'react';
import Link from 'next/link';

// Fungsi Fetch dengan Retry (Diletakkan di luar komponen agar tidak ter-recreate setiap render)
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP status ${response.status}`;
        const errorObj = new Error(errorMessage);
        errorObj.status = response.status;
        throw errorObj;
      }
      return await response.json();
    } catch (error) {
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      if (i === maxRetries - 1) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

// Format Markdown to HTML (Sesuai source)
const formatMarkdownToHTML = (text) => {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-black bg-yellow-200 px-1">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-gray-700">$1</em>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-black mt-4 mb-2 underline decoration-wavy decoration-blue-400">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-black mt-4 mb-2 uppercase">$1</h2>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc marker:text-red-500 font-bold">$1</li>')
    .replace(/\n/g, '<br/>');
  return html;
};

export default function JokiKode() {
  // State untuk Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State untuk AI Analyzer
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('<div class="h-full flex items-center justify-center text-gray-400 italic text-center text-base">&gt;_ Hasil analisis bedah soal akan diprint di sini...</div>');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Fungsi Pemanggil AI
  const handleAnalyzeTask = async () => {
    const userQuery = aiInput.trim();
    if (!userQuery) {
      alert("Tulis dulu soal UKK atau deskripsi tugasnya ya, bro!");
      return;
    }

    setIsAiLoading(true);

    try {
      // 1. Memanggil API Backend lokal yang tadi kita buat
      const response = await fetch('/api/bedah-soal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userQuery })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses soal dari server internal.");
      }

      // 2. Mengambil hasil dari backend dan memformatnya
      const rawText = data.result || "Maaf, AI kami sedang pusing baca kodingan. Coba lagi nanti ya!";
      setAiOutput(formatMarkdownToHTML(rawText));

    } catch (error) {
      console.error("AI Error:", error);
      // 3. Menampilkan UI error bawaanmu
      setAiOutput(`<div class="text-red-600 font-bold text-center mt-4 p-4 border-2 border-dashed border-red-500 bg-red-50 rounded">
        <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl mb-2 block"></i>
        <b>Gagal Terhubung ke AI:</b><br/>${error.message}<br/><br/>
        <span class="text-xs text-gray-500">(Pastikan server merespon dengan baik)</span>
      </div>`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="paper-bg antialiased selection:bg-yellow-300 selection:text-black min-h-screen">

      {/* CSS internal khusus komponen ini */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .font-handwriting { font-family: 'Caveat', cursive; }
        .font-code { font-family: 'Space Mono', monospace; }
        .paper-bg { background-color: #fdfbf7; }
        
        .card-sketch {
            background: #ffffff;
            border: 3px solid #1f2937;
            border-radius: 12px;
            box-shadow: 6px 6px 0px #1f2937;
            transition: all 0.2s ease;
        }
        .card-sketch:hover {
            transform: translate(-2px, -2px);
            box-shadow: 10px 10px 0px #1f2937;
        }
        
        .btn-sketch {
            background: #fcd34d;
            border: 3px solid #1f2937;
            border-radius: 8px;
            box-shadow: 4px 4px 0px #1f2937;
            font-weight: 800;
            transition: all 0.1s ease;
            cursor: pointer;
        }
        .btn-sketch:active {
            transform: translate(4px, 4px);
            box-shadow: 0px 0px 0px #1f2937;
        }
        .btn-sketch-blue { background: #93c5fd; }
        
        .marker-yellow {
            background: linear-gradient(180deg, transparent 40%, #fef08a 40%, #fef08a 90%, transparent 90%);
        }
        
        .scribble-underline { position: relative; }
        .scribble-underline::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 10px;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 C20,20 40,0 60,15 C80,5 100,20 100,10' stroke='%23ef4444' strokeWidth='3' fill='none' strokeLinecap='round'/%3E%3C/svg%3E");
            background-size: 100% 100%;
            background-repeat: no-repeat;
        }
        
        @keyframes fadeText1 {
            0%, 40% { opacity: 1; }
            50%, 90% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes fadeText2 {
            0%, 40% { opacity: 0; }
            50%, 90% { opacity: 1; }
            100% { opacity: 0; }
        }
        .animate-fade-1 { animation: fadeText1 4s infinite ease-in-out; }
        .animate-fade-2 { animation: fadeText2 4s infinite ease-in-out; }
      `}} />

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#fdfbf7] border-b-4 border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2 group">
              <i className="fa-solid fa-terminal text-3xl text-blue-600 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"></i>
              <span className="font-handwriting text-4xl font-bold text-gray-900 tracking-wide">JokiKode.</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#fitur" className="font-bold text-gray-700 hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600">Alasan</a>
              <a href="#ai-analyzer" className="font-bold text-gray-700 hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600">Bedah Soal</a>
              <a href="#harga" className="font-bold text-gray-700 hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600">Paket Harga</a>
              
              {/* Menu Cek Order Baru */}
              <Link href="/cek-order" className="font-bold text-gray-700 hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600">
                Cek Order 🔍
              </Link>

              <a href="#harga" className="btn-sketch px-6 py-2 text-sm bg-blue-300">
                Pesan Sekarang <i className="fa-solid fa-arrow-right ml-1"></i>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={toggleMobileMenu} className="text-gray-900 hover:text-blue-600 focus:outline-none p-2 border-2 border-gray-900 rounded bg-white">
                <i className="fa-solid fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Sidebar Menu */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-[#fdfbf7] border-l-4 border-gray-900 z-[70] transform transition-transform duration-300 ease-out shadow-[-10px_0_20px_rgba(0,0,0,0.1)] flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex justify-between items-center border-b-2 border-gray-200">
          <span className="font-handwriting text-2xl font-bold text-gray-900">Menu</span>
          <button onClick={closeMobileMenu} className="text-gray-900 hover:text-red-600 focus:outline-none p-2 rounded">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
        <div className="flex-1 px-4 pt-6 pb-6 space-y-4">
          <a href="#fitur" onClick={closeMobileMenu} className="block px-3 py-2 text-lg font-bold text-gray-900 border-l-4 border-transparent hover:border-blue-500 hover:bg-gray-100 transition-colors">Alasan</a>
          <a href="#ai-analyzer" onClick={closeMobileMenu} className="block px-3 py-2 text-lg font-bold text-gray-900 border-l-4 border-transparent hover:border-blue-500 hover:bg-gray-100 transition-colors">Bedah Soal</a>
          <a href="#harga" onClick={closeMobileMenu} className="block px-3 py-2 text-lg font-bold text-gray-900 border-l-4 border-transparent hover:border-blue-500 hover:bg-gray-100 transition-colors">Paket Harga</a>
          
          {/* Menu Cek Order Baru untuk Mobile */}
          <Link href="/cek-order" onClick={closeMobileMenu} className="block px-3 py-2 text-lg font-bold text-gray-900 border-l-4 border-transparent hover:border-blue-500 hover:bg-gray-100 transition-colors">
            Cek Order 🔍
          </Link>

          <a href="#harga" onClick={closeMobileMenu} className="block mt-8 btn-sketch px-6 py-3 text-center text-sm bg-blue-300 w-full">
            Pesan Sekarang
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-40 right-10 opacity-50 transform rotate-12 hidden lg:block">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10C50 10 90 20 80 50C70 80 10 90 20 60C30 30 50 10 50 10Z" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 40L60 60M60 40L40 60" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="text-left relative">
              <div className="absolute -top-4 left-0 md:-top-10 md:-left-6 transform -rotate-12 z-20">
                <span className="font-handwriting text-red-500 text-5xl md:text-6xl font-bold border-4 border-red-500 rounded-full px-3 md:px-4 py-1 bg-[#fdfbf7] shadow-sm">A+</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight mt-12 md:mt-8 relative z-10">
                Pusing Mikirin <br />
                <span className="marker-yellow relative">Tugas UKK / TA?</span>
              </h1>

              <p className="text-xl text-gray-700 mb-8 font-medium max-w-lg leading-relaxed">
                Fokus aja <span className="scribble-underline font-bold">belajar presentasi</span>. Biar urusan kodingan, database, dan error merah-merah kami yang kerjain sampai tuntas dan jalan!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#harga" className="btn-sketch btn-sketch-blue px-8 py-4 text-center text-lg flex items-center justify-center gap-2">
                  Pesan Joki Sekarang <i className="fa-solid fa-rocket"></i>
                </a>
                <a href="#ai-analyzer" className="card-sketch px-8 py-4 text-center text-lg font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                  <i className="fa-solid fa-robot text-blue-600"></i> AI Bedah Soal
                </a>
              </div>

              <div className="mt-8 border-t-2 border-dashed border-gray-400 pt-6">
                <p className="font-handwriting text-2xl text-gray-600 mb-2">Bisa kerjain pakai:</p>
                <div className="flex flex-wrap items-center gap-4 text-2xl text-gray-800">
                  <i className="fa-brands fa-js hover:text-yellow-500 hover:-translate-y-1 transition-transform" title="JavaScript"></i>
                  <i className="fa-brands fa-react hover:text-blue-400 hover:-translate-y-1 transition-transform" title="React / Next.js"></i>
                  <i className="fa-brands fa-node-js hover:text-green-600 hover:-translate-y-1 transition-transform" title="Node.js / Express"></i>
                  <i className="fa-brands fa-php hover:text-indigo-500 hover:-translate-y-1 transition-transform" title="PHP"></i>
                  <i className="fa-brands fa-laravel hover:text-red-500 hover:-translate-y-1 transition-transform" title="Laravel"></i>
                  <i className="fa-solid fa-database hover:text-gray-600 hover:-translate-y-1 transition-transform" title="Database"></i>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-lg mx-auto mt-16 lg:mt-0 lg:max-w-none lg:pl-8">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-white/50 backdrop-blur-sm border border-gray-200 shadow-sm rotate-2 z-20" style={{ mixBlendMode: 'multiply' }}></div>

              <div className="card-sketch overflow-hidden bg-white transform rotate-2 hover:rotate-0 transition-transform duration-500 relative z-10">
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b-3 border-gray-800">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-800 bg-red-400"></div>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-800 bg-yellow-400"></div>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-800 bg-green-400"></div>
                  <div className="ml-4 font-code text-xs font-bold text-gray-600">siswa_ukk.jsx</div>
                </div>
                <div className="p-6 font-code text-sm sm:text-base leading-relaxed bg-[#fafafa]">
                  <p><span className="text-purple-700 font-bold">import</span> {'{'} <span className="text-blue-700">useState</span> {'}'} <span className="text-purple-700 font-bold">from</span> <span className="text-green-700">'react'</span>;</p>
                  <p><span className="text-purple-700 font-bold">import</span> JokiKode <span className="text-purple-700 font-bold">from</span> <span className="text-green-700">'@/jasa/coding'</span>;</p>
                  <br />
                  <p><span className="text-purple-700 font-bold">export default function</span> <span className="text-blue-800 font-bold">UjianAkhir</span>() {'{'}</p>
                  <p className="pl-4"><span className="text-purple-700 font-bold">const</span> [<span className="text-blue-700">kondisi</span>, <span className="text-blue-700">setKondisi</span>] = <span className="text-blue-800">useState</span>(<span className="text-red-600">'Pusing Mikirin Bug'</span>);</p>
                  <br />
                  <p className="pl-4"><span className="text-purple-700 font-bold">const</span> <span className="text-blue-800">selesaikanTugas</span> = <span className="text-purple-700 font-bold">async</span> () ={'>'} {'{'}</p>
                  <p className="pl-8 text-gray-400 italic">// Serahkan ke JokiKode</p>
                  <p className="pl-8"><span className="text-purple-700 font-bold">const</span> <span className="text-blue-700">hasil</span> = <span className="text-purple-700 font-bold">await</span> JokiKode.<span className="text-blue-800">kerjakan</span>();</p>
                  <p className="pl-8"><span className="text-purple-700 font-bold">if</span> (<span className="text-blue-700">hasil</span>.<span className="text-blue-700">lancar</span>) {'{'}</p>
                  <p className="pl-12"><span className="text-blue-800">setKondisi</span>(<span className="text-green-700">'Lulus Tenang, Nilai A+ 😎'</span>);</p>
                  <p className="pl-8">{'}'}</p>
                  <p className="pl-4">{'};'}</p>
                  <br />
                  <p className="pl-4"><span className="text-purple-700 font-bold">return</span> (</p>
                  <p className="pl-8"><span className="text-gray-800">&lt;</span><span className="text-blue-800 font-bold">button</span> <span className="text-blue-700">onClick</span>=<span className="text-gray-800">{'{'}</span><span className="text-blue-800">selesaikanTugas</span><span className="text-gray-800">{'}'}&gt;</span></p>
                  <p className="pl-12 text-gray-800">Selesaikan UKK Saya!</p>
                  <p className="pl-8"><span className="text-gray-800">&lt;/</span><span className="text-blue-800 font-bold">button</span><span className="text-gray-800">&gt;</span></p>
                  <p className="pl-4">);</p>
                  <p>{'}'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 uppercase tracking-tight">Kenapa Pakai <span className="bg-yellow-300 px-2 border-2 border-black -rotate-2 inline-block shadow-[2px_2px_0px_black]">JokiKode?</span></h2>
            <p className="text-gray-600 font-handwriting text-2xl max-w-2xl mx-auto">(Catatan Penting buat Anak SMK)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-sketch p-6 bg-pink-50 relative group">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-gray-900 shadow-sm z-10"></div>
              <i className="fa-solid fa-code text-4xl mb-4 text-gray-800 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Kode Bersih</h3>
              <p className="text-gray-700 text-sm">Kodingan rapi, mudah dibaca, dan dikasih komentar penjelasan. Guru penguji dijamin gampang ngertinya saat ditanya.</p>
            </div>

            <div className="card-sketch p-6 bg-blue-50 relative group transform md:translate-y-4">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-900 shadow-sm z-10"></div>
              <i className="fa-solid fa-truck-fast text-4xl mb-4 text-gray-800 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Pengerjaan Kilat</h3>
              <p className="text-gray-700 text-sm">Deadline mepet? Tenang, bisa selesai dalam 3-5 hari tergantung kompleksitas. Tersedia layanan ekspres (1-2 hari).</p>
            </div>

            <div className="card-sketch p-6 bg-green-50 relative group">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900 shadow-sm z-10"></div>
              <i className="fa-solid fa-chalkboard-user text-4xl mb-4 text-gray-800 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Briefing Presentasi</h3>
              <p className="text-gray-700 text-sm">Nggak cuma ngoding, kita juga ajarin cara jelasin aplikasinya ke guru penguji. Kamu bakal dikasih panduan alur aplikasinya.</p>
            </div>

            <div className="card-sketch p-6 bg-yellow-50 relative group transform md:translate-y-4">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-500 border-2 border-gray-900 shadow-sm z-10"></div>
              <i className="fa-solid fa-wallet text-4xl mb-4 text-gray-800 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2">Harga Pelajar</h3>
              <p className="text-gray-700 text-sm">Harga sangat bersahabat untuk kantong siswa SMK. Bisa DP dulu, lunas setelah aplikasi selesai & siap di-running.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Analyzer Section */}
      <section id="ai-analyzer" className="py-24 relative border-y-4 border-gray-900 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-800 bg-yellow-300 text-gray-900 text-sm font-bold mb-6 shadow-[3px_3px_0_black]">
              <i className="fa-solid fa-mug-hot"></i> Konsultasi AI Senior
            </div>

            <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tight text-gray-900 relative inline-block">
              MENTOK SAMA SOAL UKK?
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-500" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 8 50 5 T 100 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </h2>

            <p className="text-gray-700 max-w-2xl mx-auto font-medium mt-4">
              <i>Paste</i> soal UKK atau ide tugas akhirmu di bawah. AI Senior kami bakal ngasih gambaran teknisnya, seberapa ribet eksekusinya, dan saran paling logis buat kamu yang lagi dikejar <i>deadline</i>. ☕
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Input Area */}
            <div className="bg-[#fdfbf7] p-6 rounded-2xl flex flex-col h-full border-3 border-gray-800 shadow-[6px_6px_0_black] relative z-10">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-200 pb-2">
                <i className="fa-regular fa-clipboard text-gray-600"></i>
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Input Soal Ujian</h3>
              </div>

              <textarea
                rows="8"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full bg-transparent border-2 border-dashed border-gray-400 rounded-xl p-4 text-gray-800 focus:ring-0 focus:border-blue-500 outline-none resize-none font-mono text-sm mb-4 placeholder-gray-400"
                placeholder={`Paste deskripsi tugas atau soal dari gurumu di sini ya...\n\nContoh: Bang, disuruh bikin aplikasi perpustakaan pakai React & Express. Harus ada fitur scan barcode buku, denda telat otomatis, sama cetak kartu perpus PDF. Kira-kira eksekusinya ngabisin waktu berapa lama ya? 🤔`}
              ></textarea>

              <button
                onClick={handleAnalyzeTask}
                disabled={isAiLoading}
                className={`w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white py-3 border-2 border-gray-800 rounded-xl font-bold shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] active:shadow-none hover:translate-y-[2px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 ${isAiLoading ? 'opacity-50 cursor-not-allowed translate-y-1 shadow-none' : ''}`}
              >
                Bedah Soal Bareng Senior 💡
              </button>
            </div>

            {/* Output Area */}
            <div className="card-sketch p-0 relative min-h-[350px] flex flex-col bg-white">
              <div className="bg-gray-900 border-b-2 border-gray-900 px-4 py-3 flex items-center gap-2">
                <i className="fa-solid fa-robot text-green-400 text-sm"></i>
                <span className="text-xs font-code text-white uppercase">Terminal Output AI</span>
              </div>

              <div className="p-6 h-full flex flex-col">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center mt-8">
                    <i className="fa-solid fa-gear fa-spin text-5xl text-blue-500 mb-6 drop-shadow-md"></i>
                    <div className="relative h-6 w-full flex justify-center items-center">
                      <p className="absolute font-mono text-sm text-gray-500 font-bold animate-fade-1">
                        Menganalisis logika program...
                      </p>
                      <p className="absolute font-mono text-sm text-gray-500 font-bold animate-fade-2">
                        Mohon tunggu beberapa saat...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm text-gray-800 leading-relaxed overflow-y-auto font-code h-full prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: aiOutput }}
                  ></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold mb-4 uppercase">Pilih Paket <span className="bg-blue-300 px-2 border-2 border-black rotate-1 inline-block shadow-[2px_2px_0px_black]">Joki</span></h2>
            <p className="font-handwriting text-2xl text-gray-600">Sesuaikan dengan budget jajan kamu bulan ini.</p>
          </div>

          <div className="flex justify-center w-full mb-12 px-4">
            <div className="inline-flex items-center gap-3 bg-green-300 border-3 border-gray-900 px-6 py-3 rounded-xl shadow-[4px_4px_0_black] transform rotate-1 hover:rotate-0 transition-all duration-300 max-w-2xl">
              <div className="bg-white border-2 border-gray-900 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-handshake text-gray-900 text-sm"></i>
              </div>
              <span className="font-bold text-gray-900 text-sm md:text-base text-left">
                Uang jajan mepet? Tenang, bisa <span className="font-black bg-white px-2 py-0.5 border border-gray-900 rounded">DP 50%</span> dulu.<br />
                <span className="text-xs font-medium opacity-80">Pelunasan nunggu aplikasi 100% jalan di laptop lu! 🤝</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto items-stretch">

            {/* Package 1 */}
            <div className="card-sketch p-8 bg-white md:mb-4">
              <div className="inline-block px-3 py-1 border-2 border-gray-900 font-bold text-xs uppercase mb-4 shadow-[2px_2px_0px_black]">Paket Hemat</div>
              <h3 className="text-2xl font-black mb-2">Tolongin Bang</h3>
              <p className="text-gray-600 text-sm mb-6 font-medium border-b-2 border-dashed border-gray-300 pb-4">Cocok untuk project UKK skala kecil / sederhana.</p>

              <div className="text-4xl font-black mb-6">Mulai 100k<span className="text-lg text-gray-500 font-medium">/app</span></div>

              <ul className="space-y-4 mb-8 font-medium">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-green-500"></i>
                  <span className="text-gray-800">Aplikasi fungsional dasar</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-green-500"></i>
                  <span className="text-gray-800">Database lengkap (SQL/Mongo)</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-xmark text-xl text-red-500"></i>
                  <span className="text-gray-500 line-through">Desain UI/UX Custom</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-xmark text-xl text-red-500"></i>
                  <span className="text-gray-500 line-through">Panduan Presentasi via Zoom</span>
                </li>
              </ul>

              <a href="/checkout?paket=hemat" rel="noreferrer" className="block w-full text-center border-2 border-gray-900 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-lg transition-colors">
                Pesan
              </a>
            </div>

            {/* Package 2 */}
            <div className="card-sketch p-8 bg-yellow-100 transform md:-translate-y-4 border-4 shadow-[8px_8px_0px_black] relative z-10">
              <div className="absolute -top-4 -right-4">
                <span className="bg-red-500 text-white font-bold px-3 py-1 border-2 border-black shadow-[2px_2px_0px_black] transform rotate-12 inline-block">Best Seller!</span>
              </div>

              <div className="inline-block px-3 py-1 bg-white border-2 border-gray-900 font-bold text-xs uppercase mb-4 shadow-[2px_2px_0px_black]">Paket Standar</div>
              <h3 className="text-3xl font-black mb-2">Terima Beres</h3>
              <p className="text-gray-700 text-sm mb-6 font-bold border-b-2 border-dashed border-gray-400 pb-4">Paket paling aman untuk standar lulus UKK.</p>

              <div className="text-4xl font-black mb-6">Mulai 350k<span className="text-lg text-gray-700 font-medium">/app</span></div>

              <ul className="space-y-4 mb-8 font-bold">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-green-600"></i>
                  <span className="text-gray-900">Aplikasi fungsional lengkap sesuai soal</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-green-600"></i>
                  <span className="text-gray-900">Desain UI rapi & responsif (Tailwind/Bootstrap)</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-green-600"></i>
                  <span className="text-gray-900">Panduan instalasi & text briefing</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-green-600"></i>
                  <span className="text-gray-900">Revisi minor 2x</span>
                </li>
              </ul>

              <a href="/checkout?paket=standar" rel="noreferrer" className="btn-sketch block w-full text-center py-4 text-lg">
                Pesan
              </a>
            </div>

            {/* Package 3 */}
            <div className="card-sketch p-8 bg-blue-50 md:mb-4">
              <div className="inline-block px-3 py-1 bg-white border-2 border-gray-900 font-bold text-xs uppercase mb-4 shadow-[2px_2px_0px_black]">Paket Sultan</div>
              <h3 className="text-2xl font-black mb-2">Nilai A+</h3>
              <p className="text-gray-600 text-sm mb-6 font-medium border-b-2 border-dashed border-gray-300 pb-4">Untuk yang ngincer nilai sempurna & UI mewah.</p>

              <div className="text-4xl font-black mb-6">Mulai 600k<span className="text-lg text-gray-500 font-medium">/app</span></div>

              <ul className="space-y-4 mb-8 font-medium">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-blue-500"></i>
                  <span className="text-gray-800">Semua fitur paket "Terima Beres"</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-blue-500"></i>
                  <span className="text-gray-800">UI/UX Premium (Animasi, Chart, dll)</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-blue-500"></i>
                  <span className="text-gray-800">Simulasi presentasi/tanya jawab via GMeet</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check text-xl text-blue-500"></i>
                  <span className="text-gray-800">Hosting & Domain gratis 1 tahun</span>
                </li>
              </ul>

              <a href="/checkout?paket=sultan" rel="noreferrer" className="block w-full text-center border-2 border-gray-900 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-lg transition-colors">
                Pesan
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t-8 border-yellow-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4 group">
                <i className="fa-solid fa-terminal text-3xl text-yellow-300 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"></i>
                <span className="font-handwriting text-4xl font-bold tracking-wide text-white">JokiKode.</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">Membantu ribuan siswa SMK lulus ujian kompetensi dengan tenang dan nilai maksimal.</p>
            </div>

            <div className="text-center md:text-right">
              <h4 className="font-bold mb-4 uppercase tracking-widest text-gray-400 text-sm">Hubungi Kami</h4>
              <div className="flex gap-4 justify-center md:justify-end mb-2">
                <a href="https://wa.me/6287865927598?text=Halo%20min,%20mau%20tanya%20paket%20Tolongin%20Bang" className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center hover:bg-yellow-300 hover:text-black transition-colors"><i className="fa-brands fa-whatsapp text-xl"></i></a>
                <a href="https://www.instagram.com/eval.124/" className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center hover:bg-yellow-300 hover:text-black transition-colors"><i className="fa-brands fa-instagram text-xl"></i></a>
              </div>
              <p className="text-gray-500 text-xs mt-6 font-code">© 2026 JokiKode All Rights Reserved.</p>
              <p className="text-gray-500 text-xs font-code">Create valianeka</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WA Button */}
      <a href="https://wa.me/6287865927598?text=Halo%20min,%20saya%20butuh%20bantuan%20tugas%20coding" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl border-3 border-gray-900 shadow-[4px_4px_0px_black] hover:-translate-y-1 transition-transform z-50">
        <i className="fa-brands fa-whatsapp"></i>
      </a>

    </div>
  );
}