
import { connect } from 'mongoose';
import { InventoryItem, Product, User, StorageMethod } from './models';
import connectDB from './lib/mongodb';

// Mock models if necessary or rely on actual DB connection
// We need to query actual DB to see if populate works.
// Using existing `lib/mongodb` and `models`

async function testPopulation() {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected.');

        // Find one inventory item
        console.log('Fetching one inventory item...');
        const item = await InventoryItem.findOne().populate('productId').populate('storageMethodId').lean();

        if (!item) {
            console.log('No inventory items found. Cannot verify.');
            return;
        }

        console.log('Item found:', item._id);

        // Check if productId is populated
        if (typeof item.productId === 'object' && item.productId !== null && 'name' in (item.productId as any)) {
            console.log('SUCCESS: productId is populated correctly.');
            console.log('Product Name:', (item.productId as any).name);
        } else {
            console.log('FAILURE: productId is NOT populated correctly.');
            console.log('Type of productId:', typeof item.productId);
            console.log('Value of productId:', item.productId);
        }

        // Check if storageMethodId is populated
        if (typeof item.storageMethodId === 'object' && item.storageMethodId !== null && 'name' in (item.storageMethodId as any)) {
            console.log('SUCCESS: storageMethodId is populated correctly.');
            console.log('Storage Method Name:', (item.storageMethodId as any).name);
        } else {
            console.log('FAILURE: storageMethodId is NOT populated correctly.');
            console.log('Type of storageMethodId:', typeof item.storageMethodId);
            console.log('Value of storageMethodId:', item.storageMethodId);
        }

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        process.exit(0);
    }
}

testPopulation();
