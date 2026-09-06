import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hashedPassword) {
    return hashPassword(password) === hashedPassword;
}

export async function createUserService(data) {
    const payload = { ...data };

    if (payload.password) {
        payload.passwordHash = hashPassword(payload.password);
        delete payload.password;
    }

    if (!payload.role) {
        payload.role = 'RENTER';
    }

    const [newUser] = await db.insert(users).values(payload).returning();
    return newUser;
}

export async function getUserByIdService(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
}

export async function getUserByEmailService(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
}