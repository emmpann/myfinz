import sharp from 'sharp';
import path from 'path';

export async function uploadImageController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File gambar wajib diunggah.'
            });
        }

        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const outputPath = path.join('uploads', filename);

        await sharp(req.file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/${filename}`;

        res.status(201).json({
            success: true,
            message: 'Gambar berhasil diunggah dan dikompresi.',
            data: { imageUrl }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal memproses dan mengompresi gambar: ' + error.message
        });
    }
}