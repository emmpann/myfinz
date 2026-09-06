import React, { useState, useEffect } from 'react';
import { CalendarDays, Check, Clock3, MapPin, MessageCircle, UserRound, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../api/axios';

const defaultListingForm = {
    title: '',
    category: '',
    footPocketType: '',
    size: '',
    pricePerDay: '',
    depositAmount: '',
    locationCity: '',
    totalStock: '',
};

const formatNumberInput = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('id-ID') : '';
};

const parseNumberInput = (value) => Number(String(value ?? '').replace(/\./g, '').replace(/\D/g, ''));

export default function OwnerDashboardPage({ currentUser, onBackToMarketplace, setChatBooking }) {
    const [ownerListings, setOwnerListings] = useState([]);
    const [ownerBookings, setOwnerBookings] = useState([]);
    const [ownerTab, setOwnerTab] = useState('transaksi');
    const [listingFormOpen, setListingFormOpen] = useState(false);
    const [listingForm, setListingForm] = useState(defaultListingForm);
    const [editingListingId, setEditingListingId] = useState(null);
    const [listingSubmitting, setListingSubmitting] = useState(false);
    const [listingError, setListingError] = useState('');
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    const [filterTransactionStatus, setFilterTransactionStatus] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterRenterName, setFilterRenterName] = useState('');

    const sizes = ['Semua Ukuran', '37-38', '39-40', '41-42', '43-44', '45-46'];
    const categories = ['All', 'Freediving', 'Scuba', 'Spearfishing', 'Carbon', 'Fiberglass'];

    useEffect(() => {
        if (currentUser) {
            fetchOwnerDashboardData();
        }
    }, [currentUser]);

    const fetchOwnerDashboardData = async () => {
        if (!currentUser) return;
        try {
            const [listingsRes, bookingsRes] = await Promise.all([
                api.get(`/listings/owner/${currentUser.id}`),
                api.get(`/bookings/owner/${currentUser.id}`),
            ]);

            if (listingsRes.data.success) {
                setOwnerListings(listingsRes.data.data || []);
            }
            if (bookingsRes.data.success) {
                setOwnerBookings(bookingsRes.data.data || []);
            }
        } catch (error) {
            console.error('Gagal mengambil data owner dashboard:', error);
            setOwnerListings([]);
            setOwnerBookings([]);
        }
    };

    const handleUpdateBookingStatus = async (bookingId, newStatus) => {
        try {
            setUpdatingBookingId(bookingId);
            const response = await api.patch(`/bookings/${bookingId}/status`, {
                status: newStatus,
            });

            if (response.data?.success) {
                await fetchOwnerDashboardData();
            } else {
                alert(response.data?.message || 'Gagal mengupdate status');
            }
        } catch (error) {
            alert(error?.response?.data?.message || error.message || 'Gagal mengupdate status');
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const resetListingForm = () => {
        setListingForm(defaultListingForm);
        setSelectedImageFile(null);
        setImagePreview('');
        setEditingListingId(null);
    };

    const handleCreateListing = async (event) => {
        event.preventDefault();
        if (!currentUser) return;

        setListingSubmitting(true);
        setListingError('');

        try {
            let uploadedImageUrl = '';

            if (selectedImageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', selectedImageFile);

                const uploadResponse = await api.post('/upload', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (!uploadResponse.data?.success || !uploadResponse.data?.imageUrl) {
                    throw new Error(uploadResponse.data?.message || 'Upload gambar gagal.');
                }

                uploadedImageUrl = uploadResponse.data.imageUrl;
            }

            const payload = {
                ...listingForm,
                lenderId: currentUser.id,
                pricePerDay: parseNumberInput(listingForm.pricePerDay).toFixed(2),
                depositAmount: parseNumberInput(listingForm.depositAmount).toFixed(2),
                totalStock: parseNumberInput(listingForm.totalStock),
                availableStock: parseNumberInput(listingForm.totalStock),
                imageUrl: uploadedImageUrl || listingForm.imageUrl,
            };

            const response = await api.post('/listings', payload);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Gagal menyimpan listing');
            }

            resetListingForm();
            await fetchOwnerDashboardData();
            setListingFormOpen(false);
        } catch (error) {
            console.error('Gagal membuat listing owner:', error);
            setListingError(error?.response?.data?.message || error.message || 'Terjadi kesalahan saat menyimpan listing.');
        } finally {
            setListingSubmitting(false);
        }
    };

    const handleEditListing = (item) => {
        setEditingListingId(item.id);
        setListingForm({
            title: item.title || '',
            category: item.category || 'Freediving',
            footPocketType: item.footPocketType || 'Standard',
            size: item.size || '37-38',
            pricePerDay: formatNumberInput(item.pricePerDay),
            depositAmount: formatNumberInput(item.depositAmount),
            locationCity: item.locationCity || 'Jakarta',
            totalStock: formatNumberInput(item.totalStock),
        });
        setImagePreview(item.imageUrl || '');
        setSelectedImageFile(null);
        setListingError('');
        setListingFormOpen(true);
    };

    const handleUpdateListing = async (event) => {
        event.preventDefault();
        if (!currentUser || !editingListingId) return;

        setListingSubmitting(true);
        setListingError('');

        try {
            let uploadedImageUrl = '';

            if (selectedImageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', selectedImageFile);

                const uploadResponse = await api.post('/upload', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (!uploadResponse.data?.success || !uploadResponse.data?.imageUrl) {
                    throw new Error(uploadResponse.data?.message || 'Upload gambar gagal.');
                }

                uploadedImageUrl = uploadResponse.data.imageUrl;
            }

            const payload = {
                ...listingForm,
                lenderId: currentUser.id,
                pricePerDay: parseNumberInput(listingForm.pricePerDay).toFixed(2),
                depositAmount: parseNumberInput(listingForm.depositAmount).toFixed(2),
                totalStock: parseNumberInput(listingForm.totalStock),
                availableStock: parseNumberInput(listingForm.totalStock),
                imageUrl: uploadedImageUrl || imagePreview || null,
            };

            const response = await api.put(`/listings/${editingListingId}`, payload);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Gagal memperbarui listing');
            }

            resetListingForm();
            await fetchOwnerDashboardData();
            setListingFormOpen(false);
        } catch (error) {
            console.error('Gagal memperbarui listing owner:', error);
            setListingError(error?.response?.data?.message || error.message || 'Terjadi kesalahan saat memperbarui listing.');
        } finally {
            setListingSubmitting(false);
        }
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus listing ini?')) return;

        try {
            const response = await api.delete(`/listings/${listingId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Gagal menghapus listing');
            }

            if (editingListingId === listingId) {
                resetListingForm();
            }

            await fetchOwnerDashboardData();
        } catch (error) {
            alert(error?.response?.data?.message || error.message || 'Gagal menghapus listing.');
        }
    };

    const filteredBookings = ownerBookings.filter((booking) => {
        if (filterTransactionStatus && booking.status !== filterTransactionStatus) return false;
        if (filterStartDate && new Date(booking.startDate) < new Date(filterStartDate)) return false;
        if (filterEndDate && new Date(booking.endDate) > new Date(filterEndDate)) return false;
        if (filterRenterName && !booking.renterName?.toLowerCase().includes(filterRenterName.toLowerCase())) return false;
        return true;
    });

    if (!currentUser) {
        return (
            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600 shadow-sm">
                    Silakan masuk terlebih dahulu untuk membuka dashboard penyewa fin.
                </div>
            </main>
        );
    }

    const totalBooked = ownerBookings.filter((item) => item.status !== 'CANCELLED').length;
    const activeRevenue = ownerBookings
        .filter((item) => ['PENDING', 'APPROVED', 'ACTIVE'].includes(item.status))
        .reduce((sum, item) => sum + Number(item.totalRentalPrice || 0), 0);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Owner dashboard</p>
                    <h1 className="text-3xl font-bold text-slate-900">Kelola listing fin kamu</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={onBackToMarketplace}
                        className="bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2 text-sm hover:border-blue-200 hover:text-blue-700"
                    >
                        Kembali ke katalog
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total listing</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{ownerListings.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Booking masuk</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{totalBooked}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Estimasi pendapatan aktif</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">Rp {activeRevenue.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <Tabs value={ownerTab} onValueChange={setOwnerTab} className="w-full space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="transaksi">Transaksi Masuk</TabsTrigger>
                        <TabsTrigger value="listing">Daftar Listing Saya</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="transaksi">
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Transaksi masuk</h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Menampilkan <span className="font-semibold text-blue-600">{filteredBookings.length}</span> dari {ownerBookings.length} transaksi
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
                                {filteredBookings.map((booking) => (
                                    <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">Permintaan sewa</p>
                                                <h3 className="mt-1 truncate text-base font-semibold text-slate-900">{booking.title || 'Listing'}</h3>
                                                <p className="mt-1 text-xs text-slate-500">ID {booking.id.slice(0, 8)}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-semibold text-blue-700">Rp {Number(booking.totalRentalPrice || 0).toLocaleString('id-ID')}</p>
                                                <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${booking.status === 'PENDING' ? 'border-amber-200 bg-amber-50 text-amber-700' : booking.status === 'CANCELLED' ? 'border-red-200 bg-red-50 text-red-700' : booking.status === 'COMPLETED' ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                                                    {booking.status === 'PENDING' ? <Clock3 className="h-3 w-3" /> : booking.status === 'CANCELLED' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-700">
                                            <div className="flex items-start gap-2"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p><span className="block text-slate-400">Penyewa</span>{booking.renterName || '-'}</p></div>
                                            <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p><span className="block text-slate-400">Periode</span>{new Date(booking.startDate).toLocaleDateString('id-ID')} - {new Date(booking.endDate).toLocaleDateString('id-ID')}</p></div>
                                            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p><span className="block text-slate-400">Lokasi</span>{booking.locationCity || '-'}</p></div>
                                            <div className="flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p><span className="block text-slate-400">Kontak</span>{booking.renterPhone || '-'}</p></div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                                            <span className="text-slate-500">Deposit</span>
                                            <span className="font-medium text-slate-700">Rp {Number(booking.depositAmount || 0).toLocaleString('id-ID')}</span>
                                        </div>

                                        {booking.note && (
                                            <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-slate-700">
                                                <span className="font-medium text-blue-700">Catatan penyewa:</span> {booking.note}
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setChatBooking(booking)}
                                                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                            >
                                                Chat penyewa
                                            </button>

                                            {booking.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'APPROVED')}
                                                        disabled={updatingBookingId === booking.id}
                                                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {updatingBookingId === booking.id ? 'Diproses...' : 'Setujui'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                        disabled={updatingBookingId === booking.id}
                                                        className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
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
                                                        className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {updatingBookingId === booking.id ? 'Diproses...' : 'Confirm Diambil'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                        disabled={updatingBookingId === booking.id}
                                                        className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        {updatingBookingId === booking.id ? 'Diproses...' : 'Batal'}
                                                    </button>
                                                </>
                                            )}

                                            {booking.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                                                    disabled={updatingBookingId === booking.id}
                                                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    {updatingBookingId === booking.id ? 'Diproses...' : 'Selesaikan'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-600 py-4">
                                {ownerBookings.length === 0
                                    ? 'Belum ada transaksi masuk. Listing yang aktif akan muncul di sini.'
                                    : 'Tidak ada transaksi yang sesuai filter.'}
                            </div>
                        )}
                    </section>
                </TabsContent>

                <TabsContent value="listing">
                    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">Daftar listing saya</h2>
                            <Button
                                onClick={() => { resetListingForm(); setListingError(''); setListingFormOpen(true); }}
                                className="w-full rounded-xl sm:w-auto"
                            >
                                + Tambah listing baru
                            </Button>
                        </div>

                        {ownerListings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {ownerListings.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-base font-semibold text-slate-900">{item.title}</p>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                    <span className="text-blue-600">●</span>{item.locationCity}
                                                </p>
                                            </div>
                                            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs">
                                            <div>
                                                <p className="text-slate-400">Kategori</p>
                                                <p className="mt-1 font-medium text-slate-700">{item.category || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Ukuran</p>
                                                <p className="mt-1 font-medium text-slate-700">{item.size || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Stok tersedia</p>
                                                <p className="mt-1 font-medium text-slate-700">{item.availableStock ?? item.totalStock} / {item.totalStock}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Harga per hari</p>
                                                <p className="mt-1 font-semibold text-blue-700">Rp {Number(item.pricePerDay || 0).toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEditListing(item)}
                                                className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteListing(item.id)}
                                                className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-600 py-4">
                                Belum ada listing yang kamu sewakan. Tambahkan fin pertama kamu di form di atas.
                            </div>
                        )}
                    </section>
                </TabsContent>
            </Tabs>

            {/* Dialog Form Listing */}
            <Dialog open={listingFormOpen} onOpenChange={(open) => { setListingFormOpen(open); if (!open) resetListingForm(); }}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
                    <DialogHeader className="border-b border-slate-200 px-6 py-5">
                        <DialogTitle>{editingListingId ? 'Edit listing' : 'Tambah listing baru'}</DialogTitle>
                        <p className="text-sm text-slate-500">Lengkapi detail fin agar mudah ditemukan penyewa.</p>
                    </DialogHeader>
                    <form onSubmit={editingListingId ? handleUpdateListing : handleCreateListing} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                        <div className="md:col-span-2 flex items-center justify-between gap-3">
                            <label className="block text-xs text-slate-600 mb-1">Judul listing</label>
                            {editingListingId && (
                                <button
                                    type="button"
                                    onClick={resetListingForm}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    Batal edit
                                </button>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <input
                                value={listingForm.title}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, title: event.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                placeholder="Contoh: Fins 42 Carbon Pro"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Kategori</label>
                            <select
                                value={listingForm.category}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, category: event.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                required
                            >
                                <option value="" disabled>Pilih kategori</option>
                                {categories.filter((item) => item !== 'All').map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Foot pocket</label>
                            <input
                                value={listingForm.footPocketType}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, footPocketType: event.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                placeholder="Standard"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Ukuran</label>
                            <select
                                value={listingForm.size}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, size: event.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                required
                            >
                                <option value="" disabled>Pilih ukuran</option>
                                {sizes.filter((item) => item !== 'Semua Ukuran').map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Kota</label>
                            <input
                                value={listingForm.locationCity}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, locationCity: event.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                placeholder="Jakarta"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Harga / hari</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={listingForm.pricePerDay}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, pricePerDay: formatNumberInput(event.target.value) }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Deposit</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={listingForm.depositAmount}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, depositAmount: formatNumberInput(event.target.value) }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Jumlah stok</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                min="1"
                                value={listingForm.totalStock}
                                onChange={(event) => setListingForm((prev) => ({ ...prev, totalStock: formatNumberInput(event.target.value) }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-600 mb-1">Gambar fin</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                        setSelectedImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                            />
                            {imagePreview && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <img src={imagePreview} alt="Preview listing" className="h-32 w-full object-cover" />
                                </div>
                            )}
                        </div>

                        {listingError && (
                            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                {listingError}
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={listingSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl"
                            >
                                {listingSubmitting ? 'Menyimpan...' : editingListingId ? 'Perbarui listing' : 'Simpan listing'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}