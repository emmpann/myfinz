import express from 'express';
import { joinWaitingListService } from '../services/waitingListService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const result = await joinWaitingListService(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

export default router;