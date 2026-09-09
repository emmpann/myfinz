import { verifyToken } from '../services/userService.js';

export function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token tidak valid atau telah kedaluwarsa.',
        });
    }
}

export async function requireVerifiedEmail(req, res, next) {
    try {
        const user = await getUserByIdService(req.user.id);
        if (!user || !user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Silakan verifikasi email kamu terlebih dahulu untuk melakukan aksi ini.',
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}