import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory rate limiter
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

const KATALOG_PAKET = {
    'hemat': 100000,
    'standar': 350000,
    'sultan': 600000
};

let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY
});

// Inisialisasi Supabase Backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Gunakan service_role key untuk backend
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // CEK RATE LIMIT
    if (isRateLimited(ip)) {
        return NextResponse.json({ error: "Terlalu banyak permintaan. Tunggu 1 menit ya!" }, { status: 429 });
    }

    try {
        const { orderId, paketId, kodePromo, nama, wa } = await request.json();

        // 1. VALIDASI PAKET
        const hargaAsli = KATALOG_PAKET[paketId];
        if (!hargaAsli) {
            return NextResponse.json({ error: "Paket tidak ditemukan atau dimanipulasi!" }, { status: 400 });
        }

        // 2. HITUNG ULANG HARGA MENGGUNAKAN PROMO DARI SUPABASE
        let hargaFinal = hargaAsli;
        if (kodePromo) {
            const { data: promoData, error: promoError } = await supabase
                .from('promo')
                .select('*')
                .eq('kode', kodePromo.toUpperCase())
                .single();

            // Jika promo ada di database dan statusnya aktif, terapkan diskon
            if (promoData && promoData.is_active) {
                const diskonPersen = promoData.diskon / 100;
                hargaFinal = hargaAsli - (hargaAsli * diskonPersen);
            }
        }

        // 3. SIMPAN KE DATABASE SUPABASE 
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