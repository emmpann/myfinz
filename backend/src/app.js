import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import userRoutes from './routes/userRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '../uploads';

const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    socket.on('join-booking', (bookingId) => {
        if (bookingId) socket.join(`booking:${bookingId}`);
    });

    socket.on('leave-booking', (bookingId) => {
        if (bookingId) socket.leave(`booking:${bookingId}`);
    });
});

app.set('io', io);

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Backend MyFinz API siap digunakan!' }));

app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// Jalankan server menggunakan httpServer (BUKAN app.listen agar Socket.IO aktif)
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server backend berjalan di port ${PORT}`);
});