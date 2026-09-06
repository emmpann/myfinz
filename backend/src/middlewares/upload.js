import multer from 'multer';
import path from 'path';

// Konfigurasi tempat penyimpanan dan nama file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // File disimpan di folder backend/uploads
    },
    filename: (req, file, cb) => {
        // Penamaan file unik: timestamp + acak + ekstensi asli
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter jenis file (hanya menerima gambar)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        return cb(null, true);
    }
    cb(new Error('Hanya file gambar (jpg, jpeg, png, webp) yang diperbolehkan!'));
};

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit ukuran file maksimal 5MB
    fileFilter
});