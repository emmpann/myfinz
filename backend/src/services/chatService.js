import { db } from '../db/index.js';
import { bookingMessages, bookings, listings, users } from '../db/schema.js';
import { eq, and, or, count, inArray, ne } from 'drizzle-orm';

export async function getBookingMessagesService(bookingId, userId) {
    // Validasi akses user ke booking ini
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

    if (booking.renterId !== userId && booking.lenderId !== userId) {
        throw new Error('Anda tidak memiliki akses ke chat ini.');
    }

    const messages = await db
        .select({
            id: bookingMessages.id,
            bookingId: bookingMessages.bookingId,
            senderId: bookingMessages.senderId,
            content: bookingMessages.content,
            imageUrl: bookingMessages.imageUrl,
            isRead: bookingMessages.isRead,
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
    if (!bookingId || !senderId || ((!content || !String(content).trim()) && !imageUrl)) {
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
            content: content ? String(content).trim() : 'Gambar dikirim',
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
            isRead: bookingMessages.isRead,
            createdAt: bookingMessages.createdAt,
            senderName: users.fullName,
            senderRole: users.role,
        })
        .from(bookingMessages)
        .innerJoin(users, eq(bookingMessages.senderId, users.id))
        .where(eq(bookingMessages.id, newMessage.id));

    return messageWithUser;
}

export async function getUnreadMessagesCountService(userId) {
    if (!userId) {
        throw new Error('User ID wajib diisi.');
    }

    const userBookingRecords = await db
        .select({ bookingId: bookings.id })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .where(
            or(
                eq(bookings.renterId, userId),
                eq(listings.lenderId, userId)
            )
        );

    const bookingIds = userBookingRecords.map((b) => b.bookingId);

    if (bookingIds.length === 0) {
        return { totalUnread: 0, unreadPerBooking: {} };
    }

    const unreadMessages = await db
        .select({
            bookingId: bookingMessages.bookingId,
            unreadCount: count(bookingMessages.id),
        })
        .from(bookingMessages)
        .where(
            and(
                inArray(bookingMessages.bookingId, bookingIds),
                ne(bookingMessages.senderId, userId),
                eq(bookingMessages.isRead, false)
            )
        )
        .groupBy(bookingMessages.bookingId);

    const unreadPerBooking = {};
    let totalUnread = 0;

    unreadMessages.forEach((row) => {
        const cnt = Number(row.unreadCount);
        unreadPerBooking[row.bookingId] = cnt;
        totalUnread += cnt;
    });

    return { totalUnread, unreadPerBooking };
}

export async function markMessagesAsReadService(bookingId, userId) {
    if (!bookingId || !userId) {
        throw new Error('Booking ID dan User ID wajib diisi.');
    }

    const updatedMessages = await db
        .update(bookingMessages)
        .set({ isRead: true })
        .where(
            and(
                eq(bookingMessages.bookingId, bookingId),
                ne(bookingMessages.senderId, userId),
                eq(bookingMessages.isRead, false)
            )
        )
        .returning();

    return updatedMessages;
}