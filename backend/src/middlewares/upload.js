import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        return cb(null, true);
    }
    cb(new Error('Hanya file gambar (JPG, JPEG, PNG, WEBP) yang diperbolehkan!'), false);
};

const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

export const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter
});