import express from 'express';
import { upload } from '../middlewares/upload.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { uploadImageController } from '../controllers/uploadController.js';

const router = express.Router();

router.post(
    '/',
    authenticateJWT,
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            next();
        });
    },
    uploadImageController
);

export default router;