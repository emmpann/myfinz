import { pgTable, uuid, text, integer, numeric, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enum Status
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export const listingStatusEnum = pgEnum('listing_status', ['AVAILABLE', 'SOLD_OUT', 'MAINTENANCE']);

// 1. Tabel User
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    phoneNumber: text('phone_number'),
    identityCardUrl: text('identity_card_url'),
    role: text('role').default('RENTER').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// 2. Tabel Listing (Katalog Fins)
export const listings = pgTable('listings', {
    id: uuid('id').defaultRandom().primaryKey(),
    lenderId: uuid('lender_id').references(() => users.id).notNull(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    footPocketType: text('foot_pocket_type').notNull(),
    size: text('size').notNull(),
    pricePerDay: numeric('price_per_day', { precision: 12, scale: 2 }).notNull(),
    locationCity: text('location_city').notNull(),
    totalStock: integer('total_stock').default(1).notNull(),
    availableStock: integer('available_stock').default(1).notNull(),
    status: listingStatusEnum('status').default('AVAILABLE').notNull(),
    nextAvailableDate: timestamp('next_available_date'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow(),
});

// 3. Tabel Booking (Transaksi Sewa)
export const bookings = pgTable('bookings', {
    id: uuid('id').defaultRandom().primaryKey(),
    renterId: uuid('renter_id').references(() => users.id).notNull(),
    listingId: uuid('listing_id').references(() => listings.id).notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    totalDays: integer('total_days').notNull(),
    totalRentalPrice: numeric('total_rental_price', { precision: 12, scale: 2 }).notNull(),
    note: text('note'),
    status: bookingStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bookingMessages = pgTable('booking_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    senderId: uuid('sender_id').references(() => users.id).notNull(),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// 4. Tabel Waiting List (Antrean Produk Sold Out)
export const waitingLists = pgTable('waiting_lists', {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id').references(() => listings.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    desiredStartDate: timestamp('desired_start_date').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

// 5. Tabel Reviews (Ulasan & Rating Transaksi)
export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id').references(() => bookings.id).notNull(),
    reviewerId: uuid('reviewer_id').references(() => users.id).notNull(),
    rating: integer('rating').notNull(), // Skala 1 - 5
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow(),
});