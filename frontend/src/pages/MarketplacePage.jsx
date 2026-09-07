import React, { useState, useEffect, useCallback } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import FinCard from '../components/FinCard';
import api from '../api/axios';

export default function MarketplacePage({ currentUser, onSelectFin, setSearchBarProps }) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeModal, setActiveModal] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState('Kota Asal / Destinasi');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedSize, setSelectedSize] = useState('Semua Ukuran');

    const locations = {
        origin: ['Jakarta (Kota Asal)', 'Surakarta', 'Bandung', 'Makassar'],
        destination: ['Bali (Destinasi)', 'Lombok', 'Labuan Bajo', 'Manado', 'Sorong']
    };
    const sizes = ['Semua Ukuran', '37-38', '39-40', '41-42', '43-44', '45-46'];
    const categories = ['All', 'Freediving', 'Scuba', 'Spearfishing', 'Carbon', 'Fiberglass'];

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

    const handleApplyFilter = useCallback(() => {
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
    }, [selectedLocation, selectedSize, activeCategory]);

    // Kirim data props ke Navbar setiap ada perubahan state filter
    useEffect(() => {
        if (setSearchBarProps) {
            setSearchBarProps({
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
            });
        }
    }, [activeModal, selectedLocation, selectedSize, startDate, endDate, activeCategory, handleApplyFilter]);

    useEffect(() => {
        fetchListings();
    }, []);

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        const params = {};
        if (cat !== 'All') {
            params.category = cat;
        }
        if (selectedLocation !== 'Kota Asal / Destinasi' && selectedLocation !== 'Semua Lokasi') {
            params.locationCity = selectedLocation.split(' ')[0];
        }
        if (selectedSize !== 'Semua Ukuran') {
            params.size = selectedSize;
        }
        fetchListings(params);
    };

    return (
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
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <p>Silakan masuk untuk melihat pesanan dan mengajukan penyewaan fins.</p>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                        >
                            Masuk Sekarang
                        </button>
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
                            <FinCard key={item.id} item={item} onClick={() => onSelectFin(item)} />
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
}