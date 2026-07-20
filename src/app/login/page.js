"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg('❌ Email atau password salah!');
            setLoading(false);
        } else {
            // Jika berhasil, arahkan ke halaman admin
            router.push('/admin');
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border-4 border-gray-900 rounded-2xl p-8 shadow-[8px_8px_0_black]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Login Admin 🕵️‍♂️</h1>
                    <p className="text-gray-600 font-bold">Masuk untuk melihat pesanan joki.</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-100 border-4 border-red-500 text-red-700 font-bold p-3 rounded-xl mb-6 text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block font-black text-gray-900 mb-2">Email</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border-4 border-gray-900 rounded-xl bg-[#fdfbf7] focus:outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                            placeholder="admin@jokikode.com"
                        />
                    </div>

                    <div>
                        <label className="block font-black text-gray-900 mb-2">Password</label>
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border-4 border-gray-900 rounded-xl bg-[#fdfbf7] focus:outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-400 py-4 mt-4 font-black text-xl text-gray-900 border-4 border-gray-900 shadow-[6px_6px_0_black] hover:translate-y-1 hover:shadow-[3px_3px_0_black] active:translate-y-2 active:shadow-none transition-all rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Masuk...' : 'Gas Masuk! 🚀'}
                    </button>
                </form>
            </div>
        </div>
    );
}