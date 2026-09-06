import { db } from '../db/index.js';
import { reviews, bookings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Mempublikasikan ulasan transaksi (Hanya jika Booking COMPLETED)
 */
export async function createReviewService({ bookingId, reviewerId, rating, comment }) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));

    if (!booking) throw new Error('Transaksi booking tidak ditemukan');
    if (booking.status !== 'COMPLETED') {
        throw new Error('Ulasan hanya dapat diberikan setelah transaksi sewa selesai (COMPLETED)');
    }

    const [newReview] = await db.insert(reviews).values({
        bookingId,
        reviewerId,
        rating,
        comment
    }).returning();

    return newReview;
}