import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin', role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n💡 If you forgot the password, you can reset it or create a new admin user.');
      process.exit(0);
    }

    // Create default admin user
    const adminUser = await User.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@hostelhaven.com',
      password: 'Admin@123', // Will be hashed automatically by the model
      role: 'admin',
      phone: '',
      firstLogin: false, // Set to false so admin can login immediately
      isActive: true,
    });

    console.log('✅ Default admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: Admin@123`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('   You can change it from Settings > Change Password after logging in.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    
    if (error.code === 11000) {
      console.error('\n💡 A user with this username or email already exists.');
      console.error('   Please use different credentials or delete the existing user first.\n');
    }
    
    process.exit(1);
  }
};

// Run the seed function
seedAdmin();

