import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../models/Room.model.js';
import Fee from '../models/Fee.model.js';
import Student from '../models/Student.model.js';
import { calculateRoomPrice } from '../utils/amenitiesPricing.js';

dotenv.config();

const fixRoomPrices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const rooms = await Room.find({});
    console.log(`\n📋 Found ${rooms.length} rooms to check\n`);

    let fixedRooms = 0;
    let fixedFees = 0;
    const errors = [];

    for (const room of rooms) {
      try {
        // Recalculate correct price
        const correctPrice = calculateRoomPrice(room.roomType, room.amenities || {});
        
        // Check if room price is incorrect
        const priceDifference = Math.abs((room.totalPrice || 0) - correctPrice.totalPrice);
        
        if (priceDifference > 0.01) {
          console.log(`\n🔧 Fixing Room ${room.roomNumber} (${room.block || 'N/A'}):`);
          console.log(`   Current totalPrice: ₹${(room.totalPrice || 0).toLocaleString('en-IN')}`);
          console.log(`   Correct totalPrice: ₹${correctPrice.totalPrice.toLocaleString('en-IN')}`);
          console.log(`   Base: ₹${correctPrice.basePrice.toLocaleString('en-IN')}, Amenities: ₹${correctPrice.amenitiesPrice.toLocaleString('en-IN')}`);
          
          // Update room with correct prices
          room.basePrice = correctPrice.basePrice;
          room.amenitiesPrice = correctPrice.amenitiesPrice;
          room.totalPrice = correctPrice.totalPrice;
          room.rent = correctPrice.totalPrice; // Sync legacy field
          await room.save();
          
          fixedRooms++;
          console.log(`   ✅ Room price updated`);
          
          // Find and fix all fees for this room
          const studentsInRoom = await Student.find({ room: room._id });
          
          for (const student of studentsInRoom) {
            const fees = await Fee.find({
              student: student._id,
              feeType: 'rent',
              status: { $in: ['pending', 'partial'] }
            });
            
            for (const fee of fees) {
              // Only update if the fee amount is wrong (within 1% tolerance)
              const feeDifference = Math.abs(fee.amount - correctPrice.totalPrice);
              if (feeDifference > 0.01) {
                console.log(`   🔧 Fixing fee for student ${student.studentId}:`);
                console.log(`      Current amount: ₹${fee.amount.toLocaleString('en-IN')}`);
                console.log(`      Correct amount: ₹${correctPrice.totalPrice.toLocaleString('en-IN')}`);
                
                fee.amount = correctPrice.totalPrice;
                fee.description = `Yearly room fee for ${room.roomType} room (${room.roomNumber}) - Base: ₹${correctPrice.basePrice.toLocaleString('en-IN')} + Amenities: ₹${correctPrice.amenitiesPrice.toLocaleString('en-IN')} = ₹${correctPrice.totalPrice.toLocaleString('en-IN')}`;
                await fee.save();
                
                fixedFees++;
                console.log(`      ✅ Fee updated`);
              }
            }
          }
        } else {
          console.log(`✓ Room ${room.roomNumber} (${room.block || 'N/A'}) - Price is correct: ₹${room.totalPrice.toLocaleString('en-IN')}`);
        }
      } catch (error) {
        errors.push({
          roomNumber: room.roomNumber,
          error: error.message
        });
        console.error(`❌ Error fixing room ${room.roomNumber}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total rooms checked: ${rooms.length}`);
    console.log(`Rooms fixed: ${fixedRooms}`);
    console.log(`Fees fixed: ${fixedFees}`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
      errors.forEach(err => {
        console.log(`  - Room ${err.roomNumber}: ${err.error}`);
      });
    }
    console.log('='.repeat(50));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixRoomPrices();

