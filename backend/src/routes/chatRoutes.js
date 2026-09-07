import express from 'express';
import {
    getUnreadMessagesCount,
    getBookingMessages,
    createBookingMessage,
    markMessagesAsRead,
} from '../controllers/chatController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Seluruh rute chat dilindungi middleware JWT
router.use(authenticateJWT);
router.get('/unread', getUnreadMessagesCount);
router.get('/booking/:bookingId', getBookingMessages);
router.post('/booking/:bookingId/message', createBookingMessage);
router.patch('/booking/:bookingId/read', markMessagesAsRead);

export default router;