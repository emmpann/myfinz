import express from 'express';
import { createReviewService } from '../services/reviewService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const review = await createReviewService(req.body);
        res.status(201).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

export default router;