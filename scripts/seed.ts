import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, getMongoDB } from '../src/config/db';

async function seedDatabase() {
  try {
    console.log('Starting NexaSupply database setup...');

    const state = await connectDB();

    if (!state.isConnected) {
      throw new Error(state.error || 'MongoDB connection failed');
    }

    const db = getMongoDB();

    if (!db) {
      throw new Error('MongoDB database instance not available');
    }

    const collectionNames = [
      'form_schemas',
      'customers',
      'suppliers',
      'products',
      'categories',
      'warehouses',
      'inventory',
      'orders',
      'custom_functions',
      'query_configs'
    ];

    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(
      (collection: any) => collection.name
    );

    for (const name of collectionNames) {
      if (!existingNames.includes(name)) {
        await db.createCollection(name);
        console.log(`Created collection: ${name}`);
      } else {
        console.log(`Collection already exists: ${name}`);
      }
    }

    console.log('Database setup completed successfully.');
  } catch (error: any) {
    console.error('Seed error:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();