"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

// 1. Katalog Resmi
const KATALOG_PAKET = {
    'hemat': { nama: 'Tolongin Bang', harga: 100000 },
    'standar': { nama: 'Terima Beres', harga: 350000 },
    'sultan': { nama: 'Nilai A+', harga: 600000 }
};

const DAFTAR_PROMO = {
    'JOKIASIK10': 0.10,
    'LULUSUKK': 50000,
    'BEBAS5': 0.05,
};

// Komponen Utama Checkout
function FormCheckout() {
    const searchParams = useSearchParams();
    const paketUrl = searchParams.get('paket');

    const [paketTerpilih, setPaketTerpilih] = useState(null);
    const [kodePromo, setKodePromo] = useState('');
    const [promoTerpakai, setPromoTerpakai] = useState('');
    const [pesanDiskon, setPesanDiskon] = useState('');
    const [totalHarga, setTotalHarga] = useState(0);

    const [formData, setFormData] = useState({ nama: '', wa: '', detail: '' });

    useEffect(() => {
        if (paketUrl && KATALOG_PAKET[paketUrl]) {
            setPaketTerpilih(KATALOG_PAKET[paketUrl]);
            setTotalHarga(KATALOG_PAKET[paketUrl].harga);
        }
    }, [paketUrl]);

    useEffect(() => {
        if (!paketTerpilih) return;

        const promo = kodePromo.toUpperCase();
        const hargaAsli = paketTerpilih.harga;

        if (promo === '') {
            setTotalHarga(hargaAsli);
            setPesanDiskon('');
            setPromoTerpakai('');
            return;
        }

        if (DAFTAR_PROMO[promo]) {
            const nilaiDiskon = DAFTAR_PROMO[promo];
            if (nilaiDiskon < 1) {
                setTotalHarga(hargaAsli - (hargaAsli * nilaiDiskon));
                setPesanDiskon(`✅ Mantap! Diskon ${nilaiDiskon * 100}% otomatis diterapkan.`);
            } else {
                setTotalHarga(hargaAsli - nilaiDiskon);
                setPesanDiskon(`✅ Hore! Potongan Rp ${nilaiDiskon.toLocaleString('id-ID')} berhasil.`);
            }
            setPromoTerpakai(promo);
        } else {
            setTotalHarga(hargaAsli);
            setPromoTerpakai('');
            if (promo.length > 4) {
                setPesanDiskon('❌ Kode promo tidak valid.');
            } else {
                setPesanDiskon('');
            }
        }
    }, [kodePromo, paketTerpilih]);

    const kirimPesanan = async (e) => {
        e.preventDefault();
        if (!paketTerpilih) return;

        if (!formData.wa) {
            alert("Nomor WhatsApp wajib diisi ya!");
            return;
        }

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: 'JOKI-' + Date.now(),
                    paketId: paketUrl,            // Sudah pakai paketId
                    kodePromo: promoTerpakai,
                    nama: formData.nama,
                    wa: formData.wa
                })
            });

            const data = await response.json();

            if (data.token) {
                window.snap.pay(data.token, {
                    onSuccess: function(result) {
                        // 1. Siapkan nomor WA Admin (Gunakan format 62 tanpa + atau 0)
                        const nomorAdmin = "6287865927598"; // GANTI DENGAN NOMOR WA KAMU
                        
                        // 2. Siapkan teks pesan otomatis
                        const pesan = `Halo Admin JokiKode, saya sudah melunasi pembayaran!%0A%0AOrder ID: ${result.order_id}%0AMohon segera diproses ya.`;
                        
                        // 3. Arahkan browser pembeli ke link WhatsApp
                        window.location.href = `https://wa.me/${nomorAdmin}?text=${pesan}`;
                    },
                    onPending: function(result) {
                        alert("Menunggu pembayaran Anda!");
                    },
                    onError: function(result) {
                        alert("Pembayaran gagal!");
                    },
                    onClose: function() {
                        alert("Anda menutup halaman sebelum menyelesaikan pembayaran.");
                    }
                });
            } else {
                alert("Gagal memuat pembayaran: " + data.error);
            }
        } catch (error) {
            console.error("Error Midtrans:", error);
            alert("Terjadi kesalahan server saat menghubungi Midtrans.");
        }
    };

    if (!paketUrl || !paketTerpilih) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
                <div className="card-sketch bg-red-50 p-8 text-center border-4 border-gray-900 shadow-[8px_8px_0_black]">
                    <h2 className="text-2xl font-black mb-4">⚠️ Paket Tidak Ditemukan</h2>
                    <p className="mb-6">Kamu belum milih paket joki nih.</p>
                    <a href="/#harga" className="btn-sketch bg-blue-300 px-6 py-2 inline-block font-bold border-2 border-black shadow-[4px_4px_0_black]">Kembali Pilih Paket</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7] py-12 px-4 md:px-0">

            <Script
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                strategy="lazyOnload"
            />

            {/* PERUBAHAN 1: Mengubah max-w-3xl menjadi max-w-xl agar di PC tidak terlalu lebar */}
            <div className="max-w-xl mx-auto">
                <a href="/" className="inline-flex items-center gap-2 mb-8 font-bold hover:text-blue-600 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i> Kembali
                </a>

                <div className="w-full">
                    {/* Ukuran font judul sedikit disesuaikan untuk layar HP */}
                    <h1 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 border-b-4 border-gray-900 pb-4">Formulir Pemesanan 🚀</h1>

                    <div className="bg-blue-50 border-4 border-gray-900 p-4 md:p-5 mb-8 rounded-xl shadow-[4px_4px_0_black]">
                        <p className="text-gray-600 font-bold mb-1">Paket Terpilih:</p>
                        <div className="flex justify-between items-center gap-2">
                            {/* PERUBAHAN 2: text-xl untuk HP, text-2xl untuk PC agar tidak patah ke bawah */}
                            <h3 className="text-xl md:text-2xl font-black text-blue-600">{paketTerpilih.nama}</h3>
                            <div className="text-right">
                                {/* PERUBAHAN 3: Ukuran harga dan memaksanya tetap 1 baris dengan text-nowrap */}
                                <p className="text-xl md:text-3xl font-black text-nowrap">Rp {totalHarga.toLocaleString('id-ID')}</p>
                                {totalHarga !== paketTerpilih.harga && (
                                    <p className="text-xs md:text-sm text-gray-500 line-through mt-1">Rp {paketTerpilih.harga.toLocaleString('id-ID')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={kirimPesanan} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold text-gray-900 mb-2">Nama Lengkap / Panggilan</label>
                                {/* PERUBAHAN 4: Mengubah padding (p-4 menjadi p-3) agar input tidak terlalu gemuk */}
                                <input type="text" required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="w-full p-3 border-4 border-gray-900 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" placeholder="Misal: Budi Santoso" />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-900 mb-2">Nomor WhatsApp (Aktif)</label>
                                <input type="number" required value={formData.wa} onChange={e => setFormData({ ...formData, wa: e.target.value })} className="w-full p-3 border-4 border-gray-900 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" placeholder="Misal: 081234567890" />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-900 mb-2">Ceritain Dikit Soal UKK-nya</label>
                                <textarea required rows="3" value={formData.detail} onChange={e => setFormData({ ...formData, detail: e.target.value })} className="w-full p-3 border-4 border-gray-900 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" placeholder="Misal: Disuruh bikin web kasir pakai Laravel..."></textarea>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-900 mb-2">Punya Kode Diskon? (Opsional)</label>
                                <input
                                    type="text"
                                    value={kodePromo}
                                    onChange={e => setKodePromo(e.target.value)}
                                    className="w-full p-3 border-4 border-gray-900 rounded-xl uppercase font-bold bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                    placeholder="KETIK KODE PROMO..."
                                />
                                {pesanDiskon && <p className={`mt-2 text-sm font-bold ${pesanDiskon.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{pesanDiskon}</p>}
                            </div>
                        </div>

                        <p className="text-sm font-bold text-gray-500 mt-4 flex justify-center items-center gap-2">
                            <i className="fa-solid fa-shield-halved text-green-600"></i>
                            Pembayaran diproses aman via Midtrans
                        </p>

                        <button type="submit" className="w-full bg-yellow-300 py-3 md:py-4 mt-4 font-black text-xl md:text-2xl border-4 border-gray-900 shadow-[6px_6px_0_black] hover:translate-y-1 hover:shadow-[3px_3px_0_black] active:translate-y-2 active:shadow-none transition-all rounded-xl">
                            Bayar Sekarang
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex justify-center items-center font-bold text-xl">Loading formulir...</div>}>
            <FormCheckout />
        </Suspense>
    );
}