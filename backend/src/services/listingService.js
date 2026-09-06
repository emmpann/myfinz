import { db } from '../db/index.js';
import { listings, bookings, users } from '../db/schema.js';
import { eq, and, ilike, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const lenderUser = alias(users, 'lender_user');

const activeBookingCondition = (listingId) => and(
    eq(bookings.listingId, listingId),
    inArray(bookings.status, ['PENDING', 'APPROVED', 'ACTIVE']),
);

async function addAvailabilityData(listing) {
    if (!listing) return null;

    const activeBookings = await db.select({
        startDate: bookings.startDate,
        endDate: bookings.endDate,
    }).from(bookings).where(activeBookingCondition(listing.id));

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const bookedToday = activeBookings.filter(({ startDate, endDate }) =>
        new Date(startDate) < todayEnd && new Date(endDate) > todayStart
    ).length;

    const unavailableDates = new Set();
    activeBookings.forEach(({ startDate, endDate }) => {
        const cursor = new Date(startDate);
        const end = new Date(endDate);
        while (cursor <= end) {
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

const listingFields = {
    id: listings.id,
    lenderId: listings.lenderId,
    lenderName: lenderUser.fullName,
    title: listings.title,
    category: listings.category,
    footPocketType: listings.footPocketType,
    size: listings.size,
    pricePerDay: listings.pricePerDay,
    locationCity: listings.locationCity,
    totalStock: listings.totalStock,
    availableStock: listings.availableStock,   // ← kolom baru
    status: listings.status,           // ← kolom baru
    nextAvailableDate: listings.nextAvailableDate, // ← kolom baru
    imageUrl: listings.imageUrl,
    createdAt: listings.createdAt,
};

export async function getAllListingsService(filters = {}) {
    const { category, size, locationCity, footPocketType, status } = filters;
    const conditions = [];

    if (category) conditions.push(eq(listings.category, category));
    if (size) conditions.push(eq(listings.size, size));
    if (locationCity) conditions.push(ilike(listings.locationCity, `%${locationCity.trim()}%`));
    if (footPocketType) conditions.push(eq(listings.footPocketType, footPocketType));
    if (status) conditions.push(eq(listings.status, status));

    const result = await db
        .select(listingFields)
        .from(listings)
        .innerJoin(lenderUser, eq(listings.lenderId, lenderUser.id))
        .where(conditions.length ? and(...conditions) : undefined);

    return await Promise.all(result.map(addAvailabilityData));
}

export async function getListingAvailabilityService(listingId) {
    const [listing] = await db
        .select(listingFields)
        .from(listings)
        .innerJoin(lenderUser, eq(listings.lenderId, lenderUser.id))
        .where(eq(listings.id, listingId));

    if (!listing) return null;
    return await addAvailabilityData(listing);
}

export async function getListingsByLenderService(lenderId) {
    return await db
        .select(listingFields)
        .from(listings)
        .innerJoin(lenderUser, eq(listings.lenderId, lenderUser.id))
        .where(eq(listings.lenderId, lenderId));
}

export async function getListingByIdService(id) {
    const [listing] = await db
        .select(listingFields)
        .from(listings)
        .innerJoin(lenderUser, eq(listings.lenderId, lenderUser.id))
        .where(eq(listings.id, id));

    return listing;
}

export async function createListingService(data) {
    const [newListing] = await db.insert(listings).values(data).returning();
    return newListing;
}

export async function updateListingService(id, data) {
    const [updatedListing] = await db
        .update(listings)
        .set(data)
        .where(eq(listings.id, id))
        .returning();

    return updatedListing;
}

export async function deleteListingService(id) {
    const [deletedListing] = await db
        .delete(listings)
        .where(eq(listings.id, id))
        .returning();

    return deletedListing;
}