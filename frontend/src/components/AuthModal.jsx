import React, { useState } from 'react';
import api from '../api/axios';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function AuthModal({ onClose, onSuccess }) {
    const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'USER',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSwitchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccessMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (mode === 'forgot') {
                const response = await api.post('/users/forgot-password', { email: form.email });
                setSuccessMsg(response.data?.message || 'Instruksi reset password telah dikirim ke email kamu.');
                return;
            }

            const endpoint = mode === 'signin' ? '/users/signin' : '/users/signup';
            const payload = mode === 'signin'
                ? { email: form.email, password: form.password }
                : form;

            const response = await api.post(endpoint, payload);

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Autentikasi gagal');
            }

            // Jika Signup berhasil (menunggu verifikasi email)
            if (mode === 'signup') {
                setSuccessMsg(response.data?.message || 'Registrasi berhasil. Silakan cek email kamu untuk verifikasi akun.');
                return;
            }

            // Jika Signin berhasil
            const responseData = response.data.data || response.data;
            const token = responseData.token || responseData.accessToken;
            const user = responseData.user || (responseData.id ? responseData : null);

            if (token) {
                localStorage.setItem('token', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            if (user) {
                localStorage.setItem('myfinz_user', JSON.stringify(user));
            }

            onSuccess?.(user);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Terjadi kesalahan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="border-b border-slate-200 px-5 py-4">
                    <DialogTitle className="text-xl">
                        {mode === 'signin' && 'Masuk'}
                        {mode === 'signup' && 'Daftar'}
                        {mode === 'forgot' && 'Lupa Password'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
                    {successMsg ? (
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
                            <p className="font-semibold mb-1">Berhasil!</p>
                            <p>{successMsg}</p>
                        </div>
                    ) : (
                        <>
                            {mode === 'signup' && (
                                <div>
                                    <Label className="mb-1 block text-xs">Nama Lengkap</Label>
                                    <input
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="Nama lengkap"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <Label className="mb-1 block text-xs">Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="bg-slate-50"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            {mode === 'signup' && (
                                <div>
                                    <Label className="mb-1 block text-xs">Nomor Telepon</Label>
                                    <Input
                                        name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        className="bg-slate-50"
                                        placeholder="0812..."
                                    />
                                </div>
                            )}

                            {mode !== 'forgot' && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs">Password</Label>
                                        {mode === 'signin' && (
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchMode('forgot')}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Lupa password?
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="bg-slate-50"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-11 w-full"
                            >
                                {loading
                                    ? 'Memproses...'
                                    : mode === 'signin'
                                        ? 'Masuk'
                                        : mode === 'signup'
                                            ? 'Daftar'
                                            : 'Kirim Link Reset'}
                            </Button>
                        </>
                    )}
                </form>

                <div className="px-5 pb-5 text-center text-sm text-slate-500">
                    {mode === 'signin' && (
                        <>
                            Belum punya akun?{' '}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSwitchMode('signup')}
                                className="px-1 text-blue-600 hover:text-blue-700"
                            >
                                Daftar di sini
                            </Button>
                        </>
                    )}
                    {mode === 'signup' && (
                        <>
                            Sudah punya akun?{' '}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSwitchMode('signin')}
                                className="px-1 text-blue-600 hover:text-blue-700"
                            >
                                Masuk di sini
                            </Button>
                        </>
                    )}
                    {mode === 'forgot' && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSwitchMode('signin')}
                            className="px-1 text-blue-600 hover:text-blue-700"
                        >
                            Kembali ke halaman Masuk
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}