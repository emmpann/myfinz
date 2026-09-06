import express from 'express';
import { createUserService, getUserByIdService, getUserByEmailService, verifyPassword } from '../services/userService.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
        }

        const existingUser = await getUserByEmailService(email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        const user = await createUserService({ fullName, email, password, phoneNumber, role });
        const safeUser = { ...user, passwordHash: undefined };
        res.status(201).json({ success: true, data: safeUser });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
        }

        const user = await getUserByEmailService(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const safeUser = { ...user, passwordHash: undefined };
        res.json({ success: true, data: safeUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const user = await createUserService(req.body);
        const safeUser = { ...user, passwordHash: undefined };
        res.status(201).json({ success: true, data: safeUser });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await getUserByIdService(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        const safeUser = { ...user, passwordHash: undefined };
        res.json({ success: true, data: safeUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;