import { db } from './index.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function updateDemoUserRole() {
    try {
        const [updated] = await db
            .update(users)
            .set({ role: 'OWNER' })
            .where(eq(users.email, 'demo.renter@myfinz.id'))
            .returning();

        if (updated) {
            console.log('✅ Demo Renter role updated to OWNER');
        } else {
            console.log('⚠️ Demo Renter user not found');
        }
    } catch (error) {
        console.error('❌ Error updating role:', error.message);
    }
}

updateDemoUserRole();
