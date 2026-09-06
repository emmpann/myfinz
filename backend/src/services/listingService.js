import { db } from '../db/index.js';
import { listings, bookings } from '../db/schema.js';
import { eq, and, ilike, inArray } from 'drizzle-orm';

const activeBookingCondition = (listingId) => and(
    eq(bookings.listingId, listingId),
    inArray(bookings.status, ['PENDING', 'APPROVED', 'ACTIVE']),
);

async function addAvailabilityData(listing) {
    const activeBookings = await db.select({
        startDate: bookings.startDate,
        endDate: bookings.endDate,
    }).from(bookings).where(activeBookingCondition(listing.id));

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const bookedToday = activeBookings.filter(({ startDate, endDate }) => new Date(startDate) < todayEnd && new Date(endDate) > todayStart).length;
    const unavailableDates = new Set();

    activeBookings.forEach(({ startDate, endDate }) => {
        const cursor = new Date(startDate);
        const end = new Date(endDate);
        while (cursor < end) {
            unavailableDates.add(cursor.toISOString().slice(0, 10));
            cursor.setDate(cursor.getDate() + 1);
        }
    });

    return {
        ...listing,
        todayBookedCount: bookedToday,
        availabilityStatus: bookedToday >= listing.totalStock ? 'WAITING LIST' : 'AVAILABLE',
        unavailableDates: [...unavailableDates],
    };
}

export async function getAllListingsService(filters = {}) {
    const { category, size, locationCity } = filters;
    const conditions = [];

    if (category) conditions.push(eq(listings.category, category));
    if (size) conditions.push(eq(listings.size, size));
    if (locationCity) conditions.push(ilike(listings.locationCity, `%${locationCity.trim()}%`));

    const result = await db.select().from(listings).where(conditions.length ? and(...conditions) : undefined);
    return await Promise.all(result.map(addAvailabilityData));
}

export async function getListingAvailabilityService(listingId) {
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
    if (!listing) return null;
    return await addAvailabilityData(listing);
}

export async function getListingsByLenderService(lenderId) {
    return await db.select().from(listings).where(eq(listings.lenderId, lenderId));
}

export async function getListingByIdService(id) {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
}

export async function createListingService(data) {
    const [newListing] = await db.insert(listings).values(data).returning();
    return newListing;
}

export async function updateListingService(id, data) {
    const [updatedListing] = await db.update(listings).set(data).where(eq(listings.id, id)).returning();
    return updatedListing;
}

export async function deleteListingService(id) {
    const [deletedListing] = await db.delete(listings).where(eq(listings.id, id)).returning();
    return deletedListing;
}