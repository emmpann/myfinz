import express from 'express';
import {
    createBooking,
    updateBookingStatus,
    getBookingsByRenter,
    getBookingsByOwner,
} from '../controllers/bookingController.js';
import { authenticateJWT, requireVerifiedEmail } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/renter', requireVerifiedEmail, getBookingsByRenter);
router.get('/renter/:renterId', requireVerifiedEmail, getBookingsByRenter);
router.get('/owner', requireVerifiedEmail, getBookingsByOwner);
router.get('/owner/:lenderId', requireVerifiedEmail, getBookingsByOwner);
router.post('/', requireVerifiedEmail, createBooking);
router.patch('/:id/status', requireVerifiedEmail, updateBookingStatus);

export default router;