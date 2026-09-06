import React, { useEffect, useMemo, useState } from 'react';
import { X, Send, ImagePlus } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';

export default function BookingChatModal({ booking, currentUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const otherUserName = useMemo(() => {
        if (!booking) return 'Pemilik';
        if (currentUser?.id === booking.renterId) return booking.ownerName || 'Pemilik';
        return booking.renterName || 'Penyewa';
    }, [booking, currentUser]);

    const loadMessages = async (showLoading = false) => {
        if (!booking?.id) return;

        try {
            if (showLoading) setLoading(true);
            const response = await api.get(`/chat/booking/${booking.id}`);
            if (response.data?.success) {
                setMessages(response.data.data || []);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Tidak bisa memuat chat.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages(true);

        const socket = io();
        socket.emit('join-booking', booking?.id);
        socket.on('booking:message', (message) => {
            setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
        });

        return () => {
            socket.emit('leave-booking', booking?.id);
            socket.disconnect();
        };
    }, [booking?.id]);

    const handleSend = async () => {
        if (!currentUser || !booking?.id || (!draft.trim() && !selectedImage)) return;

        try {
            setSending(true);
            setError('');

            let imageUrl = null;
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);
                const uploadResponse = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (!uploadResponse.data?.success || !uploadResponse.data?.imageUrl) {
                    throw new Error(uploadResponse.data?.message || 'Upload gambar gagal.');
                }
                imageUrl = uploadResponse.data.imageUrl;
            }

            const response = await api.post(`/chat/booking/${booking.id}/message`, {
                senderId: currentUser.id,
                content: draft.trim() || 'Gambar pembayaran',
                imageUrl,
            });

            if (response.data?.success) {
                setMessages((prev) => prev.some((item) => item.id === response.data.data.id)
                    ? prev
                    : [...prev, response.data.data]);
                setDraft('');
                setSelectedImage(null);
                setImagePreview('');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Pesan gagal dikirim.');
        } finally {
            setSending(false);
        }
    };

    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-70 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-blue-600">Chat transaksi</p>
                        <h3 className="text-lg font-semibold text-slate-900">{otherUserName}</h3>
                    </div>
                    <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="h-90 overflow-y-auto p-4 bg-slate-50">
                    {loading ? (
                        <div className="text-xs text-slate-500">Memuat chat...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-xs text-slate-500">Belum ada pesan. Mulai percakapan untuk mengonfirmasi detail sewa.</div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isMine = message.senderId === currentUser?.id;

                                return (
                                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                                                }`}
                                        >
                                            <div className="font-medium mb-1 opacity-80">{isMine ? 'Anda' : message.senderName || 'User'}</div>
                                            {message.imageUrl && (
                                                <a href={message.imageUrl} target="_blank" rel="noreferrer" className="block mb-2">
                                                    <img src={message.imageUrl} alt="Lampiran chat" className="max-h-48 max-w-full rounded-lg object-contain" />
                                                </a>
                                            )}
                                            {message.content && <div>{message.content}</div>}
                                            <div className={`mt-1 text-[10px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {new Date(message.createdAt).toLocaleString('id-ID', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</div>
                )}

                <Separator />
                <div className="space-y-2 p-4">
                    {imagePreview && (
                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-2 py-1.5 text-xs text-blue-700">
                            <img src={imagePreview} alt="Preview lampiran" className="h-12 w-12 rounded object-cover" />
                            <span className="flex-1 truncate">Gambar siap dikirim</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedImage(null); setImagePreview(''); }} className="text-blue-700 hover:text-blue-900">Hapus</Button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <label className="self-end cursor-pointer rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" title="Kirim QRIS atau bukti pembayaran">
                            <ImagePlus className="h-5 w-5" />
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                        setSelectedImage(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </label>
                        <Textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={2}
                            placeholder="Tulis pesan untuk pemilik/penyewa..."
                            className="min-h-0 flex-1 resize-none bg-slate-50 text-xs"
                        />
                        <Button
                            type="button"
                            size="icon"
                            disabled={sending || (!draft.trim() && !selectedImage)}
                            onClick={handleSend}
                            className="self-end"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
