import {
    getBookingMessagesService,
    createBookingMessageService,
    getUnreadMessagesCountService,
    markMessagesAsReadService,
} from '../services/chatService.js';

export async function getUnreadMessagesCount(req, res) {
    try {
        const userId = req.user.id; // Diambil otomatis dari token JWT
        const result = await getUnreadMessagesCountService(userId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function getBookingMessages(req, res) {
    try {
        const userId = req.user.id; // Diambil dari token JWT
        const { bookingId } = req.params;
        const messages = await getBookingMessagesService(bookingId, userId);
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function createBookingMessage(req, res) {
    try {
        const senderId = req.user.id; // Diambil otomatis dari token JWT
        const { bookingId } = req.params;
        const { content, imageUrl } = req.body;

        const message = await createBookingMessageService({
            bookingId,
            senderId,
            content,
            imageUrl,
        });

        // Broadcast Realtime ke Socket.io jika ada
        req.app.get('io')?.to(`booking:${bookingId}`).emit('booking:message', message);

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function markMessagesAsRead(req, res) {
    try {
        const userId = req.user.id; // Diambil otomatis dari token JWT
        const { bookingId } = req.params;

        const updated = await markMessagesAsReadService(bookingId, userId);

        req.app.get('io')?.to(`booking:${bookingId}`).emit('booking:read', {
            bookingId,
            readBy: userId,
        });

        res.json({ success: true, message: 'Pesan berhasil ditandai telah dibaca.', data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}