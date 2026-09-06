import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../api/axios';
import ListingFormDialog from '../components/owner/ListingFormDialog';
import TransactionList from '../components/owner/TransactionList';

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

  const sizes = ['Semua Ukuran', "31-32", "33-34", "35-36", '37-38', '39-40', '41-42', '43-44', '45-46'];
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
          <TransactionList
            filteredBookings={filteredBookings}
            totalBookings={ownerBookings.length}
            filterTransactionStatus={filterTransactionStatus}
            setFilterTransactionStatus={setFilterTransactionStatus}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            filterRenterName={filterRenterName}
            setFilterRenterName={setFilterRenterName}
            setChatBooking={setChatBooking}
            handleUpdateBookingStatus={handleUpdateBookingStatus}
            updatingBookingId={updatingBookingId}
            currentUser={currentUser}
          />
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

                    {/* BAGIAN UTAMA LAYOUT GAMBAR PERSEGI & INFO LISTING */}
                    <div className="flex items-start gap-3">
                      {/* Gambar Fin Persegi */}
                      <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:w-24">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title || 'Fins'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                            Tidak ada foto
                          </div>
                        )}
                      </div>

                      {/* Info Judul & Status (Responsive Layout) */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h3 className="truncate text-base font-bold text-slate-900" title={item.title}>
                            {item.title}
                          </h3>
                          <span className="w-fit shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {item.status || 'AVAILABLE'}
                          </span>
                        </div>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <span className="text-blue-600">●</span>{item.locationCity || '-'}
                        </p>
                      </div>
                    </div>

                    {/* DETAIL SPESIFIKASI & HARGA */}
                    <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs">
                      <div>
                        <p className="text-slate-400">Kategori</p>
                        <p className="mt-0.5 font-medium text-slate-700">{item.category || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Ukuran</p>
                        <p className="mt-0.5 font-medium text-slate-700">{item.size || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Stok tersedia</p>
                        <p className="mt-0.5 font-medium text-slate-700">{item.availableStock ?? item.totalStock} / {item.totalStock}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Harga per hari</p>
                        <p className="mt-0.5 font-semibold text-blue-700">Rp {Number(item.pricePerDay || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    {/* TOMBOL AKSI EDIT / HAPUS */}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditListing(item)}
                        className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item.id)}
                        className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
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

      {/* Komponen Form Dialog */}
      <ListingFormDialog
        open={listingFormOpen}
        onOpenChange={setListingFormOpen}
        editingListingId={editingListingId}
        listingForm={listingForm}
        setListingForm={setListingForm}
        selectedImageFile={selectedImageFile}
        setSelectedImageFile={setSelectedImageFile}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        listingSubmitting={listingSubmitting}
        listingError={listingError}
        resetListingForm={resetListingForm}
        onSubmit={editingListingId ? handleUpdateListing : handleCreateListing}
        categories={categories}
        sizes={sizes}
        formatNumberInput={formatNumberInput}
      />
    </main>
  );
}