import React, { useState, useEffect } from 'react';
import api from './api/axios';
import Navbar from './components/Navbar';
import CategoryFilter from './components/CategoryFilter';
import FinCard from './components/FinCard';
import FinDetailModal from './components/FinDetailModal';
import BookingChatModal from './components/BookingChatModal';
import { CalendarDays, Check, Clock3, MapPin, MessageCircle, UserRound, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

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

export default function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === 'undefined') return 'marketplace';
    if (window.location.pathname === '/owner') return 'owner';
    if (window.location.pathname === '/orders') return 'orders';
    return 'marketplace';
  });
  const [ownerListings, setOwnerListings] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [listingSubmitting, setListingSubmitting] = useState(false);
  const [listingError, setListingError] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [listingFormOpen, setListingFormOpen] = useState(false);
  const [ownerTab, setOwnerTab] = useState('transaksi');
  const [listingForm, setListingForm] = useState(defaultListingForm);
  const [editingListingId, setEditingListingId] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [filterTransactionStatus, setFilterTransactionStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterRenterName, setFilterRenterName] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('myfinz_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('Kota Asal / Destinasi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSize, setSelectedSize] = useState('Semua Ukuran');
  const [selectedFin, setSelectedFin] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);

  const locations = {
    origin: ['Jakarta (Kota Asal)', 'Surakarta', 'Bandung', 'Makassar'],
    destination: ['Bali (Destinasi)', 'Lombok', 'Labuan Bajo', 'Manado', 'Sorong']
  };
  const sizes = ['Semua Ukuran', '37-38', '39-40', '41-42', '43-44', '45-46'];
  const categories = ['All', 'Freediving', 'Scuba', 'Spearfishing', 'Carbon', 'Fiberglass'];

  useEffect(() => {
    fetchListings();
    if (currentUser) {
      fetchMyBookings();
      fetchOwnerDashboardData();
    } else {
      setMyBookings([]);
      setOwnerListings([]);
      setOwnerBookings([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const syncViewFromPath = () => {
      const pathname = window.location.pathname;
      const nextView = pathname === '/owner' ? 'owner' : pathname === '/orders' ? 'orders' : 'marketplace';
      setActiveView((prev) => (prev !== nextView ? nextView : prev));
    };

    syncViewFromPath();
    window.addEventListener('popstate', syncViewFromPath);

    return () => window.removeEventListener('popstate', syncViewFromPath);
  }, []);

  const fetchMyBookings = async () => {
    const renterId = currentUser?.id || localStorage.getItem('myfinz_demo_user_id');
    if (!renterId) {
      setMyBookings([]);
      return;
    }

    try {
      const response = await api.get(`/bookings/user/${renterId}`);
      if (response.data.success) {
        setMyBookings(response.data.data || []);
      }
    } catch (error) {
      console.error('Gagal mengambil data booking user:', error);
      setMyBookings([]);
    }
  };

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

  const fetchListings = async (query = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/listings', { params: query });
      if (response.data.success) {
        setListings(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setActiveModal(null);
    const params = {};
    if (selectedLocation !== 'Kota Asal / Destinasi' && selectedLocation !== 'Semua Lokasi') {
      const cleanCity = selectedLocation.split(' ')[0];
      params.locationCity = cleanCity;
    }
    if (selectedSize !== 'Semua Ukuran') {
      params.size = selectedSize;
    }
    if (activeCategory !== 'All') {
      params.category = activeCategory;
    }
    fetchListings(params);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    const params = {};
    if (cat !== 'All') {
      params.category = cat;
    }
    fetchListings(params);
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
      setActiveView('owner');
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

  const handleOpenOrdersPage = () => {
    if (!currentUser) return;
    setSelectedFin(null);
    setShowBookings(false);
    window.history.pushState({}, '', '/orders');
    setActiveView('orders');
  };

  const handleOpenOwnerDashboard = () => {
    if (!currentUser) return;
    setSelectedFin(null);
    setShowBookings(false);
    setOwnerTab('listing');
    window.history.pushState({}, '', '/owner');
    setActiveView('owner');
  };

  const handleBackToMarketplace = () => {
    setSelectedFin(null);
    setShowBookings(false);
    window.history.pushState({}, '', '/');
    setActiveView('marketplace');
  };

  const searchBarProps = {
    activeModal,
    setActiveModal,
    selectedLocation,
    setSelectedLocation,
    selectedSize,
    setSelectedSize,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    locations,
    sizes,
    handleApplyFilter,
  };

  // Filter ownerBookings berdasarkan kriteria
  const filteredBookings = ownerBookings.filter((booking) => {
    // Filter status
    if (filterTransactionStatus && booking.status !== filterTransactionStatus) {
      return false;
    }

    // Filter tanggal mulai
    if (filterStartDate) {
      const bookingDate = new Date(booking.startDate);
      const filterDate = new Date(filterStartDate);
      if (bookingDate < filterDate) {
        return false;
      }
    }

    // Filter tanggal selesai
    if (filterEndDate) {
      const bookingDate = new Date(booking.endDate);
      const filterDate = new Date(filterEndDate);
      if (bookingDate > filterDate) {
        return false;
      }
    }

    // Filter nama penyewa
    if (filterRenterName) {
      const nameMatch = booking.renterName?.toLowerCase().includes(filterRenterName.toLowerCase());
      if (!nameMatch) {
        return false;
      }
    }

    return true;
  });

  const renderOrdersPage = () => (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">My bookings</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pesanan Saya</h1>
          <p className="mt-2 text-sm text-slate-500">Pantau jadwal, biaya, dan komunikasi untuk setiap penyewaanmu.</p>
        </div>
        <button
          onClick={handleBackToMarketplace}
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
              <p className="mt-1 text-2xl font-semibold text-slate-900">{myBookings.filter((booking) => booking.status === 'PENDING').length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Total nilai sewa</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Rp {myBookings.reduce((sum, booking) => sum + Number(booking.totalRentalPrice || 0), 0).toLocaleString('id-ID')}</p>
            </div>
          </div>

          {myBookings.map((booking) => (
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
                    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${booking.status === 'PENDING' ? 'border-amber-200 bg-amber-50 text-amber-700' : booking.status === 'CANCELLED' ? 'border-red-200 bg-red-50 text-red-700' : booking.status === 'COMPLETED' ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
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
                  <div><p className="text-xs text-slate-400">Periode sewa</p><p className="mt-1 font-medium text-slate-700">{new Date(booking.startDate).toLocaleDateString('id-ID')} - {new Date(booking.endDate).toLocaleDateString('id-ID')}</p></div>
                  <div><p className="text-xs text-slate-400">Total sewa</p><p className="mt-1 font-medium text-slate-700">Rp {Number(booking.totalRentalPrice || 0).toLocaleString('id-ID')}</p></div>
                  <div><p className="text-xs text-slate-400">Deposit</p><p className="mt-1 font-medium text-slate-700">Rp {Number(booking.depositAmount || 0).toLocaleString('id-ID')}</p></div>
                  <div><p className="text-xs text-slate-400">Booking ID</p><p className="mt-1 font-mono font-medium text-slate-700">{booking.id.slice(0, 8)}</p></div>
                </div>

                {booking.note && (
                  <div className="mt-4 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-700">
                    <span className="font-medium text-blue-700">Catatan:</span> {booking.note}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setChatBooking({ ...booking, ownerName: booking.ownerName || 'Pemilik', renterName: currentUser?.fullName || 'Anda' })}
                  className="mt-4 w-full rounded-lg border border-blue-200 bg-white py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Buka chat dengan pemilik
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-600 shadow-sm">
          Belum ada pesanan. Ajak penyewaan fin baru dari katalog.
        </div>
      )}
    </main>
  );

  const renderMarketplace = () => (
    <>
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={handleCategoryChange}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />

      {!currentUser && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-slate-700">
            Silakan masuk untuk melihat pesanan dan mengajukan penyewaan.
          </div>
        </section>
      )}

      {showBookings && currentUser && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Pesanan Saya</h2>
              <button
                onClick={() => setShowBookings(false)}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Tutup
              </button>
            </div>

            {myBookings.length > 0 ? (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <div key={booking.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm text-slate-500">Booking ID</p>
                        <p className="font-medium text-slate-900">{booking.id.slice(0, 8)}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {booking.status}
                      </span>
                    </div>

                    {booking.note && (
                      <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-medium text-slate-900">Catatan:</span> {booking.note}
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
                      <div>
                        <p className="text-slate-500 text-xs">Mulai</p>
                        <p>{new Date(booking.startDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Selesai</p>
                        <p>{new Date(booking.endDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Total</p>
                        <p>Rp {Number(booking.totalRentalPrice || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setChatBooking({ ...booking, ownerName: booking.ownerName || 'Pemilik', renterName: currentUser?.fullName || 'Anda' })}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-lg border border-blue-200"
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600 py-3">
                Belum ada pesanan. Ajak penyewaan fin baru dari katalog.
              </div>
            )}
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="bg-slate-100 aspect-4/3 rounded-2xl mb-3"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((item) => (
              <FinCard key={item.id} item={item} onClick={() => setSelectedFin(item)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-slate-600">Tidak ada produk fins yang sesuai dengan filter.</p>
          </div>
        )}
      </main>
    </>
  );

  const renderOwnerDashboard = () => {
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
              onClick={handleBackToMarketplace}
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

          <TabsContent value="transaksi" forceMount>
            <div className="grid grid-cols-1 gap-6">
              <section className="hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-col justify-between min-h-52">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Inventory</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">Listing kamu</h2>
                    <p className="mt-2 text-sm text-slate-500">Tambahkan fin baru untuk mulai menerima permintaan sewa.</p>
                  </div>
                </div>

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
              </section>

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
            </div>
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
                    <div key={item.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-slate-900 font-semibold">{item.title}</p>
                          <p className="text-sm text-slate-500">{item.locationCity}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-700">
                        <p>Kategori: {item.category}</p>
                        <p>Ukuran: {item.size}</p>
                        <p>Stok: {item.availableStock ?? item.totalStock} / {item.totalStock}</p>
                        <p>Harga: Rp {Number(item.pricePerDay || 0).toLocaleString('id-ID')}/hari</p>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditListing(item)}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-lg border border-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 rounded-lg border border-red-200"
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
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar
        searchBarProps={searchBarProps}
        onResetFilter={() => {
          handleBackToMarketplace();
          fetchListings();
        }}
        onOpenBookings={handleOpenOrdersPage}
        onOpenOwnerDashboard={handleOpenOwnerDashboard}
        currentUser={currentUser}
        isOwnerView={activeView === 'owner'}
        isOrdersView={activeView === 'orders'}
        onSignOut={() => {
          localStorage.removeItem('myfinz_user');
          localStorage.removeItem('myfinz_demo_user_id');
          setCurrentUser(null);
          setShowBookings(false);
          handleBackToMarketplace();
        }}
      />

      {activeView === 'owner' ? renderOwnerDashboard() : activeView === 'orders' ? renderOrdersPage() : renderMarketplace()}

      {selectedFin && (
        <FinDetailModal
          item={selectedFin}
          onClose={() => setSelectedFin(null)}
          onBooked={fetchMyBookings}
          currentUser={currentUser}
        />
      )}

      {chatBooking && (
        <BookingChatModal
          booking={chatBooking}
          currentUser={currentUser}
          onClose={() => setChatBooking(null)}
        />
      )}
    </div>
  );
}