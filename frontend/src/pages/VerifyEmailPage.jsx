import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Button } from '../components/ui/button';

export default function VerifyEmailPage({ onBackToHome }) {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('Memverifikasi email kamu...');

    // Mencegah request dipanggil 2x oleh React StrictMode
    const hasRequested = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token verifikasi tidak ditemukan.');
            return;
        }

        if (hasRequested.current) return;
        hasRequested.current = true;

        api.get(`/users/verify-email?token=${token}`)
            .then((res) => {
                if (res.data?.success) {
                    setStatus('success');
                    setMessage('Email kamu berhasil diverifikasi! Mengalihkan ke halaman utama...');
                    setTimeout(() => {
                        onBackToHome?.();
                    }, 2500);
                }
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err?.response?.data?.message || 'Verifikasi email gagal atau token kadaluwarsa.');
            });
    }, [token, onBackToHome]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm border border-slate-200">
                <h2 className="mb-1 text-xl font-bold text-slate-900">Verifikasi Email</h2>
                <p className="mb-4 text-xs text-slate-500">Proses konfirmasi akun MyFinz</p>

                <div className={`my-4 rounded-xl p-4 text-xs ${status === 'loading' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                        status === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                            'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                    {message}
                </div>

                {status !== 'loading' && (
                    <Button onClick={onBackToHome} variant="outline" className="w-full mt-2">
                        Ke Halaman Utama
                    </Button>
                )}
            </div>
        </div>
    );
}