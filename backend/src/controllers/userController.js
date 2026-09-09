import crypto from 'crypto';
import {
    createUserService,
    getUserByEmailService,
    getUserByIdService,
    verifyPassword,
    generateToken,
    getUserByVerificationTokenService,
    updateUserStatusService,
    getUserByResetTokenService,
    hashPassword,
} from '../services/userService.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService.js';

const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export async function signup(req, res) {
    try {
        const { email, password, fullName, phoneNumber, role } = req.body || {};

        if (!email || !password || !fullName) {
            return res.status(400).json({ success: false, message: 'Email, password, dan nama lengkap wajib diisi.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const existingUser = await getUserByEmailService(cleanEmail);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }

        const emailVerificationToken = generateRandomToken();

        const newUser = await createUserService({
            email: cleanEmail,
            password,
            fullName: String(fullName).trim(),
            phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
            role,
            isVerified: false,
            emailVerificationToken,
        });

        try {
            await sendVerificationEmail(cleanEmail, emailVerificationToken);
        } catch (mailError) {
            console.error("Gagal mengirim email verifikasi:", mailError);
        }

        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.passwordHash;

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil. Silakan cek email kamu untuk verifikasi akun.',
            data: { user: userWithoutPassword },
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

export async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token verifikasi tidak valid.' });
        }

        const user = await getUserByVerificationTokenService(token);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Token verifikasi tidak ditemukan atau sudah kadaluwarsa.' });
        }

        await updateUserStatusService(user.id, {
            isVerified: true,
            emailVerificationToken: null,
        });

        return res.status(200).json({
            success: true,
            message: 'Email berhasil diverifikasi. Silakan login.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const user = await getUserByEmailService(cleanEmail);

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'Jika email terdaftar, instruksi reset password telah dikirim ke email kamu.',
            });
        }

        const resetToken = generateRandomToken();
        const resetExpires = new Date(Date.now() + 3600000);

        await updateUserStatusService(user.id, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires,
        });

        try {
            await sendResetPasswordEmail(cleanEmail, resetToken);
        } catch (mailError) {
            console.error("Gagal mengirim email reset password:", mailError);
        }

        return res.status(200).json({
            success: true,
            message: 'Jika email terdaftar, instruksi reset password telah dikirim ke email kamu.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body || {};

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token dan password baru wajib diisi.' });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
        }

        const user = await getUserByResetTokenService(token);
        if (!user || new Date(user.resetPasswordExpires) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Token reset password tidak valid atau sudah kadaluwarsa.',
            });
        }

        const newPasswordHash = await hashPassword(newPassword);

        await updateUserStatusService(user.id, {
            passwordHash: newPasswordHash,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });

        return res.status(200).json({
            success: true,
            message: 'Password berhasil diperbarui. Silakan login dengan password baru.',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}