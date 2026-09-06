import React, { useState, useEffect } from 'react';
import { CalendarDays, Check, Clock3, MapPin, MessageCircle, UserRound, X } from 'lucide-react';
import api from '../../api/axios';

export default function TransactionList({
    filteredBookings,
    totalBookings,
    filterTransactionStatus,
    setFilterTransactionStatus,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    filterRenterName,
    setFilterRenterName,
    setChatBooking,
    handleUpdateBookingStatus,
    updatingBookingId,
    currentUser,
}) {
    const [unreadMap, setUnreadMap] = useState({});

    // Fetch data unread count secara berkala (polling setiap 5 detik)
    useEffect(() => {
        const userId = currentUser?.id || localStorage.getItem('myfinz_demo_user_id');
        if (!userId) return;

        const fetchUnreadCounts = async () => {
            try {
                const response = await api.get(`/chat/unread/${userId}`);
                if (response.data?.success) {
                    setUnreadMap(response.data.data?.unreadPerBooking || {});
                }
            } catch (error) {
                console.error('Gagal mengambil unread chat count:', error);
            }
        };

        fetchUnreadCounts();
        const interval = setInterval(fetchUnreadCounts, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

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

    // Handler saat tombol Chat penyewa diklik
    const handleOpenChat = async (booking) => {
        const userId = currentUser?.id || localStorage.getItem('myfinz_demo_user_id');

        setChatBooking(booking);

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

    return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Transaksi masuk</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Menampilkan <span className="font-semibold text-blue-600">{filteredBookings.length}</span> dari {totalBookings} transaksi
                    </p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                    value={filterTransactionStatus}
                    onChange={(e) => setFilterTransactionStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Semua Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>

                <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />

                <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />

                <input
                    type="text"
                    value={filterRenterName}
                    onChange={(e) => setFilterRenterName(e.target.value)}
                    placeholder="Cari nama penyewa..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400"
                />
            </div>

            {filteredBookings.length > 0 ? (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => {
                        const unreadCount = unreadMap[booking.id] || 0;

                        return (
                            <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start border-b border-slate-100 pb-3">

                                    {/* GAMBAR FINS BERBENTUK PERSEGI (ASPECT-SQUARE) */}
                                    <div className="aspect-square w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-32">
                                        {booking.imageUrl ? (
                                            <img
                                                src={booking.imageUrl}
                                                alt={booking.title || 'Fins'}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                Tidak ada foto
                                            </div>
                                        )}
                                    </div>

                                    {/* DESKRIPSI UTAMA */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Permintaan sewa</p>
                                                <h3 className="mt-1 truncate text-base font-semibold text-slate-900">{booking.title || 'Listing'}</h3>
                                                <p className="mt-0.5 text-xs text-slate-500">ID {booking.id.slice(0, 8)}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-semibold text-blue-700">Rp {Number(booking.totalRentalPrice || 0).toLocaleString('id-ID')}</p>
                                                <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${booking.status === 'PENDING'
                                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                    : booking.status === 'CANCELLED'
                                                        ? 'border-red-200 bg-red-50 text-red-700'
                                                        : booking.status === 'COMPLETED'
                                                            ? 'border-slate-200 bg-slate-100 text-slate-600'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                    {booking.status === 'PENDING' ? <Clock3 className="h-3 w-3" /> : booking.status === 'CANCELLED' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
                                            <div className="flex items-start gap-1.5">
                                                <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                <p><span className="block text-[10px] text-slate-400">Penyewa</span><span className="font-medium">{booking.renterName || '-'}</span></p>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                <p>
                                                    <span className="block text-[10px] text-slate-400">Periode</span>
                                                    <span className="font-medium">{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                <p><span className="block text-[10px] text-slate-400">Lokasi</span><span className="font-medium">{booking.locationCity || '-'}</span></p>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                <p><span className="block text-[10px] text-slate-400">Kontak</span><span className="font-medium">{booking.renterPhone || '-'}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {booking.note && (
                                    <div className="mt-3 rounded-lg bg-blue-50/70 border border-blue-100 px-3 py-2 text-xs text-slate-700">
                                        <span className="font-medium text-blue-700">Catatan penyewa:</span> {booking.note}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <div className="relative flex-1">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenChat(booking)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Chat penyewa
                                        </button>

                                        {unreadCount > 0 && (
                                            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {booking.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateBookingStatus(booking.id, 'APPROVED')}
                                                disabled={updatingBookingId === booking.id}
                                                className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {updatingBookingId === booking.id ? 'Diproses...' : 'Setujui'}
                                            </button>
                                            <button
                                                onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                disabled={updatingBookingId === booking.id}
                                                className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                {updatingBookingId === booking.id ? 'Diproses...' : 'Tolak'}
                                            </button>
                                        </>
                                    )}

                                    {booking.status === 'APPROVED' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateBookingStatus(booking.id, 'ACTIVE')}
                                                disabled={updatingBookingId === booking.id}
                                                className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {updatingBookingId === booking.id ? 'Diproses...' : 'Confirm Diambil'}
                                            </button>
                                            <button
                                                onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                disabled={updatingBookingId === booking.id}
                                                className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                {updatingBookingId === booking.id ? 'Diproses...' : 'Batal'}
                                            </button>
                                        </>
                                    )}

                                    {booking.status === 'ACTIVE' && (
                                        <button
                                            onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                                            disabled={updatingBookingId === booking.id}
                                            className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {updatingBookingId === booking.id ? 'Diproses...' : 'Selesaikan'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-sm text-slate-600 py-4">
                    {totalBookings === 0
                        ? 'Belum ada transaksi masuk. Listing yang aktif akan muncul di sini.'
                        : 'Tidak ada transaksi yang sesuai filter.'}
                </div>
            )}
        </section>
    );
}