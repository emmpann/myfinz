import express from 'express';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

export default router;