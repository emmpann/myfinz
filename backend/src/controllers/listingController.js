import {
    getAllListingsService,
    getListingsByLenderService,
    createListingService,
    updateListingService,
    deleteListingService,
    getListingByIdService,
    getListingAvailabilityService,
} from '../services/listingService.js';
import { checkAvailability } from '../services/bookingService.js';

export async function getAllListings(req, res) {
    try {
        const listings = await getAllListingsService(req.query);
        res.json({ success: true, data: listings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function getListingsByLender(req, res) {
    try {
        const lenderId = req.params.lenderId || req.user.id;
        const listings = await getListingsByLenderService(lenderId);
        res.json({ success: true, data: listings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function getListingUnavailableDates(req, res) {
    try {
        const listing = await getListingAvailabilityService(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({
            success: true,
            data: {
                availabilityStatus: listing.availabilityStatus,
                unavailableDates: listing.unavailableDates
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function getListingById(req, res) {
    try {
        const listing = await getListingByIdService(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({ success: true, data: listing });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function createListing(req, res) {
    try {
        const lenderId = req.user.id; // Otomatis dari token JWT

        const newListing = await createListingService({
            ...req.body,
            lenderId
        });
        res.status(201).json({ success: true, data: newListing });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function updateListing(req, res) {
    try {
        const updatedListing = await updateListingService(req.params.id, req.body);
        if (!updatedListing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({ success: true, data: updatedListing });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function deleteListing(req, res) {
    try {
        const deletedListing = await deleteListingService(req.params.id);
        if (!deletedListing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({ success: true, data: deletedListing });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function checkListingAvailability(req, res) {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Tanggal mulai dan selesai wajib diisi.' });
        }

        const result = await checkAvailability(req.params.id, startDate, endDate);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}