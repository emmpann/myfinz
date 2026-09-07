import express from 'express';
import {
    getAllListings,
    getListingsByLender,
    getListingUnavailableDates,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    checkListingAvailability
} from '../controllers/listingController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/owner', authenticateJWT, getListingsByLender);

router.get('/', getAllListings);
router.get('/:id/unavailable-dates', getListingUnavailableDates);
router.get('/:id/availability', checkListingAvailability);
router.get('/:id', getListingById);

router.post('/', authenticateJWT, createListing);
router.put('/:id', authenticateJWT, updateListing);
router.delete('/:id', authenticateJWT, deleteListing);

export default router;