import { db } from '../db/index.js';
import { waitingLists } from '../db/schema.js';

/**
 * Memasukkan penyewa ke daftar antrean (Waiting List)
 */
export async function joinWaitingListService({ listingId, userId, desiredStartDate }) {
    const [entry] = await db.insert(waitingLists).values({
        listingId,
        userId,
        desiredStartDate: new Date(desiredStartDate)
    }).returning();

    return entry;
}