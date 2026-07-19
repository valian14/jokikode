import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory rate limiter (Hanya untuk contoh, untuk skala besar gunakan Redis/Upstash)
const requestCounts = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 menit
    const limit = 5; // Maksimal 5 permintaan per menit

    const userRequests = requestCounts.get(ip) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= limit) return true;

    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    return false;
}

// Pindahkan Katalog & Promo ke Backend sebagai sumber kebenaran (Source of Truth)
const KATALOG_PAKET = {
    'hemat': 100000,
    'standar': 350000,
    'sultan': 600000
};

const DAFTAR_PROMO = {
    'JOKIASIK10': 0.10,
    'LULUSUKK': 50000,
    'BEBAS5' : 0.05,
};

let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY
});

// 1. Inisialisasi Supabase Backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
    // 1. Ambil IP Address Client
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 2. CEK RATE LIMIT
    if (isRateLimited(ip))
        return NextResponse.json({ error: "Terlalu banyak permintaan. Tunggu 1 menit ya!" }, { status: 429 });

    try {
        const { orderId, paketId, kodePromo, nama, wa } = await request.json();

        // 1. VALIDASI PAKET
        const hargaAsli = KATALOG_PAKET[paketId];
        if (!hargaAsli) {
            return NextResponse.json({ error: "Paket tidak ditemukan atau dimanipulasi!" }, { status: 400 });
        }

        // 2. HITUNG ULANG HARGA & PROMO DI SERVER
        let hargaFinal = hargaAsli;
        if (kodePromo && DAFTAR_PROMO[kodePromo.toUpperCase()]) {
            const diskon = DAFTAR_PROMO[kodePromo.toUpperCase()];
            if (diskon < 1) {
                hargaFinal = hargaAsli - (hargaAsli * diskon);
            } else {
                hargaFinal = hargaAsli - diskon;
            }
        }

        // 3. SIMPAN KE DATABASE SUPABASE DULU SEBELUM KE MIDTRANS <<< INI YANG DITAMBAHKAN
        const { data: dbData, error: dbError } = await supabase
            .from('pesanan')
            .insert([
                {
                    order_id: orderId,
                    nama_klien: nama,
                    wa_klien: wa,
                    paket_id: paketId,
                    kode_promo: kodePromo || null,
                    total_harga: hargaFinal,
                    status: 'PENDING'
                }
            ]);

        // Jika gagal simpan ke database, batalkan transaksi dan beri tahu frontend
        if (dbError) {
            console.error("Database Error:", dbError);
            return NextResponse.json({ error: "Gagal menyimpan pesanan ke database" }, { status: 500 });
        }

        // 4. BUAT TRANSAKSI MIDTRANS
        let parameter = {
            "transaction_details": {
                "order_id": orderId,
                "gross_amount": hargaFinal 
            },
            "customer_details": {
                "first_name": nama,
                "phone": wa
            }
        };

        const transaction = await snap.createTransaction(parameter);
        return NextResponse.json({ token: transaction.token });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}