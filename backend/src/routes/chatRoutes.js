import express from 'express';
import {
    getBookingMessagesService,
    createBookingMessageService,
    getUnreadMessagesCountService,
    markMessagesAsReadService,
} from '../services/chatService.js';

const router = express.Router();

// 1. DAHULUKAN ROUTE UNREAD (Agar tidak terbentrok dengan /booking/:bookingId)
router.get('/unread/:userId', async (req, res) => {
    try {
        const result = await getUnreadMessagesCountService(req.params.userId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// 2. ROUTE BACA PESAN (PATCH)
router.patch('/booking/:bookingId/read', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId wajib diisi di body.' });
        }

        const updated = await markMessagesAsReadService(req.params.bookingId, userId);

        // Opsional: Emit socket jika pakai Realtime Socket.io
        req.app.get('io')?.to(`booking:${req.params.bookingId}`).emit('booking:read', {
            bookingId: req.params.bookingId,
            readBy: userId,
        });

        res.json({ success: true, message: 'Pesan berhasil ditandai telah dibaca.', data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// 3. ROUTE AMBIL PESAN PER BOOKING (GET)
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const messages = await getBookingMessagesService(req.params.bookingId);
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// 4. ROUTE KIRIM PESAN (POST)
router.post('/booking/:bookingId/message', async (req, res) => {
    try {
        const { senderId, content, imageUrl } = req.body;
        const message = await createBookingMessageService({
            bookingId: req.params.bookingId,
            senderId,
            content,
            imageUrl,
        });

        req.app.get('io')?.to(`booking:${req.params.bookingId}`).emit('booking:message', message);
        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

export default router;