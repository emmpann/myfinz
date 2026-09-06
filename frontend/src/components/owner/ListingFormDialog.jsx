import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export default function ListingFormDialog({
    open,
    onOpenChange,
    editingListingId,
    listingForm,
    setListingForm,
    selectedImageFile,
    setSelectedImageFile,
    imagePreview,
    setImagePreview,
    listingSubmitting,
    listingError,
    resetListingForm,
    onSubmit,
    categories,
    sizes,
    formatNumberInput,
}) {
    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);
                if (!isOpen) resetListingForm();
            }}
        >
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
                <DialogHeader className="border-b border-slate-200 px-6 py-5">
                    <DialogTitle>
                        {editingListingId ? 'Edit listing' : 'Tambah listing baru'}
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Lengkapi detail fin agar mudah ditemukan penyewa.
                    </p>
                </DialogHeader>

                <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
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
                            onChange={(event) =>
                                setListingForm((prev) => ({ ...prev, title: event.target.value }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                            placeholder="Contoh: Fins 42 Carbon Pro"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Kategori</label>
                        <select
                            value={listingForm.category}
                            onChange={(event) =>
                                setListingForm((prev) => ({ ...prev, category: event.target.value }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                            required
                        >
                            <option value="" disabled>Pilih kategori</option>
                            {categories
                                .filter((item) => item !== 'All')
                                .map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Foot pocket</label>
                        <input
                            value={listingForm.footPocketType}
                            onChange={(event) =>
                                setListingForm((prev) => ({ ...prev, footPocketType: event.target.value }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                            placeholder="Standard"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Ukuran</label>
                        <select
                            value={listingForm.size}
                            onChange={(event) =>
                                setListingForm((prev) => ({ ...prev, size: event.target.value }))
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900"
                            required
                        >
                            <option value="" disabled>Pilih ukuran</option>
                            {sizes
                                .filter((item) => item !== 'Semua Ukuran')
                                .map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Kota</label>
                        <input
                            value={listingForm.locationCity}
                            onChange={(event) =>
                                setListingForm((prev) => ({ ...prev, locationCity: event.target.value }))
                            }
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
                            onChange={(event) =>
                                setListingForm((prev) => ({
                                    ...prev,
                                    pricePerDay: formatNumberInput(event.target.value),
                                }))
                            }
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
                            onChange={(event) =>
                                setListingForm((prev) => ({
                                    ...prev,
                                    depositAmount: formatNumberInput(event.target.value),
                                }))
                            }
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
                            onChange={(event) =>
                                setListingForm((prev) => ({
                                    ...prev,
                                    totalStock: formatNumberInput(event.target.value),
                                }))
                            }
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
                            {listingSubmitting
                                ? 'Menyimpan...'
                                : editingListingId
                                    ? 'Perbarui listing'
                                    : 'Simpan listing'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}