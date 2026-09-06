import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

// Disable prefetch untuk kompatibilitas connection pooling
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });