import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

export async function createUserService(data) {
    const payload = { ...data };

    if (payload.password) {
        payload.passwordHash = await hashPassword(payload.password);
        delete payload.password;
    }

    if (!payload.role) {
        payload.role = 'USER';
    }

    const [newUser] = await db.insert(users).values(payload).returning();
    if (newUser) {
        delete newUser.passwordHash;
    }

    return newUser;
}

export async function getUserByIdService(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
        delete user.passwordHash;
    }
    return user;
}

export async function getUserByEmailService(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
}