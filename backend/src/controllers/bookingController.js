import {
    createBookingService,
    updateBookingStatusService,
    getBookingsByRenterService,
    getBookingsByOwnerService,
} from '../services/bookingService.js';

export async function createBooking(req, res) {
    try {
        const renterId = req.user.id; // Diambil otomatis dari JWT Token
        const { listingId, startDate, endDate, note } = req.body;

        if (!listingId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Listing ID, tanggal mulai, dan tanggal selesai wajib diisi.',
            });
        }

        const newBooking = await createBookingService({
            renterId,
            listingId,
            startDate,
            endDate,
            note,
        });

        res.status(201).json({ success: true, data: newBooking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function updateBookingStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status baru wajib diisi.' });
        }

        const updatedBooking = await updateBookingStatusService(id, status);
        if (!updatedBooking) {
            return res.status(404).json({ success: false, message: 'Booking tidak ditemukan.' });
        }

        res.json({ success: true, data: updatedBooking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function getBookingsByRenter(req, res) {
    try {
        const renterId = req.params.renterId || req.user.id;
        const bookingsList = await getBookingsByRenterService(renterId);
        res.json({ success: true, data: bookingsList });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function getBookingsByOwner(req, res) {
    try {
        const lenderId = req.params.lenderId || req.user.id;
        const bookingsList = await getBookingsByOwnerService(lenderId);
        res.json({ success: true, data: bookingsList });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}