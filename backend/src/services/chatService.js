import { db } from '../db/index.js';
import { bookingMessages, bookings, listings, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function getBookingMessagesService(bookingId) {
    const messages = await db
        .select({
            id: bookingMessages.id,
            bookingId: bookingMessages.bookingId,
            senderId: bookingMessages.senderId,
            content: bookingMessages.content,
            imageUrl: bookingMessages.imageUrl,
            createdAt: bookingMessages.createdAt,
            senderName: users.fullName,
            senderRole: users.role,
        })
        .from(bookingMessages)
        .innerJoin(users, eq(bookingMessages.senderId, users.id))
        .where(eq(bookingMessages.bookingId, bookingId));

    return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function createBookingMessageService({ bookingId, senderId, content, imageUrl }) {
    if (!bookingId || !senderId || (!content || !String(content).trim()) && !imageUrl) {
        throw new Error('Booking, pengirim, dan isi chat atau gambar wajib diisi.');
    }

    const [booking] = await db
        .select({
            id: bookings.id,
            renterId: bookings.renterId,
            lenderId: listings.lenderId,
        })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(eq(bookings.id, bookingId));

    if (!booking) {
        throw new Error('Booking tidak ditemukan.');
    }

    if (booking.renterId !== senderId && booking.lenderId !== senderId) {
        throw new Error('Anda tidak memiliki akses ke chat ini.');
    }

    const [newMessage] = await db
        .insert(bookingMessages)
        .values({
            bookingId,
            senderId,
            content: content ? String(content).trim() : 'Gambar pembayaran',
            imageUrl: imageUrl || null,
        })
        .returning();

    const [messageWithUser] = await db
        .select({
            id: bookingMessages.id,
            bookingId: bookingMessages.bookingId,
            senderId: bookingMessages.senderId,
            content: bookingMessages.content,
            imageUrl: bookingMessages.imageUrl,
            createdAt: bookingMessages.createdAt,
            senderName: users.fullName,
            senderRole: users.role,
        })
        .from(bookingMessages)
        .innerJoin(users, eq(bookingMessages.senderId, users.id))
        .where(eq(bookingMessages.id, newMessage.id));

    return messageWithUser;
}
