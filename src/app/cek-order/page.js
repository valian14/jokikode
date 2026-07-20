'use client';
import { useState } from 'react';

export default function CekOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cariPesanan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasil(null);

    try {
      const res = await fetch(`/api/cek-order?id=${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setHasil(data);
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-black text-gray-900 mb-8 text-center">
          Cek Status Joki 🔍
        </h1>

        {/* Card Form */}
        <div className="bg-white border-4 border-gray-900 rounded-2xl p-6 shadow-[8px_8px_0_black] mb-8">
          <p className="font-bold text-gray-600 mb-4 text-center">Masukkan Order ID kamu di bawah ini:</p>

          <form onSubmit={cariPesanan}>
            <input 
              type="text" 
              placeholder="Contoh: JOKI-123456789" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required 
              className="w-full p-3 border-4 border-gray-900 rounded-xl bg-[#fdfbf7] font-bold uppercase focus:outline-none focus:ring-4 focus:ring-blue-100 mb-4"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-400 py-3 font-black text-xl border-4 border-gray-900 rounded-xl shadow-[4px_4px_0_black] hover:translate-y-1 hover:shadow-[2px_2px_0_black] active:translate-y-2 active:shadow-none transition-all disabled:opacity-70"
            >
              {loading ? 'Mencari...' : 'Cek Status'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-4 border-red-500 text-red-700 font-bold p-4 rounded-xl text-center shadow-[4px_4px_0_black]">
            {error}
          </div>
        )}

        {/* Success Result */}
        {hasil && (
          <div className="bg-green-50 border-4 border-gray-900 rounded-2xl p-6 shadow-[8px_8px_0_black] text-left">
            <h3 className="text-xl font-black text-gray-900 border-b-4 border-gray-900 pb-2 mb-4">Detail Pesanan:</h3>
            <div className="space-y-2 font-bold text-gray-800">
              <p>Order ID: <span className="font-black">{hasil.order_id}</span></p>
              <p>Nama: <span className="font-black">{hasil.nama_klien}</span></p>
              <p>Paket: <span className="font-black">{hasil.paket_id}</span></p>
              <p>
                Status: {' '}
                <span className={`px-3 py-1 rounded-full text-sm font-black border-2 border-gray-900 ${
                  hasil.status === 'SELESAI' || hasil.status === 'LUNAS' ? 'bg-green-300' : 
                  hasil.status === 'DIKERJAKAN' ? 'bg-blue-300' : 'bg-yellow-300'
                }`}>
                  {hasil.status}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}