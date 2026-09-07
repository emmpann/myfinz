import {
    createUserService,
    getUserByEmailService,
    getUserByIdService,
    verifyPassword,
    generateToken,
} from '../services/userService.js';

export async function signup(req, res) {
    try {
        const { email, password, fullName, phoneNumber, role } = req.body || {};

        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, dan nama lengkap wajib diisi.',
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        if (!cleanEmail) {
            return res.status(400).json({ success: false, message: 'Email tidak boleh kosong.' });
        }

        const existingUser = await getUserByEmailService(cleanEmail);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        const newUser = await createUserService({
            email: cleanEmail,
            password,
            fullName: String(fullName).trim(),
            phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
            role,
        });

        const token = generateToken(newUser);

        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.passwordHash;
        delete userWithoutPassword.password;

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: {
                token,
                user: userWithoutPassword,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function signin(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password wajib diisi.',
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        const user = await getUserByEmailService(cleanEmail);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        if (!user.passwordHash) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const token = generateToken(user);

        const userWithoutPassword = { ...user };
        delete userWithoutPassword.passwordHash;
        delete userWithoutPassword.password;

        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: userWithoutPassword,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getUserById(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'ID user tidak valid' });
        }

        const user = await getUserByIdService(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const userWithoutPassword = { ...user };
        delete userWithoutPassword.passwordHash;
        delete userWithoutPassword.password;

        return res.json({ success: true, data: userWithoutPassword });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}