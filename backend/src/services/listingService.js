import { db } from '../db/index.js';
import { listings } from '../db/schema.js';
import { eq, and, ilike } from 'drizzle-orm';

export async function getAllListingsService(filters = {}) {
    const { category, size, locationCity } = filters;
    const conditions = [];

    if (category) conditions.push(eq(listings.category, category));
    if (size) conditions.push(eq(listings.size, size));
    if (locationCity) conditions.push(ilike(listings.locationCity, `%${locationCity.trim()}%`));

    return await db.select().from(listings).where(conditions.length ? and(...conditions) : undefined);
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