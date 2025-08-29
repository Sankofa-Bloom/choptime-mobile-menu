/**
 * PRODUCTION STATUS CHECK
 * Comprehensive check of database tables, data, and API endpoints
 */

const { createClient } = require('@supabase/supabase-js');

// Production database connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkProductionStatus() {
  console.log('🔍 PRODUCTION STATUS CHECK');
  console.log('===========================');

  const status = {
    database: { connected: false, tables: [], data: {} },
    api: { endpoints: {}, working: false },
    issues: [],
    recommendations: []
  };

  try {
    // 1. Test Database Connection
    console.log('\n1️⃣ DATABASE CONNECTION');
    console.log('----------------------');

    try {
      const { data, error } = await supabase
        .from('delivery_fee_settings')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      status.database.connected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      status.database.connected = false;
      status.issues.push(`Database connection failed: ${error.message}`);
      console.log('❌ Database connection failed:', error.message);
      return status; // Can't continue without database
    }

    // 2. Check Core Tables
    console.log('\n2️⃣ DATABASE TABLES');
    console.log('------------------');

    const coreTables = [
      'dishes',
      'restaurants',
      'restaurant_menus',
      'delivery_fee_settings',
      'orders',
      'order_items'
    ];

    for (const table of coreTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const exists = !error || error.code === 'PGRST116';
        status.database.tables.push({
          name: table,
          exists,
          recordCount: count || 0
        });

        if (exists) {
          console.log(`✅ ${table}: ${count || 0} records`);
        } else {
          console.log(`❌ ${table}: Table does not exist`);
          status.issues.push(`Missing table: ${table}`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
        status.database.tables.push({
          name: table,
          exists: false,
          recordCount: 0
        });
        status.issues.push(`Table error for ${table}: ${error.message}`);
      }
    }

    // 3. Check Critical Data
    console.log('\n3️⃣ CRITICAL DATA CHECK');
    console.log('----------------------');

    // Check active dishes
    try {
      const { count: activeDishes, error } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      status.database.data.activeDishes = activeDishes || 0;

      if (error) throw error;

      console.log(`🍽️  Active dishes: ${activeDishes || 0}`);

      if ((activeDishes || 0) === 0) {
        status.issues.push('No active dishes found - this explains why dishes are not showing');
        status.recommendations.push('Add dishes to the database via admin dashboard');
      }
    } catch (error) {
      console.log('❌ Error checking active dishes:', error.message);
      status.issues.push(`Cannot check active dishes: ${error.message}`);
    }

    // Check active restaurants
    try {
      const { count: activeRestaurants, error } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      status.database.data.activeRestaurants = activeRestaurants || 0;

      if (error) throw error;

      console.log(`🏪 Active restaurants: ${activeRestaurants || 0}`);

      if ((activeRestaurants || 0) === 0) {
        status.issues.push('No active restaurants found');
        status.recommendations.push('Add restaurants to the database');
      }
    } catch (error) {
      console.log('❌ Error checking active restaurants:', error.message);
    }

    // Check delivery fee settings
    try {
      const { data: feeSettings, error } = await supabase
        .from('delivery_fee_settings')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (feeSettings && feeSettings.length > 0) {
        const setting = feeSettings[0];
        status.database.data.deliveryFeesEnabled = setting.is_delivery_fee_enabled;
        console.log(`🚚 Delivery fees: ${setting.is_delivery_fee_enabled ? 'ENABLED' : 'DISABLED'}`);
      } else {
        status.issues.push('No delivery fee settings found');
        console.log('⚠️  No delivery fee settings found');
      }
    } catch (error) {
      console.log('❌ Error checking delivery fee settings:', error.message);
    }

    // 4. Test API Endpoints (if server is running)
    console.log('\n4️⃣ API ENDPOINTS TEST');
    console.log('--------------------');

    try {
      // Test dishes endpoint
      const dishesResponse = await fetch('http://localhost:3001/api/dishes');
      status.api.endpoints.dishes = dishesResponse.ok;

      if (dishesResponse.ok) {
        const dishesData = await dishesResponse.json();
        console.log(`✅ /api/dishes: ${dishesData.data?.length || 0} dishes returned`);
        status.api.endpoints.dishesData = dishesData.data?.length || 0;
      } else {
        console.log('❌ /api/dishes: Failed to fetch');
        status.issues.push('API endpoint /api/dishes is not working');
      }
    } catch (error) {
      console.log('⚠️  API server not running or not accessible');
      status.issues.push('Backend server not accessible');
      status.recommendations.push('Start the backend server: cd server && npm run dev');
    }

    // 5. Generate Report
    console.log('\n📊 FINAL REPORT');
    console.log('================');

    console.log('\n✅ WORKING COMPONENTS:');
    if (status.database.connected) console.log('  • Database connection');
    status.database.tables.forEach(table => {
      if (table.exists) console.log(`  • ${table.name} table (${table.recordCount} records)`);
    });
    if (status.api.endpoints.dishes) console.log('  • API endpoints');

    if (status.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      status.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    if (status.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      status.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Quick fix suggestions
    console.log('\n🔧 QUICK FIXES:');
    console.log('================');

    if (status.database.data.activeDishes === 0) {
      console.log('1. Add dishes to database:');
      console.log('   npm run create-admin');
      console.log('   Then use admin dashboard to add dishes');
    }

    if (!status.api.endpoints.dishes) {
      console.log('2. Start backend server:');
      console.log('   cd server && npm run dev');
    }

    if (status.issues.some(issue => issue.includes('table does not exist'))) {
      console.log('3. Create missing tables:');
      console.log('   Run: final-delivery-fee-fix.sql in Supabase dashboard');
    }

    console.log('\n🎯 STATUS: ' + (status.issues.length === 0 ? '✅ READY FOR PRODUCTION' : '⚠️  NEEDS FIXES'));

  } catch (error) {
    console.log('❌ Fatal error during status check:', error.message);
    status.issues.push(`Fatal error: ${error.message}`);
  }

  return status;
}

// Run the check
checkProductionStatus().then(status => {
  // Save status to file for reference
  const fs = require('fs');
  fs.writeFileSync('PRODUCTION_STATUS.json', JSON.stringify(status, null, 2));
  console.log('\n📄 Status saved to: PRODUCTION_STATUS.json');
});