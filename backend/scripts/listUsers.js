/**
 * Script to list all users with their usernames and passwords
 * Note: Passwords are hashed, so we can only show if they exist
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostelhaven');
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await User.find({}, { 
      username: 1, 
      email: 1, 
      name: 1, 
      role: 1, 
      isActive: 1,
      password: 1,
      firstLogin: 1
    }).sort({ role: 1, username: 1 });

    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      process.exit(0);
    }

    console.log('📋 EXISTING USERS WITH LOGIN CREDENTIALS:\n');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'N/A'}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      
      // Default admin password
      if (user.username === 'admin' && user.role === 'admin') {
        console.log(`   Password: Admin@123 (Default)`);
      } else if (user.firstLogin) {
        console.log(`   Password: ⚠️  Temporary password (check email or reset via "Forgot Password")`);
      } else {
        console.log(`   Password: ⚠️  Set by user (use "Forgot Password" to reset)`);
      }
      
      console.log(`   First Login Required: ${user.firstLogin ? '⚠️  Yes' : '✅ No'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Total Users: ${users.length}`);
    console.log('\n💡 LOGIN INSTRUCTIONS:');
    console.log('   - Admin user: Username: "admin", Password: "Admin@123"');
    console.log('   - Other users: Check your email for temporary password or use "Forgot Password"');
    console.log('   - Users with "First Login: Yes" must reset their password on first login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();

