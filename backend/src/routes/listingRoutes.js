import express from 'express';
import {
    getAllListingsService,
    getListingsByLenderService,
    createListingService,
    updateListingService,
    deleteListingService,
    getListingByIdService,
} from '../services/listingService.js';
import { checkAvailability } from '../services/bookingService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const listings = await getAllListingsService(req.query);
        res.json({ success: true, data: listings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/owner/:lenderId', async (req, res) => {
    try {
        const listings = await getListingsByLenderService(req.params.lenderId);
        res.json({ success: true, data: listings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const listing = await getListingByIdService(req.params.id);
        if (!listing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({ success: true, data: listing });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const newListing = await createListingService(req.body);
        res.status(201).json({ success: true, data: newListing });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedListing = await updateListingService(req.params.id, req.body);
        if (!updatedListing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({ success: true, data: updatedListing });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedListing = await deleteListingService(req.params.id);
        if (!deletedListing) return res.status(404).json({ success: false, message: 'Listing tidak ditemukan' });
        res.json({ success: true, data: deletedListing });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.get('/:id/availability', async (req, res) => {
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
});

export default router;