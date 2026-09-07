import express from 'express';
import {
    createBooking,
    updateBookingStatus,
    getBookingsByRenter,
    getBookingsByOwner,
} from '../controllers/bookingController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/renter', getBookingsByRenter);
router.get('/owner', getBookingsByOwner);
router.get('/renter/:renterId', getBookingsByRenter);
router.get('/owner/:lenderId', getBookingsByOwner);

router.post('/', createBooking);
router.patch('/:id/status', updateBookingStatus);

export default router;