import express from 'express';
import {
    createBookingService,
    updateBookingStatusService,
    getBookingsByRenterService,
    getBookingsByOwnerService,
} from '../services/bookingService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const booking = await createBookingService(req.body);
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await updateBookingStatusService(req.params.id, status);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.get('/user/:renterId', async (req, res) => {
    try {
        const myBookings = await getBookingsByRenterService(req.params.renterId);
        res.json({ success: true, data: myBookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/owner/:lenderId', async (req, res) => {
    try {
        const incomingBookings = await getBookingsByOwnerService(req.params.lenderId);
        res.json({ success: true, data: incomingBookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;