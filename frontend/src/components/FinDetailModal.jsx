import React, { useEffect, useState } from 'react';
import {
    X, ShieldCheck, MapPin, CheckCircle2,
    Truck, Award, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../api/axios';

export default function FinDetailModal({ item, onClose, onBooked, currentUser }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [bookingNote, setBookingNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [unavailableDates, setUnavailableDates] = useState([]);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        if (!item?.id) return;
        api.get(`/listings/${item.id}/unavailable-dates`)
            .then((response) => setUnavailableDates(response.data?.data?.unavailableDates || []))
            .catch(() => setUnavailableDates([]));
    }, [item?.id]);

    const handleStartDateChange = (value) => {
        setStartDate(value);
        if (endDate && value > endDate) {
            setEndDate('');
        }
        setBookingError('');
    };

    const handleEndDateChange = (value) => {
        if (startDate && value < startDate) {
            setEndDate(startDate);
            setBookingError('Tanggal selesai harus lebih lama dari tanggal mulai.');
            return;
        }

        setEndDate(value);
        setBookingError('');
    };

    if (!item) return null;

    const handleBookingSubmit = async () => {
        if (!currentUser) {
            setBookingError('Silakan login terlebih dahulu untuk mengajukan sewa.');
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-auth-modal'));
            }
            return;
        }

        if (!startDate || !endDate) {
            setBookingError('Pilih tanggal mulai dan tanggal selesai sewa.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            setBookingError('Tanggal sewa tidak valid.');
            return;
        }

        if (end <= start) {
            setBookingError('Tanggal selesai harus lebih lama dari tanggal mulai.');
            return;
        }

        if (!item?.id) {
            setBookingError('Data fins tidak tersedia untuk diajukan sewa.');
            return;
        }

        setSubmitting(true);
        setBookingError('');

        try {
            const response = await api.post('/bookings', {
                renterId: currentUser.id,
                listingId: item.id,
                startDate,
                endDate,
                note: bookingNote.trim(),
            });

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Permintaan sewa gagal diproses.');
            }

            setBookingSuccess(response.data.data);
            setBookingNote('');
            if (typeof onBooked === 'function') {
                onBooked();
            }
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Gagal mengajukan penyewaan.';
            setBookingError(message);
        }
        finally {
            setSubmitting(false);
        }
    };

    const calculateDays = () => {
        if (!startDate || !endDate) return 1;
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 0 ? diffDays : 1;
        } catch (e) {
            return 1;
        }
    };

    const days = calculateDays();
    const calendarYear = calendarDate.getFullYear();
    const calendarMonth = calendarDate.getMonth();
    const calendarDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const calendarStartDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const calendarDateValue = (day) => `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isUnavailable = (value) => unavailableDates.includes(value);
    const handleCalendarDateClick = (value) => {
        if (isUnavailable(value)) return;
        if (!startDate || endDate) {
            setStartDate(value);
            setEndDate('');
        } else if (value > startDate) {
            setEndDate(value);
        } else {
            setStartDate(value);
        }
        setBookingError('');
    };
    const pricePerDay = Number(item.pricePerDay || 0);
    const depositAmount = Number(item.depositAmount || 0);
    const totalPrice = pricePerDay * days;
    const availableStock = Number(item.availableStock || 0);
    const totalStock = Number(item.totalStock || 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {item.category || 'Fins'}
                        </span>
                        <span className="text-xs text-slate-500">Size {item.size || '-'}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{item.title || 'Fins Rental'}</h2>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span>{item.locationCity || 'Indonesia'}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Status: {item.status || 'AVAILABLE'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="relative aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title || 'Fins'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                                        Tidak Ada Foto
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-200 text-xs text-emerald-700 flex items-center gap-1.5">
                                    <Award className="w-4 h-4" /> Peralatan Terverifikasi
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-semibold text-slate-900 mb-3">Spesifikasi Peralatan</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold">Footpocket</span>
                                        <span className="text-xs font-medium text-slate-900">{item.footPocketType || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold">Ukuran</span>
                                        <span className="text-xs font-medium text-slate-900">{item.size || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold">Kategori</span>
                                        <span className="text-xs font-medium text-slate-900">{item.category || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <h3 className="text-base font-semibold text-slate-900 mb-3">Informasi Stok & Pengambilan</h3>
                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                    <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span><strong>Lokasi Penyewaan:</strong> {item.locationCity || 'Indonesia'}</span>
                                </div>
                                <div className="flex items-start gap-3 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong>Stok Tersedia:</strong> {availableStock} dari total {totalStock} unit.</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="sticky top-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-baseline pb-4 border-b border-slate-200">
                                    <div>
                                        <span className="text-2xl font-bold text-slate-900">Rp {pricePerDay.toLocaleString('id-ID')}</span>
                                        <span className="text-xs text-slate-500"> / hari</span>
                                    </div>
                                    <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                        {availableStock > 0 ? 'Tersedia' : 'Habis'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-[11px] font-semibold text-slate-600 mb-1">Mulai Sewa</label><div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">{startDate || 'Pilih tanggal'}</div></div>
                                        <div><label className="block text-[11px] font-semibold text-slate-600 mb-1">Selesai Sewa</label><div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900">{endDate || 'Pilih tanggal'}</div></div>
                                    </div>

                                    {/* Tombol Toggle Collapse Kalender */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition text-left shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs font-medium text-slate-700">
                                                {isCalendarOpen ? 'Sembunyikan Kalender' : 'Buka / Pilih Tanggal Kalender'}
                                            </span>
                                        </div>
                                        {isCalendarOpen ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        )}
                                    </button>

                                    {/* Komponen Kalender Tersembunyi */}
                                    {isCalendarOpen && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-3 transition-all">
                                            <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">‹</button><span className="text-xs font-semibold text-slate-900">{new Date(calendarYear, calendarMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span><button type="button" onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">›</button></div>
                                            <div className="mb-1 grid grid-cols-7 text-center">{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => <span key={day} className="text-[9px] font-semibold text-slate-400">{day}</span>)}</div>
                                            <div className="grid grid-cols-7 gap-y-1 text-center">{Array.from({ length: calendarStartDay }).map((_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: calendarDays }).map((_, index) => { const day = index + 1; const value = calendarDateValue(day); const blocked = isUnavailable(value); const selected = value === startDate || value === endDate; const inRange = startDate && endDate && value > startDate && value < endDate; return <button type="button" key={value} disabled={blocked} onClick={() => handleCalendarDateClick(value)} className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${blocked ? 'cursor-not-allowed text-slate-300 line-through decoration-red-400 decoration-2' : selected ? 'bg-blue-600 text-white' : inRange ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>{day}</button>; })}</div>
                                            <p className="mt-3 text-[10px] text-slate-400"><span className="text-red-400 line-through">Tanggal dicoret</span> sedang dipesan dan tidak dapat dipilih.</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan untuk pemilik (opsional)</label>
                                        <textarea
                                            value={bookingNote}
                                            onChange={(e) => setBookingNote(e.target.value)}
                                            rows={3}
                                            placeholder="Misalnya: saya butuh fin untuk trip 2 hari, mohon bisa pickup di Jakarta..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Sewa ({days} hari)</span>
                                        <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Deposit</span>
                                        <span>Rp {depositAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                                        <span>Total Transaksi</span>
                                        <span className="text-blue-600">Rp {(totalPrice + depositAmount).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {bookingError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                        {bookingError}
                                    </div>
                                )}

                                {bookingSuccess && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                        Penyewaan berhasil diajukan dengan status <strong>{bookingSuccess.status}</strong>.
                                    </div>
                                )}

                                {currentUser && item.lenderId === currentUser.id ? (
                                    <div className="w-full bg-slate-200 border border-slate-300 text-slate-600 font-semibold py-3 rounded-xl text-sm text-center">
                                        Ini adalah produk milik Anda
                                    </div>
                                ) : (
                                    <button
                                        disabled={availableStock <= 0 || submitting}
                                        onClick={handleBookingSubmit}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm"
                                    >
                                        {submitting
                                            ? 'Mengajukan...'
                                            : availableStock > 0
                                                ? 'Ajukan Penyewaan'
                                                : 'Stok Tidak Tersedia'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}