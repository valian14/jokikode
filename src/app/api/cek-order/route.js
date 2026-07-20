import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Menggunakan SERVICE KEY (Kunci Admin) agar bisa menembus RLS dari belakang layar
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Order ID wajib diisi!' }, { status: 400 });
  }

  // Cari pesanan berdasarkan Order ID
  const { data, error } = await supabase
    .from('pesanan')
    .select('order_id, nama_klien, paket_id, status')
    .eq('order_id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan. Coba cek lagi Order ID kamu.' }, { status: 404 });
  }

  return NextResponse.json(data);
}