/**
 * Database Health Check Script
 * 
 * This script checks which collections have data and which are empty.
 * Run this to verify your database status.
 * 
 * Usage:
 *   node check-database-health.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

// Collection definitions with expected behavior
const collections = [
  // Tier 1: CRITICAL (Must have data)
  {
    name: 'users',
    tier: 1,
    tierName: 'CRITICAL',
    description: 'User accounts (admin, students, staff, parents)',
    expectedBehavior: 'Should have at least 1 admin account',
    minExpected: 1,
  },
  {
    name: 'rooms',
    tier: 1,
    tierName: 'CRITICAL',
    description: 'Room definitions',
    expectedBehavior: 'Should have rooms if admin created them',
    minExpected: 1,
  },

  // Tier 2: IMPORTANT (Should have data in active system)
  {
    name: 'students',
    tier: 2,
    tierName: 'IMPORTANT',
    description: 'Student profiles',
    expectedBehavior: 'Should have data if students registered',
    minExpected: 0,
  },
  {
    name: 'fees',
    tier: 2,
    tierName: 'IMPORTANT',
    description: 'Student fees (rent, mess, etc.)',
    expectedBehavior: 'Should have data after room selection',
    minExpected: 0,
  },
  {
    name: 'payments',
    tier: 2,
    tierName: 'IMPORTANT',
    description: 'Payment transactions',
    expectedBehavior: 'Should have data after students pay',
    minExpected: 0,
  },
  {
    name: 'notifications',
    tier: 2,
    tierName: 'IMPORTANT',
    description: 'System notifications',
    expectedBehavior: 'Should have data if system is active',
    minExpected: 0,
  },

  // Tier 3: FEATURE-DEPENDENT (Empty until feature used)
  {
    name: 'roommategroups',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Student roommate groups',
    expectedBehavior: 'Empty until students form groups',
    minExpected: 0,
  },
  {
    name: 'roommaterequest',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Roommate requests',
    expectedBehavior: 'Empty until students send requests',
    minExpected: 0,
  },
  {
    name: 'complaints',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Student complaints',
    expectedBehavior: 'Empty until complaints submitted',
    minExpected: 0,
  },
  {
    name: 'cleaningrequests',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Cleaning service requests',
    expectedBehavior: 'Empty until cleaning requested',
    minExpected: 0,
  },
  {
    name: 'inventoryrequests',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Inventory item requests',
    expectedBehavior: 'Empty until items requested',
    minExpected: 0,
  },
  {
    name: 'outingrequests',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Student outpass requests',
    expectedBehavior: 'Empty until outpass requested',
    minExpected: 0,
  },
  {
    name: 'visitorlogs',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Visitor check-in logs',
    expectedBehavior: 'Empty until visitors logged',
    minExpected: 0,
  },
  {
    name: 'vendorlogs',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Vendor entry logs',
    expectedBehavior: 'Empty until vendors logged',
    minExpected: 0,
  },
  {
    name: 'activityparticipations',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Activity participation records',
    expectedBehavior: 'Empty until students participate',
    minExpected: 0,
  },
  {
    name: 'mealpreferences',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Student meal preferences',
    expectedBehavior: 'Empty until preferences set',
    minExpected: 0,
  },
  {
    name: 'mealsuggestions',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Meal menu suggestions',
    expectedBehavior: 'Empty until suggestions submitted',
    minExpected: 0,
  },
  {
    name: 'roomchangerequests',
    tier: 3,
    tierName: 'FEATURE',
    description: 'Room change requests',
    expectedBehavior: 'Empty until room changes requested',
    minExpected: 0,
  },

  // Tier 4: ADMIN-INITIATED (Empty unless admin uses specific features)
  {
    name: 'matchingpools',
    tier: 4,
    tierName: 'ADMIN',
    description: 'AI roommate matching pool',
    expectedBehavior: 'Empty unless admin uses matching pool feature',
    minExpected: 0,
  },
  {
    name: 'attendances',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Student attendance records',
    expectedBehavior: 'Empty until attendance marked',
    minExpected: 0,
  },
  {
    name: 'activities',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Activity/event definitions',
    expectedBehavior: 'Empty until admin creates activities',
    minExpected: 0,
  },
  {
    name: 'inventories',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Inventory item catalog',
    expectedBehavior: 'Empty until staff adds inventory',
    minExpected: 0,
  },
  {
    name: 'staffschedules',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Staff work schedules',
    expectedBehavior: 'Empty until schedules created',
    minExpected: 0,
  },
  {
    name: 'staffleaverequests',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Staff leave requests',
    expectedBehavior: 'Empty until staff requests leave',
    minExpected: 0,
  },
  {
    name: 'stockrequests',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Stock replenishment requests',
    expectedBehavior: 'Empty until stock requested',
    minExpected: 0,
  },
  {
    name: 'staffs',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Staff profiles',
    expectedBehavior: 'Empty until staff added',
    minExpected: 0,
  },
  {
    name: 'parents',
    tier: 4,
    tierName: 'ADMIN',
    description: 'Parent accounts',
    expectedBehavior: 'Empty until parents registered',
    minExpected: 0,
  },

  // Tier 5: RARE/CONDITIONAL (Empty unless specific scenario)
  {
    name: 'wallets',
    tier: 5,
    tierName: 'RARE',
    description: 'Student wallet balances (refunds)',
    expectedBehavior: 'Empty unless room downgrades/refunds issued',
    minExpected: 0,
  },

  // Tier 6: LEGACY/UNUSED (Not part of active workflow)
  {
    name: 'bookings',
    tier: 6,
    tierName: 'LEGACY',
    description: 'Room bookings (alternative system)',
    expectedBehavior: 'Empty - not used in main workflow',
    minExpected: 0,
  },

  // Tier 7: TEMPORARY (Auto-deleted)
  {
    name: 'otps',
    tier: 7,
    tierName: 'TEMPORARY',
    description: 'OTP codes for phone auth',
    expectedBehavior: 'Usually empty - auto-deleted after 10 minutes',
    minExpected: 0,
  },
];

async function checkDatabaseHealth() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.blue}🔍 DATABASE HEALTH CHECK${colors.reset}`);
    console.log('='.repeat(80) + '\n');

    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostelhaven';
    console.log(`${colors.gray}Connecting to: ${mongoURI}${colors.reset}\n`);

    await mongoose.connect(mongoURI);
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}\n`);

    const db = mongoose.connection.db;

    // Get all collections
    const existingCollections = await db.listCollections().toArray();
    const collectionNames = existingCollections.map((c) => c.name);

    // Stats
    const stats = {
      critical: { total: 0, empty: 0, populated: 0 },
      important: { total: 0, empty: 0, populated: 0 },
      feature: { total: 0, empty: 0, populated: 0 },
      admin: { total: 0, empty: 0, populated: 0 },
      rare: { total: 0, empty: 0, populated: 0 },
      legacy: { total: 0, empty: 0, populated: 0 },
      temporary: { total: 0, empty: 0, populated: 0 },
    };

    // Check each collection
    for (const tier of [1, 2, 3, 4, 5, 6, 7]) {
      const tierCollections = collections.filter((c) => c.tier === tier);
      if (tierCollections.length === 0) continue;

      const tierName = tierCollections[0].tierName;
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`${colors.blue}TIER ${tier}: ${tierName} COLLECTIONS${colors.reset}`);
      console.log('─'.repeat(80));

      for (const col of tierCollections) {
        if (!collectionNames.includes(col.name)) {
          console.log(
            `${colors.gray}⚪ ${col.name.padEnd(25)} - Collection not created yet${colors.reset}`
          );
          continue;
        }

        const collection = db.collection(col.name);
        const count = await collection.countDocuments();

        // Determine status
        let status = '✅';
        let statusText = 'OK';
        let color = colors.green;

        if (tier === 1 && count < col.minExpected) {
          status = '❌';
          statusText = 'CRITICAL - EMPTY';
          color = colors.red;
        } else if (tier === 2 && count === 0) {
          status = '⚠️';
          statusText = 'WARNING - Empty but may be normal';
          color = colors.yellow;
        } else if (count === 0) {
          status = '⚪';
          statusText = 'Empty (Normal)';
          color = colors.gray;
        } else {
          status = '✅';
          statusText = `${count} documents`;
          color = colors.green;
        }

        // Update stats
        const statKey =
          tier === 1
            ? 'critical'
            : tier === 2
            ? 'important'
            : tier === 3
            ? 'feature'
            : tier === 4
            ? 'admin'
            : tier === 5
            ? 'rare'
            : tier === 6
            ? 'legacy'
            : 'temporary';
        stats[statKey].total++;
        if (count === 0) {
          stats[statKey].empty++;
        } else {
          stats[statKey].populated++;
        }

        console.log(
          `${color}${status} ${col.name.padEnd(25)} ${statusText.padEnd(35)} ${colors.gray}${col.description}${colors.reset}`
        );
        console.log(
          `   ${colors.gray}↳ ${col.expectedBehavior}${colors.reset}`
        );
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.blue}📊 SUMMARY${colors.reset}`);
    console.log('='.repeat(80) + '\n');

    const totalPopulated = Object.values(stats).reduce((sum, s) => sum + s.populated, 0);
    const totalEmpty = Object.values(stats).reduce((sum, s) => sum + s.empty, 0);
    const totalCollections = totalPopulated + totalEmpty;

    console.log(`${colors.green}✅ Total Collections: ${totalCollections}${colors.reset}`);
    console.log(`${colors.green}   ├─ Populated: ${totalPopulated}${colors.reset}`);
    console.log(`${colors.gray}   └─ Empty: ${totalEmpty}${colors.reset}\n`);

    console.log(`${colors.red}❌ CRITICAL: ${stats.critical.empty}/${stats.critical.total} empty${colors.reset}`);
    console.log(
      `${colors.yellow}⚠️  IMPORTANT: ${stats.important.empty}/${stats.important.total} empty${colors.reset}`
    );
    console.log(`${colors.gray}⚪ FEATURE: ${stats.feature.empty}/${stats.feature.total} empty (normal)${colors.reset}`);
    console.log(`${colors.gray}⚪ ADMIN: ${stats.admin.empty}/${stats.admin.total} empty (normal)${colors.reset}`);
    console.log(`${colors.gray}⚪ RARE: ${stats.rare.empty}/${stats.rare.total} empty (normal)${colors.reset}`);
    console.log(`${colors.gray}⚪ LEGACY: ${stats.legacy.empty}/${stats.legacy.total} empty (expected)${colors.reset}`);
    console.log(
      `${colors.gray}⚪ TEMPORARY: ${stats.temporary.empty}/${stats.temporary.total} empty (expected)${colors.reset}\n`
    );

    // Overall verdict
    console.log('='.repeat(80));
    if (stats.critical.empty > 0) {
      console.log(`${colors.red}⚠️  DATABASE STATUS: CRITICAL - NEEDS ATTENTION${colors.reset}`);
      console.log(
        `${colors.red}   Critical collections are empty. System may not function properly.${colors.reset}`
      );
    } else if (stats.important.empty === stats.important.total && stats.important.total > 0) {
      console.log(`${colors.yellow}⚠️  DATABASE STATUS: WARNING - New System${colors.reset}`);
      console.log(
        `${colors.yellow}   Important collections are empty. This is normal for a new system.${colors.reset}`
      );
    } else {
      console.log(`${colors.green}✅ DATABASE STATUS: HEALTHY${colors.reset}`);
      console.log(`${colors.green}   All collections are as expected. System is working correctly!${colors.reset}`);
    }
    console.log('='.repeat(80) + '\n');

    // Explanation for empty collections
    if (totalEmpty > 0) {
      console.log(`${colors.blue}ℹ️  WHY ARE SOME COLLECTIONS EMPTY?${colors.reset}\n`);
      console.log(`${colors.gray}Collections fill up naturally as features are used:${colors.reset}`);
      console.log(`${colors.gray}  • FEATURE collections: Fill when users use those features${colors.reset}`);
      console.log(`${colors.gray}  • ADMIN collections: Fill when admin uses specific features${colors.reset}`);
      console.log(`${colors.gray}  • RARE collections: Fill only in specific scenarios (e.g., refunds)${colors.reset}`);
      console.log(`${colors.gray}  • LEGACY collections: Not used in main workflow${colors.reset}`);
      console.log(`${colors.gray}  • TEMPORARY collections: Auto-delete after expiry (e.g., OTPs)${colors.reset}\n`);
      console.log(
        `${colors.gray}📖 See DATABASE_COLLECTIONS_EXPLAINED.md for detailed explanations.${colors.reset}\n`
      );
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error(`${colors.red}❌ Error checking database health:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run the health check
checkDatabaseHealth();

