import { db } from './index.js';
import { users, listings } from './schema.js';
import { hashPassword } from '../services/userService.js';
import { eq } from 'drizzle-orm';

// Helper Generator Random Data
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
    console.log('🌱 Memulai proses seeding (demo login, 10 Vendor & 100 Listing Fins)...');

    const cities = ['Bali', 'Jakarta', 'Lombok', 'Labuan Bajo', 'Surakarta', 'Bandung', 'Makassar', 'Manado', 'Sorong'];
    const categories = ['Freediving', 'Scuba', 'Spearfishing', 'Carbon', 'Fiberglass'];
    const brands = [
        'Leaderfins', 'Molchanovs', 'Cetma Composites', 'Mantra', 'Cressi Gara',
        'Mares Razor', 'Oceanic', 'Aqualung', 'Beuchat Mundial', 'Alchemy V3'
    ];
    const footPockets = ['Pathos', 'Cressi Full Foot', 'Mares Razor Footpocket', 'Forza Footpocket', 'Cetma S-Wing'];
    const sizes = ['37-38', '39-40', '41-42', '43-44', '45-46'];
    const images = [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=600&auto=format&fit=crop'
    ];

    const demoAccounts = [
        { fullName: 'Demo Renter', email: 'demo.renter@myfinz.id', phoneNumber: '0811000001', passwordHash: hashPassword('demo123'), role: 'RENTER' },
        { fullName: 'Demo Owner', email: 'demo.owner@myfinz.id', phoneNumber: '0811000002', passwordHash: hashPassword('demo123'), role: 'OWNER' },
    ];

    const createdDemoUsers = [];
    for (const account of demoAccounts) {
        const [existing] = await db.select().from(users).where(eq(users.email, account.email));

        if (!existing) {
            const [created] = await db.insert(users).values(account).returning();
            createdDemoUsers.push(created);
        } else {
            if (existing.role !== account.role || existing.fullName !== account.fullName || existing.phoneNumber !== account.phoneNumber) {
                const [updated] = await db.update(users)
                    .set({
                        fullName: account.fullName,
                        phoneNumber: account.phoneNumber,
                        role: account.role,
                        passwordHash: account.passwordHash,
                    })
                    .where(eq(users.email, account.email))
                    .returning();
                createdDemoUsers.push(updated);
            } else {
                createdDemoUsers.push(existing);
            }
        }
    }

    const createdVendors = [];
    for (let i = 1; i <= 10; i++) {
        const vendorEmail = `vendor${i}@divecenter.com`;
        const vendorData = {
            fullName: `Dive Center ${i} - ${getRandomItem(cities)}`,
            email: vendorEmail,
            phoneNumber: `081234567${i.toString().padStart(3, '0')}`,
            role: 'OWNER',
            passwordHash: hashPassword(`vendor${i}123`),
        };

        const [existingVendor] = await db.select().from(users).where(eq(users.email, vendorEmail));

        if (existingVendor) {
            const [updatedVendor] = await db.update(users)
                .set({
                    fullName: vendorData.fullName,
                    phoneNumber: vendorData.phoneNumber,
                    role: 'OWNER',
                    passwordHash: vendorData.passwordHash,
                })
                .where(eq(users.email, vendorEmail))
                .returning();
            createdVendors.push(updatedVendor || existingVendor);
            continue;
        }

        const [vendor] = await db.insert(users).values(vendorData).returning();
        createdVendors.push(vendor);
    }

    const ownerUser = createdDemoUsers.find((user) => user.role === 'OWNER') || createdVendors[0];
    if (ownerUser) {
        const existingOwnerListings = await db.select().from(listings).where(eq(listings.lenderId, ownerUser.id));
        if (!existingOwnerListings.length) {
            await db.insert(listings).values({
                lenderId: ownerUser.id,
                title: 'Demo Carbon Fin Pro 42',
                category: 'Carbon',
                footPocketType: 'Pathos',
                size: '41-42',
                pricePerDay: '220000.00',
                depositAmount: '660000.00',
                locationCity: 'Jakarta',
                totalStock: 2,
                availableStock: 2,
                status: 'AVAILABLE',
                imageUrl: images[0],
            });
        }
    }

    const listingsBatch = [];
    for (let i = 1; i <= 100; i++) {
        const brand = getRandomItem(brands);
        const category = getRandomItem(categories);
        const price = getRandomInt(8, 30) * 10000;
        const deposit = price * getRandomInt(3, 5);

        listingsBatch.push({
            lenderId: getRandomItem(createdVendors).id,
            title: `${brand} ${category} Series ${getRandomInt(1, 99)}`,
            category: category,
            footPocketType: getRandomItem(footPockets),
            size: getRandomItem(sizes),
            pricePerDay: price.toFixed(2),
            depositAmount: deposit.toFixed(2),
            locationCity: getRandomItem(cities),
            totalStock: getRandomInt(1, 5),
            availableStock: getRandomInt(1, 5),
            status: 'AVAILABLE',
            imageUrl: getRandomItem(images),
        });
    }

    await db.insert(listings).values(listingsBatch);

    console.log('✅ Seeding berhasil! Demo login tersedia:');
    console.log('   - demo.renter@myfinz.id / demo123 (RENTER)');
    console.log('   - demo.owner@myfinz.id / demo123 (OWNER)');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Gagal melakukan seeding data:', err);
    process.exit(1);
});