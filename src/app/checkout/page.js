"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 

function FormCheckout() {
    const searchParams = useSearchParams();
    const paketUrl = searchParams.get('paket');

    const [paketTerpilih, setPaketTerpilih] = useState(null);
    const [kodePromo, setKodePromo] = useState('');
    const [promoTerpakai, setPromoTerpakai] = useState('');
    const [pesanDiskon, setPesanDiskon] = useState('');
    const [totalHarga, setTotalHarga] = useState(0);
    const [hargaAsliDatabase, setHargaAsliDatabase] = useState(0);
    const [diskonPaketPersen, setDiskonPaketPersen] = useState(0);
    const [formData, setFormData] = useState({ nama: '', wa: '', detail: '' });

    const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchPaketDariSupabase = async () => {
            if (!paketUrl) return;

            const { data, error } = await supabase
                .from('paket_harga')
                .select('*')
                .eq('id_paket', paketUrl)
                .single();

            if (data && !error) {
                const hargaAsli = data.harga_asli;
                const diskonPersen = data.diskon_persen || 0;
                
                const potongDiskon = (hargaAsli * diskonPersen) / 100;
                const hargaFinalPaket = hargaAsli - potongDiskon;

                setPaketTerpilih({
                    nama: paketUrl === 'hemat' ? 'Tolongin Bang' : paketUrl === 'standar' ? 'Terima Beres' : 'Nilai A+',
                    harga: hargaFinalPaket
                });
                setHargaAsliDatabase(hargaAsli);
                setDiskonPaketPersen(diskonPersen);
                setTotalHarga(hargaFinalPaket);
            } else {
                const fallbackData = {
                    'hemat': { nama: 'Tolongin Bang', harga: 75000 },
                    'standar': { nama: 'Terima Beres', harga: 250000 },
                    'sultan': { nama: 'Nilai A+', harga: 350000 }
                };
                if (fallbackData[paketUrl]) {
                    setPaketTerpilih(fallbackData[paketUrl]);
                    setHargaAsliDatabase(fallbackData[paketUrl].harga);
                    setTotalHarga(fallbackData[paketUrl].harga);
                }
            }
        };

        fetchPaketDariSupabase();
    }, [paketUrl]);

    const showAlert = (message, type = 'error') => {
        setCustomAlert({ show: true, message, type });
    };

    const handleCekPromo = async () => {
        if (!paketTerpilih) return;
        
        // 🔥 VALIDASI: Cegah Double Diskon
        if (diskonPaketPersen > 0) {
            setPesanDiskon('❌ Promo tidak dapat digabung dengan diskon paket.');
            return;
        }

        const inputBersih = kodePromo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const hargaAcuan = hargaAsliDatabase - (hargaAsliDatabase * diskonPaketPersen / 100);

        if (!inputBersih) {
            setTotalHarga(hargaAcuan);
            setPesanDiskon('');
            setPromoTerpakai('');
            return;
        }

        const { data, error } = await supabase.from('promo').select('*');
        if (error || !data) {
            setPesanDiskon('❌ Gagal menghubungi database.');
            return;
        }

        let promoDitemukan = null;
        for (let i = 0; i < data.length; i++) {
            const dbKodeBersih = String(data[i].kode).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            if (dbKodeBersih === inputBersih) {
                promoDitemukan = data[i];
                break;
            }
        }

        if (!promoDitemukan) {
            setTotalHarga(hargaAcuan);
            setPromoTerpakai('');
            setPesanDiskon('❌ Kode promo tidak valid.');
        } else if (promoDitemukan.is_active !== true) {
            setTotalHarga(hargaAcuan);
            setPromoTerpakai('');
            setPesanDiskon('❌ Kode promo sudah tidak aktif.');
        } else {
            const diskonPromoPersen = promoDitemukan.diskon / 100;
            setTotalHarga(hargaAcuan - (hargaAcuan * diskonPromoPersen));
            setPromoTerpakai(promoDitemukan.kode);
            setPesanDiskon(`✅ Mantap! Diskon ${promoDitemukan.diskon}% diterapkan.`);
        }
    };

    const kirimPesanan = async (e) => {
        e.preventDefault();
        if (!paketTerpilih) return;
        if (!formData.wa) {
            showAlert("Nomor WhatsApp wajib diisi ya!");
            return;
        }
        if (isProcessing) return;
        setIsProcessing(true);

        const currentOrderId = 'JOKI-' + Date.now();

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: currentOrderId,
                    paketId: paketUrl,
                    paketNama: paketTerpilih.nama,
                    kodePromo: promoTerpakai,
                    nama: formData.nama,
                    wa: formData.wa,
                    amount: totalHarga
                })
            });

            const data = await response.json();

            if (data.success && data.paymentData) {
                const paymentUrl = data.paymentData.payment_url;

                if (paymentUrl) {
                    const { error: dbError } = await supabase.from('pesanan').insert([{
                        order_id: currentOrderId,
                        nama_klien: formData.nama,
                        wa_klien: formData.wa,
                        paket_id: paketUrl,
                        kode_promo: promoTerpakai || null,
                        total_harga: totalHarga,
                        status: 'PENDING'
                    }]);

                    if (dbError) {
                        console.error("Gagal simpan ke DB:", dbError);
                        showAlert("Sistem gagal menyimpan data pesanan. Coba lagi.");
                        setIsProcessing(false);
                        return;
                    }

                    setIsProcessing(false);
                    window.location.href = paymentUrl;
                } else {
                    showAlert("Pesanan berhasil dibuat! Tapi gagal mendapatkan link pembayaran dari server.");
                    setIsProcessing(false);
                }
            } else {
                showAlert("Gagal memuat pembayaran: " + (data.message || "Terjadi kesalahan"));
                setIsProcessing(false);
            }
        } catch (error) {
            console.error(error);
            showAlert("Terjadi kesalahan server saat menghubungi API Pembayaran.");
            setIsProcessing(false);
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
            {customAlert.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white border-4 border-gray-900 p-6 md:p-8 rounded-2xl shadow-[8px_8px_0_black] max-w-sm w-full transform transition-all scale-100">
                        <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-gray-900 mb-4 shadow-[4px_4px_0_black] ${customAlert.type === 'error' ? 'bg-red-400' : 'bg-green-400'}`}>
                                <i className={`fa-solid ${customAlert.type === 'error' ? 'fa-triangle-exclamation' : 'fa-check'} text-3xl text-gray-900`}></i>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Tunggu Sebentar!</h3>
                            <p className="text-gray-700 font-bold mb-6 leading-relaxed">{customAlert.message}</p>
                            <button
                                onClick={() => setCustomAlert({ show: false, message: '', type: 'error' })}
                                className="w-full bg-yellow-300 py-3 font-black text-lg border-4 border-gray-900 rounded-xl shadow-[4px_4px_0_black] hover:translate-y-1 hover:shadow-[2px_2px_0_black] active:translate-y-2 active:shadow-none transition-all"
                            >
                                Oke, Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-xl mx-auto">
                <a href="/" className="inline-flex items-center gap-2 mb-8 font-bold hover:text-blue-600 transition-colors">
                    <i className="fa-solid fa-arrow-left"></i> Kembali
                </a>

                <div className="w-full">
                    <h1 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 border-b-4 border-gray-900 pb-4">Formulir Pemesanan 🚀</h1>

                    <div className="bg-blue-50 border-4 border-gray-900 p-4 md:p-5 mb-8 rounded-xl shadow-[4px_4px_0_black]">
                        <p className="text-gray-600 font-bold mb-1">Paket Terpilih:</p>
                        <div className="flex justify-between items-center gap-2">
                            <h3 className="text-xl md:text-2xl font-black text-blue-600">{paketTerpilih.nama}</h3>
                            <div className="text-right">
                                <p className="text-xl md:text-3xl font-black text-nowrap">Rp {totalHarga.toLocaleString('id-ID')}</p>
                                {(diskonPaketPersen > 0 || totalHarga !== hargaAsliDatabase) && (
                                    <p className="text-xs md:text-sm text-gray-500 line-through mt-1">Rp {hargaAsliDatabase.toLocaleString('id-ID')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={kirimPesanan} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold text-gray-900 mb-2">Nama Lengkap / Panggilan</label>
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

                            {/* 🔥 BAGIAN VALIDASI DISABLE INPUT & BUTTON */}
                            <div>
                                <label className="block font-bold text-gray-900 mb-2">Punya Kode Diskon?</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={kodePromo}
                                        onChange={e => setKodePromo(e.target.value)}
                                        disabled={diskonPaketPersen > 0} 
                                        className={`w-full p-3 border-4 border-gray-900 rounded-xl uppercase font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all ${diskonPaketPersen > 0 ? 'bg-gray-200 cursor-not-allowed placeholder-gray-500' : 'bg-white'}`}
                                        placeholder={diskonPaketPersen > 0 ? "TIDAK BERLAKU SAAT DISKON PAKET" : "KETIK KODE..."}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCekPromo}
                                        disabled={diskonPaketPersen > 0}
                                        className={`px-6 py-2 rounded-xl font-bold transition-colors ${diskonPaketPersen > 0 ? 'bg-gray-400 text-gray-700 border-4 border-gray-900 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                    >
                                        Cek
                                    </button>
                                </div>
                                {/* Peringatan warna merah kalau ada diskon paket */}
                                {diskonPaketPersen > 0 ? (
                                    <p className="mt-2 text-sm font-bold text-red-600">❌ Promo tidak dapat digabung dengan diskon paket.</p>
                                ) : (
                                    pesanDiskon && <p className={`mt-2 text-sm font-bold ${pesanDiskon.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{pesanDiskon}</p>
                                )}
                            </div>
                        </div>

                        <p className="text-sm font-bold text-gray-500 mt-6 flex justify-center items-center gap-2">
                            <i className="fa-solid fa-shield-halved text-green-600"></i>
                            Pembayaran diproses aman via DompetX
                        </p>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-3 md:py-4 mt-4 font-black text-xl md:text-2xl border-4 border-gray-900 transition-all rounded-xl ${isProcessing
                                    ? 'bg-gray-400 opacity-70 cursor-not-allowed shadow-[3px_3px_0_black] translate-y-1'
                                    : 'bg-yellow-300 shadow-[6px_6px_0_black] hover:translate-y-1 hover:shadow-[3px_3px_0_black] active:translate-y-2 active:shadow-none'
                                }`}
                        >
                            {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
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