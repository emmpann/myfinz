import express from 'express';
import { signup, signin, getUserById } from '../controllers/userController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/:id', authenticateJWT, getUserById);

export default router;