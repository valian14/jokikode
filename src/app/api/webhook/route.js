import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
    try {
        const body = await request.json();
        
        // 1. Ambil data penting dari webhook
        const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;
        const serverKey = process.env.MIDTRANS_SERVER_KEY;

        // 2. Rumus validasi Midtrans: SHA512(order_id + status_code + gross_amount + serverKey)
        const stringToHash = order_id + status_code + gross_amount + serverKey;
        const hash = crypto.createHash('sha512').update(stringToHash).digest('hex');

        // 3. Bandingkan hash kita dengan signature dari Midtrans (Sistem Keamanan)
        if (signature_key !== hash) {
            console.error(`⚠️ Peringatan: Signature Key tidak valid untuk order ${order_id}`);
            return NextResponse.json({ error: "Invalid Signature Key!" }, { status: 403 });
        }

        // 4. JIKA SIGNATURE VALID: Tentukan Status Pesanan
        let statusPesanan = 'PENDING';

        if (transaction_status === 'capture') {
            if (fraud_status === 'challenge') {
                statusPesanan = 'CHALLENGE';
            } else if (fraud_status === 'accept') {
                statusPesanan = 'LUNAS';
            }
        } else if (transaction_status === 'settlement') {
            statusPesanan = 'LUNAS';
        } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
            statusPesanan = 'GAGAL';
        } else if (transaction_status === 'pending') {
            statusPesanan = 'PENDING';
        }

        // 5. Update status di database Supabase
        if (order_id) {
            const { error } = await supabase
                .from('pesanan')
                .update({ status: statusPesanan })
                .eq('order_id', order_id);

            if (error) {
                console.error("❌ Gagal update status di Supabase:", error);
                return NextResponse.json({ error: "Gagal update database" }, { status: 500 });
            }
            
            console.log(`✅ Order ${order_id} berhasil diupdate menjadi ${statusPesanan}`);
        }

        return NextResponse.json({ message: "OK" });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
    }
}