import express from 'express';
import { getBookingMessagesService, createBookingMessageService } from '../services/chatService.js';

const router = express.Router();

router.get('/booking/:bookingId', async (req, res) => {
    try {
        const messages = await getBookingMessagesService(req.params.bookingId);
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post('/booking/:bookingId/message', async (req, res) => {
    try {
        const { senderId, content, imageUrl } = req.body;
        const message = await createBookingMessageService({
            bookingId: req.params.bookingId,
            senderId,
            content,
            imageUrl,
        });
        req.app.get('io').to(`booking:${req.params.bookingId}`).emit('booking:message', message);
        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

export default router;
