import cron from 'node-cron';
import { generateMonthlyMessFees } from './feeGenerator.js';
import { processLateFees } from '../controllers/studentController.js';

/**
 * Initialize scheduled tasks
 * This function sets up cron jobs for automated fee generation and late fee processing
 */
export const initializeScheduler = () => {
  console.log('🕐 Initializing scheduled tasks...');

  // Generate mess fees on the last day of each month at 11:59 PM
  // Cron expression: 59 23 L * * (last day of month at 23:59)
  // Note: node-cron doesn't support 'L' directly, so we use a workaround
  // We'll run it daily at 23:59 and check if it's the last day of the month
  cron.schedule('59 23 * * *', async () => {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if tomorrow is the first day of next month (meaning today is last day)
      if (tomorrow.getDate() === 1) {
        console.log('📅 Last day of month detected. Generating mess fees based on attendance...');
        // Default daily rate: ₹150/day (can be configured via environment variable)
        const dailyRate = process.env.MESS_FEE_DAILY_RATE ? parseFloat(process.env.MESS_FEE_DAILY_RATE) : 150;
        const result = await generateMonthlyMessFees(dailyRate);
        console.log('✅ Mess fees generated:', {
          generated: result.generated,
          skipped: result.skipped,
          total: result.total,
          month: result.month,
          year: result.year,
        });
        
        if (result.errors.length > 0) {
          console.error('⚠️ Errors during fee generation:', result.errors);
        }
      }
    } catch (error) {
      console.error('❌ Error in scheduled mess fee generation:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Adjust timezone as needed
  });

  console.log('✅ Scheduler initialized: Mess fees will be generated on the last day of each month at 11:59 PM');

  // Process late fees daily at 12:01 AM (just after midnight)
  // Adds ₹50 per day for overdue payments
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('⏰ Processing late fees for overdue payments...');
      const result = await processLateFees();
      
      if (result.success) {
        console.log(`✅ Late fees processed: ${result.processedCount} students charged ₹${result.lateFeeTotal} total`);
      } else {
        console.error('❌ Error processing late fees:', result.error);
      }
    } catch (error) {
      console.error('❌ Error in scheduled late fee processing:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Adjust timezone as needed
  });

  console.log('✅ Late fee processor initialized: Will run daily at 12:01 AM to add ₹50/day for overdue payments');
};

