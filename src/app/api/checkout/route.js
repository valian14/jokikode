import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // 1. Tangkap data dari frontend
    const body = await request.json();
    
    // 🔥 method udah gak perlu ditangkep lagi
    const { amount, orderId, nama, paketNama } = body; 
    
    const finalAmount = Number(amount);

    if (!finalAmount || finalAmount <= 0) {
       throw new Error("Waduh ngab, harganya 0 atau gak kebaca nih!");
    }

    // Ambil waktu saat ini dalam format Unix (detik) untuk Timestamp Header
    const waktuSekarang = Math.floor(Date.now() / 1000); 

    // 🔥 SIAPIN LINK WHATSAPP BUAT REDIRECT
    // (Nomornya udah gue sesuaikan sama yang ada di profile lu tadi)
    const nomorWA = "6287865927598"; 
    const pesan = `Halo Admin JokiKode, pesanan saya sudah dibayar ya!%0A%0AOrder ID: ${orderId}%0AMohon segera diproses.`;
    const linkWA = `https://wa.me/${nomorWA}?text=${pesan}`;

    // 2. Siapkan Body JSON (Mode Checkout / Bebas Milih Bank)
    const payload = {
      amount: finalAmount, 
      currency: "IDR",
      reference: orderId,
      redirectUrl: linkWA, // 🔥 Pelanggan dilempar ke WA abis lunas
      metadata: { // 🔥 TAMBAHIN BLOK METADATA INI BIAR POPUP HILANG
        order_name: `Paket Joki: ${paketNama || 'Custom'}`,
        customer_name: nama || 'Klien JokiKode'
      }
    };

    const jsonString = JSON.stringify(payload);

    // 3. Bikin Timestamp (Unix) untuk Header Signature
    const timestamp = waktuSekarang.toString();

    // 4. Bikin Signature Input persis kayak di dokumentasi
    const signatureInput = `${timestamp}.${jsonString}`;

    // 5. Enkripsi pakai HMAC-SHA256 (Pake API Key dari .env)
    const apiKey = process.env.DOMPETX_API_KEY; 
    const signature = crypto
      .createHmac('sha256', apiKey)
      .update(signatureInput)
      .digest('hex');

    // 6. Tembak API-nya DompetX (🔥 ENDPOINT UDAH DIGANTI KE CHECKOUT)
    const dompetxUrl = 'https://api.dompetx.com/v1/payments/checkout'; 

    const response = await fetch(dompetxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DOMPAY-API-Key': apiKey,
        'X-DOMPAY-Signature': signature,
        'X-DOMPAY-Timestamp': timestamp,
        'Idempotency-Key': orderId // Pake order ID biar ga dobel bayar
      },
      body: jsonString
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Gagal bikin transaksi di DompetX');
    }

    // 7. Balikin datanya ke Frontend
    return NextResponse.json({ 
      success: true, 
      paymentData: responseData 
    });

  } catch (error) {
    console.error("Error Payment DompetX:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}