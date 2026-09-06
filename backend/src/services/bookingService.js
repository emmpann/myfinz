import { db } from '../db/index.js';
import { bookings, listings, users } from '../db/schema.js';
import { eq, and, gte, lte, ne, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const ownerUser = alias(users, 'owner_user');

export async function checkAvailability(listingId, startDate, endDate) {
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
    if (!listing) throw new Error('Listing tidak ditemukan');

    const start = new Date(startDate);
    const end = new Date(endDate);

    const overlappingBookings = await db
        .select()
        .from(bookings)
        .where(
            and(
                eq(bookings.listingId, listingId),
                ne(bookings.status, 'CANCELLED'),
                ne(bookings.status, 'COMPLETED'),
                lte(bookings.startDate, end),
                gte(bookings.endDate, start)
            )
        );

    const isAvailable = overlappingBookings.length < listing.totalStock;

    return {
        isAvailable,
        listing,
        remainingStock: listing.totalStock - overlappingBookings.length
    };
}

export async function createBookingService({ renterId, listingId, startDate, endDate, note }) {
    const { isAvailable, listing } = await checkAvailability(listingId, startDate, endDate);

    if (!isAvailable) {
        throw new Error('Stok fins tidak tersedia pada tanggal yang dipilih.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalRentalPrice = (parseFloat(listing.pricePerDay) * totalDays).toFixed(2);
    const depositAmount = parseFloat(listing.depositAmount).toFixed(2);

    const [newBooking] = await db.insert(bookings).values({
        renterId,
        listingId,
        startDate: start,
        endDate: end,
        totalDays,
        totalRentalPrice,
        depositAmount,
        note: note ? String(note).trim() : null,
        status: 'PENDING'
    }).returning();

    return newBooking;
}

export async function updateBookingStatusService(bookingId, status) {
    const [updatedBooking] = await db
        .update(bookings)
        .set({ status, updatedAt: new Date() })
        .where(eq(bookings.id, bookingId))
        .returning();

    return updatedBooking;
}

export async function getBookingsByRenterService(renterId) {
    return await db
        .select({
            id: bookings.id,
            renterId: bookings.renterId,
            listingId: bookings.listingId,
            startDate: bookings.startDate,
            endDate: bookings.endDate,
            totalDays: bookings.totalDays,
            totalRentalPrice: bookings.totalRentalPrice,
            depositAmount: bookings.depositAmount,
            note: bookings.note,
            status: bookings.status,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
            title: listings.title,
            category: listings.category,
            footPocketType: listings.footPocketType,
            size: listings.size,
            locationCity: listings.locationCity,
            imageUrl: listings.imageUrl,
            ownerId: listings.lenderId,
            ownerName: ownerUser.fullName,
            ownerPhone: ownerUser.phoneNumber,
        })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .innerJoin(ownerUser, eq(listings.lenderId, ownerUser.id))
        .where(eq(bookings.renterId, renterId));
}

export async function getBookingsByOwnerService(lenderId) {
    const ownerListings = await db.select({ id: listings.id }).from(listings).where(eq(listings.lenderId, lenderId));

    if (!ownerListings.length) {
        return [];
    }

    const listingIds = ownerListings.map((item) => item.id);

    return await db
        .select({
            id: bookings.id,
            renterId: bookings.renterId,
            renterName: users.fullName,
            renterPhone: users.phoneNumber,
            listingId: bookings.listingId,
            startDate: bookings.startDate,
            endDate: bookings.endDate,
            totalDays: bookings.totalDays,
            totalRentalPrice: bookings.totalRentalPrice,
            depositAmount: bookings.depositAmount,
            note: bookings.note,
            status: bookings.status,
            createdAt: bookings.createdAt,
            title: listings.title,
            locationCity: listings.locationCity,
            imageUrl: listings.imageUrl,
        })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .innerJoin(users, eq(bookings.renterId, users.id))
        .where(inArray(bookings.listingId, listingIds));
}