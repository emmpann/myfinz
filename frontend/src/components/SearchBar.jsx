import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, ChevronLeft, ChevronRight, Loader2, Anchor } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

// Daftar Destinasi Utama & Spot Diving Populer
const POPULAR_DESTINATIONS = [
    { name: 'Jakarta (Kota)', category: 'Utama' },
    { name: 'Bali / Badung', category: 'Utama' },
    { name: 'Surabaya', category: 'Utama' },
    { name: 'Labuan Bajo (Kabu. Manggarai Barat)', category: 'Diving' },
    { name: 'Raja Ampat', category: 'Diving' },
    { name: 'Manado / Bunaken', category: 'Diving' },
    { name: 'Sabang / Pulau Weh', category: 'Diving' },
    { name: 'Derawan / Berau', category: 'Diving' },
    { name: 'Wakatobi', category: 'Diving' },
    { name: 'Lombok / Gili Trawangan', category: 'Diving' },
];

export default function SearchBar({ activeModal, setActiveModal, selectedLocation, setSelectedLocation, selectedSize, setSelectedSize, startDate, setStartDate, endDate, setEndDate, sizes, handleApplyFilter }) {
    const [isLocating, setIsLocating] = useState(false);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // State Data Kota API
    const [cityList, setCityList] = useState([]);
    const [searchCityQuery, setSearchCityQuery] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    // State Kalender
    const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const dateValue = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateLabel = startDate && endDate ? `${startDate} s/d ${endDate}` : startDate ? `Mulai: ${startDate}` : 'Pilih tanggal';

    const triggerClass = (name) => `flex min-w-0 flex-col rounded-2xl px-4 py-2 text-left transition-all hover:bg-slate-50 ${activeModal === name ? 'bg-slate-100 ring-2 ring-blue-500/20' : ''}`;

    // Fetch API Kota
    useEffect(() => {
        const fetchAllCities = async () => {
            setIsLoadingCities(true);
            try {
                const provRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
                const provinces = await provRes.json();
                const regencyPromises = provinces.map(p =>
                    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${p.id}.json`).then(res => res.json())
                );
                const regenciesResults = await Promise.all(regencyPromises);
                const allRegencies = regenciesResults.flat().map(item => item.name);
                setCityList(allRegencies);
            } catch (error) {
                setCityList(['JAKARTA SELATAN', 'JAKARTA BARAT', 'BANDUNG', 'SURABAYA', 'BADUNG']);
            } finally {
                setIsLoadingCities(false);
            }
        };
        fetchAllCities();
    }, []);

    // Filter daftar kota berdasarkan pencarian
    const filteredCities = cityList.filter(city =>
        city.toLowerCase().includes(searchCityQuery.toLowerCase())
    );

    const chooseSegment = (e, name) => {
        e.stopPropagation();
        setActiveModal(activeModal === name ? null : name);
    };

    const chooseMobileSegment = (name) => {
        setActiveModal(name);
        setMobileFilterOpen(true);
    };

    const handleGetNearestLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert('Browser kamu tidak mendukung Geolocation.');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(() => {
            setSelectedLocation('Jakarta (Terdekat)');
            setIsLocating(false);
            setActiveModal('dates');
        }, () => {
            alert('Gagal mendeteksi lokasi.');
            setIsLocating(false);
        });
    };

    const handleDateClick = (day) => {
        const selectedDate = dateValue(day);
        if (!startDate || endDate) {
            setStartDate(selectedDate);
            setEndDate('');
        } else if (new Date(selectedDate) >= new Date(startDate)) {
            setEndDate(selectedDate);
        } else {
            setStartDate(selectedDate);
        }
    };

    const renderSegmentButton = (name, label, value, widthClass) => {
        const buttonEl = (
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => chooseSegment(e, name)}
                className={triggerClass(name)}
            >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${name === 'location' ? 'text-blue-600' : 'text-slate-500'}`}>
                    {label}
                </span>
                <span className={`${widthClass} truncate text-xs font-medium text-slate-900`}>
                    {value}
                </span>
            </button>
        );

        if (activeModal === name) {
            return <PopoverAnchor asChild>{buttonEl}</PopoverAnchor>;
        }

        return buttonEl;
    };

    return (
        <>
            <Sheet open={mobileFilterOpen} onOpenChange={(open) => { setMobileFilterOpen(open); if (!open) setActiveModal(null); }}>
                <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all hover:shadow-md lg:hidden">
                    <Search className="ml-2 h-4 w-4 shrink-0 text-blue-600" />
                    <button type="button" onClick={() => chooseMobileSegment('location')} className="min-w-0 flex-1 text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">Cari rental</span>
                        <span className="block truncate text-xs text-slate-600">{selectedLocation} · {dateLabel} · {selectedSize}</span>
                    </button>
                    <Button type="button" size="icon" className="shrink-0 rounded-xl" onClick={handleApplyFilter} aria-label="Cari listing"><Search className="h-4 w-4" /></Button>
                </div>
                <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-5 sm:p-6">
                    <SheetHeader><SheetTitle>Filter pencarian</SheetTitle><p className="text-sm text-slate-500">Atur lokasi, tanggal, dan ukuran fins.</p></SheetHeader>
                    <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                        {['location', 'dates', 'size'].map((segment) => <button type="button" key={segment} onClick={() => chooseMobileSegment(segment)} className={`rounded-lg px-2 py-2 text-xs font-medium ${activeModal === segment ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{segment === 'location' ? 'Lokasi' : segment === 'dates' ? 'Tanggal' : 'Ukuran'}</button>)}
                    </div>
                    {activeModal === 'location' && <div>
                        <Input placeholder="Cari nama kota/kabupaten..." value={searchCityQuery} onChange={(e) => setSearchCityQuery(e.target.value)} className="mb-3 bg-slate-50" />
                        <Button variant="outline" className="mb-3 w-full justify-between bg-blue-50 text-xs text-blue-700" onClick={handleGetNearestLocation} disabled={isLocating}><span className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5" />{isLocating ? 'Mendeteksi...' : 'Gunakan lokasi terdekat'}</span><span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">GPS</span></Button>
                        <div className="max-h-56 space-y-1 overflow-y-auto">{(!searchCityQuery ? POPULAR_DESTINATIONS.map((destination) => destination.name) : filteredCities).map((location) => <button type="button" key={location} onClick={() => { setSelectedLocation(location); setActiveModal('dates'); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-100">{location}<MapPin className="h-4 w-4 text-slate-400" /></button>)}</div>
                    </div>}
                    {activeModal === 'dates' && <div><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">{months[month]} {year}</p><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button></div></div><div className="mb-1 grid grid-cols-7 text-center">{daysOfWeek.map((day) => <span key={day} className="text-[10px] font-bold text-slate-400">{day}</span>)}</div><div className="grid grid-cols-7 gap-y-1 text-center text-xs">{Array.from({ length: firstDayIndex }).map((_, index) => <div key={`empty-${index}`} />)}{Array.from({ length: totalDays }).map((_, index) => { const day = index + 1; const value = dateValue(day); return <button type="button" key={day} onClick={() => handleDateClick(day)} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${value === startDate || value === endDate ? 'bg-blue-600 text-white' : startDate && endDate && value > startDate && value < endDate ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>{day}</button>; })}</div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{dateLabel}</span><Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>Reset</Button></div><Button className="mt-3 w-full" onClick={() => setActiveModal('size')}>Lanjut ke Ukuran</Button></div>}
                    {activeModal === 'size' && <div><p className="mb-3 text-sm font-semibold">Pilih ukuran fins</p><div className="grid grid-cols-2 gap-2">{sizes.map((size) => <button type="button" key={size} onClick={() => setSelectedSize(size)} className={`rounded-xl border px-3 py-3 text-sm ${selectedSize === size ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200'}`}>{size}</button>)}</div><Button className="mt-4 w-full" onClick={handleApplyFilter}>Terapkan Filter</Button></div>}
                </SheetContent>
            </Sheet>

            <Popover open={Boolean(activeModal) && !mobileFilterOpen} onOpenChange={(open) => !open && setActiveModal(null)}>
                <div className="relative hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 text-sm shadow-sm transition-all hover:shadow-md lg:flex">

                    {renderSegmentButton('location', 'Lokasi Ambil', selectedLocation, 'max-w-[150px]')}
                    <div className="h-8 w-px bg-slate-200" />
                    {renderSegmentButton('dates', 'Durasi', dateLabel, 'max-w-[160px]')}
                    <div className="h-8 w-px bg-slate-200" />
                    {renderSegmentButton('size', 'Ukuran', selectedSize, 'max-w-[120px]')}

                    <Button type="button" size="icon" className="ml-1 shrink-0 rounded-full" onClick={handleApplyFilter} aria-label="Cari listing">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {/* CONTENT POPOVER */}
                <PopoverContent
                    align={activeModal === 'size' ? 'end' : activeModal === 'location' ? 'start' : 'center'}
                    sideOffset={12}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className={activeModal === 'dates' ? 'w-85 max-w-[calc(100vw-2rem)]' : activeModal === 'location' ? 'w-80 max-w-[calc(100vw-2rem)]' : 'w-72 max-w-[calc(100vw-2rem)]'}
                >
                    {/* --- TAB LOKASI --- */}
                    {activeModal === 'location' && (
                        <>
                            <div className="mb-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">Pilih lokasi ambil</p>
                                <p className="mt-1 text-xs text-slate-500">Tentukan kota pengambilan fins.</p>
                            </div>

                            <div className="relative mb-3 flex items-center w-full">
                                <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                                <Input
                                    placeholder="Cari nama kota/kabupaten..."
                                    value={searchCityQuery}
                                    onChange={(e) => setSearchCityQuery(e.target.value)}
                                    style={{ paddingLeft: '2.25rem' }} // <-- Inline style ini memaksa teks geser ke kanan sejauh 36px
                                    className="h-9 w-full text-xs bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            <Button
                                variant="outline"
                                className="mb-3 w-full justify-between bg-blue-50/50 text-xs text-blue-700 hover:bg-blue-100/70 border-blue-100"
                                onClick={handleGetNearestLocation}
                                disabled={isLocating}
                            >
                                <span className="flex items-center gap-2">
                                    <Navigation className="h-3.5 w-3.5 text-blue-600" />
                                    {isLocating ? 'Mendeteksi...' : 'Gunakan lokasi terdekat'}
                                </span>
                                <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white font-medium">GPS</span>
                            </Button>

                            <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                                {/* OPSI SEMUA LOKASI */}
                                {!searchCityQuery && (
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedLocation('Semua Lokasi'); setActiveModal('dates'); }}
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                                    >
                                        Semua Lokasi
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    </button>
                                )}

                                {/* JIKA INPUT SEARCH KOSONG: Tampilkan Destinasi Populer (Tanpa Ikon Jangkar) */}
                                {!searchCityQuery ? (
                                    <>
                                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                            Destinasi Populer
                                        </p>
                                        {POPULAR_DESTINATIONS.map((dest) => (
                                            <button
                                                type="button"
                                                key={dest.name}
                                                onClick={() => { setSelectedLocation(dest.name); setActiveModal('dates'); }}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-100 transition"
                                            >
                                                <span>{dest.name}</span>
                                                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    /* JIKA USER MENGETIK: Tampilkan Hasil Pencarian dari API Kota Indonesia */
                                    isLoadingCities ? (
                                        <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat data kota...
                                        </div>
                                    ) : filteredCities.length > 0 ? (
                                        filteredCities.map((cityName) => (
                                            <button
                                                type="button"
                                                key={cityName}
                                                onClick={() => { setSelectedLocation(cityName); setActiveModal('dates'); }}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs capitalize text-slate-600 hover:bg-slate-100 transition"
                                            >
                                                {cityName.toLowerCase()}
                                                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                                            </button>
                                        ))
                                    ) : (
                                        <p className="py-4 text-center text-xs text-slate-400">Kota tidak ditemukan</p>
                                    )
                                )}
                            </div>
                        </>
                    )}

                    {/* --- DURASI --- */}
                    {activeModal === 'dates' && (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider">Pilih tanggal sewa</p>
                                    <p className="mt-1 text-xs text-slate-500">Pilih tanggal mulai dan selesai.</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <p className="mb-3 text-center text-sm font-semibold">{months[month]} {year}</p>
                            <div className="mb-1 grid grid-cols-7 text-center">
                                {daysOfWeek.map((day) => <span key={day} className="text-[10px] font-bold text-slate-400">{day}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                                {Array.from({ length: firstDayIndex }).map((_, index) => <div key={`empty-${index}`} />)}
                                {Array.from({ length: totalDays }).map((_, index) => {
                                    const day = index + 1;
                                    const value = dateValue(day);
                                    const selected = value === startDate || value === endDate;
                                    const inRange = startDate && endDate && value > startDate && value < endDate;
                                    return (
                                        <button type="button" key={day} onClick={() => handleDateClick(day)} className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full font-medium transition ${selected ? 'bg-blue-600 text-white' : inRange ? 'w-full rounded-none bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}>{day}</button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-xs text-slate-500">{dateLabel}</span>
                                <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => { setStartDate(''); setEndDate(''); }}>Reset</Button>
                            </div>
                            <Button className="mt-3 w-full" onClick={() => setActiveModal('size')}>Lanjut ke Ukuran</Button>
                        </>
                    )}

                    {/* --- UKURAN --- */}
                    {activeModal === 'size' && (
                        <>
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider">Pilih ukuran fins</p>
                                <p className="mt-1 text-xs text-slate-500">Sesuaikan dengan ukuran kaki kamu.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {sizes.map((size) => (
                                    <button type="button" key={size} onClick={() => setSelectedSize(size)} className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition ${selectedSize === size ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50'}`}>{size}</button>
                                ))}
                            </div>
                            <Button className="mt-4 w-full" onClick={handleApplyFilter}>Terapkan Filter</Button>
                        </>
                    )}
                </PopoverContent>
            </Popover>
        </>
    );
}