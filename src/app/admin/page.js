"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
    const router = useRouter();
    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState('pesanan');

    const [promoList, setPromoList] = useState([]);
    const [newPromo, setNewPromo] = useState({ kode: '', diskon: 0 });
    const [editingKode, setEditingKode] = useState(null); 

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { 
            router.push('/login'); 
            return; 
        }

        const { data: dataPesanan } = await supabase.from('pesanan').select('*').order('created_at', { ascending: false });
        const { data: dataPromo } = await supabase.from('promo').select('*');

        if (dataPesanan) setPesanan(dataPesanan);
        if (dataPromo) setPromoList(dataPromo);
        setLoading(false);
    };

    const submitPromo = async () => {
        if (!newPromo.kode || newPromo.diskon <= 0) return alert("Isi kode dan diskon!");
        
        const kodeUpper = newPromo.kode.toUpperCase();

        if (editingKode) {
            // PROSES UPDATE
            const { error } = await supabase
                .from('promo')
                .update({ diskon: newPromo.diskon })
                .eq('kode', editingKode); 

            if (error) {
                alert("Gagal update promo: " + error.message);
            } else {
                alert("Promo berhasil diupdate!");
            }
        } else {
            // Cek duplikasi kode promo
            const isExist = promoList.find(p => p.kode === kodeUpper);
            if (isExist) {
                return alert(`Promo dengan kode ${kodeUpper} sudah ada! Gunakan kode lain.`);
            }

            // PROSES INSERT
            const { error } = await supabase.from('promo').insert([
                { kode: kodeUpper, diskon: newPromo.diskon, is_active: true }
            ]);

            if (error) {
                alert("Gagal menambah promo: " + error.message);
            } else {
                alert("Promo berhasil dibuat!");
            }
        }
        
        setNewPromo({ kode: '', diskon: 0 });
        setEditingKode(null); 
        fetchData(); 
    };

    const hapusPromo = async (kode) => {
        if (!confirm(`Yakin ingin menghapus promo ${kode}?`)) return;
        
        const { error } = await supabase.from('promo').delete().eq('kode', kode);
        
        if (error) {
            alert("Gagal menghapus promo: " + error.message);
        } else {
            fetchData();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const updateStatus = async (id, newStatus) => {
        const { error } = await supabase.from('pesanan').update({ status: newStatus }).eq('id', id);
        if (error) alert("Gagal update status!");
        else fetchData();
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = pesanan.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(pesanan.length / itemsPerPage);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex justify-center items-center">
                <div className="bg-yellow-300 border-4 border-gray-900 p-6 rounded-xl shadow-[8px_8px_0_black] font-black text-2xl">
                    Loading Bosku... ⏳
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7] font-sans pb-12">
            <nav className="bg-yellow-300 border-b-4 border-gray-900 p-4 md:px-8 flex justify-between items-center shadow-sm">
                <h1 className="text-2xl font-black text-gray-900">Admin JokiKode 💻</h1>
                <button onClick={handleLogout} className="bg-red-400 text-gray-900 px-6 py-2 rounded-xl font-bold border-4 border-gray-900 shadow-[4px_4px_0_black] hover:translate-y-1 hover:shadow-[2px_2px_0_black] active:translate-y-2 active:shadow-none transition-all">
                    Logout
                </button>
            </nav>

            <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => setActiveTab('pesanan')} 
                        className={`px-6 py-3 border-4 border-gray-900 rounded-xl font-black shadow-[4px_4px_0_black] transition-colors ${activeTab === 'pesanan' ? 'bg-blue-300' : 'bg-white hover:bg-gray-100'}`}
                    >
                        📦 Daftar Pesanan
                    </button>
                    <button 
                        onClick={() => setActiveTab('promo')} 
                        className={`px-6 py-3 border-4 border-gray-900 rounded-xl font-black shadow-[4px_4px_0_black] transition-colors ${activeTab === 'promo' ? 'bg-green-300' : 'bg-white hover:bg-gray-100'}`}
                    >
                         Kelola Promo
                    </button>
                </div>

                {activeTab === 'pesanan' && (
                    <div>
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 mb-2">Daftar Pesanan Masuk 📦</h2>
                                <p className="font-bold text-gray-600 bg-blue-100 border-2 border-gray-900 px-3 py-1 rounded-lg inline-block shadow-[2px_2px_0_black]">
                                    Total: {pesanan.length} pesanan
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border-4 border-gray-900 rounded-2xl overflow-hidden shadow-[8px_8px_0_black]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="bg-blue-300 border-b-4 border-gray-900 text-lg">
                                            <th className="p-4 font-black text-gray-900 border-r-4 border-gray-900">ID Pesanan</th>
                                            <th className="p-4 font-black text-gray-900 border-r-4 border-gray-900">Data Klien</th>
                                            <th className="p-4 font-black text-gray-900 border-r-4 border-gray-900">Paket & Promo</th>
                                            <th className="p-4 font-black text-gray-900 border-r-4 border-gray-900">Total Harga</th>
                                            <th className="p-4 font-black text-gray-900">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((item) => (
                                            <tr key={item.id} className="border-b-4 border-gray-900 last:border-b-0 hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-bold border-r-4 border-gray-900">{item.order_id || '-'}</td>
                                                <td className="p-4 border-r-4 border-gray-900">
                                                    <div className="font-black text-lg text-gray-900">{item.nama_klien || '-'}</div>
                                                    <a href={`https://wa.me/${item.wa_klien}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-bold underline decoration-2">{item.wa_klien || '-'}</a>
                                                </td>
                                                <td className="p-4 border-r-4 border-gray-900">
                                                    <span className="bg-gray-200 border-2 border-gray-900 px-2 py-1 rounded text-sm font-black uppercase shadow-[2px_2px_0_black]">{item.paket_id || '-'}</span>
                                                    {item.kode_promo && <div className="mt-2 text-sm font-bold text-green-600">🎟️ {item.kode_promo}</div>}
                                                </td>
                                                <td className="p-4 font-black text-green-600 text-xl border-r-4 border-gray-900">Rp {item.total_harga?.toLocaleString('id-ID')}</td>
                                                <td className="p-4">
                                                    <select 
                                                        className={`border-4 border-gray-900 p-2 rounded-xl font-black text-sm shadow-[4px_4px_0_black] cursor-pointer outline-none transition-all ${
                                                            item.status === 'LUNAS' ? 'bg-green-300' : item.status === 'GAGAL' ? 'bg-red-300' : item.status === 'DIKERJAKAN' ? 'bg-blue-300' : 'bg-yellow-300'
                                                        }`}
                                                        value={item.status || 'PENDING'}
                                                        onChange={(e) => updateStatus(item.id, e.target.value)}
                                                    >
                                                        <option value="PENDING">⏳ PENDING</option>
                                                        <option value="DIKERJAKAN">👨‍💻 DIKERJAKAN</option>
                                                        <option value="LUNAS">✅ LUNAS</option>
                                                        <option value="GAGAL">❌ GAGAL</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 mt-8">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-white border-4 border-gray-900 px-6 py-2 rounded-xl font-black shadow-[4px_4px_0_black] disabled:opacity-50">« Prev</button>
                                <span className="font-black text-xl text-gray-900 bg-yellow-300 px-4 py-2 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0_black]">{currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="bg-white border-4 border-gray-900 px-6 py-2 rounded-xl font-black shadow-[4px_4px_0_black] disabled:opacity-50">Next »</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'promo' && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-black text-gray-900 mb-6">
                            🎟️ {editingKode ? 'Edit Kode Promo' : 'Tambah Kode Promo'}
                        </h2>
                        
                        <div className="bg-white border-4 border-gray-900 rounded-2xl p-6 shadow-[8px_8px_0_black] mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input 
                                    type="text" placeholder="Kode Promo (e.g. DISKON10)"
                                    value={newPromo.kode}
                                    className="p-3 border-4 border-gray-900 rounded-xl font-bold uppercase disabled:bg-gray-200 disabled:cursor-not-allowed"
                                    onChange={(e) => setNewPromo({...newPromo, kode: e.target.value})}
                                    disabled={editingKode !== null} 
                                />
                                <input 
                                    type="number" placeholder="Diskon (%)"
                                    value={newPromo.diskon}
                                    className="p-3 border-4 border-gray-900 rounded-xl font-bold"
                                    onChange={(e) => setNewPromo({...newPromo, diskon: e.target.value})}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={submitPromo}
                                        className="w-full bg-green-400 border-4 border-gray-900 rounded-xl font-black hover:bg-green-500 transition-all active:translate-y-1"
                                    >
                                        {editingKode ? 'Update Promo' : 'Tambah Promo'}
                                    </button>
                                    {editingKode && (
                                        <button 
                                            onClick={() => {setEditingKode(null); setNewPromo({kode: '', diskon: 0})}}
                                            className="bg-gray-300 border-4 border-gray-900 rounded-xl font-black px-4 hover:bg-gray-400 transition-all active:translate-y-1"
                                        >
                                            Batal
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-4 border-gray-900 rounded-2xl overflow-hidden shadow-[8px_8px_0_black]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-green-300 border-b-4 border-gray-900 text-lg">
                                            <th className="p-4 font-black text-gray-900 border-r-4 border-gray-900">Kode Promo</th>
                                            <th className="p-4 font-black text-gray-900 border-r-4 border-gray-900">Diskon (%)</th>
                                            <th className="p-4 font-black text-gray-900">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promoList.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-10 text-center font-bold text-gray-500">Belum ada promo yang dibuat.</td>
                                            </tr>
                                        ) : (
                                            promoList.map((p) => (
                                                <tr key={p.kode} className="border-b-4 border-gray-900 last:border-b-0 hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 font-bold border-r-4 border-gray-900 uppercase">{p.kode}</td>
                                                    <td className="p-4 font-black border-r-4 border-gray-900">{p.diskon}%</td>
                                                    <td className="p-4 flex gap-2">
                                                        <button 
                                                            onClick={() => { setEditingKode(p.kode); setNewPromo({ kode: p.kode, diskon: p.diskon }); }}
                                                            className="bg-blue-300 px-4 py-1 border-2 border-gray-900 font-bold rounded-lg shadow-[2px_2px_0_black] hover:translate-y-[2px] hover:shadow-none transition-all"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => hapusPromo(p.kode)}
                                                            className="bg-red-400 px-4 py-1 border-2 border-gray-900 font-bold rounded-lg shadow-[2px_2px_0_black] hover:translate-y-[2px] hover:shadow-none transition-all"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}