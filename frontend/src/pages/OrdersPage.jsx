import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../api/axios';

export default function OrdersPage({ currentUser, onBackToMarketplace, setChatBooking }) {
    const [myBookings, setMyBookings] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const [cancelingId, setCancelingId] = useState(null);
    const [confirmCancelId, setConfirmCancelId] = useState(null); // State untuk Custom Modal Confirm

    useEffect(() => {
        if (currentUser) {
            fetchMyBookings();
            fetchUnreadCounts();

            const interval = setInterval(fetchUnreadCounts, 5000);
            return () => clearInterval(interval);
        } else {
            setMyBookings([]);
            setUnreadMap({});
        }
    }, [currentUser]);

    const fetchMyBookings = async () => {
        const renterId = currentUser?.id || localStorage.getItem('myfinz_demo_user_id');
        if (!renterId) {
            setMyBookings([]);
            return;
        }

        try {
            const response = await api.get(`/bookings/user/${renterId}`);
            if (response.data?.success) {
                setMyBookings(response.data.data || []);
            }
        } catch (error) {
            console.error('Gagal mengambil data booking user:', error);
            setMyBookings([]);
        }
    };

    const fetchUnreadCounts = async () => {
        const userId = currentUser?.id || localStorage.getItem('myfinz_demo_user_id');
        if (!userId) return;

        try {
            const response = await api.get(`/chat/unread/${userId}`);
            if (response.data?.success) {
                setUnreadMap(response.data.data?.unreadPerBooking || {});
            }
        } catch (error) {
            console.error('Gagal mengambil unread chat count:', error);
        }
    };

    const handleOpenChat = async (booking) => {
        const userId = currentUser?.id || localStorage.getItem('myfinz_demo_user_id');

        setChatBooking({
            ...booking,
            ownerName: booking.ownerName || 'Pemilik',
            renterName: currentUser?.fullName || 'Anda',
        });

        if (userId && booking?.id) {
            try {
                const response = await api.patch(`/chat/booking/${booking.id}/read`, { userId });

                if (response.data?.success) {
                    setUnreadMap((prevMap) => ({
                        ...prevMap,
                        [booking.id]: 0,
                    }));
                }
            } catch (error) {
                console.error('Gagal menandai pesan telah dibaca:', error);
            }
        }
    };

    const executeCancelBooking = async () => {
        if (!confirmCancelId) return;

        const bookingId = confirmCancelId;
        setCancelingId(bookingId);
        setConfirmCancelId(null);

        try {
            const response = await api.patch(`/bookings/${bookingId}/status`, {
                status: 'CANCELLED',
            });

            if (response.data?.success) {
                fetchMyBookings();
            }
        } catch (error) {
            console.error('Gagal membatalkan pesanan:', error);
            alert(error?.response?.data?.message || 'Gagal membatalkan penyewaan.');
        } finally {
            setCancelingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">My bookings</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pesanan Saya</h1>
                    <p className="mt-2 text-sm text-slate-500">Pantau jadwal, biaya, dan komunikasi untuk setiap penyewaanmu.</p>
                </div>
                <button
                    onClick={onBackToMarketplace}
                    className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                    Kembali ke katalog
                </button>
            </div>

            {!currentUser ? (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-slate-700">
                    Silakan masuk untuk melihat pesanan dan mengajukan penyewaan.
                </div>
            ) : myBookings.length > 0 ? (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs text-blue-700">Total pesanan</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{myBookings.length}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="text-xs text-amber-700">Menunggu konfirmasi</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                {myBookings.filter((booking) => booking.status === 'PENDING' || booking.status === 'WAITING_LIST').length}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs text-slate-500">Total nilai sewa</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                Rp {myBookings.reduce((sum, booking) => sum + Number(booking.totalRentalPrice || 0), 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {myBookings.map((booking) => {
                        const unreadCount = unreadMap[booking.id] || 0;
                        const canCancel = booking.status === 'PENDING' || booking.status === 'WAITING_LIST';

                        return (
                            <article key={booking.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
                                <div className="flex flex-col gap-5 p-5 sm:flex-row">
                                    <div className="aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-40">
                                        {booking.imageUrl ? (
                                            <img src={booking.imageUrl} alt={booking.title || 'Fins'} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-slate-500">Tidak ada foto</div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">Item yang dibooking</p>
                                                <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">{booking.title || 'Fins rental'}</h2>
                                            </div>
                                            <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${booking.status === 'PENDING' || booking.status === 'WAITING_LIST'
                                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                : booking.status === 'CANCELLED'
                                                    ? 'border-red-200 bg-red-50 text-red-700'
                                                    : booking.status === 'COMPLETED'
                                                        ? 'border-slate-200 bg-slate-100 text-slate-600'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                                            <p><span className="mb-0.5 block text-slate-400">Kategori</span>{booking.category || '-'}</p>
                                            <p><span className="mb-0.5 block text-slate-400">Ukuran</span>{booking.size || '-'}</p>
                                            <p><span className="mb-0.5 block text-slate-400">Foot pocket</span>{booking.footPocketType || '-'}</p>
                                            <p><span className="mb-0.5 block text-slate-400">Lokasi ambil</span>{booking.locationCity || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                        <div>
                                            <p className="text-xs text-slate-400">Periode sewa</p>
                                            <p className="mt-1 font-medium text-slate-700">{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Total sewa</p>
                                            <p className="mt-1 font-medium text-slate-700">Rp {Number(booking.totalRentalPrice || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Deposit</p>
                                            <p className="mt-1 font-medium text-slate-700">Rp {Number(booking.depositAmount || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Booking ID</p>
                                            <p className="mt-1 font-mono font-medium text-slate-700">{booking.id.slice(0, 8)}</p>
                                        </div>
                                    </div>

                                    {booking.note && (
                                        <div className="mt-4 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700">
                                            <span className="font-medium text-blue-700">Catatan:</span> {booking.note}
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <div className="relative flex-1">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenChat(booking)}
                                                className="w-full rounded-xl border border-blue-200 bg-white py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                                            >
                                                Buka chat dengan pemilik
                                            </button>

                                            {unreadCount > 0 && (
                                                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        {canCancel && (
                                            <button
                                                type="button"
                                                disabled={cancelingId === booking.id}
                                                onClick={() => setConfirmCancelId(booking.id)}
                                                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                {cancelingId === booking.id ? 'Memproses...' : 'Batal Sewa'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-600 shadow-sm">
                    Belum ada pesanan. Ajak penyewaan fin baru dari katalog.
                </div>
            )}

            {/* CUSTOM CONFIRMATION MODAL */}
            {confirmCancelId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setConfirmCancelId(null)}
                >
                    <div
                        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setConfirmCancelId(null)}
                            className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-900">Batalkan Penyewaan?</h3>
                            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                Permintaan sewa fins ini akan dibatalkan. Tindakan ini tidak dapat dibatalkan kembali.
                            </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmCancelId(null)}
                                className="w-1/2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={executeCancelBooking}
                                className="w-1/2 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
                            >
                                Ya, Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}