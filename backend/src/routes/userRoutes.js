import express from 'express';
import { signup, signin, getUserById, verifyEmail, forgotPassword, resetPassword } from '../controllers/userController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/:id', authenticateJWT, getUserById);

export default router;