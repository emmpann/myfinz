import {
    createUserService,
    getUserByEmailService,
    verifyPassword,
    generateToken,
} from '../services/userService.js';

export async function signup(req, res) {
    try {
        const { email, password, fullName, phoneNumber, role } = req.body;

        const existingUser = await getUserByEmailService(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        const newUser = await createUserService({
            email,
            password,
            fullName,
            phoneNumber,
            role,
        });

        const token = generateToken(newUser);

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: {
                token,
                user: newUser,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function signin(req, res) {
    try {
        const { email, password } = req.body;

        const user = await getUserByEmailService(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }

        const token = generateToken(user);

        const userWithoutPassword = { ...user };
        delete userWithoutPassword.passwordHash;

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
        const user = await getUserByIdService(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}