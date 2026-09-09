import React, { useState } from 'react';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function ResetPasswordPage({ onBackToHome }) {
    // Membaca token dari query URL (contoh: ?token=xxx)
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/users/reset-password', {
                token,
                newPassword,
            });

            if (response.data?.success) {
                setMessage('Password berhasil diperbarui! Mengalihkan ke halaman utama...');
                setTimeout(() => {
                    onBackToHome?.();
                }, 2500);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Gagal mereset password.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm border border-slate-200">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 mb-4">
                        Token reset password tidak ditemukan atau tautan tidak valid.
                    </div>
                    <Button onClick={onBackToHome} variant="outline" className="w-full">
                        Kembali ke Halaman Utama
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="mb-1 text-xl font-bold text-slate-900">Buat Password Baru</h2>
                <p className="mb-6 text-xs text-slate-500">Masukkan password baru untuk akun MyFinz kamu.</p>

                {message && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label className="mb-1 block text-xs">Password Baru</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-11">
                        {loading ? 'Memproses...' : 'Simpan Password Baru'}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={onBackToHome}
                        className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                        Batal dan Kembali
                    </button>
                </div>
            </div>
        </div>
    );
}