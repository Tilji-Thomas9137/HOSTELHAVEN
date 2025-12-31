/**
 * Migration script to fix room number unique index
 * Drops the old roomNumber_1 index and ensures the compound index exists
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../models/Room.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostelhaven';

async function fixRoomIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('rooms');

    // Get all indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop old roomNumber_1 index if it exists
    try {
      console.log('\nAttempting to drop old roomNumber_1 index...');
      await collection.dropIndex('roomNumber_1');
      console.log('✓ Successfully dropped roomNumber_1 index');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('✓ roomNumber_1 index does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // Ensure the compound index exists
    console.log('\nCreating compound unique index (roomNumber + block + gender)...');
    try {
      await collection.createIndex(
        { roomNumber: 1, block: 1, gender: 1 },
        { unique: true, name: 'roomNumber_block_gender_1' }
      );
      console.log('✓ Successfully created compound unique index');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('✓ Compound index already exists');
      } else {
        throw error;
      }
    }

    // Verify final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✓ Migration completed successfully!');
    console.log('\nYou can now create rooms with the same number in different blocks or genders.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the migration
fixRoomIndex();

